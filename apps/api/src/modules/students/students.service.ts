import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AdicionarFilhoDto, AlocarAtletasDto } from './dto/filho.dto';
import { gerarTokenConvite, VALIDADE_CONVITE_HORAS, emailGeradoAutomaticamente } from '../../common/utils/convite-acesso.util';
import { StudentsReportService } from './students-report.service';
import { EmailService } from '../email/email.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { AuditService } from '../../common/audit/audit.service';
import { DOCUMENTOS_INSCRICAO_OBRIGATORIOS } from '../../common/constants/documentos';
import { mesclarRegistosDesempenho } from '../avaliacoes/normalizar-desempenho.util';
import { resolveContactoAtleta } from '../../common/utils/contacto-atleta.util';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';

const ROLES_GESTAO_ATLETA = ['ADMIN', 'SUPER_ADMIN', 'ASSISTENTE_ADMIN'];
/** Atletas com esta etiqueta (Banco de Moçambique) não usam pacotes de pagamento. */
export const ETIQUETA_SEM_PACOTE = 'BM';

function semAcentos(v: string): string {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const DIAS_EN: Record<string, string> = {
  MONDAY: 'SEGUNDA', TUESDAY: 'TERCA', WEDNESDAY: 'QUARTA', THURSDAY: 'QUINTA', FRIDAY: 'SEXTA', SATURDAY: 'SABADO', SUNDAY: 'DOMINGO',
};

/** Compara o dia do horário ("Terça", "TERÇA-FEIRA", "TUESDAY") com o dia pedido, já sem acentos e em maiúsculas. */
function diaCorresponde(diaHorario: string, pedido: string): boolean {
  const norm = (d: string) => {
    const x = semAcentos(d).toUpperCase().replace(/-FEIRA$/, '').trim();
    return DIAS_EN[x] ?? x;
  };
  return norm(diaHorario) === norm(pedido);
}

function limparTexto(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/\s+/g, ' ');
  return t ? t.slice(0, max) : null;
}

const CAMPOS_ALIASES: Record<string, string[]> = {
  firstName: ['nome', 'primeironome', 'firstname'],
  lastName: ['apelido', 'sobrenome', 'ultimonome', 'lastname'],
  dateOfBirth: ['datanascimento', 'nascimento', 'datadenascimento', 'dob', 'dateofbirth'],
  gender: ['genero', 'género', 'sexo', 'gender'],
  phone: ['telefone', 'contacto', 'telemovel', 'phone'],
  email: ['email', 'correio', 'correioeletronico'],
  unidade: ['unidade', 'localunidade'],
  turma: ['turma', 'classe', 'aula'],
};

function normalizarChave(k: string): string {
  return k
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizeImportRow(row: Record<string, any>): Record<string, string> {
  const entries = Object.entries(row).map(([k, v]) => [normalizarChave(k), v] as [string, any]);
  const normalized: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(CAMPOS_ALIASES)) {
    const match = entries.find(([k]) => k === field.toLowerCase() || aliases.includes(k));
    if (match && match[1] !== undefined && match[1] !== null) {
      normalized[field] = match[1] instanceof Date ? match[1].toISOString() : String(match[1]).trim();
    }
  }
  return normalized;
}

function normalizarGenero(v?: string): string | undefined {
  if (!v) return undefined;
  const g = v.trim().toUpperCase();
  if (['M', 'MASCULINO', 'MALE'].includes(g)) return 'MALE';
  if (['F', 'FEMININO', 'FEMALE'].includes(g)) return 'FEMALE';
  return 'OTHER';
}

