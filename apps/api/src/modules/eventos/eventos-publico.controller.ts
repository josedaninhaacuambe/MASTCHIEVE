import { Controller, Get, Post, Param, Body, UseGuards, SetMetadata } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { EventosService } from './eventos.service';
import { PreInscricaoEscolaDto, PreInscricaoIndividualDto } from './dto/eventos.dto';

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
}
