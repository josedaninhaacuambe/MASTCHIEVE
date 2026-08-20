import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateClassDto, CreateSessionDto, TransferStudentDto } from './dto/create-class.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private service: ClassesService) {}

  @Get() @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN') @ApiOperation({ summary: 'Listar turmas' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('my') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Listar as minhas turmas (instrutor autenticado)' })
  findMyClasses(@CurrentUser('id') userId: string) { return this.service.findMyClasses(userId); }

  @Get(':id') @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN') @ApiOperation({ summary: 'Detalhes da turma' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @Roles('ADMIN', 'ASSISTENTE_ADMIN') @ApiOperation({ summary: 'Criar turma' })
  create(@Body() dto: CreateClassDto, @CurrentUser('id') userId: string) { return this.service.create(dto, userId); }

  @Put(':id') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Atualizar turma' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateClassDto>,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.update(id, dto, userId, role);
  }

  @Post('transfer') @Roles('ADMIN', 'ASSISTENTE_ADMIN') @ApiOperation({ summary: 'Transferir atleta entre turmas' })
  transferStudent(@Body() dto: TransferStudentDto, @CurrentUser('id') userId: string) {
    return this.service.transferStudent(dto, userId);
  }

  @Post(':id/enroll') @Roles('ADMIN', 'ASSISTENTE_ADMIN') @ApiOperation({ summary: 'Inscrever atleta na turma' })
  enroll(@Param('id') id: string, @Body('studentId') studentId: string, @CurrentUser('id') userId: string) {
    return this.service.enroll(id, studentId, userId);
  }

  @Delete(':id/enroll/:studentId') @Roles('ADMIN', 'ASSISTENTE_ADMIN') @ApiOperation({ summary: 'Remover atleta da turma' })
  unenroll(@Param('id') id: string, @Param('studentId') studentId: string, @CurrentUser('id') userId: string) {
    return this.service.unenroll(id, studentId, userId);
  }

  @Get(':id/roster/export') @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN') @ApiOperation({ summary: 'Exportar lista da turma em PDF' })
  async exportRoster(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.exportRosterPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="lista-turma-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id/sessions') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Listar sessões da turma' })
  getSessions(@Param('id') id: string) { return this.service.getSessions(id); }

  @Post(':id/sessions') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Criar sessão de aula' })
  createSession(@Param('id') id: string, @Body() dto: CreateSessionDto) {
    return this.service.createSession(id, dto);
  }
}
