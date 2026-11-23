import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, Request, Res, ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { EventosService } from './eventos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppRole, Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  AlterarPacoteParticipanteDto, ComunicacaoEventoDto, EstadoParticipanteDto, PacoteEventoDto, PartilharComLeadsDto,
  RejeitarParticipanteDto, ValidarParticipanteDto, WalkInDto,
} from './dto/eventos.dto';

// Validar/rejeitar inscrições do formulário público: secretaria e administração.
const VALIDACAO: AppRole[] = ['ADMIN', 'ASSISTENTE_ADMIN'];

@ApiTags('eventos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
@Controller('eventos')
export class EventosController {
  constructor(private readonly svc: EventosService) {}

  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }

  @Get(':id/participantes')
  listParticipantes(@Param('id') id: string, @Query() q: any) { return this.svc.listParticipantes(id, q); }

  @Get(':id/participantes/exportar')
  async exportar(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const { csv, nomeFicheiro } = await this.svc.exportarCsv(id, req.user.id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeFicheiro}"`);
    res.send(csv);
  }

  @Post(':id/participantes')
  addParticipante(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.addParticipante(id, body, req.user.id);
  }

  @Post(':id/walk-in')
  addWalkIn(@Param('id') id: string, @Body() dto: WalkInDto, @Request() req: any) {
    return this.svc.addWalkIn(id, dto, req.user.id);
  }

  @Put('participantes/:participanteId/presenca')
  marcarPresenca(@Param('participanteId') participanteId: string, @Body('presente') presente: boolean, @Request() req: any) {
    return this.svc.marcarPresencaParticipante(participanteId, presente, req.user.id);
  }

  @Patch('participantes/:participanteId/estado')
  alterarEstado(@Param('participanteId') participanteId: string, @Body() dto: EstadoParticipanteDto, @Request() req: any) {
    return this.svc.alterarEstado(participanteId, dto.estado, req.user.id);
  }

  @Post('participantes/:participanteId/pedido-inscricao')
  converter(@Param('participanteId') participanteId: string, @Request() req: any) {
    return this.svc.converterEmPedido(participanteId, req.user.id);
  }

  @Delete('participantes/:participanteId')
  removeParticipante(@Param('participanteId') participanteId: string, @Request() req: any) {
    return this.svc.removeParticipante(participanteId, req.user.id);
  }

  // ─── Programa (férias): pacotes e validação ────────────────────────────────

  @Get(':id/pacotes')
  listarPacotes(@Param('id', ParseUUIDPipe) id: string) { return this.svc.listarPacotes(id); }

  @Post(':id/pacotes')
  @Roles('ADMIN')
  criarPacote(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PacoteEventoDto, @Request() req: any) {
    return this.svc.criarPacote(id, dto, req.user.id);
  }

  @Put('pacotes/:pacoteId')
  @Roles('ADMIN')
  actualizarPacote(@Param('pacoteId', ParseUUIDPipe) pacoteId: string, @Body() dto: PacoteEventoDto, @Request() req: any) {
    return this.svc.actualizarPacote(pacoteId, dto, req.user.id);
  }

  @Delete('pacotes/:pacoteId')
  @Roles('ADMIN')
  removerPacote(@Param('pacoteId', ParseUUIDPipe) pacoteId: string, @Request() req: any) {
    return this.svc.removerPacote(pacoteId, req.user.id);
  }

  @Put('participantes/:participanteId/validar')
  @Roles(...VALIDACAO)
  validar(@Param('participanteId', ParseUUIDPipe) participanteId: string, @Body() dto: ValidarParticipanteDto, @Request() req: any) {
    return this.svc.validarParticipante(participanteId, dto, req.user.id);
  }

  @Put('participantes/:participanteId/rejeitar')
  @Roles(...VALIDACAO)
  rejeitar(@Param('participanteId', ParseUUIDPipe) participanteId: string, @Body() dto: RejeitarParticipanteDto, @Request() req: any) {
    return this.svc.rejeitarParticipante(participanteId, dto, req.user.id);
  }

  @Put('participantes/:participanteId/pacote')
  @Roles(...VALIDACAO)
  alterarPacote(@Param('participanteId', ParseUUIDPipe) participanteId: string, @Body() dto: AlterarPacoteParticipanteDto, @Request() req: any) {
    return this.svc.alterarPacoteParticipante(participanteId, dto, req.user.id);
  }

  @Get(':id/comunicacoes')
  listarComunicacoes(@Param('id') id: string) { return this.svc.listarComunicacoes(id); }

  @Post(':id/comunicacoes')
  comunicar(@Param('id') id: string, @Body() dto: ComunicacaoEventoDto, @Request() req: any) {
    return this.svc.comunicar(id, dto, req.user.id);
  }

  @Post(':id/partilhar-leads')
  partilharComLeads(@Param('id') id: string, @Body() dto: PartilharComLeadsDto, @Request() req: any) {
    return this.svc.partilharComLeads(id, dto, req.user.id);
  }

  @Post(':id/regenerar-link')
  regenerarLink(@Param('id') id: string, @Request() req: any) { return this.svc.regenerarLink(id, req.user.id); }

  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.id); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.svc.update(id, body, req.user.id); }
}
