"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createForUser(userId, type, title, body, data) {
        return this.prisma.notification.create({
            data: { userId, type, title, body, data },
        });
    }
    async createForRole(role, type, title, body) {
        const users = await this.prisma.user.findMany({
            where: { role: role, isActive: true },
            select: { id: true },
        });
        return this.prisma.notification.createMany({
            data: users.map((u) => ({ userId: u.id, type, title, body })),
        });
    }
    async getUserNotifications(userId, page = 1, limit = 20) {
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
    async markAllRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, readAt: null },
            data: { readAt: new Date() },
        });
    }
    async markRead(id) {
        return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    }
    async sendBulk(dto, gateway) {
        const { title, body, type, target } = dto;
        let userIds = [];
        if (target === 'ALL_STUDENTS') {
            const rows = await this.prisma.user.findMany({ where: { role: 'STUDENT', isActive: true }, select: { id: true } });
            userIds = rows.map((r) => r.id);
        }
        else if (target === 'ALL_INSTRUCTORS') {
            const rows = await this.prisma.user.findMany({ where: { role: 'INSTRUCTOR', isActive: true }, select: { id: true } });
            userIds = rows.map((r) => r.id);
        }
        else if (target === 'ALL_USERS') {
            const rows = await this.prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
            userIds = rows.map((r) => r.id);
        }
        else if (target === 'OVERDUE_PAYMENTS') {
            const payments = await this.prisma.payment.findMany({
                where: { status: 'OVERDUE' },
                include: { student: { include: { user: { select: { id: true } } } } },
            });
            const ids = payments.map((p) => p.student?.user?.id).filter(Boolean);
            userIds = [...new Set(ids)];
        }
        let sent = 0;
        for (const userId of userIds) {
            try {
                const notif = await this.createForUser(userId, type, title, body);
                gateway?.sendToUser(userId, 'notification', notif);
                sent++;
            }
            catch { }
        }
        return { sent, total: userIds.length };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map