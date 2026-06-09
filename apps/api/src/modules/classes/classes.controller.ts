import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateClassDto, CreateSessionDto } from './dto/create-class.dto';

@ApiTags('classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private service: ClassesService) {}

  @Get() @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Listar turmas' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get(':id') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Detalhes da turma' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post() @Roles('ADMIN') @ApiOperation({ summary: 'Criar turma' })
  create(@Body() dto: CreateClassDto) { return this.service.create(dto); }

  @Put(':id') @Roles('ADMIN') @ApiOperation({ summary: 'Atualizar turma' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateClassDto>) { return this.service.update(id, dto); }

  @Post(':id/enroll') @Roles('ADMIN') @ApiOperation({ summary: 'Inscrever atleta na turma' })
  enroll(@Param('id') id: string, @Body('studentId') studentId: string) {
    return this.service.enroll(id, studentId);
  }

  @Delete(':id/enroll/:studentId') @Roles('ADMIN') @ApiOperation({ summary: 'Remover atleta da turma' })
  unenroll(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.service.unenroll(id, studentId);
  }

  @Post(':id/sessions') @Roles('ADMIN', 'INSTRUCTOR') @ApiOperation({ summary: 'Criar sessão de aula' })
  createSession(@Param('id') id: string, @Body() dto: CreateSessionDto) {
    return this.service.createSession(id, dto);
  }
}
