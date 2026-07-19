import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { RhNotificationsScheduler } from './rh-notifications.scheduler';
import { FuncionariosController } from './funcionarios/funcionarios.controller';
import { FuncionariosService } from './funcionarios/funcionarios.service';
import { DocumentosRhController } from './documentos-rh/documentos-rh.controller';
import { DocumentosRhService } from './documentos-rh/documentos-rh.service';
import { VagasController } from './recrutamento/vagas.controller';
import { VagasService } from './recrutamento/vagas.service';
import { CandidaturasController } from './recrutamento/candidaturas.controller';
import { CandidaturasService } from './recrutamento/candidaturas.service';
import { ContratosController } from './contratos/contratos.controller';
import { ContratosService } from './contratos/contratos.service';
import { CertificacoesController } from './certificacoes/certificacoes.controller';
import { CertificacoesService } from './certificacoes/certificacoes.service';
import { EscalasController } from './escalas/escalas.controller';
import { EscalasService } from './escalas/escalas.service';
import { AvaliacoesDesempenhoController } from './avaliacoes-desempenho/avaliacoes-desempenho.controller';
import { AvaliacoesDesempenhoService } from './avaliacoes-desempenho/avaliacoes-desempenho.service';
import { FeriasFaltasController } from './ferias-faltas/ferias-faltas.controller';
import { FeriasFaltasService } from './ferias-faltas/ferias-faltas.service';
import { FolhaPagamentoController } from './folha-pagamento/folha-pagamento.controller';
import { FolhaPagamentoService } from './folha-pagamento/folha-pagamento.service';
import { DisciplinaController } from './disciplina/disciplina.controller';
import { DisciplinaService } from './disciplina/disciplina.service';
import { DesligamentoController } from './desligamento/desligamento.controller';
import { DesligamentoService } from './desligamento/desligamento.service';
import { FormacaoController } from './formacao/formacao.controller';
import { FormacaoService } from './formacao/formacao.service';
import { RelatoriosRhController } from './relatorios/relatorios-rh.controller';
import { RelatoriosRhService } from './relatorios/relatorios-rh.service';

@Module({
  imports: [NotificationsModule],
  controllers: [
    FuncionariosController,
    DocumentosRhController,
    VagasController,
    CandidaturasController,
    ContratosController,
    CertificacoesController,
    EscalasController,
    AvaliacoesDesempenhoController,
    FeriasFaltasController,
    FolhaPagamentoController,
    DisciplinaController,
    DesligamentoController,
    FormacaoController,
    RelatoriosRhController,
  ],
  providers: [
    FuncionariosService,
    DocumentosRhService,
    VagasService,
    CandidaturasService,
    ContratosService,
    CertificacoesService,
    EscalasService,
    AvaliacoesDesempenhoService,
    FeriasFaltasService,
    FolhaPagamentoService,
    DisciplinaService,
    DesligamentoService,
    FormacaoService,
    RelatoriosRhService,
    RhNotificationsScheduler,
  ],
  exports: [FuncionariosService, CertificacoesService],
})
export class RecursosHumanosModule {}
