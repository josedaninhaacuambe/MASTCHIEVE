import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { destinatariosDoAtleta } from '../../common/utils/destinatarios-atleta.util';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private email: EmailService,
    private notifications: NotificationsService,
  ) {}

  async getFeedbacks(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true, avatarUrl: true } },
          instructor: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      data: data.map((fb) => this.normalizeFeedback(fb)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMyFeedbacks(userId: string, query: any = {}) {
    const student = await this.prisma.student.findFirst({ where: { userId }, select: { id: true } });
    if (!student) return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    // O atleta só vê feedbacks que o instrutor já reviu e enviou.
    return this.getFeedbacks({ page: query.page, limit: query.limit, studentId: student.id, status: 'SENT' });
  }

  async findOne(id: string) {
    const fb = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        student: { select: { firstName: true, lastName: true } },
        instructor: { select: { firstName: true, lastName: true } },
        performanceRecord: true,
      },
    });
    if (!fb) throw new NotFoundException('Feedback não encontrado');
    return this.normalizeFeedback(fb);
  }

  private parseJsonField<T>(value: any, fallback: T): T {
    if (Array.isArray(value)) return value as unknown as T;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  private normalizeFeedback(fb: any) {
    return {
      ...fb,
      recommendedLessons: this.parseJsonField<any[]>(fb.recommendedLessons, []),
      interactiveExercises: this.parseJsonField<any[]>(fb.interactiveExercises, []),
    };
  }

  async reviewFeedback(id: string, instructorNotes: string, approve: boolean) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback não encontrado');

    if (feedback.status === 'SENT') throw new ConflictException('Este feedback já foi enviado e não pode ser alterado.');
    // Se o instrutor já escreveu/corrigiu o texto final, aprovar não o substitui pelo texto da IA.
    const finalText = approve && feedback.finalText?.trim()
      ? feedback.finalText
      : approve
      ? `${feedback.aiGeneratedText || ''}${instructorNotes ? `\n\n**Nota do instrutor:** ${instructorNotes}` : ''}`
      : instructorNotes;

    return this.prisma.feedback.update({
      where: { id },
      data: { instructorNotes, finalText, status: 'REVIEWED' },
    });
  }

  /** Feedback escrito à mão pelo instrutor: fica logo revisto, pronto a enviar. */
  async createManual(studentId: string, texto: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!student) throw new NotFoundException('Atleta não encontrado');
    const instructor = await this.prisma.instructor.findUnique({ where: { userId }, select: { id: true } });
    const fb = await this.prisma.feedback.create({
      data: {
        studentId,
        instructorId: instructor?.id ?? null,
        status: 'REVIEWED',
        finalText: texto.trim(),
        recommendedLessons: '[]',
        interactiveExercises: '[]',
      },
    });
    await this.audit.log({ userId, action: 'FEEDBACK_MANUAL_CRIADO', entity: 'Feedback', entityId: fb.id, newValues: { studentId } });
    return this.normalizeFeedback(fb);
  }

  /** Escrever ou corrigir o texto final (também serve para feedbacks pendentes cuja IA falhou). */
  async editarTexto(id: string, texto: string, userId: string) {
    const fb = await this.prisma.feedback.findUnique({ where: { id }, select: { status: true, instructorId: true } });
    if (!fb) throw new NotFoundException('Feedback não encontrado');
    if (fb.status === 'SENT') throw new ConflictException('Este feedback já foi enviado e não pode ser alterado.');
    const instructor = fb.instructorId
      ? null
      : await this.prisma.instructor.findUnique({ where: { userId }, select: { id: true } });
    const updated = await this.prisma.feedback.update({
      where: { id },
      data: { finalText: texto.trim(), status: 'REVIEWED', ...(instructor && { instructorId: instructor.id }) },
    });
    await this.audit.log({ userId, action: 'FEEDBACK_TEXTO_EDITADO', entity: 'Feedback', entityId: id });
    return this.normalizeFeedback(updated);
  }

  /**
   * Envia o feedback ao atleta e a todos os encarregados: notificação na aplicação para cada conta
   * e email só para endereços reais (os emails gerados pelo sistema não contam).
   * Só fica marcado como enviado quando pelo menos uma conta o recebe; sem contas não se presume entrega.
   */
  async sendFeedback(id: string, userId?: string) {
    const userLite = { select: { id: true, email: true, isActive: true } };
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: userLite,
            parents: { include: { parent: { include: { user: userLite } } } },
          },
        },
      },
    });
    if (!feedback) throw new NotFoundException('Feedback não encontrado');
    if (feedback.status === 'SENT') throw new ConflictException('Este feedback já foi enviado.');
    const texto = (feedback.finalText || feedback.aiGeneratedText || '').trim();
    if (!texto) throw new BadRequestException('O feedback ainda não tem texto. Escreva-o ou gere-o com IA antes de enviar.');

    const student = (feedback as any).student;
    const studentName = `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim();
    const destinatarios = destinatariosDoAtleta(student ?? {});
    const { student: _s, ...semAluno } = feedback as any;

    if (!destinatarios.length) {
      return {
        ...this.normalizeFeedback(semAluno),
        emailEnviado: false,
        notificados: 0,
        emailsEnviados: 0,
        motivo: 'O atleta e os encarregados não têm conta activa na aplicação. O feedback não foi marcado como enviado.',
      };
    }

    // Marca primeiro (com guarda contra envios duplicados em simultâneo) e só depois comunica.
    const marcado = await this.prisma.feedback.updateMany({
      where: { id, status: { not: 'SENT' } },
      data: { status: 'SENT', sentToStudentAt: new Date(), ...(!feedback.finalText && { finalText: texto }) },
    });
    if (!marcado.count) throw new ConflictException('Este feedback já foi enviado.');

    let notificados = 0;
    let emailsEnviados = 0;
    let comEmail = 0;
    for (const d of destinatarios) {
      try {
        await this.notifications.createForUser(
          d.userId,
          'FEEDBACK_SENT',
          '🏊 Novo feedback do treino',
          d.papel === 'ATLETA'
            ? 'O seu instrutor enviou-lhe um novo feedback. Abra a aplicação para o ler.'
            : `Há um novo feedback do treino de ${studentName}.`,
          JSON.stringify({ feedbackId: id }),
        );
        notificados++;
      } catch {
        /* uma falha de notificação não impede as restantes */
      }
      if (d.email) {
        comEmail++;
        const ok = await this.email.sendFeedbackReady(d.email, studentName, texto).catch(() => false);
        if (ok) emailsEnviados++;
      }
    }

    if (userId) {
      await this.audit.log({
        userId,
        action: 'SEND_FEEDBACK',
        entity: 'Feedback',
        entityId: id,
        newValues: { destinatarios: destinatarios.length, notificados, emailsEnviados },
      });
    }
    const updated = await this.prisma.feedback.findUnique({ where: { id } });
    return {
      ...this.normalizeFeedback(updated),
      emailEnviado: emailsEnviados > 0,
      notificados,
      emailsEnviados,
      ...(comEmail === 0 && { motivo: 'Enviado na aplicação. Não há email real registado, por isso não foi enviado email.' }),
      ...(comEmail > 0 && emailsEnviados < comEmail && { motivo: 'Enviado na aplicação, mas alguns emails não saíram (serviço de email indisponível ou não configurado).' }),
    };
  }
}
