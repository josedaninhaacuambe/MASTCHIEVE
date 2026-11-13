import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../config/prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../../common/audit/audit.service';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';

@ApiTags('training-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training-plans')
export class TrainingPlansController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Post() @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Criar plano de treino manualmente (sem IA)' })
  async create(@Body() dto: CreateTrainingPlanDto, @CurrentUser('id') userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId }, select: { id: true } });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    const validFrom = dto.validFrom ? new Date(dto.validFrom) : new Date();
    const validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    if (validUntil && validUntil < validFrom) throw new BadRequestException('A data de fim não pode ser anterior à de início.');

    const objectives = (dto.objectives ?? []).map((o) => o.trim()).filter(Boolean);
    const exercises = dto.exercises ?? [];
    if (!dto.description?.trim() && objectives.length === 0 && exercises.length === 0) {
      throw new BadRequestException('Indique pelo menos uma descrição, um objectivo ou um exercício.');
    }

    const instructor = await this.prisma.instructor.findUnique({ where: { userId }, select: { id: true } });
    const plan = await this.prisma.trainingPlan.create({
      data: {
        studentId: dto.studentId,
        instructorId: instructor?.id ?? null,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        objectives: JSON.stringify(objectives),
        exercises: JSON.stringify(exercises),
        aiGenerated: false,
        validFrom,
        validUntil,
      },
    });
    await this.audit.log({ userId, action: 'PLANO_TREINO_CRIADO', entity: 'TrainingPlan', entityId: plan.id, newValues: { studentId: dto.studentId, title: plan.title } });
    return { ...plan, objectives, exercises };
  }

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
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return {
      ...plan,
      objectives: (() => { try { return JSON.parse(plan.objectives as any); } catch { return plan.objectives; } })(),
      exercises: (() => { try { return JSON.parse(plan.exercises as any); } catch { return plan.exercises; } })(),
    };
  }

  @Patch(':id/toggle') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Activar/desactivar plano' })
  async toggle(@Param('id') id: string) {
    const plan = await this.prisma.trainingPlan.findUnique({ where: { id }, select: { isActive: true } });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return this.prisma.trainingPlan.update({ where: { id }, data: { isActive: !plan.isActive } });
  }
}
