import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { StudentsService } from './students.service';
import { StudentsReportService } from './students-report.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { ChamadaAtencaoDto } from './dto/chamada-atencao.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(
    private studentsService: StudentsService,
    private studentsReportService: StudentsReportService,
  ) {}

  @Get('me')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Perfil do atleta autenticado' })
  getMe(@CurrentUser('id') userId: string) {
    return this.studentsService.findByUserId(userId);
  }

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar atletas' })
  findAll(@Query() query: StudentQueryDto, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.studentsService.findAll(query, userId, role);
  }

  @Get('check-duplicate')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Verificar possível duplicado por nome + data de nascimento (aviso não-bloqueante)' })
  checkDuplicate(@Query('firstName') firstName: string, @Query('lastName') lastName: string, @Query('dateOfBirth') dateOfBirth: string) {
    return this.studentsService.checkDuplicate(firstName, lastName, dateOfBirth);
  }

  @Get(':id')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Obter atleta por ID' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/checklist')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Checklist de documentos obrigatórios de inscrição' })
  getChecklist(@Param('id') id: string) {
    return this.studentsService.getChecklist(id);
  }

  @Get(':id/report')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Exportar Ficha Técnica do Atleta em PDF' })
  async getReport(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.studentsReportService.generate(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ficha-tecnica-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id/performance')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Resumo de desempenho do atleta' })
  getPerformance(@Param('id') id: string) {
    return this.studentsService.getPerformanceSummary(id);
  }

  @Get(':id/reports')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Histórico de relatórios mensais e chamadas de atenção' })
  getReportsHistory(@Param('id') id: string) {
    return this.studentsService.getReportsHistory(id);
  }

  @Post(':id/report/monthly')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Enviar relatório mensal detalhado ao atleta' })
  sendMonthlyReport(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.studentsService.sendMonthlyReport(id, userId);
  }

  @Post(':id/report/chamada-atencao')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Enviar chamada de atenção ao atleta' })
  sendChamadaAtencao(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ChamadaAtencaoDto,
  ) {
    return this.studentsService.sendChamadaAtencao(id, userId, dto.mensagem);
  }

  @Post()
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Criar atleta' })
  create(@Body() dto: CreateStudentDto, @CurrentUser('id') userId: string) {
    return this.studentsService.create(dto, userId);
  }

  @Put(':id')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Atualizar atleta' })
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto, @CurrentUser('id') userId: string) {
    return this.studentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Desativar atleta' })
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.studentsService.deactivate(id, userId);
  }
}
