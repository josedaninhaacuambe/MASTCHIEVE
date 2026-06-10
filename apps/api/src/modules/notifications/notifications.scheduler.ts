import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
    private gateway: NotificationsGateway,
  ) {}

  // Runs every day at 08:00
  @Cron('0 8 * * *')
  async checkPaymentsDue() {
    this.logger.log('Checking payments due soon...');
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { gte: today, lte: in3Days },
      },
      include: { student: { include: { user: true } } },
    });

    for (const p of pending) {
      if (!p.student?.user?.id) continue;
      const daysLeft = Math.ceil((new Date(p.dueDate).getTime() - today.getTime()) / 86400000);
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: p.student.user.id,
          type: 'PAYMENT_DUE',
          createdAt: { gte: new Date(Date.now() - 86400000) },
        },
      });
      if (existing) continue;

      const notif = await this.notifService.createForUser(
        p.student.user.id,
        'PAYMENT_DUE',
        daysLeft === 0 ? '💰 Mensalidade vence hoje!' : `💰 Mensalidade vence em ${daysLeft} dia(s)`,
        `O valor de MT ${p.amount} deve ser pago até ${new Date(p.dueDate).toLocaleDateString('pt-PT')}.`,
      );
      this.gateway.sendToUser(p.student.user.id, 'notification', notif);
    }

    // Overdue payments
    const overdue = await this.prisma.payment.findMany({
      where: { status: 'PENDING', dueDate: { lt: today } },
      include: { student: { include: { user: true } } },
    });

    for (const p of overdue) {
      if (!p.student?.user?.id) continue;
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: p.student.user.id,
          type: 'PAYMENT_DUE',
          createdAt: { gte: new Date(Date.now() - 3 * 86400000) },
        },
      });
      if (existing) continue;

      await this.prisma.payment.update({ where: { id: p.id }, data: { status: 'OVERDUE' } });
      const notif = await this.notifService.createForUser(
        p.student.user.id,
        'PAYMENT_DUE',
        '⚠️ Mensalidade em atraso',
        `A mensalidade de MT ${p.amount} está em atraso desde ${new Date(p.dueDate).toLocaleDateString('pt-PT')}. Por favor regulariza a situação.`,
      );
      this.gateway.sendToUser(p.student.user.id, 'notification', notif);
    }
  }

  // Runs every day at 09:00
  @Cron('0 9 * * *')
  async checkAttendance() {
    this.logger.log('Checking low attendance...');
    const students = await this.prisma.student.findMany({
      include: { user: true },
      where: { user: { isActive: true } },
    });

    for (const student of students) {
      const total = await this.prisma.attendance.count({ where: { studentId: student.id } });
      if (total < 3) continue;
      const present = await this.prisma.attendance.count({ where: { studentId: student.id, status: 'PRESENT' } });
      const rate = Math.round((present / total) * 100);

      if (rate < 70) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: student.user.id,
            type: 'ATTENDANCE_ALERT',
            createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
          },
        });
        if (existing) continue;

        const notif = await this.notifService.createForUser(
          student.user.id,
          'ATTENDANCE_ALERT',
          '📉 Assiduidade abaixo do esperado',
          `A tua taxa de presença é ${rate}%. Tenta não faltar para manteres o progresso nos módulos!`,
        );
        this.gateway.sendToUser(student.user.id, 'notification', notif);
      }
    }
  }

  // Called externally when feedback is sent
  async notifyFeedbackSent(studentUserId: string, feedbackId: string) {
    const notif = await this.notifService.createForUser(
      studentUserId,
      'PERFORMANCE_UPDATE',
      '🧠 Novo feedback da IA disponível!',
      'O teu instrutor reviu e enviou o relatório de desempenho. Clica para ver as recomendações.',
    );
    this.gateway.sendToUser(studentUserId, 'notification', notif);
    return notif;
  }

  // Called when a new performance record is created
  async notifyPerformanceRecorded(studentUserId: string, overallScore: number) {
    const notif = await this.notifService.createForUser(
      studentUserId,
      'PERFORMANCE_UPDATE',
      `⚡ Avaliação registada — Score: ${overallScore}/10`,
      'O teu instrutor registou uma nova avaliação de desempenho. Consulta o teu painel para ver os detalhes.',
    );
    this.gateway.sendToUser(studentUserId, 'notification', notif);
    return notif;
  }
}
