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
exports.ClassesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let ClassesService = class ClassesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
        const where = {};
        if (query.level)
            where.level = query.level;
        if (query.status)
            where.status = query.status;
        if (query.instructorId)
            where.instructorId = query.instructorId;
        if (query.search)
            where.name = { contains: query.search };
        const [data, total] = await Promise.all([
            this.prisma.class.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    instructor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                    enrollments: { where: { isActive: true }, select: { id: true } },
                },
            }),
            this.prisma.class.count({ where }),
        ]);
        return {
            data: data.map((c) => ({
                ...c,
                schedules: (() => { try {
                    return JSON.parse(c.schedules);
                }
                catch {
                    return [];
                } })(),
                enrolledCount: c.enrollments.length,
                enrollments: undefined,
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const cls = await this.prisma.class.findUnique({
            where: { id },
            include: {
                instructor: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true, specializations: true, bio: true },
                },
                enrollments: {
                    where: { isActive: true },
                    include: {
                        student: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true, gender: true },
                        },
                    },
                },
                sessions: {
                    take: 10,
                    orderBy: { sessionDate: 'desc' },
                    select: { id: true, sessionDate: true, startTime: true, endTime: true, topic: true },
                },
            },
        });
        if (!cls)
            throw new common_1.NotFoundException('Turma não encontrada');
        return {
            ...cls,
            schedules: (() => { try {
                return JSON.parse(cls.schedules);
            }
            catch {
                return [];
            } })(),
            enrolledCount: cls.enrollments.length,
        };
    }
    async create(dto) {
        return this.prisma.class.create({
            data: {
                ...dto,
                schedules: typeof dto.schedules === 'string' ? dto.schedules : JSON.stringify(dto.schedules || []),
            },
            include: { instructor: { select: { firstName: true, lastName: true } } },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        const data = { ...dto };
        if (dto.schedules && typeof dto.schedules !== 'string') {
            data.schedules = JSON.stringify(dto.schedules);
        }
        return this.prisma.class.update({ where: { id }, data });
    }
    async enroll(classId, studentId) {
        const cls = await this.prisma.class.findUnique({
            where: { id: classId },
            include: { enrollments: { where: { isActive: true } } },
        });
        if (!cls)
            throw new common_1.NotFoundException('Turma não encontrada');
        if (cls.enrollments.length >= cls.maxStudents)
            throw new common_1.ConflictException('Turma lotada');
        return this.prisma.enrollment.upsert({
            where: { studentId_classId: { studentId, classId } },
            create: { studentId, classId },
            update: { isActive: true },
        });
    }
    async unenroll(classId, studentId) {
        return this.prisma.enrollment.updateMany({
            where: { classId, studentId },
            data: { isActive: false },
        });
    }
    async getSessions(classId) {
        const sessions = await this.prisma.classSession.findMany({
            where: { classId },
            orderBy: { sessionDate: 'desc' },
            select: { id: true, sessionDate: true, startTime: true, endTime: true, topic: true, notes: true },
        });
        return { data: sessions };
    }
    async createSession(classId, dto) {
        return this.prisma.classSession.create({ data: { ...dto, classId } });
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClassesService);
//# sourceMappingURL=classes.service.js.map