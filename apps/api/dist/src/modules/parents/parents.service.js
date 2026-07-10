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
exports.ParentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let ParentsService = class ParentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(100, parseInt(query.limit) || 20);
        const where = {};
        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search } },
                { lastName: { contains: query.search } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.parent.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { firstName: 'asc' },
                include: {
                    user: { select: { email: true, lastLoginAt: true, isActive: true } },
                    children: {
                        include: {
                            student: { select: { id: true, firstName: true, lastName: true, isActive: true } },
                        },
                    },
                },
            }),
            this.prisma.parent.count({ where }),
        ]);
        return {
            data: data.map((p) => ({ ...p, childrenCount: p.children.length })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const parent = await this.prisma.parent.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, email: true, lastLoginAt: true } },
                children: {
                    include: {
                        student: {
                            select: {
                                id: true, firstName: true, lastName: true,
                                enrollments: { where: { isActive: true }, include: { class: { select: { name: true, level: true } } } },
                            },
                        },
                    },
                },
            },
        });
        if (!parent)
            throw new common_1.NotFoundException('Encarregado não encontrado');
        return parent;
    }
    async findMe(userId) {
        const parent = await this.prisma.parent.findUnique({
            where: { userId },
            include: {
                user: { select: { email: true } },
                children: {
                    include: {
                        student: {
                            include: {
                                enrollments: {
                                    where: { isActive: true },
                                    include: { class: { select: { id: true, name: true, level: true } } },
                                },
                                payments: {
                                    where: { status: { in: ['PENDING', 'OVERDUE'] } },
                                    select: { id: true, amount: true, status: true, dueDate: true },
                                    take: 3,
                                    orderBy: { dueDate: 'asc' },
                                },
                                feedbacks: {
                                    where: { status: { in: ['SENT', 'REVIEWED'] } },
                                    take: 3,
                                    orderBy: { createdAt: 'desc' },
                                    select: { id: true, aiGeneratedText: true, createdAt: true, status: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!parent)
            throw new common_1.NotFoundException('Perfil de encarregado não encontrado');
        return parent;
    }
    async getChildDetail(userId, studentId) {
        const parent = await this.prisma.parent.findUnique({ where: { userId }, select: { id: true } });
        if (!parent)
            throw new common_1.NotFoundException('Encarregado não encontrado');
        const link = await this.prisma.studentParent.findFirst({
            where: { parentId: parent.id, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException('Este atleta não está associado à sua conta');
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                enrollments: {
                    where: { isActive: true },
                    include: {
                        class: {
                            include: {
                                instructor: { select: { firstName: true, lastName: true } },
                            },
                        },
                    },
                },
                attendances: {
                    take: 30,
                    orderBy: { markedAt: 'desc' },
                    select: { id: true, status: true, markedAt: true, session: { select: { sessionDate: true, startTime: true } } },
                },
                payments: {
                    take: 12,
                    orderBy: { dueDate: 'desc' },
                    select: { id: true, amount: true, status: true, dueDate: true, paidAt: true, method: true },
                },
                feedbacks: {
                    where: { status: { in: ['SENT', 'REVIEWED'] } },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, aiGeneratedText: true, finalText: true, createdAt: true, status: true },
                },
                progressRecords: {
                    include: { module: { select: { name: true, level: true } } },
                },
            },
        });
        if (!student)
            throw new common_1.NotFoundException('Atleta não encontrado');
        const totalAttendances = student.attendances.length;
        const presentCount = student.attendances.filter((a) => a.status === 'PRESENT').length;
        const attendanceRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0;
        return { ...student, attendanceStats: { total: totalAttendances, present: presentCount, rate: attendanceRate } };
    }
    async update(id, dto) {
        const exists = await this.prisma.parent.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Encarregado não encontrado');
        return this.prisma.parent.update({ where: { id }, data: dto });
    }
};
exports.ParentsService = ParentsService;
exports.ParentsService = ParentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ParentsService);
//# sourceMappingURL=parents.service.js.map