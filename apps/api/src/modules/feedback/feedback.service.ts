import { Injectable, NotFoundException } from '@nestjs/common';
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

    const finalText = approve
      ? `${feedback.aiGeneratedText || ''}${instructorNotes ? `\n\n**Nota do instrutor:** ${instructorNotes}` : ''}`
      : instructorNotes;

    return this.prisma.feedback.update({
      where: { id },
      data: { instructorNotes, finalText, status: 'REVIEWED' },
    });
  }

  async sendFeedback(id: string, userId?: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        student: {
          include: { user: { select: { email: true } } },
        },
      },
    });
    if (!feedback) throw new NotFoundException('Feedback não encontrado');
    const updated = await this.prisma.feedback.update({
      where: { id },
      data: { status: 'SENT', sentToStudentAt: new Date() },
    });
    if (userId) {
      this.audit.log({ userId, action: 'SEND_FEEDBACK', entity: 'Feedback', entityId: id });
    }
    const studentEmail = (feedback as any).student?.user?.email;
    const studentName = `${(feedback as any).student?.firstName ?? ''} ${(feedback as any).student?.lastName ?? ''}`.trim();
    const preview = feedback.finalText || feedback.aiGeneratedText || '';
    if (studentEmail && preview) {
      this.email.sendFeedbackReady(studentEmail, studentName, preview).catch(() => {});
    }
    return updated;
  }
}