function parseDataNascimento(v?: string): string | undefined {
  if (!v) return undefined;
  const s = v.trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const br = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private reportService: StudentsReportService,
    private email: EmailService,
    private whatsapp: WhatsappService,
    private audit: AuditService,
  ) {}

  private async getContactEmail(studentId: string): Promise<{ email: string | null; name: string }> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { email: true } },
        parents: { include: { parent: { include: { user: { select: { email: true } } } } } },
      },
    });
    if (!student) throw new NotFoundException('Atleta não encontrado');
    const name = `${student.firstName} ${student.lastName}`.trim();
    const primaryParent = student.parents.find((p) => p.isPrimary)?.parent ?? student.parents[0]?.parent;
    // Emails de acesso gerados automaticamente não são contactos reais: nunca se envia para eles.
    const real = (e?: string | null) => (e && !emailGeradoAutomaticamente(e) ? e : null);
    const email = real(student.user?.email) || real(primaryParent?.user?.email) || null;
    return { email, name };
  }

  async sendMonthlyReport(studentId: string, userId: string) {
    const { email, name } = await this.getContactEmail(studentId);
    if (!email) throw new BadRequestException('Atleta sem email de contacto (próprio ou de encarregado) disponível');
    const instructor = await this.prisma.instructor.findFirst({ where: { userId } });

    const pdfBuffer = await this.reportService.generate(studentId, { detalhado: true });
    await this.email.sendMonthlyReport(email, name, pdfBuffer);

    return this.prisma.athleteReport.create({
      data: {
        studentId,
        instructorId: instructor?.id ?? null,
        tipo: 'MENSAL',
        referenceMonth: new Date().toISOString().slice(0, 7),
        sentAt: new Date(),
      },
    });
  }

  async sendChamadaAtencao(studentId: string, userId: string, mensagem: string) {
    if (!mensagem?.trim()) throw new BadRequestException('Mensagem da chamada de atenção é obrigatória');
    const { email, name } = await this.getContactEmail(studentId);
    const instructor = await this.prisma.instructor.findFirst({ where: { userId } });
    if (!email) throw new BadRequestException('Atleta sem email de contacto (próprio ou de encarregado) disponível');

    const studentFases = await this.prisma.studentFase.findMany({
      where: { studentId, estado: 'EM_PROGRESSO' },
      include: { fase: true, avaliacoes: true },
    });
    const habilidadesAbaixoMinimo: string[] = [];
    for (const sf of studentFases) {
      const criterios: { nome: string; obrigatoria: boolean }[] = JSON.parse(sf.fase.criterios);
      for (const av of sf.avaliacoes) {
        const criterio = criterios[av.criterioIndex];
        if (!criterio) continue;
        const minimo = criterio.obrigatoria ? 4 : 3;
        if (av.valor < minimo) habilidadesAbaixoMinimo.push(`${criterio.nome} (${sf.fase.nome}) — ${av.valor}/${minimo}`);
      }
    }

    await this.email.sendChamadaAtencao(email, name, mensagem, habilidadesAbaixoMinimo);

    return this.prisma.athleteReport.create({
      data: { studentId, instructorId: instructor?.id ?? null, tipo: 'CHAMADA_ATENCAO', mensagem, sentAt: new Date() },
    });
  }

  async getReportsHistory(studentId: string) {
    return this.prisma.athleteReport.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: { instructor: { select: { firstName: true, lastName: true } } },
    });
  }

  private async resolveUnidadeIdsDoUsuario(userId?: string, role?: string): Promise<string[] | null> {
    if (!userId || role === 'ADMIN' || role === 'SUPER_ADMIN') return null;

    const funcionario = await this.prisma.funcionario.findUnique({
      where: { userId },
      select: { unidadeId: true },
    });
    if (funcionario?.unidadeId) return [funcionario.unidadeId];

    if (role === 'INSTRUCTOR') {
      const instructor = await this.prisma.instructor.findUnique({
        where: { userId },
        select: { unidades: { select: { unidadeId: true } } },
      });
      const ids = instructor?.unidades.map((u) => u.unidadeId) ?? [];
      if (ids.length > 0) return ids;
    }

    return null;
  }

  /**
   * Resolve as turmas que correspondem aos filtros de turma, módulo (fase) e horário.
   * Devolve null quando nenhum destes filtros foi pedido.
   */
  private async turmasPorFiltro(f: { classId?: string; moduleId?: string; dia?: string; hora?: string }): Promise<string[] | null> {
    const classId = typeof f.classId === 'string' && f.classId ? f.classId : null;
    const moduleId = typeof f.moduleId === 'string' && f.moduleId ? f.moduleId : null;
    const dia = typeof f.dia === 'string' && f.dia ? semAcentos(f.dia).toUpperCase() : null;
    const hora = typeof f.hora === 'string' && /^\d{2}:\d{2}$/.test(f.hora) ? f.hora : null;
    if (!classId && !moduleId && !dia && !hora) return null;
    if (classId && !moduleId && !dia && !hora) return [classId];

    const turmas = await this.prisma.class.findMany({
      where: classId ? { id: classId } : {},
      select: { id: true, moduleIds: true, schedules: true },
    });
    const lerJson = (s: string | null): any[] => {
      if (!s) return [];
      try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
    };
    return turmas
      .filter((t) => !moduleId || lerJson(t.moduleIds).includes(moduleId))
      .filter((t) => {
        if (!dia && !hora) return true;
        return lerJson(t.schedules).some((h: any) =>
          (!dia || diaCorresponde(String(h?.day ?? h?.dayOfWeek ?? ''), dia)) &&
          (!hora || String(h?.startTime ?? '').slice(0, 5) === hora),
        );
      })
      .map((t) => t.id);
  }

  async findAll(query: any, userId?: string, role?: string) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    const { search, classId } = query;
    const isActive = query.isActive === undefined ? undefined : query.isActive === 'true' || query.isActive === true;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      // Cada palavra tem de aparecer no nome ou no apelido, para "Ana Ossumane" encontrar o atleta.
      const palavras = String(search).trim().split(/\s+/).filter(Boolean).slice(0, 5);
      where.AND = palavras.map((p) => ({
        OR: [{ firstName: { contains: p } }, { lastName: { contains: p } }],
      }));
    }
    const unidadeIds = await this.resolveUnidadeIdsDoUsuario(userId, role);
    // Filtro de unidade pedido: só é aplicado dentro das unidades a que o utilizador tem acesso.
    const unidadePedida = typeof query.unidadeId === 'string' && query.unidadeId ? query.unidadeId : null;
    if (unidadeIds && unidadePedida) {
      where.unidadeId = { in: unidadeIds.includes(unidadePedida) ? [unidadePedida] : [] };
    } else if (unidadeIds) {
      where.unidadeId = { in: unidadeIds };
    } else if (unidadePedida === 'SEM_UNIDADE') {
      where.unidadeId = null;
    } else if (unidadePedida) {
      where.unidadeId = unidadePedida;
    }

    if (typeof query.etiqueta === 'string' && query.etiqueta) {
      where.etiqueta = query.etiqueta === 'SEM_ETIQUETA' ? null : query.etiqueta;
    }

    const e: any[] = [];
    if (typeof query.genero === 'string' && ['MALE', 'FEMALE', 'OTHER'].includes(query.genero)) where.gender = query.genero;
    if (query.irregular === 'true' || query.irregular === true) e.push({ payments: { some: { status: 'OVERDUE' } } });
    if (typeof query.campanha === 'string' && query.campanha) e.push({ lead: { campanha: query.campanha } });
    if (typeof query.nivel === 'string' && query.nivel) e.push({ enrollments: { some: { isActive: true, class: { level: query.nivel } } } });

    // Módulo: o módulo em progresso do atleta, ou (para quem ainda não tem módulo) o módulo dado na turma.
    const moduleId = typeof query.moduleId === 'string' && query.moduleId ? query.moduleId : null;
    if (query.semModulo === 'true' || query.semModulo === true) {
      e.push({ studentFases: { none: { estado: 'EM_PROGRESSO' } } });
    } else if (moduleId) {
      const turmasDoModulo = (await this.turmasPorFiltro({ moduleId })) ?? [];
      e.push({
        OR: [
          { studentFases: { some: { faseId: moduleId, estado: 'EM_PROGRESSO' } } },
          ...(turmasDoModulo.length
            ? [{ studentFases: { none: { estado: 'EM_PROGRESSO' } }, enrollments: { some: { classId: { in: turmasDoModulo }, isActive: true } } }]
            : []),
        ],
      });
    }

    if (query.semTurma === 'true' || query.semTurma === true) {
      e.push({ enrollments: { none: { isActive: true } } });
    } else {
      const turmas = await this.turmasPorFiltro({ classId, dia: query.dia, hora: query.hora });
      if (turmas) e.push({ enrollments: { some: { classId: { in: turmas }, isActive: true } } });
    }
    if (e.length) where.AND = [...(where.AND ?? []), ...e];

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
        include: {
          user: { select: { email: true, role: true, lastLoginAt: true } },
          enrollments: {
            where: { isActive: true },
            include: {
              class: {
                select: { id: true, name: true, level: true },
              },
            },
          },
          parents: {
            include: {
              parent: { select: { firstName: true, lastName: true, phone: true } },
            },
          },
          lead: { select: { campanha: true, origem: true } },
          pacote: { select: { id: true, nome: true, preco: true } },
          payments: { where: { status: 'OVERDUE' }, select: { id: true }, take: 1 },
          studentFases: { where: { estado: 'EM_PROGRESSO' }, select: { fase: { select: { id: true, nome: true, nivel: true, ordem: true } } }, take: 1 },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    const dataComCategorias = data.map(({ payments, studentFases, ...student }) => ({
      ...student,
      moduloActual: studentFases[0]?.fase ?? null,
      categoria: {
        ativo: student.isActive,
        irregular: payments.length > 0,
        campanha: student.lead?.campanha ?? null,
      },
    }));

    return {
      data: dataComCategorias,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByUserId(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
      include: {
        user: { select: { email: true, role: true, lastLoginAt: true } },
        enrollments: {
          where: { isActive: true },
          include: {
            class: {
              include: { instructor: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        feedbacks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, status: true, aiGeneratedText: true,
            finalText: true, aiConfidenceScore: true, createdAt: true,
          },
        },
        payments: {
          take: 6,
          orderBy: { dueDate: 'desc' },
          select: { id: true, amount: true, status: true, dueDate: true, notes: true },
        },
        progressRecords: {
          include: { module: { select: { id: true, name: true, description: true, level: true, order: true, skills: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!student) throw new NotFoundException('Perfil de atleta não encontrado');

    const [attendanceStats, performanceRecords, avaliacoesDiarias, trainingPlans] = await Promise.all([
      this.prisma.attendance.groupBy({
        by: ['status'],
        where: { studentId: student.id },
        _count: true,
      }),
      this.prisma.performanceRecord.findMany({
        where: { studentId: student.id },
        orderBy: { recordedAt: 'desc' },
        take: 10,
        select: {
          id: true, technique: true, stamina: true, speed: true,
          coordination: true, breathing: true, turns: true,
          startDive: true, overallScore: true, instructorNotes: true, recordedAt: true,
        },
      }),
      this.prisma.avaliacao.findMany({
        where: { studentId: student.id, tipo: 'DIARIA' },
        orderBy: { avaliadoEm: 'desc' },
        take: 10,
        select: { id: true, pontuacoes: true, notaGlobal: true, observacoes: true, avaliadoEm: true },
      }),
      this.prisma.trainingPlan.findMany({
        where: { studentId: student.id, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: {
          id: true, title: true, description: true, objectives: true,
          exercises: true, aiGenerated: true, validFrom: true, validUntil: true,
        },
      }),
    ]);

    const totalSessions = attendanceStats.reduce((s, r) => s + r._count, 0);
    const present = attendanceStats.find((r) => r.status === 'PRESENT')?._count ?? 0;

    return {
      ...student,
      performanceRecords: mesclarRegistosDesempenho(performanceRecords, avaliacoesDiarias).slice(0, 10),
      trainingPlans,
      attendanceStats: { total: totalSessions, present, rate: totalSessions ? Math.round((present / totalSessions) * 100) : 0 },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true, lastLoginAt: true } },
        enrollments: {
          include: {
            class: {
              include: {
                instructor: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        parents: {
          include: { parent: true },
        },
        pacote: { select: { id: true, nome: true, preco: true, aulasPorSemana: true, ativo: true } },
        feedbacks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, status: true, aiGeneratedText: true,
            finalText: true, aiConfidenceScore: true,
            sentToStudentAt: true, createdAt: true,
          },
        },
        progressRecords: {
          include: { module: true },
        },
        trainingPlans: { where: { isActive: true } },
        payments: {
          take: 12,
          orderBy: { dueDate: 'desc' },
        },
      },
    });
    if (!student) throw new NotFoundException('Atleta não encontrado');
    return student;
  }

  async create(
    dto: Partial<CreateStudentDto> & { email?: string; password?: string; unidadeId?: string },
    actorUserId?: string,
    passwordHashPrecomputado?: string,
    actorRole?: string,
  ) {
    const bcrypt = await import('bcryptjs');

    const camposEmFalta: string[] = [];
    const firstName = dto.firstName?.trim() || (camposEmFalta.push('firstName'), '(Sem nome)');
    const lastName = dto.lastName?.trim() || (camposEmFalta.push('lastName'), '(Sem apelido)');
    const dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : (camposEmFalta.push('dateOfBirth'), new Date());

    let unidadeId = dto.unidadeId || undefined;
    if (actorRole === 'ASSISTENTE_ADMIN' && actorUserId) {
      const funcionario = await this.prisma.funcionario.findUnique({
        where: { userId: actorUserId },
        select: { unidadeId: true },
      });
      if (!funcionario?.unidadeId) {
        throw new BadRequestException('A tua conta não tem Unidade atribuída — pede a um Admin para a configurar em RH → Funcionários');
      }
      unidadeId = funcionario.unidadeId;
    }

    const studentData = {
      firstName,
      lastName,
      dateOfBirth,
      gender: dto.gender || 'OTHER',
      phone: dto.phone,
      medicalNotes: dto.medicalNotes,
      emergencyContact: dto.emergencyContact,
      emergencyPhone: dto.emergencyPhone,
      autorizacaoImagem: dto.autorizacaoImagem ?? false,
      autorizacaoImagemData: dto.autorizacaoImagem ? new Date() : undefined,
      autorizacaoImagemDoc: dto.autorizacaoImagemDoc,
      estadoInscricao: 'DOCUMENTOS_PENDENTES',
      camposEmFalta: camposEmFalta.length ? JSON.stringify(camposEmFalta) : undefined,
      unidadeId,
      pacoteId: undefined as string | undefined,
      etiqueta: dto.etiqueta || null,
      trabalhadorBm: limparTexto(dto.trabalhadorBm, 120),
    };

    if (studentData.etiqueta === ETIQUETA_SEM_PACOTE && dto.pacoteId) {
      throw new BadRequestException('Atletas do Banco de Moçambique (BM) não têm pacote de pagamento.');
    }
    const pacote = dto.pacoteId ? await this.validarPacote(dto.pacoteId) : null;
    if (pacote) studentData.pacoteId = pacote.id;

    // A turma é validada antes de criar o atleta, para não ficar um registo a meio.
    if (dto.classId) await this.validarTurmaParaAtleta(dto.classId, unidadeId ?? null);

    let user: { student?: any };

    if (dto.guardians?.length) {
      user = await this.prisma.$transaction(async (tx) => {
        const createdStudent = await tx.student.create({ data: studentData });

        const guardianPassword = await bcrypt.hash('parent123', 10);
        for (const [index, guardian] of dto.guardians!.entries()) {
          let parentId: string;

          const existingUser = guardian.email
            ? await tx.user.findUnique({ where: { email: guardian.email }, include: { parent: true } })
            : null;

          if (existingUser?.parent) {
            parentId = existingUser.parent.id;
          } else if (existingUser) {
            const flip = existingUser.role === 'STUDENT' || existingUser.role === 'VISITOR';
            const updated = await tx.user.update({
              where: { id: existingUser.id },
              data: {
                ...(flip && { role: 'PARENT' }),
                parent: {
                  create: {
                    firstName: guardian.firstName,
                    lastName: guardian.lastName,
                    phone: guardian.phone,
                    relationship: guardian.relationship || 'Parent',
                  },
                },
              },
              include: { parent: true },
            });
            parentId = updated.parent!.id;
          } else {
            try {
              const guardianUser = await tx.user.create({
                data: {
                  email: guardian.email ?? `encarregado_${Date.now()}_${index}_${randomUUID().slice(0, 8)}@mastchieve.com`,
                  password: guardianPassword,
                  role: 'PARENT',
                  parent: {
                    create: {
                      firstName: guardian.firstName,
                      lastName: guardian.lastName,
                      phone: guardian.phone,
                      relationship: guardian.relationship || 'Parent',
                    },
                  },
                },
                include: { parent: true },
              });
              parentId = guardianUser.parent!.id;
            } catch (e: any) {
              if (e?.code === 'P2002') {
                throw new BadRequestException('Este email de encarregado já está associado a outra conta.');
              }
              throw e;
            }
          }

          await tx.studentParent.create({
            data: { studentId: createdStudent.id, parentId, isPrimary: guardian.isPrimary ?? index === 0 },
          });
        }

        return { student: createdStudent };
      });
    } else {
      const email = dto.email || `atleta_${Date.now()}_${randomUUID().slice(0, 8)}@mastchieve.com`;
      if (dto.email) {
        const existente = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existente) {
          throw new BadRequestException(
            'Este email já está associado a outra conta. Se for o encarregado deste atleta, adiciona-o na secção Encarregados em vez do campo de email do atleta.',
          );
        }
      }
      const password = passwordHashPrecomputado ?? (await bcrypt.hash(dto.password || 'student123', 10));

      user = await this.prisma.user.create({
        data: {
          email,
          password,
          role: 'STUDENT',
          student: { create: studentData },
        },
        include: { student: true },
      });
    }

    if (actorUserId && user.student) {
      await this.audit.log({
        userId: actorUserId,
        action: 'STUDENT_CRIADO',
        entity: 'Student',
        entityId: user.student.id,
        newValues: { firstName, lastName, guardians: dto.guardians?.length ?? 0, pacoteId: pacote?.id, etiqueta: studentData.etiqueta, classId: dto.classId },
      });
    }

    if (dto.classId && user.student) {
      await this.matricularNaTurma(user.student.id, dto.classId, unidadeId ?? null, actorUserId);
    }

    // O preço do pacote reflecte-se logo na inscrição: primeira mensalidade com o valor do pacote.
    if (pacote && user.student && dto.gerarPrimeiraMensalidade !== false) {
      await this.criarPrimeiraMensalidade(user.student.id, pacote, actorUserId);
    }

    if (user.student) {
      const studentComContacto = await this.prisma.student.findUnique({
        where: { id: user.student.id },
        include: {
          parents: { include: { parent: true } },
          unidade: { select: { contacto: true, email: true } },
        },
      });
      const contacto = studentComContacto ? resolveContactoAtleta(studentComContacto) : { telefone: null, viaEncarregado: false };
      const links = await this.prisma.linkPartilha.findMany({ orderBy: { chave: 'asc' } });
      const nomeCompleto = `${firstName} ${lastName}`.trim();
      const suporte = studentComContacto?.unidade?.contacto || studentComContacto?.unidade?.email;
      const appUrl = process.env.APP_URL ?? 'http://localhost:4300';

      if (contacto.telefone) {
        const saudacao = contacto.viaEncarregado
          ? `Olá${contacto.nomeEncarregado ? `, ${contacto.nomeEncarregado}` : ''}! Em nome de ${nomeCompleto}, bem-vindo(a) à Mastchieve! 🏊`
          : `Olá! Bem-vindo(a) à Mastchieve, ${nomeCompleto}! 🏊`;

        const mensagem = [
          saudacao,
          'Aqui tens toda a informação sobre como funciona a nossa academia:',
          ...links.map((l) => `${l.label}: ${l.url}`),
          '',
          'Horário de funcionamento: Segunda a Sábado, 06h00–20h00.',
          `Acede à tua área de atleta em: ${appUrl}/login`,
          suporte ? `Qualquer dúvida, contacta-nos: ${suporte}` : undefined,
        ].filter(Boolean).join('\n');

        await this.whatsapp.enqueue({
          tipo: 'BOAS_VINDAS',
          telefone: contacto.telefone,
          mensagem,
          studentId: user.student.id,
        });
      }

      const { email: contactEmail } = await this.getContactEmail(user.student.id);
      if (contactEmail) {
        await this.email.sendBoasVindasAtleta(contactEmail, nomeCompleto, nomeCompleto, links, suporte);
      }
    }

    return user;
  }

  async addChild(actorUserId: string, dto: CreateStudentDto) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      include: { student: true, parent: true },
    });
    if (!actor) throw new NotFoundException('Utilizador não encontrado');

    let parentId = actor.parent?.id;
    if (!parentId) {
      if (!actor.student) {
        throw new BadRequestException('Apenas atletas ou encarregados podem inscrever filhos');
      }
      const updated = await this.prisma.user.update({
        where: { id: actor.id },
        data: {
          role: 'PARENT',
          parent: {
            create: {
              firstName: actor.student.firstName,
              lastName: actor.student.lastName,
              phone: actor.student.phone || dto.phone || 'N/D',
              relationship: 'Pai/Mãe',
            },
          },
        },
        include: { parent: true },
      });
      parentId = updated.parent!.id;
    }

    // O encarregado não escolhe pacote/preço: isso é feito pela administração.
    const { guardians, pacoteId: _p, gerarPrimeiraMensalidade: _g, etiqueta: _e, trabalhadorBm: _t, classId: _c, ...childDto } = dto;
    const created = await this.create(childDto, actorUserId);
    if (created.student) {
      await this.prisma.studentParent.create({
        data: { studentId: created.student.id, parentId, isPrimary: true },
      });
    }
    return created;
  }

  /** O assistente administrativo só gere atletas da sua unidade. ADMIN / SUPER_ADMIN gerem todas. */
  private async assertAtletaNaUnidadeDoActor(student: { unidadeId: string | null }, actorUserId?: string, actorRole?: string) {
    if (actorRole !== 'ASSISTENTE_ADMIN' || !actorUserId) return;
    const minha = await this.unidadeDoFuncionario(actorUserId);
    if (!minha) throw new ForbiddenException('A sua conta não tem unidade atribuída — peça a um Admin para a configurar em RH → Funcionários.');
    if (student.unidadeId !== minha) throw new ForbiddenException('Este atleta pertence a outra unidade.');
  }

  private idade(dataNascimento: Date, ref = new Date()): number {
    let anos = ref.getFullYear() - dataNascimento.getFullYear();
    const m = ref.getMonth() - dataNascimento.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < dataNascimento.getDate())) anos--;
    return anos;
  }

  /** Filhos (educandos) ligados à conta de um atleta adulto. */
  async listarFilhos(studentId: string, actorUserId?: string, actorRole?: string) {
    const atleta = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { unidadeId: true, user: { select: { parent: { select: { id: true } } } } },
    });
    if (!atleta) throw new NotFoundException('Atleta não encontrado');
    await this.assertAtletaNaUnidadeDoActor(atleta, actorUserId, actorRole);
    const parentId = atleta.user?.parent?.id;
    if (!parentId) return [];
    const ligacoes = await this.prisma.studentParent.findMany({
      where: { parentId },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, dateOfBirth: true, isActive: true, etiqueta: true,
            enrollments: { where: { isActive: true }, select: { class: { select: { id: true, name: true } } } },
          },
        },
      },
    });
    return ligacoes.filter((l) => l.student.id !== studentId).map((l) => l.student);
  }

  /**
   * A secretaria inscreve um filho de um atleta adulto: o atleta passa a ser também encarregado
   * (o perfil continua a ser de atleta) e o filho fica na mesma unidade, com a turma indicada.
   */
  async adicionarFilho(studentId: string, dto: AdicionarFilhoDto, actorUserId: string, actorRole?: string) {
    const atleta = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true, parent: { select: { id: true } } } } },
    });
    if (!atleta) throw new NotFoundException('Atleta não encontrado');
    await this.assertAtletaNaUnidadeDoActor(atleta, actorUserId, actorRole);
    if (this.idade(atleta.dateOfBirth) < 18) throw new BadRequestException('Só atletas maiores de idade podem ter filhos associados.');
    if (!atleta.userId || !atleta.user) throw new BadRequestException('Este atleta não tem conta de acesso própria.');

    const nascimento = new Date(dto.dateOfBirth);
    if (isNaN(nascimento.getTime()) || nascimento > new Date()) throw new BadRequestException('Data de nascimento inválida.');
    if (nascimento <= atleta.dateOfBirth) throw new BadRequestException('O filho tem de ser mais novo do que o encarregado.');
    if (dto.classId) await this.validarTurmaParaAtleta(dto.classId, atleta.unidadeId);

    const filho = await this.prisma.$transaction(async (tx) => {
      let parentId = atleta.user!.parent?.id;
      if (!parentId) {
        // Não se inventam contactos: sem telefone do atleta, o encarregado fica sem telefone.
        const parent = await tx.parent.create({
          data: {
            userId: atleta.userId!,
            firstName: atleta.firstName,
            lastName: atleta.lastName,
            phone: atleta.phone?.trim() || '',
            relationship: dto.relationship?.trim() || 'Pai/Mãe',
          },
        });
        parentId = parent.id;
      }
      const criado = await tx.student.create({
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          dateOfBirth: nascimento,
          gender: dto.gender,
          medicalNotes: dto.medicalNotes?.trim() || undefined,
          unidadeId: atleta.unidadeId,
          // Os filhos de trabalhadores do BM seguem a mesma regra (sem pacotes).
          etiqueta: atleta.etiqueta,
          trabalhadorBm: atleta.etiqueta ? atleta.trabalhadorBm || `${atleta.firstName} ${atleta.lastName}`.trim() : null,
          estadoInscricao: 'DOCUMENTOS_PENDENTES',
        },
      });
      await tx.studentParent.create({ data: { studentId: criado.id, parentId, isPrimary: true } });
      return criado;
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'FILHO_ASSOCIADO',
      entity: 'Student',
      entityId: filho.id,
      newValues: { encarregadoStudentId: studentId, classId: dto.classId ?? null },
    });

    let avisoTurma: string | null = null;
    if (dto.classId) {
      try {
        await this.matricularNaTurma(filho.id, dto.classId, atleta.unidadeId, actorUserId);
      } catch (e: any) {
        avisoTurma = e?.message ?? 'Não foi possível inscrever na turma.';
      }
    }
    return { ...filho, avisoTurma };
  }

  /**
   * Gera um link de uso único (72 h) para o atleta / encarregado definir a própria password.
   * Nunca é enviada uma password: quem recebe o link escolhe-a. Os links anteriores deixam de valer.
   */
  async criarConviteAcesso(studentId: string, actorUserId: string, actorRole?: string) {
    const atleta = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true, firstName: true, lastName: true, unidadeId: true, userId: true, phone: true,
        user: { select: { email: true, isActive: true, parent: { select: { phone: true } } } },
      },
    });
    if (!atleta) throw new NotFoundException('Atleta não encontrado');
    await this.assertAtletaNaUnidadeDoActor(atleta, actorUserId, actorRole);
    if (!atleta.userId || !atleta.user) throw new BadRequestException('Este atleta não tem conta própria — o acesso é feito pela conta do encarregado.');
    if (!atleta.user.isActive) throw new BadRequestException('A conta deste atleta está desactivada.');

    const { token, tokenHash } = gerarTokenConvite();
    const expiraEm = new Date(Date.now() + VALIDADE_CONVITE_HORAS * 3600 * 1000);
    await this.prisma.$transaction([
      this.prisma.conviteAcesso.updateMany({ where: { userId: atleta.userId, usadoEm: null }, data: { usadoEm: new Date() } }),
      this.prisma.conviteAcesso.create({ data: { userId: atleta.userId, tokenHash, expiraEm, criadoPorId: actorUserId } }),
    ]);
    await this.audit.log({
      userId: actorUserId,
      action: 'CONVITE_ACESSO_CRIADO',
      entity: 'Student',
      entityId: studentId,
      newValues: { expiraEm },
    });

    const appUrl = (process.env.APP_URL ?? 'http://localhost:4300').replace(/\/$/, '');
    const telefone = atleta.phone?.trim() || atleta.user.parent?.phone?.trim() || null;
    return {
      link: `${appUrl}/acesso/${token}`,
      expiraEm,
      email: atleta.user.email,
      emailGerado: emailGeradoAutomaticamente(atleta.user.email),
      // Só para o botão "Partilhar por WhatsApp" — se não houver telefone, não se assume envio.
      telefone,
      nome: `${atleta.firstName} ${atleta.lastName}`.trim(),
    };
  }

  /**
   * Coloca vários atletas numa unidade e/ou turma. Cada atleta é tratado à parte: os que não
   * puderem ser alocados (outra unidade, turma lotada) são devolvidos com o motivo.
   */
  async alocarAtletas(dto: AlocarAtletasDto, actorUserId: string, actorRole?: string) {
    if (!dto.unidadeId && !dto.classId) throw new BadRequestException('Escolha a unidade e/ou a turma.');
    const ids = Array.from(new Set(dto.studentIds));
    let unidadeDestino = dto.unidadeId ?? null;

    if (dto.classId) {
      const turma = await this.prisma.class.findUnique({ where: { id: dto.classId }, select: { unidadeId: true } });
      if (!turma) throw new BadRequestException('A turma escolhida não existe.');
      if (unidadeDestino && turma.unidadeId && turma.unidadeId !== unidadeDestino) {
        throw new BadRequestException('A turma escolhida pertence a outra unidade.');
      }
      unidadeDestino = unidadeDestino ?? turma.unidadeId ?? null;
    }
    if (dto.unidadeId) {
      const u = await this.prisma.unidade.findUnique({ where: { id: dto.unidadeId }, select: { ativo: true } });
      if (!u?.ativo) throw new BadRequestException('A unidade escolhida não existe ou está desactivada.');
    }
    if (actorRole === 'ASSISTENTE_ADMIN') {
      const minha = await this.unidadeDoFuncionario(actorUserId);
      if (!minha) throw new ForbiddenException('A sua conta não tem unidade atribuída.');
      if (unidadeDestino && unidadeDestino !== minha) throw new ForbiddenException('Só pode alocar atletas na sua unidade.');
    }

    const atletas = await this.prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true, unidadeId: true, firstName: true, lastName: true } });
    const minhaUnidade = actorRole === 'ASSISTENTE_ADMIN' ? await this.unidadeDoFuncionario(actorUserId) : null;
    const resultado = { alocados: 0, falhas: [] as { studentId: string; nome: string; motivo: string }[] };

    for (const a of atletas) {
      const nome = `${a.firstName} ${a.lastName}`.trim();
      try {
        // O assistente só mexe em atletas da sua unidade ou ainda sem unidade.
        if (minhaUnidade && a.unidadeId && a.unidadeId !== minhaUnidade) throw new ForbiddenException('Atleta de outra unidade.');
        const unidadeFinal = dto.unidadeId ?? (a.unidadeId || unidadeDestino);
        if (dto.unidadeId && a.unidadeId !== dto.unidadeId) {
          await this.prisma.student.update({ where: { id: a.id }, data: { unidadeId: dto.unidadeId } });
        } else if (!a.unidadeId && unidadeDestino) {
          await this.prisma.student.update({ where: { id: a.id }, data: { unidadeId: unidadeDestino } });
        }
        if (dto.classId) await this.matricularNaTurma(a.id, dto.classId, unidadeFinal ?? null, actorUserId);
        resultado.alocados++;
      } catch (e: any) {
        resultado.falhas.push({ studentId: a.id, nome, motivo: e?.message ?? 'Erro' });
      }
    }
    const encontrados = new Set(atletas.map((a) => a.id));
    for (const id of ids) if (!encontrados.has(id)) resultado.falhas.push({ studentId: id, nome: '', motivo: 'Atleta não encontrado' });

    await this.audit.log({
      userId: actorUserId,
      action: 'ATLETAS_ALOCADOS',
      entity: 'Student',
      newValues: { total: ids.length, alocados: resultado.alocados, unidadeId: dto.unidadeId ?? null, classId: dto.classId ?? null },
    });
    return resultado;
  }

  /** Unidade do funcionário (assistente administrativo) — usada para limitar onde pode inscrever atletas. */
  private async unidadeDoFuncionario(userId: string): Promise<string | null> {
    const f = await this.prisma.funcionario.findUnique({ where: { userId }, select: { unidadeId: true } });
    return f?.unidadeId ?? null;
  }

  /** A turma tem de existir, estar activa e pertencer à mesma unidade do atleta. */
  private async validarTurmaParaAtleta(classId: string, unidadeId: string | null) {
    const turma = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, status: true, unidadeId: true, maxStudents: true, _count: { select: { enrollments: { where: { isActive: true } } } } },
    });
    if (!turma) throw new BadRequestException('A turma escolhida não existe.');
    if (turma.status && turma.status !== 'ACTIVE') throw new BadRequestException('A turma escolhida não está activa.');
    if (turma.unidadeId && unidadeId && turma.unidadeId !== unidadeId) {
      throw new BadRequestException('A turma escolhida pertence a outra unidade. Escolha uma turma da unidade do atleta.');
    }
    if (turma._count.enrollments >= turma.maxStudents) throw new ConflictException(`A turma ${turma.name} está lotada.`);
    return turma;
  }

  /** Inscreve o atleta na turma, com a capacidade verificada dentro de uma transacção (linha da turma bloqueada). */
  private async matricularNaTurma(studentId: string, classId: string, unidadeId: string | null, actorUserId?: string) {
    await this.validarTurmaParaAtleta(classId, unidadeId);
    const enrollment = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM classes WHERE id = ${classId} FOR UPDATE`;
      const [turma, activos, existente] = await Promise.all([
        tx.class.findUnique({ where: { id: classId }, select: { maxStudents: true, name: true } }),
        tx.enrollment.count({ where: { classId, isActive: true } }),
        tx.enrollment.findUnique({ where: { studentId_classId: { studentId, classId } }, select: { isActive: true } }),
      ]);
      if (existente?.isActive) return null;
      if (!turma || activos >= turma.maxStudents) throw new ConflictException(`A turma ${turma?.name ?? ''} está lotada.`.trim());
      return tx.enrollment.upsert({
        where: { studentId_classId: { studentId, classId } },
        create: { studentId, classId },
        update: { isActive: true },
      });
    });
    if (enrollment && actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'CLASS_MATRICULA',
        entity: 'Enrollment',
        entityId: enrollment.id,
        newValues: { classId, studentId },
      });
    }
    return enrollment;
  }

  /** Pacote tem de existir e estar activo para ser atribuído. */
  private async validarPacote(pacoteId: string) {
    const pacote = await this.prisma.pacote.findUnique({ where: { id: pacoteId } });
    if (!pacote) throw new BadRequestException('O pacote escolhido não existe.');
    if (!pacote.ativo) throw new BadRequestException('O pacote escolhido está desactivado. Escolha outro pacote.');
    return pacote;
  }

  /**
   * Mensalidade do mês da inscrição com o preço do pacote. Vence no dia 10; se a inscrição
   * for depois disso, vence 7 dias após a inscrição (para não nascer já em atraso).
   */
  private async criarPrimeiraMensalidade(studentId: string, pacote: { id: string; nome: string; preco: number }, actorUserId?: string) {
    if (!(pacote.preco > 0)) return null;
    const hoje = new Date();
    const month = hoje.getMonth() + 1;
    const year = hoje.getFullYear();
    const existente = await this.prisma.monthlyFee.findUnique({ where: { studentId_month_year: { studentId, month, year } } });
    if (existente) return null;
    let dueDate = new Date(year, month - 1, 10, 23, 59, 59);
    if (dueDate < hoje) {
      dueDate = new Date(hoje);
      dueDate.setDate(dueDate.getDate() + 7);
      dueDate.setHours(23, 59, 59, 0);
    }
    const description = `Mensalidade — ${pacote.nome}`;
    const fee = await this.prisma.$transaction(async (tx) => {
      const f = await tx.monthlyFee.create({ data: { studentId, month, year, amount: pacote.preco, dueDate, description } });
      await tx.payment.create({ data: { studentId, monthlyFeeId: f.id, amount: pacote.preco, status: 'PENDING', dueDate, notes: description } });
      return f;
    });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'MENSALIDADE_INSCRICAO_CRIADA',
        entity: 'MonthlyFee',
        entityId: fee.id,
        newValues: { studentId, pacoteId: pacote.id, amount: pacote.preco, month, year },
      });
    }
    return fee;
  }

  async update(id: string, dto: UpdateStudentDto, actorUserId?: string, actorRole?: string) {
    const before = await this.findOne(id);
    const { gerarPrimeiraMensalidade, guardians: _guardians, classId, email: _email, ...resto } = dto as any;
    const data: any = { ...resto };
    const gestao = ROLES_GESTAO_ATLETA.includes(actorRole ?? '');

    // Unidade, turma e etiqueta definem onde o atleta treina e como paga: só a administração.
    if ((dto.unidadeId !== undefined || classId !== undefined || dto.etiqueta !== undefined || dto.trabalhadorBm !== undefined) && !gestao) {
      throw new ForbiddenException('Só a administração pode alterar a unidade, a turma ou a etiqueta do atleta.');
    }
    if (dto.unidadeId !== undefined) {
      if (!dto.unidadeId) throw new BadRequestException('O atleta tem de ficar numa unidade.');
      const unidade = await this.prisma.unidade.findUnique({ where: { id: dto.unidadeId }, select: { ativo: true } });
      if (!unidade?.ativo) throw new BadRequestException('A unidade escolhida não existe ou está desactivada.');
      if (actorRole === 'ASSISTENTE_ADMIN' && actorUserId) {
        const minha = await this.unidadeDoFuncionario(actorUserId);
        if (!minha || minha !== dto.unidadeId) {
          throw new ForbiddenException('Só pode colocar atletas na unidade a que está atribuído(a).');
        }
      }
    }
    if (dto.trabalhadorBm !== undefined) data.trabalhadorBm = limparTexto(dto.trabalhadorBm, 120);
    if (dto.etiqueta !== undefined) data.etiqueta = dto.etiqueta || null;

    const etiquetaFinal = dto.etiqueta !== undefined ? data.etiqueta : (before as any).etiqueta;
    if (dto.pacoteId !== undefined) {
      // O pacote define o valor cobrado: só a administração o pode alterar.
      if (!gestao) {
        throw new BadRequestException('Só a administração pode alterar o pacote do atleta.');
      }
      if (dto.pacoteId && etiquetaFinal === ETIQUETA_SEM_PACOTE) {
        throw new BadRequestException('Atletas do Banco de Moçambique (BM) não têm pacote de pagamento.');
      }
      data.pacoteId = dto.pacoteId ? (await this.validarPacote(dto.pacoteId)).id : null;
    }
    // Ao marcar como BM, o pacote deixa de se aplicar (fica registado na auditoria).
    if (etiquetaFinal === ETIQUETA_SEM_PACOTE && (before as any).pacoteId) data.pacoteId = null;

    const unidadeFinal = dto.unidadeId !== undefined ? dto.unidadeId : (before as any).unidadeId;
    if (classId) await this.validarTurmaParaAtleta(classId, unidadeFinal ?? null);

    if ((before as any).camposEmFalta) {
      let emFalta: string[] = [];
      try { emFalta = JSON.parse((before as any).camposEmFalta); } catch { emFalta = []; }
      const aindaEmFalta = emFalta.filter((campo) => (dto as any)[campo] === undefined);
      data.camposEmFalta = aindaEmFalta.length > 0 ? JSON.stringify(aindaEmFalta) : null;
    }

    const updated = await this.prisma.student.update({ where: { id }, data });
    if (classId) await this.matricularNaTurma(id, classId, unidadeFinal ?? null, actorUserId);
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'STUDENT_ATUALIZADO',
        entity: 'Student',
        entityId: id,
        oldValues: dto ? Object.fromEntries(Object.keys(dto as any).map((k) => [k, (before as any)[k]])) : undefined,
        newValues: dto as any,
      });
    }
    return updated;
  }

  async resetPassword(studentId: string, newPassword: string, actorUserId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (!student) throw new NotFoundException('Atleta não encontrado');
    if (!student.userId) {
      throw new BadRequestException('Este atleta não tem conta própria — a senha é gerida na conta do encarregado (painel /parent).');
    }

    const bcrypt = await import('bcryptjs');
    const password = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: student.userId }, data: { password } });

    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'STUDENT_SENHA_REDEFINIDA',
        entity: 'Student',
        entityId: studentId,
      });
    }

    return { success: true };
  }

  async importFromFile(buffer: Buffer, actorUserId?: string) {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const [unidades, turmas] = await Promise.all([
      this.prisma.unidade.findMany({ where: { ativo: true } }),
      this.prisma.class.findMany(),
    ]);

    // Todas as linhas do ficheiro usam a senha por omissão — calcular o hash bcrypt
    // uma única vez em vez de repetir o custo (CPU-bound) em cada linha.
    const bcrypt = await import('bcryptjs');
    const senhaPadraoHash = await bcrypt.hash('student123', 10);

    const resultado = { criados: 0, incompletos: 0, erros: [] as { linha: number; motivo: string }[] };

    const processarLinha = async (i: number) => {
      const linha = i + 2;
      try {
        const normalizado = normalizeImportRow(rows[i]);
        const dto: Partial<CreateStudentDto> & { email?: string; unidadeId?: string } = {
          firstName: normalizado.firstName,
          lastName: normalizado.lastName,
          dateOfBirth: parseDataNascimento(normalizado.dateOfBirth),
          gender: normalizarGenero(normalizado.gender) as any,
          phone: normalizado.phone,
          email: normalizado.email,
        };

        if (normalizado.unidade) {
          const chave = normalizarChave(normalizado.unidade);
          const unidade = unidades.find((u) => normalizarChave(u.nome) === chave || normalizarChave(u.codigo) === chave);
          if (unidade) dto.unidadeId = unidade.id;
        }

        const created = await this.create(dto, actorUserId, senhaPadraoHash);

        if (normalizado.turma && created.student) {
          const chaveTurma = normalizarChave(normalizado.turma);
          const turma = turmas.find((t) => normalizarChave(t.name) === chaveTurma);
          if (turma) {
            await this.prisma.enrollment.upsert({
              where: { studentId_classId: { studentId: created.student.id, classId: turma.id } },
              create: { studentId: created.student.id, classId: turma.id },
              update: {},
            });
          }
        }

        resultado.criados++;
        if (created.student?.camposEmFalta) resultado.incompletos++;
      } catch (e: any) {
        resultado.erros.push({ linha, motivo: e?.message || 'Erro desconhecido ao processar a linha' });
      }
    };

    // Processar em lotes concorrentes — o trabalho por linha é sobretudo I/O
    // (BD, auditoria), por isso paralelizar reduz o tempo total quase linearmente
    // com o tamanho do lote, em vez de somar a latência de cada linha em série.
    const CONCORRENCIA = 10;
    for (let i = 0; i < rows.length; i += CONCORRENCIA) {
      const lote = Array.from({ length: Math.min(CONCORRENCIA, rows.length - i) }, (_, j) => i + j);
      await Promise.all(lote.map(processarLinha));
    }

    return resultado;
  }

  async exportToFile(template = false): Promise<Buffer> {
    let rows: Record<string, string>[] = [];

    if (!template) {
      const students = await this.prisma.student.findMany({
        include: {
          user: { select: { email: true } },
          unidade: { select: { nome: true } },
          enrollments: { where: { isActive: true }, include: { class: { select: { name: true } } } },
        },
        orderBy: { firstName: 'asc' },
      });

      rows = students.map((s) => {
        let camposEmFalta = '';
        if (s.camposEmFalta) {
          try { camposEmFalta = (JSON.parse(s.camposEmFalta) as string[]).join(', '); } catch { camposEmFalta = ''; }
        }
        return {
          Nome: s.firstName,
          Apelido: s.lastName,
          'Data de Nascimento': s.dateOfBirth.toISOString().slice(0, 10),
          'Género': s.gender,
          Telefone: s.phone ?? '',
          Email: s.user?.email ?? '',
          Unidade: s.unidade?.nome ?? '',
          Turma: s.enrollments.map((e) => e.class.name).join(', '),
          'Estado Inscrição': s.estadoInscricao,
          'Campos em Falta': camposEmFalta,
        };
      });
    }

    const headers = ['Nome', 'Apelido', 'Data de Nascimento', 'Género', 'Telefone', 'Email', 'Unidade', 'Turma', 'Estado Inscrição', 'Campos em Falta'];
    const sheet = rows.length ? XLSX.utils.json_to_sheet(rows, { header: headers }) : XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Atletas');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async deactivate(id: string, actorUserId?: string) {
    await this.findOne(id);
    const updated = await this.prisma.student.update({ where: { id }, data: { isActive: false, estadoInscricao: 'CANCELADA' } });
    if (actorUserId) {
      await this.audit.log({ userId: actorUserId, action: 'STUDENT_DESATIVADO', entity: 'Student', entityId: id });
    }
    return updated;
  }

  async checkDuplicate(firstName: string, lastName: string, dateOfBirth: string) {
    if (!firstName?.trim() || !lastName?.trim() || !dateOfBirth) {
      throw new BadRequestException('firstName, lastName e dateOfBirth são obrigatórios');
    }
    const matches = await this.prisma.student.findMany({
      where: {
        firstName: { equals: firstName.trim() },
        lastName: { equals: lastName.trim() },
        dateOfBirth: new Date(dateOfBirth),
      },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true, isActive: true, enrollmentDate: true },
    });
    return { duplicado: matches.length > 0, matches };
  }

  async getChecklist(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: { id: true, estadoInscricao: true },
    });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    const docs = await this.prisma.document.findMany({ where: { studentId: id } });
    const items = DOCUMENTOS_INSCRICAO_OBRIGATORIOS.map((type) => {
      const doc = docs.find((d) => d.type === type);
      return { type, presente: !!doc, validado: doc?.validado ?? false, documentId: doc?.id ?? null };
    });
    const completo = items.every((i) => i.validado);

    return { estadoInscricao: student.estadoInscricao, items, completo };
  }

  async getPerformanceSummary(studentId: string) {
    const [performanceRecords, avaliacoesDiarias, feedbacks, progress, attendance, trainingPlans] = await Promise.all([
      this.prisma.performanceRecord.findMany({
        where: { studentId },
        orderBy: { recordedAt: 'desc' },
        take: 20,
        select: {
          id: true, technique: true, stamina: true, speed: true,
          coordination: true, breathing: true, turns: true,
          startDive: true, overallScore: true, instructorNotes: true, recordedAt: true,
        },
      }),
      this.prisma.avaliacao.findMany({
        where: { studentId, tipo: 'DIARIA' },
        orderBy: { avaliadoEm: 'desc' },
        take: 20,
        select: { id: true, pontuacoes: true, notaGlobal: true, observacoes: true, avaliadoEm: true },
      }),
      this.prisma.feedback.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, status: true, aiGeneratedText: true,
          finalText: true, aiConfidenceScore: true,
          sentToStudentAt: true, createdAt: true,
        },
      }),
      this.prisma.progress.findMany({
        where: { studentId },
        include: { module: true },
      }),
      this.prisma.attendance.findMany({
        where: { studentId },
        orderBy: { markedAt: 'desc' },
        take: 30,
        select: { status: true, markedAt: true },
      }),
      this.prisma.trainingPlan.findMany({
        where: { studentId, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
    const attendanceRate = attendance.length
      ? Math.round((presentCount / attendance.length) * 100)
      : 0;

    const records = mesclarRegistosDesempenho(performanceRecords, avaliacoesDiarias).slice(0, 20);
    const avgScore = records.length
      ? parseFloat((records.reduce((s, r) => s + (r.overallScore || 0), 0) / records.length).toFixed(1))
      : 0;

    return { records, feedbacks, progress, attendance, trainingPlans, attendanceRate, avgScore };
  }
}
