import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma/prisma.service';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidInitialized = false;

  constructor(private prisma: PrismaService, private config: ConfigService) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT', 'mailto:mastchieve@gmail.com');
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidInitialized = true;
      this.logger.log('Web Push (VAPID) initialized');
    } else {
      this.logger.warn('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — Web Push disabled');
    }
  }

  getVapidPublicKey() {
    return { publicKey: this.config.get<string>('VAPID_PUBLIC_KEY') ?? null };
  }

  async subscribePush(userId: string, dto: { endpoint: string; p256dh: string; auth: string }) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: { userId, ...dto },
      update: { userId, p256dh: dto.p256dh, auth: dto.auth },
    });
  }

  async unsubscribePush(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { ok: true };
  }

  async sendPushToUser(userId: string, title: string, body: string, data?: any) {
    if (!this.vapidInitialized) return;
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    const payload = JSON.stringify({ title, body, data });
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
      } catch (err: any) {
        if (err.statusCode === 410) {
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  }

  async createForUser(userId: string, type: any, title: string, body: string, data?: any) {
    const notif = await this.prisma.notification.create({
      data: { userId, type, title, body, data },
    });
    // Fire-and-forget push — won't break in-app flow if VAPID is not configured
    this.sendPushToUser(userId, title, body, data).catch(() => {});
    return notif;
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
