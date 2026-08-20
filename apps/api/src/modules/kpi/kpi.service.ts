import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { mesclarRegistosDesempenho } from '../avaliacoes/normalizar-desempenho.util';

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardKpis() {
    const [
      totalStudents, activeStudents, totalInstructors, totalClasses,
      overduePayments, recentFeedbacks, attendanceStats,
      totalFuncionarios, funcionariosPorEstado, folhasPendentes, reclamacoesAbertas, leadsPorEstado,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.student.count({ where: { isActive: true } }),
      this.prisma.instructor.count({ where: { isActive: true } }),
      this.prisma.class.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.count({ where: { status: 'OVERDUE' } }),
      this.prisma.feedback.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, aiGeneratedText: true, aiConfidenceScore: true, createdAt: true,
          student: { select: { firstName: true, lastName: true } },
        },
      }),
      this.getAttendanceStats(),
      this.prisma.funcionario.count(),
      this.prisma.funcionario.groupBy({ by: ['estado'], _count: true }),
      this.prisma.folhaPagamento.count({ where: { estado: 'PENDENTE_APROVACAO' } }),
      this.prisma.reclamacao.count({ where: { estado: { notIn: ['RESPONDIDA', 'FECHADA'] } } }),
      this.prisma.lead.groupBy({ by: ['estado'], _count: true }),
    ]);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyRevenue = await this.prisma.payment.aggregate({
      where: { status: 'PAID', paidAt: { gte: monthStart } },
      _sum: { amount: true },
    });

    const moduleProgress = await this.getModuleProgressStats();

    const [totalFeedbacks, reviewedFeedbacks] = await Promise.all([
      this.prisma.feedback.count({ where: { status: { not: 'PENDING' } } }),
      this.prisma.feedback.count({ where: { status: { in: ['REVIEWED', 'SENT'] } } }),
    ]);
    const aiConcordanceRate = totalFeedbacks > 0
      ? Math.round((reviewedFeedbacks / totalFeedbacks) * 100)
      : 0;

    return {
      students: { total: totalStudents, active: activeStudents },
      instructors: totalInstructors,
      classes: totalClasses,
      overduePayments,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      attendanceRate: attendanceStats.rate,
      recentFeedbacks,
      moduleProgress,
      aiConcordanceRate,
      rh: {
        totalFuncionarios,
        porEstado: funcionariosPorEstado.map((e) => ({ estado: e.estado, total: e._count })),
        folhasPendentes,
      },
      administrativo: {
        reclamacoesAbertas,
        leadsPorEstado: leadsPorEstado.map((l) => ({ estado: l.estado, total: l._count })),
      },
    };
  }

  async getAttendanceStats(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [total, present] = await Promise.all([
      this.prisma.attendance.count({ where: { markedAt: { gte: since } } }),
      this.prisma.attendance.count({ where: { status: 'PRESENT', markedAt: { gte: since } } }),
    ]);
    return { total, present, rate: total ? Math.round((present / total) * 100) : 0 };
  }

  async getModuleProgressStats() {
    const all = await this.prisma.progress.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    return all.reduce((acc: any, s) => ({ ...acc, [s.status]: s._count.status }), {});
  }

  async getStudentProgressTrend(studentId: string) {
    const [performanceRecords, avaliacoesDiarias] = await Promise.all([
      this.prisma.performanceRecord.findMany({
        where: { studentId },
        orderBy: { recordedAt: 'desc' },
        take: 20,
        select: {
          id: true, technique: true, stamina: true, speed: true,
          coordination: true, breathing: true, turns: true,
          startDive: true, overallScore: true, recordedAt: true,
        },
      }),
      this.prisma.avaliacao.findMany({
        where: { studentId, tipo: 'DIARIA' },
        orderBy: { avaliadoEm: 'desc' },
        take: 20,
        select: { id: true, pontuacoes: true, notaGlobal: true, observacoes: true, avaliadoEm: true },
      }),
    ]);

    return mesclarRegistosDesempenho(performanceRecords, avaliacoesDiarias)
      .slice(0, 20)
      .reverse();
  }

  async getInstructorAdoptionRate() {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, active] = await Promise.all([
      this.prisma.instructor.count({ where: { isActive: true } }),
      this.prisma.instructor.count({
        where: {
          isActive: true,
          feedbacks: { some: { createdAt: { gte: since30 } } },
        },
      }),
    ]);
    return { total, active, rate: total ? Math.round((active / total) * 100) : 0 };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async snapshotKpis() {
    try {
      const kpis = await this.getDashboardKpis();
      const adoption = await this.getInstructorAdoptionRate();
      await this.prisma.kpiSnapshot.create({
        data: {
          totalStudents: kpis.students.total,
          activeStudents: kpis.students.active,
          totalInstructors: kpis.instructors,
          totalClasses: kpis.classes,
          attendanceRate: kpis.attendanceRate,
          overduePayments: kpis.overduePayments,
          monthlyRevenue: kpis.monthlyRevenue,
          instructorAdoptionRate: adoption.rate,
        },
      });
      this.logger.log('KPI snapshot saved');
    } catch (e) {
      this.logger.error('KPI snapshot failed', e);
    }
  }

  async getKpiHistory(days = 30) {
    return this.prisma.kpiSnapshot.findMany({
      where: { snapshotDate: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } },
      orderBy: { snapshotDate: 'asc' },
    });
  }
}
