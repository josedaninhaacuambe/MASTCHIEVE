import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CompeticoesService } from './competicoes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('competicoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('competicoes')
export class CompeticoesController {
  constructor(private readonly svc: CompeticoesService) {}

  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Post(':id/atletas/:studentId') addAtleta(@Param('id') id: string, @Param('studentId') sid: string, @Body() body: any) { return this.svc.addAtleta(id, sid, body); }
  @Delete(':id/atletas/:studentId') removeAtleta(@Param('id') id: string, @Param('studentId') sid: string) { return this.svc.removeAtleta(id, sid); }
}
