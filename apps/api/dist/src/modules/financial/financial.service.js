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
var FinancialService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
const common_2 = require("@nestjs/common");
const email_service_1 = require("../email/email.service");
const pdf_lib_1 = require("pdf-lib");
let FinancialService = FinancialService_1 = class FinancialService {
    constructor(prisma, email) {
        this.prisma = prisma;
        this.email = email;
        this.logger = new common_2.Logger(FinancialService_1.name);
    }
    async getPayments(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
        const skip = (page - 1) * limit;
        const where = {};
        if (query.studentId)
            where.studentId = query.studentId;
        if (query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { dueDate: 'desc' },
                include: {
                    student: { select: { firstName: true, lastName: true } },
                    monthlyFee: { select: { month: true, year: true } },
                },
            }),
            this.prisma.payment.count({ where }),
        ]);
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async getMyPayments(userId, query = {}) {
        const student = await this.prisma.student.findFirst({
            where: { userId },
            select: { id: true, enrollmentDate: true },
        });
        if (!student)
            return { data: [], meta: { total: 0, page: 1, limit: 200, totalPages: 0, years: [] } };
        const where = { studentId: student.id };
        if (query.year) {
            const y = Number(query.year);
            where.dueDate = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
        }
        const [data, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                take: 200,
                orderBy: { dueDate: 'desc' },
                include: {
                    monthlyFee: { select: { month: true, year: true } },
                },
            }),
            this.prisma.payment.count({ where: { studentId: student.id } }),
        ]);
        const allYearRows = await this.prisma.payment.findMany({
            where: { studentId: student.id },
            select: { dueDate: true, monthlyFee: { select: { year: true } } },
            orderBy: { dueDate: 'asc' },
        });
        const yearSet = new Set();
        allYearRows.forEach((p) => yearSet.add(p.monthlyFee?.year ?? new Date(p.dueDate).getFullYear()));
        const years = Array.from(yearSet).sort((a, b) => b - a);
        return {
            data,
            meta: { total, page: 1, limit: 200, totalPages: Math.ceil(total / 200), years },
        };
    }
    async createPayment(dto) {
        const receiptNumber = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        return this.prisma.payment.create({
            data: { ...dto, receiptNumber },
            include: { student: { select: { firstName: true, lastName: true } } },
        });
    }
    async markAsPaid(id, method) {
        const payment = await this.prisma.payment.findUnique({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Pagamento não encontrado');
        const receiptNumber = payment.receiptNumber || `REC-${Date.now()}-${id.slice(0, 6).toUpperCase()}`;
        return this.prisma.payment.update({
            where: { id },
            data: { status: 'PAID', method: method || 'CASH', paidAt: new Date(), receiptNumber },
        });
    }
    async generateMonthlyFees(month, year, amount) {
        const students = await this.prisma.student.findMany({
            where: { isActive: true },
            select: { id: true },
        });
        const dueDate = new Date(year, month - 1, 10);
        let created = 0;
        for (const s of students) {
            const existing = await this.prisma.monthlyFee.findUnique({
                where: { studentId_month_year: { studentId: s.id, month, year } },
            });
            if (!existing) {
                const fee = await this.prisma.monthlyFee.create({
                    data: { studentId: s.id, month, year, amount, dueDate },
                });
                await this.prisma.payment.create({
                    data: {
                        studentId: s.id,
                        monthlyFeeId: fee.id,
                        amount,
                        status: 'PENDING',
                        dueDate,
                    },
                });
                created++;
            }
        }
        return { created, total: students.length, month, year };
    }
    async getFinancialSummary(year) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year + 1, 0, 1);
        const [totalRevenue, overduePayments, pendingPayments] = await Promise.all([
            this.prisma.payment.aggregate({
                where: { status: 'PAID', paidAt: { gte: yearStart, lt: yearEnd } },
                _sum: { amount: true },
            }),
            this.prisma.payment.count({ where: { status: 'OVERDUE' } }),
            this.prisma.payment.aggregate({
                where: { status: 'PENDING' },
                _sum: { amount: true },
                _count: true,
            }),
        ]);
        return {
            totalRevenue: totalRevenue._sum.amount || 0,
            overduePayments,
            pendingAmount: pendingPayments._sum.amount || 0,
            pendingCount: pendingPayments._count,
        };
    }
    async getStudentBalance(studentId) {
        const [paid, pending, overdue] = await Promise.all([
            this.prisma.payment.aggregate({ where: { studentId, status: 'PAID' }, _sum: { amount: true } }),
            this.prisma.payment.aggregate({ where: { studentId, status: 'PENDING' }, _sum: { amount: true }, _count: true }),
            this.prisma.payment.aggregate({ where: { studentId, status: 'OVERDUE' }, _sum: { amount: true }, _count: true }),
        ]);
        return {
            paidAmount: paid._sum.amount || 0,
            pendingAmount: pending._sum.amount || 0,
            overdueAmount: overdue._sum.amount || 0,
            pendingCount: pending._count,
            overdueCount: overdue._count,
        };
    }
    async sendReminders() {
        const overdue = await this.prisma.payment.findMany({
            where: { status: 'OVERDUE' },
            include: {
                student: {
                    include: { user: { select: { email: true } } },
                },
                monthlyFee: { select: { month: true, year: true } },
            },
        });
        let sent = 0;
        for (const p of overdue) {
            const email = p.student?.user?.email;
            if (!email)
                continue;
            const name = `${p.student.firstName} ${p.student.lastName}`;
            const dueStr = new Date(p.dueDate).toLocaleDateString('pt-PT');
            try {
                await this.email.sendPaymentReminder(email, name, p.amount, dueStr);
                sent++;
            }
            catch (e) {
                this.logger.warn(`Failed to send reminder to ${email}: ${e.message}`);
            }
        }
        return { sent, total: overdue.length };
    }
    async exportPdf(year) {
        const payments = await this.prisma.payment.findMany({
            where: {
                dueDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
            },
            include: { student: { select: { firstName: true, lastName: true } } },
            orderBy: { dueDate: 'asc' },
        });
        const doc = await pdf_lib_1.PDFDocument.create();
        const page = doc.addPage([595, 842]);
        const font = await doc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const fontBold = await doc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        const { width, height } = page.getSize();
        const blue = (0, pdf_lib_1.rgb)(0.1, 0.33, 0.86);
        const dark = (0, pdf_lib_1.rgb)(0.07, 0.07, 0.07);
        const gray = (0, pdf_lib_1.rgb)(0.45, 0.45, 0.45);
        page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue });
        page.drawText('Mastchieve — Relatório Financeiro', {
            x: 40, y: height - 45, size: 18, font: fontBold, color: (0, pdf_lib_1.rgb)(1, 1, 1),
        });
        page.drawText(`Ano ${year}  ·  Gerado em ${new Date().toLocaleDateString('pt-PT')}`, {
            x: 40, y: height - 65, size: 10, font, color: (0, pdf_lib_1.rgb)(0.8, 0.85, 1),
        });
        let y = height - 110;
        const cols = [40, 220, 320, 400, 480];
        const headers = ['Atleta', 'Valor', 'Vencimento', 'Estado'];
        headers.forEach((h, i) => {
            page.drawText(h, { x: cols[i], y, size: 9, font: fontBold, color: gray });
        });
        y -= 6;
        page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: (0, pdf_lib_1.rgb)(0.85, 0.85, 0.85) });
        y -= 16;
        const statusPt = { PAID: 'Pago', PENDING: 'Pendente', OVERDUE: 'Em atraso', CANCELLED: 'Cancelado' };
        const statusColor = {
            PAID: (0, pdf_lib_1.rgb)(0.06, 0.63, 0.42),
            PENDING: (0, pdf_lib_1.rgb)(0.85, 0.60, 0.0),
            OVERDUE: (0, pdf_lib_1.rgb)(0.85, 0.15, 0.15),
            CANCELLED: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5),
        };
        for (const p of payments) {
            if (y < 60)
                break;
            const name = `${p.student?.firstName ?? ''} ${p.student?.lastName ?? ''}`.trim();
            page.drawText(name.slice(0, 28), { x: cols[0], y, size: 9, font, color: dark });
            page.drawText(`MT ${p.amount.toFixed(2)}`, { x: cols[1], y, size: 9, font, color: dark });
            page.drawText(new Date(p.dueDate).toLocaleDateString('pt-PT'), { x: cols[2], y, size: 9, font, color: dark });
            page.drawText(statusPt[p.status] ?? p.status, {
                x: cols[3], y, size: 9, font: fontBold, color: statusColor[p.status] ?? gray,
            });
            y -= 18;
            page.drawLine({ start: { x: 40, y: y + 8 }, end: { x: width - 40, y: y + 8 }, thickness: 0.3, color: (0, pdf_lib_1.rgb)(0.93, 0.93, 0.93) });
        }
        const bytes = await doc.save();
        return Buffer.from(bytes);
    }
    async markOverduePayments() {
        const updated = await this.prisma.payment.updateMany({
            where: { status: 'PENDING', dueDate: { lt: new Date() } },
            data: { status: 'OVERDUE' },
        });
        this.logger.log(`Marked ${updated.count} payments as overdue`);
    }
};
exports.FinancialService = FinancialService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinancialService.prototype, "markOverduePayments", null);
exports.FinancialService = FinancialService = FinancialService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], FinancialService);
//# sourceMappingURL=financial.service.js.map