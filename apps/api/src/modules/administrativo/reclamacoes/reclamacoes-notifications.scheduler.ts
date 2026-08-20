import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';

@Injectable()
export class ReclamacoesNotificationsScheduler {
  private readonly logger = new Logger(ReclamacoesNotificationsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
    private gateway: NotificationsGateway,
  ) {}

  private async notifyRoleOnce(role: string, type: string, title: string, body: string, dedupeHours = 24) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        type,
        title,
        createdAt: { gte: new Date(Date.now() - dedupeHours * 3600000) },
      },
    });
    if (existing) return;
    await this.notifService.createForRole(role, type, title, body);
    this.gateway.broadcastToRole(role, 'notification', { type, title, body });
  }

  // Runs every day at 08:00 — reclamações com prazo de resposta vencido
  @Cron('0 8 * * *')
  async checkReclamacoesComPrazoVencido() {
    this.logger.log('A verificar reclamações com prazo de resposta vencido...');
    const vencidas = await this.prisma.reclamacao.count({
      where: {
        prazoResposta: { lt: new Date() },
        estado: { notIn: ['RESPONDIDA', 'FECHADA'] },
      },
    });
    if (vencidas === 0) return;

    const title = `⚠️ ${vencidas} reclamação(ões) com prazo de resposta vencido`;
    const body = 'Consulta o painel Administrativo para responder às reclamações com prazo expirado.';

    await this.notifyRoleOnce('ADMIN', 'RECLAMACAO_PRAZO_VENCIDO', title, body);
    await this.notifyRoleOnce('ASSISTENTE_ADMIN', 'RECLAMACAO_PRAZO_VENCIDO', title, body);
  }
}
