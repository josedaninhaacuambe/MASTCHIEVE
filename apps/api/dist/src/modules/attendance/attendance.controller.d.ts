import { AttendanceService } from './attendance.service';
import { BulkAttendanceDto } from './dto/attendance.dto';
export declare class AttendanceController {
    private service;
    constructor(service: AttendanceService);
    markBulk(sessionId: string, user: any, dto: BulkAttendanceDto): Promise<{
        count: number;
        sessionId: string;
    }>;
    getSession(sessionId: string): Promise<({
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
    getStudent(studentId: string): Promise<{
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
