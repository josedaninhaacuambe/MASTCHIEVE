import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createForUser(userId: string, type: any, title: string, body: string, data?: any) {
    return this.prisma.notification.create({
      data: { userId, type, title, body, data },
    });
  }

  async createForRole(role: string, type: any, title: string, body: string) {
    const users = await this.prisma.user.findMany({
      where: { role: role as any, isActive: true },
      select: { id: true },
    });
    return this.prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, type, title, body })),
    });
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { data, meta: { total, page, limit, unread } };
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async sendBulk(dto: { title: string; body: string; type: string; target: string }, gateway: any) {
    const { title, body, type, target } = dto;
    let userIds: string[] = [];

    if (target === 'ALL_STUDENTS') {
      const rows = await this.prisma.user.findMany({ where: { role: 'STUDENT', isActive: true }, select: { id: true } });
      userIds = rows.map((r) => r.id);
    } else if (target === 'ALL_INSTRUCTORS') {
      const rows = await this.prisma.user.findMany({ where: { role: 'INSTRUCTOR', isActive: true }, select: { id: true } });
      userIds = rows.map((r) => r.id);
    } else if (target === 'ALL_USERS') {
      const rows = await this.prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
      userIds = rows.map((r) => r.id);
    } else if (target === 'OVERDUE_PAYMENTS') {
      const payments = await this.prisma.payment.findMany({
        where: { status: 'OVERDUE' },
        include: { student: { include: { user: { select: { id: true } } } } },
      });
      const ids = payments.map((p) => (p as any).student?.user?.id).filter(Boolean) as string[];
      userIds = [...new Set(ids)];
    }

    let sent = 0;
    for (const userId of userIds) {
      try {
        const notif = await this.createForUser(userId, type, title, body);
        gateway?.sendToUser(userId, 'notification', notif);
        sent++;
      } catch { /* continue */ }
    }
    return { sent, total: userIds.length };
  }
}
