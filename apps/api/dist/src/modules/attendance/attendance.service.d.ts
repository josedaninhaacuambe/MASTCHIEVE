import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
export declare class AttendanceService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    markBulk(sessionId: string, user: {
        id: string;
        role: string;
    }, records: {
        studentId: string;
        status: any;
        notes?: string;
    }[]): Promise<{
        count: number;
        sessionId: string;
    }>;
    getSessionAttendance(sessionId: string): Promise<({
        student: {
            firstName: string;
            lastName: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        status: string;
        instructorId: string;
        studentId: string;
        notes: string | null;
        sessionId: string;
        markedAt: Date;
    })[]>;
    getMyAttendance(userId: string): Promise<{
        records: ({
            session: {
                sessionDate: Date;
                startTime: string;
            };
        } & {
            id: string;
            status: string;
            instructorId: string;
            studentId: string;
            notes: string | null;
            sessionId: string;
            markedAt: Date;
        })[];
        attendanceRate: number;
    }>;
    getStudentAttendance(studentId: string, take?: number): Promise<{
        records: ({
            session: {
                sessionDate: Date;
                startTime: string;
            };
        } & {
            id: string;
            status: string;
            instructorId: string;
            studentId: string;
            notes: string | null;
            sessionId: string;
            markedAt: Date;
        })[];
        attendanceRate: number;
    }>;
}
