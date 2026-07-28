import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { FasesService } from './fases.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateStudentFaseDto } from './dto/update-student-fase.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('fases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fases')
export class FasesController {
  constructor(private readonly svc: FasesService) {}

  @Get() findAll() { return this.svc.findAll(); }

  @Get('seed')
  @Roles('ADMIN', 'INSTRUCTOR')
  seed() { return this.svc.seed(); }

  @Get('nivel/:nivel') getAlunosPorNivel(@Param('nivel') nivel: string) { return this.svc.getAlunosPorNivel(nivel); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Get('estudante/:studentId/progresso') progressoAtleta(@Param('studentId') sid: string) { return this.svc.progressoAtleta(sid); }

  @Put('estudante/:studentId/fase/:faseId')
  @Roles('ADMIN', 'INSTRUCTOR')
  updateProgresso(@Param('studentId') sid: string, @Param('faseId') fid: string, @Body() dto: UpdateStudentFaseDto) {
    return this.svc.updateProgresso(sid, fid, dto);
  }
}
