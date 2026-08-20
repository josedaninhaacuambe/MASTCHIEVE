import { Injectable, NotFoundException } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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

  async exportSessionRosterPdf(sessionId: string): Promise<Buffer> {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { class: { select: { name: true } } },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');

    const attendances = await this.prisma.attendance.findMany({
      where: { sessionId },
      include: { student: { select: { firstName: true, lastName: true } } },
      orderBy: { student: { firstName: 'asc' } },
    });

    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();

    const blue = rgb(0.1, 0.33, 0.86);
    const dark = rgb(0.07, 0.07, 0.07);
    const gray = rgb(0.45, 0.45, 0.45);

    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue });
    page.drawText('Mastchieve — Lista de Presenças', {
      x: 40, y: height - 45, size: 18, font: fontBold, color: rgb(1, 1, 1),
    });
    page.drawText(
      `${session.class?.name ?? ''}  ·  ${new Date(session.sessionDate).toLocaleDateString('pt-PT')} ${session.startTime}-${session.endTime}`,
      { x: 40, y: height - 65, size: 10, font, color: rgb(0.8, 0.85, 1) },
    );

    let y = height - 110;
    const cols = [40, 320, 420];
    const headers = ['Atleta', 'Estado', 'Notas'];
    headers.forEach((h, i) => page.drawText(h, { x: cols[i], y, size: 9, font: fontBold, color: gray }));
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
    y -= 16;

    const statusPt: Record<string, string> = { PRESENT: 'Presente', ABSENT: 'Ausente', LATE: 'Atrasado', EXCUSED: 'Justificado' };
    const statusColor: Record<string, any> = {
      PRESENT: rgb(0.06, 0.63, 0.42),
      ABSENT: rgb(0.85, 0.15, 0.15),
      LATE: rgb(0.85, 0.60, 0.0),
      EXCUSED: rgb(0.3, 0.3, 0.7),
    };

    for (const a of attendances) {
      if (y < 60) break;
      const name = `${a.student?.firstName ?? ''} ${a.student?.lastName ?? ''}`.trim();
      page.drawText(name.slice(0, 34), { x: cols[0], y, size: 9, font, color: dark });
      page.drawText(statusPt[a.status] ?? a.status, { x: cols[1], y, size: 9, font: fontBold, color: statusColor[a.status] ?? gray });
      if (a.notes) page.drawText(a.notes.slice(0, 30), { x: cols[2], y, size: 9, font, color: gray });
      y -= 18;
      page.drawLine({ start: { x: 40, y: y + 8 }, end: { x: width - 40, y: y + 8 }, thickness: 0.3, color: rgb(0.93, 0.93, 0.93) });
    }

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }

  async createContactoFalta(
    data: { studentId: string; motivo: string; faltasConsecutivas: number; meioContacto: string; resultado?: string },
    actorUserId: string,
  ) {
    const student = await this.prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    const contacto = await this.prisma.contactoFalta.create({
      data: { ...data, contactadoPorId: actorUserId },
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'CONTACTO_FALTA_CRIADO',
      entity: 'ContactoFalta',
      entityId: contacto.id,
      newValues: { studentId: data.studentId, faltasConsecutivas: data.faltasConsecutivas, meioContacto: data.meioContacto },
    });

    return contacto;
  }

  async listContactosFalta(studentId?: string) {
    return this.prisma.contactoFalta.findMany({
      where: studentId ? { studentId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true } },
        contactadoPor: { select: { email: true } },
      },
    });
  }
}
