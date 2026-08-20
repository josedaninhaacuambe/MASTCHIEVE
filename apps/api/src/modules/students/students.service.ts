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

  async findAll(query: any) {
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

  async create(dto: CreateStudentDto & { email?: string; password?: string }, actorUserId?: string) {
    const email = dto.email || `atleta_${Date.now()}@mastchieve.com`;
    const bcrypt = await import('bcryptjs');
    const password = await bcrypt.hash(dto.password || 'student123', 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password,
          role: 'STUDENT',
          student: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              dateOfBirth: new Date(dto.dateOfBirth),
              gender: dto.gender || 'OTHER',
              phone: dto.phone,
              medicalNotes: dto.medicalNotes,
              emergencyContact: dto.emergencyContact,
              emergencyPhone: dto.emergencyPhone,
              autorizacaoImagem: dto.autorizacaoImagem ?? false,
              autorizacaoImagemData: dto.autorizacaoImagem ? new Date() : undefined,
              autorizacaoImagemDoc: dto.autorizacaoImagemDoc,
              estadoInscricao: 'DOCUMENTOS_PENDENTES',
            },
          },
        },
        include: { student: true },
      });

      if (dto.guardians?.length && createdUser.student) {
        const guardianPassword = await bcrypt.hash('parent123', 10);
        for (const [index, guardian] of dto.guardians.entries()) {
          const guardianUser = await tx.user.create({
            data: {
              email: `encarregado_${Date.now()}_${index}@mastchieve.com`,
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
          if (guardianUser.parent) {
            await tx.studentParent.create({
              data: {
                studentId: createdUser.student.id,
                parentId: guardianUser.parent.id,
                isPrimary: guardian.isPrimary ?? index === 0,
              },
            });
          }
        }
      }

      return createdUser;
    });

    if (actorUserId && user.student) {
      await this.audit.log({
        userId: actorUserId,
        action: 'STUDENT_CRIADO',
        entity: 'Student',
        entityId: user.student.id,
        newValues: { firstName: dto.firstName, lastName: dto.lastName, guardians: dto.guardians?.length ?? 0 },
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

      if (contacto.telefone) {
        const videoInducao = await this.prisma.linkPartilha.findUnique({ where: { chave: 'VIDEO_INDUCAO' } });
        const nomeCompleto = `${dto.firstName} ${dto.lastName}`.trim();
        const suporte = studentComContacto?.unidade?.contacto || studentComContacto?.unidade?.email;
        const appUrl = process.env.APP_URL ?? 'http://localhost:4300';
        const saudacao = contacto.viaEncarregado
          ? `Olá${contacto.nomeEncarregado ? `, ${contacto.nomeEncarregado}` : ''}! Em nome de ${nomeCompleto}, bem-vindo(a) à Mastchieve! 🏊`
          : `Olá! Bem-vindo(a) à Mastchieve, ${nomeCompleto}! 🏊`;

        const mensagem = [
          saudacao,
          'Aqui tens o vídeo de indução com tudo sobre como funciona a nossa academia:',
          videoInducao?.url,
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
    }

    return user;
  }

  async update(id: string, dto: UpdateStudentDto, actorUserId?: string) {
    const before = await this.findOne(id);
    const updated = await this.prisma.student.update({ where: { id }, data: dto as any });
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
