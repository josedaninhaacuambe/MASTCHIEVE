import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { StudentsService } from './students.service';
import { StudentsReportService } from './students-report.service';
import { StudentsQrService } from './students-qr.service';
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
    private studentsQrService: StudentsQrService,
  ) {}

  @Get('me')
  @Roles('STUDENT', 'PARENT')
  @ApiOperation({ summary: 'Perfil do atleta autenticado' })
  getMe(@CurrentUser('id') userId: string) {
    return this.studentsService.findByUserId(userId);
  }

  @Post('me/children')
  @Roles('STUDENT', 'PARENT')
  @ApiOperation({ summary: 'Inscrever um filho/educando menor de idade a partir da própria conta' })
  addChild(@Body() dto: CreateStudentDto, @CurrentUser('id') userId: string) {
    return this.studentsService.addChild(userId, dto);
  }

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar atletas' })
  findAll(@Query() query: StudentQueryDto, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.studentsService.findAll(query, userId, role);
  }

  @Get('check-duplicate')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Verificar possível duplicado por nome + data de nascimento (aviso não-bloqueante)' })
  checkDuplicate(@Query('firstName') firstName: string, @Query('lastName') lastName: string, @Query('dateOfBirth') dateOfBirth: string) {
    return this.studentsService.checkDuplicate(firstName, lastName, dateOfBirth);
  }

  @Get('export')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Exportar atletas (ou modelo de importação) em Excel' })
  async export(@Query('template') template: string, @Res() res: Response) {
    const isTemplate = template === 'true';
    const buffer = await this.studentsService.exportToFile(isTemplate);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${isTemplate ? 'modelo-atletas' : 'atletas'}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('import')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar atletas em massa a partir de um ficheiro Excel/CSV' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  importFile(@UploadedFile() file: Express.Multer.File, @CurrentUser('id') userId: string) {
    return this.studentsService.importFromFile(file.buffer, userId);
  }

  @Get(':id')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter atleta por ID' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/checklist')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Checklist de documentos obrigatórios de inscrição' })
  getChecklist(@Param('id') id: string) {
    return this.studentsService.getChecklist(id);
  }

  @Post(':id/qr-code')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Gerar/regenerar QR Code de acesso do atleta (invalida o anterior)' })
  generateQrCode(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.studentsQrService.generate(id, userId);
  }

  @Get(':id/qr-code')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter o QR Code de acesso actualmente activo' })
  getQrCode(@Param('id') id: string) {
    return this.studentsQrService.getCurrent(id);
  }

  @Delete(':id/qr-code')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Revogar o QR Code de acesso sem gerar um novo' })
  revokeQrCode(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.studentsQrService.revoke(id, userId);
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
  @Roles('ADMIN', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Criar atleta' })
  create(@Body() dto: CreateStudentDto, @CurrentUser('id') userId: string) {
    return this.studentsService.create(dto, userId);
  }

  @Put(':id')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN', 'SUPER_ADMIN')
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
