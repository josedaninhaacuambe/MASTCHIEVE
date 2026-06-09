import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async markBulk(sessionId: string, user: { id: string; role: string }, records: { studentId: string; status: any; notes?: string }[]) {
    // Resolve instructor.id from user.id (Instructor and User have separate IDs)
    let instructorId: string;
    if (user.role === 'INSTRUCTOR') {
      const instructor = await this.prisma.instructor.findFirst({ where: { userId: user.id } });
      if (!instructor) throw new Error('Instructor profile not found for this user');
      instructorId = instructor.id;
    } else {
      // ADMIN: use first available instructor for the session's class as fallback
      const session = await this.prisma.classSession.findUnique({
        where: { id: sessionId },
        include: { class: { select: { instructorId: true } } },
      });
      instructorId = session?.class?.instructorId ?? user.id;
    }

    const results = await Promise.all(
      records.map((r) =>
        this.prisma.attendance.upsert({
          where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
          create: { sessionId, studentId: r.studentId, instructorId, status: r.status, notes: r.notes },
          update: { status: r.status, notes: r.notes },
        }),
      ),
    );

    this.audit.log({
      userId: user.id,
      action: 'BULK_ATTENDANCE',
      entity: 'ClassSession',
      entityId: sessionId,
      newValues: { count: results.length, records: records.map((r) => ({ studentId: r.studentId, status: r.status })) },
    });

    return { count: results.length, sessionId };
  }

  async getSessionAttendance(sessionId: string) {
    return this.prisma.attendance.findMany({
      where: { sessionId },
      include: { student: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  async getMyAttendance(userId: string) {
    const student = await this.prisma.student.findFirst({ where: { userId }, select: { id: true } });
    if (!student) return { records: [], attendanceRate: 0 };
    return this.getStudentAttendance(student.id, 50);
  }

  async getStudentAttendance(studentId: string, take = 30) {
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
}
