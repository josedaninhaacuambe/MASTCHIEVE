import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AvaliacoesIniciaisService } from './avaliacoes-iniciais.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('avaliacoes-iniciais')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('avaliacoes-iniciais')
export class AvaliacoesIniciaisController {
  constructor(private readonly svc: AvaliacoesIniciaisService) {}

  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get('estudante/:studentId') findByStudent(@Param('studentId') id: string) { return this.svc.findByStudent(id); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.userId); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Put(':id/aprovar') aprovar(@Param('id') id: string, @Request() req: any) { return this.svc.aprovar(id, req.user.userId); }
}
