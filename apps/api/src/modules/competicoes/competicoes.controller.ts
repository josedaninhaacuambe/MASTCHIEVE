import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { CompeticoesService } from './competicoes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('competicoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
@Controller('competicoes')
export class CompeticoesController {
  constructor(private readonly svc: CompeticoesService) {}

  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.id); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.svc.update(id, body, req.user.id); }

  @Post(':id/atletas/:studentId')
  addAtleta(@Param('id') id: string, @Param('studentId') sid: string, @Body() body: any, @Request() req: any) {
    return this.svc.addAtleta(id, sid, body, req.user.id);
  }

  @Delete(':id/atletas/:studentId')
  removeAtleta(@Param('id') id: string, @Param('studentId') sid: string, @Request() req: any) {
    return this.svc.removeAtleta(id, sid, req.user.id);
  }
}
