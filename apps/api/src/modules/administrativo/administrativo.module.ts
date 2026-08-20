import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AtendimentoController } from './atendimento/atendimento.controller';
import { AtendimentoService } from './atendimento/atendimento.service';
import { InventarioController } from './inventario/inventario.controller';
import { InventarioService } from './inventario/inventario.service';
import { EntradaSaidaController } from './entrada-saida/entrada-saida.controller';
import { EntradaSaidaService } from './entrada-saida/entrada-saida.service';
import { ReclamacoesController } from './reclamacoes/reclamacoes.controller';
import { ReclamacoesService } from './reclamacoes/reclamacoes.service';
import { ReclamacoesNotificationsScheduler } from './reclamacoes/reclamacoes-notifications.scheduler';
import { RelatoriosMensaisController } from './relatorios-mensais/relatorios-mensais.controller';
import { RelatoriosMensaisService } from './relatorios-mensais/relatorios-mensais.service';
import { RotinaDiariaController } from './rotina-diaria/rotina-diaria.controller';
import { RotinaDiariaService } from './rotina-diaria/rotina-diaria.service';

@Module({
  imports: [NotificationsModule],
  controllers: [
    AtendimentoController,
    InventarioController,
    EntradaSaidaController,
    ReclamacoesController,
    RelatoriosMensaisController,
    RotinaDiariaController,
  ],
  providers: [
    AtendimentoService,
    InventarioService,
    EntradaSaidaService,
    ReclamacoesService,
    ReclamacoesNotificationsScheduler,
    RelatoriosMensaisService,
    RotinaDiariaService,
  ],
  exports: [InventarioService, RelatoriosMensaisService],
})
export class AdministrativoModule {}
