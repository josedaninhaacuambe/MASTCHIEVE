import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { FasesService } from './fases.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('fases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fases')
export class FasesController {
  constructor(private readonly svc: FasesService) {}

  @Get() findAll() { return this.svc.findAll(); }
  @Get('seed') seed() { return this.svc.seed(); }
  @Get('nivel/:nivel') getAlunosPorNivel(@Param('nivel') nivel: string) { return this.svc.getAlunosPorNivel(nivel); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Get('estudante/:studentId/progresso') progressoAtleta(@Param('studentId') sid: string) { return this.svc.progressoAtleta(sid); }
  @Put('estudante/:studentId/fase/:faseId') updateProgresso(@Param('studentId') sid: string, @Param('faseId') fid: string, @Body() body: any) { return this.svc.updateProgresso(sid, fid, body); }
}
