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
var NotificationsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../config/prisma/prisma.service");
const notifications_service_1 = require("./notifications.service");
const notifications_gateway_1 = require("./notifications.gateway");
let NotificationsScheduler = NotificationsScheduler_1 = class NotificationsScheduler {
    constructor(prisma, notifService, gateway) {
        this.prisma = prisma;
        this.notifService = notifService;
        this.gateway = gateway;
        this.logger = new common_1.Logger(NotificationsScheduler_1.name);
    }
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
            if (!p.student?.user?.id)
                continue;
            const daysLeft = Math.ceil((new Date(p.dueDate).getTime() - today.getTime()) / 86400000);
            const existing = await this.prisma.notification.findFirst({
                where: {
                    userId: p.student.user.id,
                    type: 'PAYMENT_DUE',
                    createdAt: { gte: new Date(Date.now() - 86400000) },
                },
            });
            if (existing)
                continue;
            const notif = await this.notifService.createForUser(p.student.user.id, 'PAYMENT_DUE', daysLeft === 0 ? '💰 Mensalidade vence hoje!' : `💰 Mensalidade vence em ${daysLeft} dia(s)`, `O valor de MT ${p.amount} deve ser pago até ${new Date(p.dueDate).toLocaleDateString('pt-PT')}.`);
            this.gateway.sendToUser(p.student.user.id, 'notification', notif);
        }
        const overdue = await this.prisma.payment.findMany({
            where: { status: 'PENDING', dueDate: { lt: today } },
            include: { student: { include: { user: true } } },
        });
        for (const p of overdue) {
            if (!p.student?.user?.id)
                continue;
            const existing = await this.prisma.notification.findFirst({
                where: {
                    userId: p.student.user.id,
                    type: 'PAYMENT_DUE',
                    createdAt: { gte: new Date(Date.now() - 3 * 86400000) },
                },
            });
            if (existing)
                continue;
            await this.prisma.payment.update({ where: { id: p.id }, data: { status: 'OVERDUE' } });
            const notif = await this.notifService.createForUser(p.student.user.id, 'PAYMENT_DUE', '⚠️ Mensalidade em atraso', `A mensalidade de MT ${p.amount} está em atraso desde ${new Date(p.dueDate).toLocaleDateString('pt-PT')}. Por favor regulariza a situação.`);
            this.gateway.sendToUser(p.student.user.id, 'notification', notif);
        }
    }
    async checkAttendance() {
        this.logger.log('Checking low attendance...');
        const students = await this.prisma.student.findMany({
            include: { user: true },
            where: { user: { isActive: true } },
        });
        for (const student of students) {
            const total = await this.prisma.attendance.count({ where: { studentId: student.id } });
            if (total < 3)
                continue;
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
                if (existing)
                    continue;
                const notif = await this.notifService.createForUser(student.user.id, 'ATTENDANCE_ALERT', '📉 Assiduidade abaixo do esperado', `A tua taxa de presença é ${rate}%. Tenta não faltar para manteres o progresso nos módulos!`);
                this.gateway.sendToUser(student.user.id, 'notification', notif);
            }
        }
    }
    async notifyFeedbackSent(studentUserId, feedbackId) {
        const notif = await this.notifService.createForUser(studentUserId, 'PERFORMANCE_UPDATE', '🧠 Novo feedback da IA disponível!', 'O teu instrutor reviu e enviou o relatório de desempenho. Clica para ver as recomendações.');
        this.gateway.sendToUser(studentUserId, 'notification', notif);
        return notif;
    }
    async notifyPerformanceRecorded(studentUserId, overallScore) {
        const notif = await this.notifService.createForUser(studentUserId, 'PERFORMANCE_UPDATE', `⚡ Avaliação registada — Score: ${overallScore}/10`, 'O teu instrutor registou uma nova avaliação de desempenho. Consulta o teu painel para ver os detalhes.');
        this.gateway.sendToUser(studentUserId, 'notification', notif);
        return notif;
    }
};
exports.NotificationsScheduler = NotificationsScheduler;
__decorate([
    (0, schedule_1.Cron)('0 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsScheduler.prototype, "checkPaymentsDue", null);
__decorate([
    (0, schedule_1.Cron)('0 9 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsScheduler.prototype, "checkAttendance", null);
exports.NotificationsScheduler = NotificationsScheduler = NotificationsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        notifications_gateway_1.NotificationsGateway])
], NotificationsScheduler);
//# sourceMappingURL=notifications.scheduler.js.map