import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';

const RH_ENTITIES = [
  'Funcionario',
  'Vaga',
  'Candidatura',
  'Contrato',
  'Escala',
  'CertificacaoFuncionario',
  'AvaliacaoDesempenho',
  'FeriasFalta',
  'FolhaPagamento',
  'OcorrenciaDisciplinar',
  'Formacao',
  'FuncionarioFormacao',
  'DocumentoRH',
  'Desligamento',
];

@Injectable()
export class RelatoriosRhService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [
      totalFuncionarios,
      porEstado,
      porCargo,
      vagasEmAprovacao,
      candidaturasEmAndamento,
      contratosAguardandoAssinatura,
      folhasPendentes,
      feriasEncaminhadas,
      ocorrenciasEscaladas,
      desligamentosPendentes,
      formacoesPropostas,
      certificacoesAExpirar,
    ] = await Promise.all([
      this.prisma.funcionario.count(),
      this.prisma.funcionario.groupBy({ by: ['estado'], _count: true }),
      this.prisma.funcionario.groupBy({ by: ['cargo'], _count: true }),
      this.prisma.vaga.count({ where: { estado: 'EM_APROVACAO' } }),
      this.prisma.candidatura.count({ where: { estado: { notIn: ['REJEITADA', 'CONTRATADA'] } } }),
      this.prisma.contrato.count({ where: { estado: 'AGUARDA_ASSINATURA' } }),
      this.prisma.folhaPagamento.count({ where: { estado: 'PENDENTE_APROVACAO' } }),
      this.prisma.feriasFalta.count({ where: { estado: 'ENCAMINHADA_SUPER_ADMIN' } }),
      this.prisma.ocorrenciaDisciplinar.count({ where: { estado: 'ESCALADA_SUPER_ADMIN' } }),
      this.prisma.desligamento.count({ where: { estado: 'AGUARDA_APROVACAO' } }),
      this.prisma.formacao.count({ where: { estado: 'PROPOSTA' } }),
      this.prisma.certificacaoFuncionario.count({
        where: { estado: 'ATIVA', dataValidade: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      totalFuncionarios,
      porEstado: porEstado.map((e) => ({ estado: e.estado, total: e._count })),
      porCargo: porCargo.map((c) => ({ cargo: c.cargo, total: c._count })),
      aprovacoesPendentesSuperAdmin: {
        vagas: vagasEmAprovacao,
        contratos: contratosAguardandoAssinatura,
        folhaPagamento: folhasPendentes,
        feriasFaltas: feriasEncaminhadas,
        ocorrenciasDisciplinares: ocorrenciasEscaladas,
        desligamentos: desligamentosPendentes,
        formacoes: formacoesPropostas,
      },
      candidaturasEmAndamento,
      certificacoesAExpirar,
    };
  }

  auditoria(query: any) {
    const page = Math.max(1, parseInt(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query?.limit) || 50));
    return this.prisma.auditLog.findMany({
      where: { entity: { in: RH_ENTITIES } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
