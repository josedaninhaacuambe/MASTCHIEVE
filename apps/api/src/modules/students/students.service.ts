import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsReportService } from './students-report.service';
import { EmailService } from '../email/email.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { AuditService } from '../../common/audit/audit.service';
import { DOCUMENTOS_INSCRICAO_OBRIGATORIOS } from '../../common/constants/documentos';
import { mesclarRegistosDesempenho } from '../avaliacoes/normalizar-desempenho.util';
import { resolveContactoAtleta } from '../../common/utils/contacto-atleta.util';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';

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
    const email = student.user?.email || primaryParent?.user?.email || null;
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

  async findAll(query: any, userId?: string, role?: string) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    const { search, classId } = query;
    const isActive = query.isActive === undefined ? undefined : query.isActive === 'true' || query.isActive === true;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }
    if (classId) {
      where.enrollments = { some: { classId, isActive: true } };
    }

    const unidadeIds = await this.resolveUnidadeIdsDoUsuario(userId, role);
    if (unidadeIds) where.unidadeId = { in: unidadeIds };

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
          payments: { where: { status: 'OVERDUE' }, select: { id: true }, take: 1 },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    const dataComCategorias = data.map(({ payments, ...student }) => ({
      ...student,
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
  ) {
    const bcrypt = await import('bcryptjs');

    const camposEmFalta: string[] = [];
    const firstName = dto.firstName?.trim() || (camposEmFalta.push('firstName'), '(Sem nome)');
    const lastName = dto.lastName?.trim() || (camposEmFalta.push('lastName'), '(Sem apelido)');
    const dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : (camposEmFalta.push('dateOfBirth'), new Date());

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
      unidadeId: dto.unidadeId || undefined,
    };

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
        newValues: { firstName, lastName, guardians: dto.guardians?.length ?? 0 },
      });
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

    const { guardians, ...childDto } = dto;
    const created = await this.create(childDto, actorUserId);
    if (created.student) {
      await this.prisma.studentParent.create({
        data: { studentId: created.student.id, parentId, isPrimary: true },
      });
    }
    return created;
  }

  async update(id: string, dto: UpdateStudentDto, actorUserId?: string) {
    const before = await this.findOne(id);
    const data: any = { ...dto };

    if ((before as any).camposEmFalta) {
      let emFalta: string[] = [];
      try { emFalta = JSON.parse((before as any).camposEmFalta); } catch { emFalta = []; }
      const aindaEmFalta = emFalta.filter((campo) => (dto as any)[campo] === undefined);
      data.camposEmFalta = aindaEmFalta.length > 0 ? JSON.stringify(aindaEmFalta) : null;
    }

    const updated = await this.prisma.student.update({ where: { id }, data });
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
