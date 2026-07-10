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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let StudentsService = class StudentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
        const skip = (page - 1) * limit;
        const { search, classId } = query;
        const isActive = query.isActive === undefined ? undefined : query.isActive === 'true' || query.isActive === true;
        const where = {};
        if (isActive !== undefined)
            where.isActive = isActive;
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
            ];
        }
        if (classId) {
            where.enrollments = { some: { classId, isActive: true } };
        }
        const [data, total] = await Promise.all([
            this.prisma.student.findMany({
                where,
                skip,
                take: limit,
                orderBy: { firstName: 'asc' },
                include: {
                    user: { select: { email: true, role: true, lastLoginAt: true } },
                    enrollments: {
                        where: { isActive: true },
                        include: {
                            class: {
                                select: { id: true, name: true, level: true },
                            },
                        },
                    },
                    parents: {
                        include: {
                            parent: { select: { firstName: true, lastName: true, phone: true } },
                        },
                    },
                },
            }),
            this.prisma.student.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findByUserId(userId) {
        const student = await this.prisma.student.findFirst({
            where: { userId },
            include: {
                user: { select: { email: true, role: true, lastLoginAt: true } },
                enrollments: {
                    where: { isActive: true },
                    include: {
                        class: {
                            include: { instructor: { select: { firstName: true, lastName: true } } },
                        },
                    },
                },
                feedbacks: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true, status: true, aiGeneratedText: true,
                        finalText: true, aiConfidenceScore: true, createdAt: true,
                    },
                },
                payments: {
                    take: 6,
                    orderBy: { dueDate: 'desc' },
                    select: { id: true, amount: true, status: true, dueDate: true, notes: true },
                },
                progressRecords: {
                    include: { module: { select: { id: true, name: true, description: true, level: true, order: true, skills: true } } },
                    orderBy: { updatedAt: 'desc' },
                    take: 20,
                },
            },
        });
        if (!student)
            throw new common_1.NotFoundException('Perfil de atleta não encontrado');
        const [attendanceStats, performanceRecords, trainingPlans] = await Promise.all([
            this.prisma.attendance.groupBy({
                by: ['status'],
                where: { studentId: student.id },
                _count: true,
            }),
            this.prisma.performanceRecord.findMany({
                where: { studentId: student.id },
                orderBy: { recordedAt: 'desc' },
                take: 10,
                select: {
                    id: true, technique: true, stamina: true, speed: true,
                    coordination: true, breathing: true, turns: true,
                    startDive: true, overallScore: true, instructorNotes: true, recordedAt: true,
                },
            }),
            this.prisma.trainingPlan.findMany({
                where: { studentId: student.id, isActive: true },
                orderBy: { createdAt: 'desc' },
                take: 2,
                select: {
                    id: true, title: true, description: true, objectives: true,
                    exercises: true, aiGenerated: true, validFrom: true, validUntil: true,
                },
            }),
        ]);
        const totalSessions = attendanceStats.reduce((s, r) => s + r._count, 0);
        const present = attendanceStats.find((r) => r.status === 'PRESENT')?._count ?? 0;
        return {
            ...student,
            performanceRecords,
            trainingPlans,
            attendanceStats: { total: totalSessions, present, rate: totalSessions ? Math.round((present / totalSessions) * 100) : 0 },
        };
    }
    async findOne(id) {
        const student = await this.prisma.student.findUnique({
            where: { id },
            include: {
                user: { select: { email: true, role: true, lastLoginAt: true } },
                enrollments: {
                    include: {
                        class: {
                            include: {
                                instructor: { select: { firstName: true, lastName: true } },
                            },
                        },
                    },
                },
                parents: {
                    include: { parent: true },
                },
                feedbacks: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true, status: true, aiGeneratedText: true,
                        finalText: true, aiConfidenceScore: true,
                        sentToStudentAt: true, createdAt: true,
                    },
                },
                progressRecords: {
                    include: { module: true },
                },
                trainingPlans: { where: { isActive: true } },
                payments: {
                    take: 12,
                    orderBy: { dueDate: 'desc' },
                },
            },
        });
        if (!student)
            throw new common_1.NotFoundException('Atleta não encontrado');
        return student;
    }
    async create(dto) {
        const email = dto.email || `atleta_${Date.now()}@mastchieve.com`;
        const bcrypt = await Promise.resolve().then(() => require('bcryptjs'));
        const password = await bcrypt.hash(dto.password || 'student123', 10);
        return this.prisma.user.create({
            data: {
                email,
                password,
                role: 'STUDENT',
                student: {
                    create: {
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        dateOfBirth: new Date(dto.dateOfBirth),
                        gender: dto.gender || 'OTHER',
                        phone: dto.phone,
                        medicalNotes: dto.medicalNotes,
                        emergencyContact: dto.emergencyContact,
                        emergencyPhone: dto.emergencyPhone,
                    },
                },
            },
            include: { student: true },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.student.update({ where: { id }, data: dto });
    }
    async deactivate(id) {
        await this.findOne(id);
        return this.prisma.student.update({ where: { id }, data: { isActive: false } });
    }
    async getPerformanceSummary(studentId) {
        const [records, feedbacks, progress, attendance, trainingPlans] = await Promise.all([
            this.prisma.performanceRecord.findMany({
                where: { studentId },
                orderBy: { recordedAt: 'desc' },
                take: 20,
                select: {
                    id: true, technique: true, stamina: true, speed: true,
                    coordination: true, breathing: true, turns: true,
                    startDive: true, overallScore: true, instructorNotes: true, recordedAt: true,
                },
            }),
            this.prisma.feedback.findMany({
                where: { studentId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true, status: true, aiGeneratedText: true,
                    finalText: true, aiConfidenceScore: true,
                    sentToStudentAt: true, createdAt: true,
                },
            }),
            this.prisma.progress.findMany({
                where: { studentId },
                include: { module: true },
            }),
            this.prisma.attendance.findMany({
                where: { studentId },
                orderBy: { markedAt: 'desc' },
                take: 30,
                select: { status: true, markedAt: true },
            }),
            this.prisma.trainingPlan.findMany({
                where: { studentId, isActive: true },
                orderBy: { createdAt: 'desc' },
                take: 3,
            }),
        ]);
        const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
        const attendanceRate = attendance.length
            ? Math.round((presentCount / attendance.length) * 100)
            : 0;
        const avgScore = records.length
            ? parseFloat((records.reduce((s, r) => s + (r.overallScore || 0), 0) / records.length).toFixed(1))
            : 0;
        return { records, feedbacks, progress, attendance, trainingPlans, attendanceRate, avgScore };
    }
    async createPerformanceRecord(studentId, userId, dto) {
        await this.findOne(studentId);
        const instructor = await this.prisma.instructor.findFirst({ where: { userId } });
        const scores = [dto.technique, dto.stamina, dto.speed, dto.coordination, dto.breathing, dto.turns, dto.startDive]
            .filter((v) => v != null);
        const overallScore = scores.length ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : null;
        return this.prisma.performanceRecord.create({
            data: {
                studentId,
                instructorId: instructor?.id ?? null,
                sessionId: dto.sessionId ?? null,
                technique: dto.technique ?? null,
                stamina: dto.stamina ?? null,
                speed: dto.speed ?? null,
                coordination: dto.coordination ?? null,
                breathing: dto.breathing ?? null,
                turns: dto.turns ?? null,
                startDive: dto.startDive ?? null,
                instructorNotes: dto.instructorNotes ?? null,
                overallScore,
            },
        });
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentsService);
//# sourceMappingURL=students.service.js.map