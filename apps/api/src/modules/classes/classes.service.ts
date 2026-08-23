import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PrismaService } from '../../config/prisma/prisma.service';
import { CertificacoesService } from '../recursos-humanos/certificacoes/certificacoes.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private certificacoesService: CertificacoesService,
    private audit: AuditService,
  ) {}

  private async assertInstrutorCertificado(instructorId: string | undefined) {
    if (!instructorId) return;
    const funcionario = await this.prisma.funcionario.findUnique({ where: { instructorId } });
    if (funcionario) await this.certificacoesService.assertCertificacoesValidas(funcionario.id);
  }

  async findAll(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const where: any = {};
    if (query.level) where.level = query.level;
    if (query.status) where.status = query.status;
    if (query.instructorId) where.instructorId = query.instructorId;
    if (query.search) where.name = { contains: query.search };

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
        schedules: (() => { try { return JSON.parse(c.schedules); } catch { return []; } })(),
        moduleIds: (() => { try { return c.moduleIds ? JSON.parse(c.moduleIds) : []; } catch { return []; } })(),
        enrolledCount: c.enrollments.length,
        enrollments: undefined,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
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
    if (!cls) throw new NotFoundException('Turma não encontrada');
    return {
      ...cls,
      schedules: (() => { try { return JSON.parse(cls.schedules); } catch { return []; } })(),
      moduleIds: (() => { try { return cls.moduleIds ? JSON.parse(cls.moduleIds) : []; } catch { return []; } })(),
      enrolledCount: cls.enrollments.length,
    };
  }

  async create(dto: any, actorUserId?: string) {
    await this.assertInstrutorCertificado(dto.instructorId);
    const cls = await this.prisma.class.create({
      data: {
        ...dto,
        schedules: typeof dto.schedules === 'string' ? dto.schedules : JSON.stringify(dto.schedules || []),
        moduleIds: dto.moduleIds ? (typeof dto.moduleIds === 'string' ? dto.moduleIds : JSON.stringify(dto.moduleIds)) : undefined,
      },
      include: { instructor: { select: { firstName: true, lastName: true } } },
    });

    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'CLASS_CRIADA',
        entity: 'Class',
        entityId: cls.id,
        newValues: { name: cls.name, instructorId: cls.instructorId },
      });
    }

    return cls;
  }

  async update(id: string, dto: any, actorUserId?: string, actorRole?: string) {
    const existing = await this.findOne(id);

    if (actorRole === 'INSTRUCTOR') {
      const instructor = await this.prisma.instructor.findUnique({ where: { userId: actorUserId } });
      if (!instructor || existing.instructorId !== instructor.id) {
        throw new ForbiddenException('Só podes editar as tuas próprias turmas');
      }
    }

    if (dto.instructorId) await this.assertInstrutorCertificado(dto.instructorId);
    const data: any = { ...dto };
    if (dto.schedules && typeof dto.schedules !== 'string') {
      data.schedules = JSON.stringify(dto.schedules);
    }
    if (dto.moduleIds && typeof dto.moduleIds !== 'string') {
      data.moduleIds = JSON.stringify(dto.moduleIds);
    }
    const updated = await this.prisma.class.update({ where: { id }, data });

    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'CLASS_ATUALIZADA',
        entity: 'Class',
        entityId: id,
        oldValues: { name: existing.name, maxStudents: existing.maxStudents, status: existing.status },
        newValues: { name: updated.name, maxStudents: updated.maxStudents, status: updated.status },
      });
    }

    return updated;
  }

  async enroll(classId: string, studentId: string, actorUserId?: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { enrollments: { where: { isActive: true } } },
    });
    if (!cls) throw new NotFoundException('Turma não encontrada');
    if (cls.enrollments.length >= cls.maxStudents) throw new ConflictException('Turma lotada');

    const enrollment = await this.prisma.enrollment.upsert({
      where: { studentId_classId: { studentId, classId } },
      create: { studentId, classId },
      update: { isActive: true },
    });

    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'CLASS_MATRICULA',
        entity: 'Enrollment',
        entityId: enrollment.id,
        newValues: { classId, studentId },
      });
    }

    return enrollment;
  }

  async unenroll(classId: string, studentId: string, actorUserId?: string) {
    const result = await this.prisma.enrollment.updateMany({
      where: { classId, studentId },
      data: { isActive: false },
    });

    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: 'CLASS_DESMATRICULA',
        entity: 'Enrollment',
        newValues: { classId, studentId },
      });
    }

    return result;
  }

  async transferStudent(
    data: { studentId: string; turmaOrigemId?: string; turmaDestinoId: string; motivo: string },
    actorUserId: string,
  ) {
    const transferencia = await this.prisma.$transaction(async (tx) => {
      const destino = await tx.class.findUnique({
        where: { id: data.turmaDestinoId },
        include: { enrollments: { where: { isActive: true } } },
      });
      if (!destino) throw new NotFoundException('Turma de destino não encontrada');
      if (destino.enrollments.length >= destino.maxStudents) throw new ConflictException('Turma de destino lotada');

      if (data.turmaOrigemId) {
        await tx.enrollment.updateMany({
          where: { classId: data.turmaOrigemId, studentId: data.studentId, isActive: true },
          data: { isActive: false, notes: data.motivo },
        });
      }

      await tx.enrollment.upsert({
        where: { studentId_classId: { studentId: data.studentId, classId: data.turmaDestinoId } },
        create: { studentId: data.studentId, classId: data.turmaDestinoId },
        update: { isActive: true },
      });

      return tx.transferenciaTurma.create({
        data: {
          studentId: data.studentId,
          turmaOrigemId: data.turmaOrigemId,
          turmaDestinoId: data.turmaDestinoId,
          motivo: data.motivo,
          autorizadoPorId: actorUserId,
        },
      });
    });

    await this.audit.log({
      userId: actorUserId,
      action: 'TURMA_TRANSFERENCIA',
      entity: 'TransferenciaTurma',
      entityId: transferencia.id,
      newValues: { studentId: data.studentId, turmaOrigemId: data.turmaOrigemId, turmaDestinoId: data.turmaDestinoId },
    });

    return transferencia;
  }

  async exportRosterPdf(classId: string): Promise<Buffer> {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        instructor: { select: { firstName: true, lastName: true } },
        enrollments: {
          where: { isActive: true },
          include: { student: { select: { firstName: true, lastName: true, phone: true } } },
        },
      },
    });
    if (!cls) throw new NotFoundException('Turma não encontrada');

    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();

    const blue = rgb(0.1, 0.33, 0.86);
    const dark = rgb(0.07, 0.07, 0.07);
    const gray = rgb(0.45, 0.45, 0.45);

    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue });
    page.drawText(`Mastchieve — Lista da Turma ${cls.name}`, {
      x: 40, y: height - 45, size: 16, font: fontBold, color: rgb(1, 1, 1),
    });
    page.drawText(`Instrutor: ${cls.instructor.firstName} ${cls.instructor.lastName}  ·  ${cls.enrollments.length} atleta(s)`, {
      x: 40, y: height - 65, size: 10, font, color: rgb(0.8, 0.85, 1),
    });

    let y = height - 110;
    const cols = [40, 320];
    ['Atleta', 'Telefone'].forEach((h, i) => page.drawText(h, { x: cols[i], y, size: 9, font: fontBold, color: gray }));
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
    y -= 16;

    for (const e of cls.enrollments) {
      if (y < 60) break;
      const name = `${e.student.firstName} ${e.student.lastName}`.trim();
      page.drawText(name.slice(0, 34), { x: cols[0], y, size: 9, font, color: dark });
      page.drawText(e.student.phone || '-', { x: cols[1], y, size: 9, font, color: dark });
      y -= 18;
      page.drawLine({ start: { x: 40, y: y + 8 }, end: { x: width - 40, y: y + 8 }, thickness: 0.3, color: rgb(0.93, 0.93, 0.93) });
    }

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }

  async findMyClasses(userId: string) {
    const instructor = await this.prisma.instructor.findUnique({ where: { userId } });
    if (!instructor) return [];
    return this.prisma.class.findMany({
      where: { instructorId: instructor.id, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  async getSessions(classId: string) {
    const sessions = await this.prisma.classSession.findMany({
      where: { classId },
      orderBy: { sessionDate: 'desc' },
      select: { id: true, sessionDate: true, startTime: true, endTime: true, topic: true, notes: true },
    });
    return { data: sessions };
  }

  async createSession(classId: string, dto: any) {
    return this.prisma.classSession.create({ data: { ...dto, classId } });
  }
}
