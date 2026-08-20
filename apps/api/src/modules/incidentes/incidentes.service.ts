import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

const GRAVIDADES_CRITICAS = ['ALTA', 'CRITICA'];

@Injectable()
export class IncidentesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifService: NotificationsService,
    private gateway: NotificationsGateway,
  ) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    if (query.tipo) where.tipo = query.tipo;
    if (query.tipoOcorrencia) where.tipoOcorrencia = query.tipoOcorrencia;
    if (query.protocoloId) where.protocoloId = query.protocoloId;
    return this.prisma.incidente.findMany({
      where,
      orderBy: { data: 'desc' },
      include: {
        unidade: { select: { nome: true, codigo: true } },
        reportadoPor: { select: { email: true } },
        protocolo: { select: { nome: true, ranking: true, dimensao: true } },
      },
    });
  }

  async findOne(id: string) {
    const i = await this.prisma.incidente.findUnique({
      where: { id },
      include: {
        unidade: true,
        reportadoPor: { select: { email: true, role: true } },
        protocolo: true,
      },
    });
    if (!i) throw new NotFoundException('Incidente não encontrado');
    return i;
  }

  async create(data: any, userId: string) {
    const { protocoloId, dimensoes, testemunhas, ...rest } = data;
    const incidente = await this.prisma.incidente.create({
      data: {
        ...rest,
        reportadoPorId: userId,
        dimensoes: Array.isArray(dimensoes) ? JSON.stringify(dimensoes) : (dimensoes || '[]'),
        ...(testemunhas !== undefined
          ? { testemunhas: Array.isArray(testemunhas) ? JSON.stringify(testemunhas) : testemunhas }
          : {}),
        ...(protocoloId ? { protocoloId } : {}),
      },
    });
    await this.audit.log({
      userId, action: 'INCIDENTE_CRIADO', entity: 'Incidente', entityId: incidente.id,
      newValues: { tipo: incidente.tipo, gravidade: incidente.gravidade },
    });
    await this.alertarSeGravidadeCritica(incidente);
    return incidente;
  }

  async createRelampago(userId: string, unidadeId?: string) {
    const incidente = await this.prisma.incidente.create({
      data: {
        tipo: 'ACIDENTE_GRAVE',
        tipoOcorrencia: 'INCIDENTE_CONFIRMADO',
        isRelampago: true,
        descricao: 'RELÂMPAGO ZERO — Evacuação imediata acionada pelo instrutor',
        acaoImediata: 'Atletas evacuados da piscina imediatamente. Aguardar 30 min após último trovão.',
        dimensoes: JSON.stringify(['FISICA']),
        envolvidos: '[]',
        gravidade: 'CRITICA',
        estado: 'REPORTADO',
        reportadoPorId: userId,
        ...(unidadeId && { unidadeId }),
      },
    });
    await this.audit.log({
      userId, action: 'INCIDENTE_RELAMPAGO_CRIADO', entity: 'Incidente', entityId: incidente.id,
    });
    await this.alertarSeGravidadeCritica(incidente);
    return incidente;
  }

  async update(id: string, data: any, actorUserId?: string) {
    const existing = await this.findOne(id);
    if (data.estado === 'RESOLVIDO' && !data.resolvidoEm) data.resolvidoEm = new Date();
    if (data.dimensoes && Array.isArray(data.dimensoes)) data.dimensoes = JSON.stringify(data.dimensoes);
    if (data.testemunhas !== undefined && Array.isArray(data.testemunhas)) data.testemunhas = JSON.stringify(data.testemunhas);
    const updated = await this.prisma.incidente.update({ where: { id }, data });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'INCIDENTE_ATUALIZADO', entity: 'Incidente', entityId: id,
        oldValues: { estado: existing.estado, gravidade: existing.gravidade },
        newValues: { estado: updated.estado, gravidade: updated.gravidade },
      });
    }
    return updated;
  }

  private async alertarSeGravidadeCritica(incidente: { id: string; gravidade: string; tipo: string; descricao: string }) {
    if (!GRAVIDADES_CRITICAS.includes(incidente.gravidade)) return;
    const title = `🚨 Incidente ${incidente.gravidade} registado`;
    const body = incidente.descricao.slice(0, 200);
    await this.notifService.createForRole('ADMIN', 'INCIDENTE_GRAVE', title, body);
    this.gateway.broadcastToRole('ADMIN', 'notification', { type: 'INCIDENTE_GRAVE', title, body });
  }

  async stats() {
    const [total, abertos, graves, quaseIncidentes, confirmados] = await Promise.all([
      this.prisma.incidente.count(),
      this.prisma.incidente.count({ where: { estado: { in: ['REPORTADO', 'EM_INVESTIGACAO'] } } }),
      this.prisma.incidente.count({ where: { tipo: 'ACIDENTE_GRAVE' } }),
      this.prisma.incidente.count({ where: { tipoOcorrencia: 'QUASE_INCIDENTE' } }),
      this.prisma.incidente.count({ where: { tipoOcorrencia: 'INCIDENTE_CONFIRMADO' } }),
    ]);
    return { total, abertos, graves, quaseIncidentes, confirmados, zerado: graves === 0 };
  }
}
