import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    const { search, classId } = query;
    const isActive = query.isActive === undefined ? undefined : query.isActive === 'true' || query.isActive === true;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }
    if (classId) {
      where.enrollments = { some: { classId, isActive: true } };
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
        include: {
          user: { select: { email: true, role: true, lastLoginAt: true } },
          enrollments: {
            where: { isActive: true },
            include: {
              class: {
                select: { id: true, name: true, level: true },
              },
            },
          },
          parents: {
            include: {
              parent: { select: { firstName: true, lastName: true, phone: true } },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByUserId(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId },
      include: {
        user: { select: { email: true, role: true, lastLoginAt: true } },
        enrollments: {
          where: { isActive: true },
          include: {
            class: {
              include: { instructor: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        feedbacks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, status: true, aiGeneratedText: true,
            finalText: true, aiConfidenceScore: true, createdAt: true,
          },
        },
        payments: {
          take: 6,
          orderBy: { dueDate: 'desc' },
          select: { id: true, amount: true, status: true, dueDate: true, notes: true },
        },
        progressRecords: {
          include: { module: { select: { id: true, name: true, description: true, level: true, order: true, skills: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!student) throw new NotFoundException('Perfil de atleta não encontrado');

    const [attendanceStats, performanceRecords, trainingPlans] = await Promise.all([
      this.prisma.attendance.groupBy({
        by: ['status'],
        where: { studentId: student.id },
        _count: true,
      }),
      this.prisma.performanceRecord.findMany({
        where: { studentId: student.id },
        orderBy: { recordedAt: 'desc' },
        take: 10,
        select: {
          id: true, technique: true, stamina: true, speed: true,
          coordination: true, breathing: true, turns: true,
          startDive: true, overallScore: true, instructorNotes: true, recordedAt: true,
        },
      }),
      this.prisma.trainingPlan.findMany({
        where: { studentId: student.id, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: {
          id: true, title: true, description: true, objectives: true,
          exercises: true, aiGenerated: true, validFrom: true, validUntil: true,
        },
      }),
    ]);

    const totalSessions = attendanceStats.reduce((s, r) => s + r._count, 0);
    const present = attendanceStats.find((r) => r.status === 'PRESENT')?._count ?? 0;

    return {
      ...student,
      performanceRecords,
      trainingPlans,
      attendanceStats: { total: totalSessions, present, rate: totalSessions ? Math.round((present / totalSessions) * 100) : 0 },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true, lastLoginAt: true } },
        enrollments: {
          include: {
            class: {
              include: {
                instructor: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        parents: {
          include: { parent: true },
        },
        feedbacks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, status: true, aiGeneratedText: true,
            finalText: true, aiConfidenceScore: true,
            sentToStudentAt: true, createdAt: true,
          },
        },
        progressRecords: {
          include: { module: true },
        },
        trainingPlans: { where: { isActive: true } },
        payments: {
          take: 12,
          orderBy: { dueDate: 'desc' },
        },
      },
    });
    if (!student) throw new NotFoundException('Atleta não encontrado');
    return student;
  }

  async create(dto: CreateStudentDto & { email?: string; password?: string }) {
    const email = dto.email || `atleta_${Date.now()}@mastchieve.com`;
    const bcrypt = await import('bcryptjs');
    const password = await bcrypt.hash(dto.password || 'student123', 10);

    return this.prisma.user.create({
      data: {
        email,
        password,
        role: 'STUDENT',
        student: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            dateOfBirth: new Date(dto.dateOfBirth),
            gender: dto.gender || 'OTHER',
            phone: dto.phone,
            medicalNotes: dto.medicalNotes,
            emergencyContact: dto.emergencyContact,
            emergencyPhone: dto.emergencyPhone,
          },
        },
      },
      include: { student: true },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    return this.prisma.student.update({ where: { id }, data: dto as any });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.student.update({ where: { id }, data: { isActive: false } });
  }

  async getPerformanceSummary(studentId: string) {
    const [records, feedbacks, progress, attendance, trainingPlans] = await Promise.all([
      this.prisma.performanceRecord.findMany({
        where: { studentId },
        orderBy: { recordedAt: 'desc' },
        take: 20,
        select: {
          id: true, technique: true, stamina: true, speed: true,
          coordination: true, breathing: true, turns: true,
          startDive: true, overallScore: true, instructorNotes: true, recordedAt: true,
        },
      }),
      this.prisma.feedback.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, status: true, aiGeneratedText: true,
          finalText: true, aiConfidenceScore: true,
          sentToStudentAt: true, createdAt: true,
        },
      }),
      this.prisma.progress.findMany({
        where: { studentId },
        include: { module: true },
      }),
      this.prisma.attendance.findMany({
        where: { studentId },
        orderBy: { markedAt: 'desc' },
        take: 30,
        select: { status: true, markedAt: true },
      }),
      this.prisma.trainingPlan.findMany({
        where: { studentId, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
    const attendanceRate = attendance.length
      ? Math.round((presentCount / attendance.length) * 100)
      : 0;

    const avgScore = records.length
      ? parseFloat((records.reduce((s, r) => s + (r.overallScore || 0), 0) / records.length).toFixed(1))
      : 0;

    return { records, feedbacks, progress, attendance, trainingPlans, attendanceRate, avgScore };
  }

  async createPerformanceRecord(studentId: string, userId: string, dto: any) {
    await this.findOne(studentId);
    const instructor = await this.prisma.instructor.findFirst({ where: { userId } });
    const scores = [dto.technique, dto.stamina, dto.speed, dto.coordination, dto.breathing, dto.turns, dto.startDive]
      .filter((v) => v != null) as number[];
    const overallScore = scores.length ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : null;
    return this.prisma.performanceRecord.create({
      data: {
        studentId,
        instructorId: instructor?.id ?? null,
        sessionId: dto.sessionId ?? null,
        technique: dto.technique ?? null,
        stamina: dto.stamina ?? null,
        speed: dto.speed ?? null,
        coordination: dto.coordination ?? null,
        breathing: dto.breathing ?? null,
        turns: dto.turns ?? null,
        startDive: dto.startDive ?? null,
        instructorNotes: dto.instructorNotes ?? null,
        overallScore,
      },
    });
  }
}
