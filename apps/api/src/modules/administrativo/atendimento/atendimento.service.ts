import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';

@Injectable()
export class AtendimentoService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async findAll(query: any) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    return this.prisma.atendimentoRecepcao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        unidade: { select: { id: true, nome: true } },
        encaminhadoPara: { select: { id: true, email: true } },
        atendidoPor: { select: { id: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const atendimento = await this.prisma.atendimentoRecepcao.findUnique({
      where: { id },
      include: {
        unidade: { select: { id: true, nome: true } },
        encaminhadoPara: { select: { id: true, email: true } },
        atendidoPor: { select: { id: true, email: true } },
      },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    return atendimento;
  }

  async create(dto: CreateAtendimentoDto, actorUserId: string) {
    const atendimento = await this.prisma.atendimentoRecepcao.create({
      data: {
        nome: dto.nome,
        contacto: dto.contacto,
        tipoVisitante: dto.tipoVisitante || 'VISITANTE',
        motivo: dto.motivo,
        unidadeId: dto.unidadeId,
        encaminhadoParaId: dto.encaminhadoParaId,
        prazo: dto.prazo ? new Date(dto.prazo) : undefined,
        atendidoPorId: actorUserId,
      },
    });

    if (dto.encaminhadoParaId) {
      await this.notifications.createForUser(
        dto.encaminhadoParaId,
        'ATENDIMENTO_ENCAMINHADO',
        'Novo atendimento encaminhado',
        `${dto.nome} — ${dto.motivo}`,
      );
    }

    await this.audit.log({ userId: actorUserId, action: 'ATENDIMENTO_RECEPCAO_CRIADO', entity: 'AtendimentoRecepcao', entityId: atendimento.id });
    return atendimento;
  }

  async resolver(id: string, desfecho: string, actorUserId: string) {
    const atendimento = await this.prisma.atendimentoRecepcao.findUnique({ where: { id } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if (atendimento.estado === 'RESOLVIDO') throw new ConflictException('Atendimento já resolvido');

    const updated = await this.prisma.atendimentoRecepcao.update({
      where: { id },
      data: { desfecho, estado: 'RESOLVIDO', resolvidoEm: new Date() },
    });
    await this.audit.log({ userId: actorUserId, action: 'ATENDIMENTO_RECEPCAO_RESOLVIDO', entity: 'AtendimentoRecepcao', entityId: id });
    return updated;
  }
}
