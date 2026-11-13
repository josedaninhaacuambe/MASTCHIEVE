import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private email: EmailService,
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
    return this.getFeedbacks({ ...query, studentId: student.id });
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
   * Envia o feedback por email ao atleta (ou ao encarregado principal).
   * Só é marcado como enviado quando o email sai de facto; sem contacto não se presume que foi recebido.
   */
  async sendFeedback(id: string, userId?: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { email: true } },
            parents: { include: { parent: { include: { user: { select: { email: true } } } } } },
          },
        },
      },
    });
    if (!feedback) throw new NotFoundException('Feedback não encontrado');
    const texto = (feedback.finalText || feedback.aiGeneratedText || '').trim();
    if (!texto) throw new BadRequestException('O feedback ainda não tem texto. Escreva-o ou gere-o com IA antes de enviar.');

    const student = (feedback as any).student;
    const primaryParent = student?.parents?.find((sp: any) => sp.isPrimary)?.parent ?? student?.parents?.[0]?.parent;
    const destino: string | undefined = student?.user?.email || primaryParent?.user?.email || undefined;
    const studentName = `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim();

    if (!destino) {
      return {
        ...this.normalizeFeedback(feedback),
        student: undefined,
        emailEnviado: false,
        motivo: 'O atleta e o encarregado não têm email registado. O feedback não foi marcado como enviado.',
      };
    }

    const enviado = await this.email.sendFeedbackReady(destino, studentName, texto).catch(() => false);
    if (!enviado) {
      return {
        ...this.normalizeFeedback(feedback),
        student: undefined,
        emailEnviado: false,
        motivo: 'Não foi possível enviar o email (serviço de email indisponível ou não configurado). Tente mais tarde.',
      };
    }

    const updated = await this.prisma.feedback.update({
      where: { id },
      data: { status: 'SENT', sentToStudentAt: new Date(), ...(!feedback.finalText && { finalText: texto }) },
    });
    if (userId) {
      await this.audit.log({ userId, action: 'SEND_FEEDBACK', entity: 'Feedback', entityId: id });
    }
    return { ...this.normalizeFeedback(updated), emailEnviado: true };
  }
}
