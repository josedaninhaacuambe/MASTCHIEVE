import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { escolherTurmaOrigem, validarConvidado, validarHorario } from './attendance-convidado.util';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  /** instructor.id a gravar na presença: o próprio instrutor, ou (staff) o 1.º indicado / principal da turma. */
  private async resolverInstrutorId(sessionId: string, user: { id: string; role: string }, preferidos?: string[]) {
    if (user.role === 'INSTRUCTOR') {
      const instructor = await this.prisma.instructor.findFirst({ where: { userId: user.id } });
      if (!instructor) throw new BadRequestException('Perfil de instrutor não encontrado para este utilizador');
      return instructor.id;
    }
    if (preferidos?.length) return preferidos[0];
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { class: { select: { instructorId: true } } },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    return session.class.instructorId;
  }

  private async getSessaoOuFalha(sessionId: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { class: { select: { id: true, name: true, unidadeId: true, instructorId: true } } },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    return session;
  }

  async markBulk(
    sessionId: string,
    user: { id: string; role: string },
    records: { studentId: string; status: any; notes?: string }[],
    instructorIds?: string[],
  ) {
    const session = await this.getSessaoOuFalha(sessionId);
    const instructorId = await this.resolverInstrutorId(sessionId, user, instructorIds);

    // Quem não estiver inscrito na turma e ainda não tiver registo fica marcado como convidado.
    const inscritos = new Set(
      (await this.prisma.enrollment.findMany({
        where: { classId: session.classId, isActive: true },
        select: { studentId: true },
      })).map((e) => e.studentId),
    );

    const results = await Promise.all(
      records.map((r) =>
        this.prisma.attendance.upsert({
          where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
          create: {
            sessionId, studentId: r.studentId, instructorId, status: r.status, notes: r.notes,
            ...(inscritos.has(r.studentId) ? {} : { isConvidado: true, unidadeId: session.class.unidadeId }),
          },
          update: { status: r.status, notes: r.notes },
        }),
      ),
    );

    // Instrutores que leccionaram: os indicados, ou pelo menos quem marcou (se instrutor).
    if (instructorIds?.length) {
      await this.definirInstrutoresSessao(sessionId, instructorIds, user, false);
    } else if (user.role === 'INSTRUCTOR') {
      await this.adicionarInstrutorSessao(session, instructorId, user.id);
    }

    this.audit.log({
      userId: user.id,
      action: 'BULK_ATTENDANCE',
      entity: 'ClassSession',
      entityId: sessionId,
      newValues: {
        count: results.length,
        instructorIds,
        records: records.map((r) => ({ studentId: r.studentId, status: r.status })),
      },
    });

    return { count: results.length, sessionId };
  }

  async getSessionAttendance(sessionId: string) {
    return this.prisma.attendance.findMany({
      where: { sessionId },
      orderBy: { markedAt: 'asc' },
      include: {
        student: { select: { firstName: true, lastName: true, avatarUrl: true } },
        turmaOrigem: { select: { id: true, name: true } },
        unidade: { select: { id: true, nome: true } },
      },
    });
  }

  // ─── Instrutores que leccionaram a aula ─────────────────────────────────────

  private async adicionarInstrutorSessao(
    session: { id: string; sessionDate: Date; class: { unidadeId: string | null } },
    instructorId: string,
    registadoPorId: string,
  ) {
    await this.prisma.sessionInstructor.upsert({
      where: { sessionId_instructorId: { sessionId: session.id, instructorId } },
      create: {
        sessionId: session.id, instructorId, registadoPorId,
        unidadeId: session.class.unidadeId, data: session.sessionDate,
      },
      update: {},
    });
  }

  async getInstrutoresSessao(sessionId: string) {
    return this.prisma.sessionInstructor.findMany({
      where: { sessionId },
      orderBy: { criadoEm: 'asc' },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        unidade: { select: { id: true, nome: true } },
      },
    });
  }

  /**
   * Define o conjunto de instrutores que efectivamente deram a aula. Podem ser
   * de qualquer unidade — a ligação habitual (InstructorUnidade) não muda.
   */
  async definirInstrutoresSessao(
    sessionId: string,
    instructorIds: string[],
    user: { id: string; role: string },
    auditar = true,
  ) {
    const ids = Array.from(new Set(instructorIds.filter(Boolean)));
    if (!ids.length) throw new BadRequestException('Indique pelo menos um instrutor');
    const session = await this.getSessaoOuFalha(sessionId);
    const validos = await this.prisma.instructor.count({ where: { id: { in: ids }, isActive: true } });
    if (validos !== ids.length) throw new BadRequestException('Instrutor inválido ou inactivo');

    await this.prisma.$transaction([
      this.prisma.sessionInstructor.deleteMany({ where: { sessionId, instructorId: { notIn: ids } } }),
      ...ids.map((instructorId) =>
        this.prisma.sessionInstructor.upsert({
          where: { sessionId_instructorId: { sessionId, instructorId } },
          create: {
            sessionId, instructorId, registadoPorId: user.id,
            unidadeId: session.class.unidadeId, data: session.sessionDate,
          },
          update: {},
        }),
      ),
    ]);

    if (auditar) {
      await this.audit.log({
        userId: user.id, action: 'SESSAO_INSTRUTORES_DEFINIDOS', entity: 'ClassSession', entityId: sessionId,
        newValues: { instructorIds: ids, unidadeId: session.class.unidadeId, data: session.sessionDate },
      });
    }
    return this.getInstrutoresSessao(sessionId);
  }

  // ─── Convidados (atletas de outras turmas) ──────────────────────────────────

  /** Pesquisa em todos os atletas activos (não só os da turma) para registar como convidado. */
  async pesquisarCandidatosConvidado(sessionId: string, search: string) {
    const session = await this.getSessaoOuFalha(sessionId);
    const termo = (search ?? '').trim();
    if (termo.length < 2) return [];
    const partes = termo.split(/\s+/).slice(0, 3);
    const students = await this.prisma.student.findMany({
      where: {
        isActive: true,
        AND: partes.map((p) => ({ OR: [{ firstName: { contains: p } }, { lastName: { contains: p } }] })),
      },
      take: 15,
      orderBy: { firstName: 'asc' },
      select: {
        id: true, firstName: true, lastName: true, avatarUrl: true,
        unidade: { select: { id: true, nome: true } },
        enrollments: {
          where: { isActive: true },
          select: { classId: true, class: { select: { id: true, name: true } } },
        },
        attendances: { where: { sessionId }, select: { id: true } },
      },
    });
    return students.map(({ enrollments, attendances, ...st }) => ({
      ...st,
      turmas: enrollments.map((e) => e.class),
      inscritoNaTurma: enrollments.some((e) => e.classId === session.classId),
      jaRegistado: attendances.length > 0,
    }));
  }

  async registarConvidado(
    sessionId: string,
    user: { id: string; role: string },
    dto: { studentId: string; status?: string; turmaOrigemId?: string; horaEntrada?: string; horaSaida?: string; notes?: string },
  ) {
    const session = await this.getSessaoOuFalha(sessionId);
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      select: {
        id: true, isActive: true, firstName: true, lastName: true,
        enrollments: { where: { isActive: true }, select: { classId: true, class: { select: { unidadeId: true } } } },
      },
    });
    const existente = await this.prisma.attendance.findUnique({
      where: { sessionId_studentId: { sessionId, studentId: dto.studentId } },
      select: { id: true },
    });

    const erro = validarConvidado({
      atletaExiste: !!student,
      atletaAtivo: !!student?.isActive,
      inscritoNaTurma: !!student?.enrollments.some((e) => e.classId === session.classId),
      jaRegistadoNaAula: !!existente,
    });
    if (erro) {
      if (!student) throw new NotFoundException(erro);
      throw new ConflictException(erro);
    }

    const turmaOrigemId = escolherTurmaOrigem(
      student!.enrollments.map((e) => ({ classId: e.classId, unidadeId: e.class.unidadeId })),
      session.class.unidadeId,
      dto.turmaOrigemId,
    );
    if (dto.turmaOrigemId && !turmaOrigemId) {
      throw new BadRequestException('A turma de origem indicada não corresponde a uma inscrição activa do atleta');
    }

    const horaEntrada = dto.horaEntrada ? new Date(dto.horaEntrada) : new Date();
    const horaSaida = dto.horaSaida ? new Date(dto.horaSaida) : null;
    const erroHorario = validarHorario(horaEntrada, horaSaida);
    if (erroHorario) throw new BadRequestException(erroHorario);

    const instructorId = await this.resolverInstrutorId(sessionId, user);
    const registo = await this.prisma.attendance.create({
      data: {
        sessionId,
        studentId: dto.studentId,
        instructorId,
        status: dto.status ?? 'PRESENT',
        notes: dto.notes,
        isConvidado: true,
        turmaOrigemId,
        unidadeId: session.class.unidadeId,
        horaEntrada,
        horaSaida,
      },
      include: {
        student: { select: { firstName: true, lastName: true, avatarUrl: true } },
        turmaOrigem: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      userId: user.id, action: 'PRESENCA_CONVIDADO_REGISTADA', entity: 'Attendance', entityId: registo.id,
      newValues: {
        sessionId, studentId: dto.studentId, turmaFrequentadaId: session.classId, turmaOrigemId,
        unidadeId: session.class.unidadeId, data: session.sessionDate, horaEntrada, horaSaida,
      },
    });
    return registo;
  }

  async atualizarHorario(attendanceId: string, user: { id: string }, dto: { horaEntrada?: string | null; horaSaida?: string | null }) {
    const atual = await this.prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!atual) throw new NotFoundException('Registo de presença não encontrado');
    const horaEntrada = dto.horaEntrada === undefined ? atual.horaEntrada : dto.horaEntrada ? new Date(dto.horaEntrada) : null;
    const horaSaida = dto.horaSaida === undefined ? atual.horaSaida : dto.horaSaida ? new Date(dto.horaSaida) : null;
    const erro = validarHorario(horaEntrada, horaSaida);
    if (erro) throw new BadRequestException(erro);

    const updated = await this.prisma.attendance.update({ where: { id: attendanceId }, data: { horaEntrada, horaSaida } });
    await this.audit.log({
      userId: user.id, action: 'PRESENCA_HORARIO_ATUALIZADO', entity: 'Attendance', entityId: attendanceId,
      oldValues: { horaEntrada: atual.horaEntrada, horaSaida: atual.horaSaida },
      newValues: { horaEntrada, horaSaida },
    });
    return updated;
  }

  async removerConvidado(attendanceId: string, user: { id: string }) {
    const atual = await this.prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!atual) throw new NotFoundException('Registo de presença não encontrado');
    if (!atual.isConvidado) throw new BadRequestException('Só é possível remover registos de convidados');
    await this.prisma.attendance.delete({ where: { id: attendanceId } });
    await this.audit.log({
      userId: user.id, action: 'PRESENCA_CONVIDADO_REMOVIDA', entity: 'Attendance', entityId: attendanceId,
      oldValues: { sessionId: atual.sessionId, studentId: atual.studentId, turmaOrigemId: atual.turmaOrigemId },
    });
    return { id: attendanceId, removed: true };
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
      include: { student: { select: { firstName: true, lastName: true } }, turmaOrigem: { select: { name: true } } },
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
      const nomeBase = `${a.student?.firstName ?? ''} ${a.student?.lastName ?? ''}`.trim();
      const name = a.isConvidado ? `${nomeBase.slice(0, 22)} (convidado${a.turmaOrigem ? ` · ${a.turmaOrigem.name}` : ''})` : nomeBase;
      page.drawText(name.slice(0, 48), { x: cols[0], y, size: 9, font, color: dark });
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
