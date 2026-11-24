import { Controller, Get, Post, Param, Body, UseGuards, SetMetadata, Res } from '@nestjs/common';
import { Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { EventosService } from './eventos.service';
import { InscricaoProgramaDto, PreInscricaoEscolaDto, PreInscricaoIndividualDto } from './dto/eventos.dto';

const Public = () => SetMetadata('isPublic', true);

/**
 * Formulário público de pré-inscrição (sem login). O token é aleatório e só
 * expõe a informação do evento — nunca a lista de participantes.
 */
@ApiTags('eventos-publicos')
@Public()
@UseGuards(ThrottlerGuard)
@Controller('eventos-publicos')
export class EventosPublicoController {
  constructor(private readonly svc: EventosService) {}

  /**
   * Imagem / cartaz de um evento. Só serve ficheiros registados em evento_imagens
   * (nunca outros uploads, como documentos dos atletas).
   */
  @Get('imagem/:nome')
  @Throttle({ short: { limit: 30, ttl: 1000 } })
  async imagem(@Param('nome') nome: string, @Res() res: Response) {
    const caminho = await this.svc.caminhoImagemPublica(nome);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(caminho);
  }

  @Get(':token')
  @Throttle({ short: { limit: 10, ttl: 1000 } })
  get(@Param('token') token: string) { return this.svc.getPublico(token); }

  @Post(':token/individual')
  @Throttle({ short: { limit: 2, ttl: 1000 }, medium: { limit: 10, ttl: 60000 } })
  individual(@Param('token') token: string, @Body() dto: PreInscricaoIndividualDto) {
    return this.svc.submeterIndividual(token, dto);
  }

  @Post(':token/escola')
  @Throttle({ short: { limit: 2, ttl: 1000 }, medium: { limit: 5, ttl: 60000 } })
  escola(@Param('token') token: string, @Body() dto: PreInscricaoEscolaDto) {
    return this.svc.submeterEscola(token, dto);
  }

  @Post(':token/programa')
  @Throttle({ short: { limit: 2, ttl: 1000 }, medium: { limit: 10, ttl: 60000 } })
  programa(@Param('token') token: string, @Body() dto: InscricaoProgramaDto) {
    return this.svc.submeterPrograma(token, dto);
  }
}
