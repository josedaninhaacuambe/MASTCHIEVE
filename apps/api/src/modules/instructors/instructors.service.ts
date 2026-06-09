import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class InstructorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true' || query.isActive === true;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.instructor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { firstName: 'asc' },
        include: {
          user: { select: { email: true, lastLoginAt: true } },
          classes: {
            where: { status: 'ACTIVE' },
            select: { id: true, name: true, level: true },
          },
        },
      }),
      this.prisma.instructor.count({ where }),
    ]);

    return {
      data: data.map((i) => ({
        ...i,
        specializations: (() => { try { return JSON.parse(i.specializations); } catch { return []; } })(),
        classCount: i.classes.length,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const inst = await this.prisma.instructor.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        classes: {
          include: { enrollments: { where: { isActive: true }, select: { id: true } } },
        },
        feedbacks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, createdAt: true },
        },
      },
    });
    if (!inst) throw new NotFoundException('Instrutor não encontrado');
    return {
      ...inst,
      specializations: (() => { try { return JSON.parse(inst.specializations); } catch { return []; } })(),
      classes: inst.classes.map((c) => ({
        ...c,
        schedules: (() => { try { return JSON.parse(c.schedules); } catch { return []; } })(),
        enrolledCount: c.enrollments.length,
      })),
    };
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (Array.isArray(dto.specializations)) {
      data.specializations = JSON.stringify(dto.specializations);
    }
    return this.prisma.instructor.update({ where: { id }, data });
  }

  async getStats(id: string) {
    const [classes, feedbacks, students] = await Promise.all([
      this.prisma.class.count({ where: { instructorId: id, status: 'ACTIVE' } }),
      this.prisma.feedback.count({ where: { instructorId: id } }),
      this.prisma.enrollment.count({
        where: { class: { instructorId: id }, isActive: true },
      }),
    ]);
    return { classes, feedbacks, students };
  }
}
