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
          user: { select: { id: true, email: true, lastLoginAt: true, isActive: true } },
          classes: {
            where: { status: 'ACTIVE' },
            select: { id: true, name: true, level: true },
          },
          _count: { select: { feedbacks: true } },
        },
      }),
      this.prisma.instructor.count({ where }),
    ]);

    return {
      data: data.map((i) => ({
        ...i,
        specializations: (() => { try { return JSON.parse(i.specializations); } catch { return []; } })(),
        classCount: i.classes.length,
        feedbackCount: i._count.feedbacks,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const inst = await this.prisma.instructor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, lastLoginAt: true, isActive: true } },
        classes: {
          include: {
            enrollments: { where: { isActive: true }, select: { id: true } },
            _count: { select: { enrollments: true } },
          },
          orderBy: { name: 'asc' },
        },
        feedbacks: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, createdAt: true },
        },
        _count: { select: { feedbacks: true } },
      },
    });
    if (!inst) throw new NotFoundException('Instrutor não encontrado');
    return {
      ...inst,
      specializations: (() => { try { return JSON.parse(inst.specializations); } catch { return []; } })(),
      feedbackCount: inst._count.feedbacks,
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
    delete data._count;
    return this.prisma.instructor.update({ where: { id }, data });
  }

  async toggleActive(id: string) {
    const inst = await this.prisma.instructor.findUnique({ where: { id }, select: { isActive: true } });
    if (!inst) throw new NotFoundException('Instrutor não encontrado');
    const updated = await this.prisma.instructor.update({
      where: { id },
      data: { isActive: !inst.isActive },
      select: { id: true, isActive: true },
    });
    return updated;
  }

  async sendNotification(id: string, title: string, body: string) {
    const inst = await this.prisma.instructor.findUnique({
      where: { id },
      select: { userId: true, firstName: true },
    });
    if (!inst) throw new NotFoundException('Instrutor não encontrado');
    return this.prisma.notification.create({
      data: { userId: inst.userId, type: 'SYSTEM', title, body },
    });
  }

  async getStats(id: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [classes, feedbacks, students, recentFeedbacks] = await Promise.all([
      this.prisma.class.count({ where: { instructorId: id, status: 'ACTIVE' } }),
      this.prisma.feedback.count({ where: { instructorId: id } }),
      this.prisma.enrollment.count({ where: { class: { instructorId: id }, isActive: true } }),
      this.prisma.feedback.findMany({
        where: { instructorId: id, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Group by month (last 6 months)
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('pt-PT', { month: 'short' }),
        count: 0,
      });
    }
    recentFeedbacks.forEach((f) => {
      const d = new Date(f.createdAt);
      const label = d.toLocaleString('pt-PT', { month: 'short' });
      const entry = months.find((m) => m.month === label);
      if (entry) entry.count++;
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMonthFeedbacks = recentFeedbacks.filter(
      (f) => new Date(f.createdAt) >= thirtyDaysAgo,
    ).length;

    return { classes, feedbacks, students, feedbacksByMonth: months, recentMonthFeedbacks };
  }
}
