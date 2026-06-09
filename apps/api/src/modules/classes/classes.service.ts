import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

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
      enrolledCount: cls.enrollments.length,
    };
  }

  async create(dto: any) {
    return this.prisma.class.create({
      data: {
        ...dto,
        schedules: typeof dto.schedules === 'string' ? dto.schedules : JSON.stringify(dto.schedules || []),
      },
      include: { instructor: { select: { firstName: true, lastName: true } } },
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.schedules && typeof dto.schedules !== 'string') {
      data.schedules = JSON.stringify(dto.schedules);
    }
    return this.prisma.class.update({ where: { id }, data });
  }

  async enroll(classId: string, studentId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { enrollments: { where: { isActive: true } } },
    });
    if (!cls) throw new NotFoundException('Turma não encontrada');
    if (cls.enrollments.length >= cls.maxStudents) throw new ConflictException('Turma lotada');

    return this.prisma.enrollment.upsert({
      where: { studentId_classId: { studentId, classId } },
      create: { studentId, classId },
      update: { isActive: true },
    });
  }

  async unenroll(classId: string, studentId: string) {
    return this.prisma.enrollment.updateMany({
      where: { classId, studentId },
      data: { isActive: false },
    });
  }

  async createSession(classId: string, dto: any) {
    return this.prisma.classSession.create({ data: { ...dto, classId } });
  }
}
