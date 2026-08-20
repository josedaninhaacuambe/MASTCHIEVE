import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('eventos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
@Controller('eventos')
export class EventosController {
  constructor(private readonly svc: EventosService) {}

  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }

  @Get(':id/participantes')
  listParticipantes(@Param('id') id: string) { return this.svc.listParticipantes(id); }

  @Post(':id/participantes')
  addParticipante(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.addParticipante(id, body, req.user.id);
  }

  @Put('participantes/:participanteId/presenca')
  marcarPresenca(@Param('participanteId') participanteId: string, @Body('presente') presente: boolean, @Request() req: any) {
    return this.svc.marcarPresencaParticipante(participanteId, presente, req.user.id);
  }

  @Delete('participantes/:participanteId')
  removeParticipante(@Param('participanteId') participanteId: string, @Request() req: any) {
    return this.svc.removeParticipante(participanteId, req.user.id);
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.id); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.svc.update(id, body, req.user.id); }
}
