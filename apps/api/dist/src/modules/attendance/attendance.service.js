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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
let AttendanceService = class AttendanceService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async markBulk(sessionId, user, records) {
        let instructorId;
        if (user.role === 'INSTRUCTOR') {
            const instructor = await this.prisma.instructor.findFirst({ where: { userId: user.id } });
            if (!instructor)
                throw new Error('Instructor profile not found for this user');
            instructorId = instructor.id;
        }
        else {
            const session = await this.prisma.classSession.findUnique({
                where: { id: sessionId },
                include: { class: { select: { instructorId: true } } },
            });
            instructorId = session?.class?.instructorId ?? user.id;
        }
        const results = await Promise.all(records.map((r) => this.prisma.attendance.upsert({
            where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
            create: { sessionId, studentId: r.studentId, instructorId, status: r.status, notes: r.notes },
            update: { status: r.status, notes: r.notes },
        })));
        this.audit.log({
            userId: user.id,
            action: 'BULK_ATTENDANCE',
            entity: 'ClassSession',
            entityId: sessionId,
            newValues: { count: results.length, records: records.map((r) => ({ studentId: r.studentId, status: r.status })) },
        });
        return { count: results.length, sessionId };
    }
    async getSessionAttendance(sessionId) {
        return this.prisma.attendance.findMany({
            where: { sessionId },
            include: { student: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        });
    }
    async getMyAttendance(userId) {
        const student = await this.prisma.student.findFirst({ where: { userId }, select: { id: true } });
        if (!student)
            return { records: [], attendanceRate: 0 };
        return this.getStudentAttendance(student.id, 50);
    }
    async getStudentAttendance(studentId, take = 30) {
        const records = await this.prisma.attendance.findMany({
            where: { studentId },
            orderBy: { markedAt: 'desc' },
            take,
            include: { session: { select: { sessionDate: true, startTime: true } } },
        });
        const rate = records.length
            ? Math.round((records.filter((r) => r.status === 'PRESENT').length / records.length) * 100)
            : 0;
        return { records, attendanceRate: rate };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map