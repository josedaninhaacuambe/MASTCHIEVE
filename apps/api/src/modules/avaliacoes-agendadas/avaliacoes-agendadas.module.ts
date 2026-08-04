import { Module } from '@nestjs/common';
import { AvaliacoesAgendadasController } from './avaliacoes-agendadas.controller';
import { AvaliacoesAgendadasService } from './avaliacoes-agendadas.service';
import { AvaliacoesModule } from '../avaliacoes/avaliacoes.module';

@Module({
  imports: [AvaliacoesModule],
  controllers: [AvaliacoesAgendadasController],
  providers: [AvaliacoesAgendadasService],
})
export class AvaliacoesAgendadasModule {}
