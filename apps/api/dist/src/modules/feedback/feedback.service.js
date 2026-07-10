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
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
const ai_service_1 = require("../ai/ai.service");
const audit_service_1 = require("../../common/audit/audit.service");
const email_service_1 = require("../email/email.service");
let FeedbackService = class FeedbackService {
    constructor(prisma, aiService, audit, email) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.audit = audit;
        this.email = email;
    }
    async recordPerformance(dto) {
        const overallScore = this.calculateOverall(dto);
        const record = await this.prisma.performanceRecord.create({
            data: {
                studentId: dto.studentId,
                sessionId: dto.sessionId || null,
                instructorId: dto.instructorId || null,
                technique: dto.technique ? Number(dto.technique) : null,
                stamina: dto.stamina ? Number(dto.stamina) : null,
                speed: dto.speed ? Number(dto.speed) : null,
                coordination: dto.coordination ? Number(dto.coordination) : null,
                breathing: dto.breathing ? Number(dto.breathing) : null,
                turns: dto.turns ? Number(dto.turns) : null,
                startDive: dto.startDive ? Number(dto.startDive) : null,
                overallScore,
                instructorNotes: dto.instructorNotes || null,
            },
        });
        if (dto.instructorId) {
            this.audit.log({
                userId: dto.instructorId,
                action: 'RECORD_PERFORMANCE',
                entity: 'PerformanceRecord',
                entityId: record.id,
                newValues: { studentId: dto.studentId, overallScore },
            });
        }
        try {
            await this.aiService.queueFeedbackGeneration(record.id);
        }
        catch (e) {
        }
        return record;
    }
    async getFeedbacks(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
        const skip = (page - 1) * limit;
        const where = {};
        if (query.studentId)
            where.studentId = query.studentId;
        if (query.status)
            where.status = query.status;
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
    async getMyFeedbacks(userId, query = {}) {
        const student = await this.prisma.student.findFirst({ where: { userId }, select: { id: true } });
        if (!student)
            return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
        return this.getFeedbacks({ ...query, studentId: student.id });
    }
    async findOne(id) {
        const fb = await this.prisma.feedback.findUnique({
            where: { id },
            include: {
                student: { select: { firstName: true, lastName: true } },
                instructor: { select: { firstName: true, lastName: true } },
                performanceRecord: true,
            },
        });
        if (!fb)
            throw new common_1.NotFoundException('Feedback não encontrado');
        return this.normalizeFeedback(fb);
    }
    parseJsonField(value, fallback) {
        if (Array.isArray(value))
            return value;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            }
            catch {
                return fallback;
            }
        }
        return fallback;
    }
    normalizeFeedback(fb) {
        return {
            ...fb,
            recommendedLessons: this.parseJsonField(fb.recommendedLessons, []),
            interactiveExercises: this.parseJsonField(fb.interactiveExercises, []),
        };
    }
    async reviewFeedback(id, instructorNotes, approve) {
        const feedback = await this.prisma.feedback.findUnique({ where: { id } });
        if (!feedback)
            throw new common_1.NotFoundException('Feedback não encontrado');
        const finalText = approve
            ? `${feedback.aiGeneratedText || ''}${instructorNotes ? `\n\n**Nota do instrutor:** ${instructorNotes}` : ''}`
            : instructorNotes;
        return this.prisma.feedback.update({
            where: { id },
            data: { instructorNotes, finalText, status: 'REVIEWED' },
        });
    }
    async sendFeedback(id, userId) {
        const feedback = await this.prisma.feedback.findUnique({
            where: { id },
            include: {
                student: {
                    include: { user: { select: { email: true } } },
                },
            },
        });
        if (!feedback)
            throw new common_1.NotFoundException('Feedback não encontrado');
        const updated = await this.prisma.feedback.update({
            where: { id },
            data: { status: 'SENT', sentToStudentAt: new Date() },
        });
        if (userId) {
            this.audit.log({ userId, action: 'SEND_FEEDBACK', entity: 'Feedback', entityId: id });
        }
        const studentEmail = feedback.student?.user?.email;
        const studentName = `${feedback.student?.firstName ?? ''} ${feedback.student?.lastName ?? ''}`.trim();
        const preview = feedback.finalText || feedback.aiGeneratedText || '';
        if (studentEmail && preview) {
            this.email.sendFeedbackReady(studentEmail, studentName, preview).catch(() => { });
        }
        return updated;
    }
    calculateOverall(dto) {
        const scores = [dto.technique, dto.stamina, dto.speed, dto.coordination, dto.breathing, dto.turns, dto.startDive]
            .filter((s) => s !== undefined && s !== null)
            .map(Number);
        return scores.length ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService,
        audit_service_1.AuditService,
        email_service_1.EmailService])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map