import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../config/prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('training-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training-plans')
export class TrainingPlansController {
  constructor(private prisma: PrismaService) {}

  @Get() @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Listar planos de treino' })
  async findAll(@Query() query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 20);
    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.aiGenerated !== undefined) where.aiGenerated = query.aiGenerated === 'true';
    if (query.studentId) where.studentId = query.studentId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { student: { firstName: { contains: query.search } } },
        { student: { lastName: { contains: query.search } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.trainingPlan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          instructor: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.trainingPlan.count({ where }),
    ]);
    return {
      data: data.map((p) => ({
        ...p,
        objectives: (() => { try { return JSON.parse(p.objectives as any); } catch { return p.objectives; } })(),
        exercises: (() => { try { return JSON.parse(p.exercises as any); } catch { return p.exercises; } })(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get(':id') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Detalhe do plano' })
  async findOne(@Param('id') id: string) {
    const plan = await this.prisma.trainingPlan.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        instructor: { select: { firstName: true, lastName: true } },
      },
    });
    if (!plan) throw new Error('Plano não encontrado');
    return {
      ...plan,
      objectives: (() => { try { return JSON.parse(plan.objectives as any); } catch { return plan.objectives; } })(),
      exercises: (() => { try { return JSON.parse(plan.exercises as any); } catch { return plan.exercises; } })(),
    };
  }

  @Patch(':id/toggle') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Activar/desactivar plano' })
  async toggle(@Param('id') id: string) {
    const plan = await this.prisma.trainingPlan.findUnique({ where: { id }, select: { isActive: true } });
    if (!plan) throw new Error('Plano não encontrado');
    return this.prisma.trainingPlan.update({ where: { id }, data: { isActive: !plan.isActive } });
  }
}
