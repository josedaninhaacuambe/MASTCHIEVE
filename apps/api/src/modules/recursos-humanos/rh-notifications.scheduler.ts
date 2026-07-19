import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class RhNotificationsScheduler {
  private readonly logger = new Logger(RhNotificationsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
    private gateway: NotificationsGateway,
  ) {}

  private async notifyRoleOnce(role: string, type: string, title: string, body: string, dedupeHours = 24) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        type: type as any,
        title,
        createdAt: { gte: new Date(Date.now() - dedupeHours * 3600000) },
      },
    });
    if (existing) return;
    await this.notifService.createForRole(role, type, title, body);
    this.gateway.broadcastToRole(role, 'notification', { type, title, body });
  }

  // Runs every day at 07:00 — certificações a expirar
  @Cron('0 7 * * *')
  async checkCertificacoesAExpirar() {
    this.logger.log('A verificar certificações a expirar...');
    const alvos = [30, 15, 7];
    for (const dias of alvos) {
      const limite = new Date();
      limite.setDate(limite.getDate() + dias);
      limite.setHours(23, 59, 59, 999);
      const inicio = new Date();
      inicio.setDate(inicio.getDate() + dias);
      inicio.setHours(0, 0, 0, 0);

      const certs = await this.prisma.certificacaoFuncionario.findMany({
        where: { estado: 'ATIVA', dataValidade: { gte: inicio, lte: limite } },
        include: { funcionario: { include: { user: true } } },
      });

      for (const cert of certs) {
        const userId = cert.funcionario?.userId;
        if (!userId) continue;
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId,
            type: 'CERTIFICACAO_A_EXPIRAR' as any,
            title: { contains: cert.tipo },
            createdAt: { gte: new Date(Date.now() - 20 * 3600000) },
          },
        });
        if (existing) continue;

        const notif = await this.notifService.createForUser(
          userId,
          'CERTIFICACAO_A_EXPIRAR',
          `⚠️ Certificação ${cert.tipo} a expirar em ${dias} dia(s)`,
          `A tua certificação ${cert.tipo} expira em ${new Date(cert.dataValidade!).toLocaleDateString('pt-PT')}. Regulariza a situação para evitares bloqueios em turmas/escalas.`,
        );
        this.gateway.sendToUser(userId, 'notification', notif);
      }

      if (certs.length > 0) {
        await this.notifyRoleOnce(
          'GESTOR_RH',
          'CERTIFICACAO_A_EXPIRAR',
          `⚠️ ${certs.length} certificação(ões) a expirar em ${dias} dia(s)`,
          'Consulta o painel de RH para regularizar as certificações a expirar.',
        );
      }
    }
  }

  // Runs every day at 07:15 — contratos a caducar
  @Cron('15 7 * * *')
  async checkContratosACaducar() {
    this.logger.log('A verificar contratos a caducar...');
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);

    const contratos = await this.prisma.contrato.count({
      where: { estado: 'ATIVO', dataFim: { not: null, lte: limite, gte: new Date() } },
    });
    if (contratos === 0) return;

    await this.notifyRoleOnce(
      'GESTOR_RH',
      'CONTRATO_A_CADUCAR',
      `📄 ${contratos} contrato(s) a caducar nos próximos 30 dias`,
      'Consulta o painel de RH para renovar ou encerrar os contratos a caducar.',
    );
  }

  // Runs every day at 07:30 — aprovações pendentes para o Super Admin
  @Cron('30 7 * * *')
  async checkAprovacoesPendentes() {
    this.logger.log('A verificar aprovações pendentes de RH...');
    const [vagas, contratos, folhas, ferias, disciplina, desligamentos] = await Promise.all([
      this.prisma.vaga.count({ where: { estado: 'EM_APROVACAO' } }),
      this.prisma.contrato.count({ where: { estado: 'AGUARDA_ASSINATURA' } }),
      this.prisma.folhaPagamento.count({ where: { estado: 'PENDENTE_APROVACAO' } }),
      this.prisma.feriasFalta.count({ where: { estado: 'ENCAMINHADA_SUPER_ADMIN' } }),
      this.prisma.ocorrenciaDisciplinar.count({ where: { estado: 'ESCALADA_SUPER_ADMIN' } }),
      this.prisma.desligamento.count({ where: { estado: 'AGUARDA_APROVACAO' } }),
    ]);

    const total = vagas + contratos + folhas + ferias + disciplina + desligamentos;
    if (total === 0) return;

    await this.notifyRoleOnce(
      'SUPER_ADMIN',
      'RH_APROVACAO_PENDENTE',
      `🔔 ${total} aprovação(ões) de RH pendente(s)`,
      `Vagas: ${vagas} · Contratos: ${contratos} · Folha: ${folhas} · Férias/Faltas: ${ferias} · Disciplina: ${disciplina} · Desligamentos: ${desligamentos}.`,
    );
  }

  // Runs every day at 07:45 — avaliações de desempenho por realizar
  @Cron('45 7 * * *')
  async checkAvaliacoesPorRealizar() {
    this.logger.log('A verificar avaliações de desempenho por realizar...');
    const pendentes = await this.prisma.avaliacaoDesempenho.count({
      where: { estado: 'PENDENTE', dataLimite: { not: null, lte: new Date() } },
    });
    if (pendentes === 0) return;

    await this.notifyRoleOnce(
      'GESTOR_RH',
      'AVALIACAO_DESEMPENHO_PENDENTE',
      `📋 ${pendentes} avaliação(ões) de desempenho por realizar`,
      'Consulta o painel de RH para agendar/realizar as avaliações de desempenho pendentes.',
    );
  }
}
