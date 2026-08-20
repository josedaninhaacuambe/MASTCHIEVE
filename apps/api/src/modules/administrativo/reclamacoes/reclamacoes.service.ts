import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { CreateReclamacaoDto } from './dto/create-reclamacao.dto';

@Injectable()
export class ReclamacoesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifService: NotificationsService,
    private gateway: NotificationsGateway,
  ) {}

  private async getParentByUserId(userId: string) {
    const parent = await this.prisma.parent.findUnique({ where: { userId } });
    if (!parent) throw new ForbiddenException('Encarregado não encontrado');
    return parent;
  }

  async findAll(query: any, actorUserId?: string, actorRole?: string) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;
    if (query.tipo) where.tipo = query.tipo;
    if (query.unidadeId) where.unidadeId = query.unidadeId;

    if (actorRole === 'PARENT') {
      const parent = await this.getParentByUserId(actorUserId!);
      const filhos = await this.prisma.studentParent.findMany({ where: { parentId: parent.id }, select: { studentId: true } });
      where.OR = [{ parentId: parent.id }, { studentId: { in: filhos.map((f) => f.studentId) } }];
    }

    return this.prisma.reclamacao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
        unidade: { select: { id: true, nome: true } },
        registadoPor: { select: { id: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const reclamacao = await this.prisma.reclamacao.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
        unidade: { select: { id: true, nome: true } },
        registadoPor: { select: { id: true, email: true } },
      },
    });
    if (!reclamacao) throw new NotFoundException('Reclamação não encontrada');
    return reclamacao;
  }

  async create(dto: CreateReclamacaoDto, actorUserId: string, actorRole?: string) {
    let parentId = dto.parentId;

    if (actorRole === 'PARENT') {
      const parent = await this.getParentByUserId(actorUserId);
      if (dto.studentId) {
        const vinculo = await this.prisma.studentParent.findUnique({
          where: { studentId_parentId: { studentId: dto.studentId, parentId: parent.id } },
        });
        if (!vinculo) throw new ForbiddenException('Este aluno não está associado à sua conta');
      }
      parentId = parent.id;
    }

    const reclamacao = await this.prisma.reclamacao.create({
      data: {
        tipo: dto.tipo,
        categoria: dto.categoria || 'OUTRO',
        studentId: dto.studentId,
        parentId,
        nome: dto.nome,
        contacto: dto.contacto,
        unidadeId: dto.unidadeId,
        descricao: dto.descricao,
        prazoResposta: dto.prazoResposta ? new Date(dto.prazoResposta) : undefined,
        registadoPorId: actorUserId,
      },
    });
    await this.audit.log({ userId: actorUserId, action: 'RECLAMACAO_CRIADA', entity: 'Reclamacao', entityId: reclamacao.id, newValues: { tipo: dto.tipo } });
    return reclamacao;
  }

  async responder(id: string, resposta: string, actorUserId: string) {
    const reclamacao = await this.prisma.reclamacao.findUnique({ where: { id } });
    if (!reclamacao) throw new NotFoundException('Reclamação não encontrada');
    if (reclamacao.estado === 'FECHADA') throw new ConflictException('Reclamação já fechada');

    const updated = await this.prisma.reclamacao.update({
      where: { id },
      data: { resposta, estado: 'RESPONDIDA', resolvidoEm: new Date() },
    });
    await this.audit.log({ userId: actorUserId, action: 'RECLAMACAO_RESPONDIDA', entity: 'Reclamacao', entityId: id });

    if (reclamacao.parentId) {
      const parent = await this.prisma.parent.findUnique({ where: { id: reclamacao.parentId }, select: { userId: true } });
      if (parent) {
        const tipoLabel = reclamacao.tipo === 'RECLAMACAO' ? 'reclamação' : reclamacao.tipo === 'SUGESTAO' ? 'sugestão' : 'elogio';
        const notif = await this.notifService.createForUser(
          parent.userId,
          'RECLAMACAO_RESPONDIDA',
          `A sua ${tipoLabel} foi respondida`,
          resposta,
        );
        this.gateway.sendToUser(parent.userId, 'notification', notif);
      }
    }

    return updated;
  }

  private static readonly TRANSICOES: Record<string, string[]> = {
    ABERTA: ['EM_ANALISE', 'RESPONDIDA', 'FECHADA'],
    EM_ANALISE: ['RESPONDIDA', 'FECHADA'],
    RESPONDIDA: ['FECHADA'],
    FECHADA: [],
  };

  async updateEstado(id: string, estado: string, actorUserId: string) {
    const reclamacao = await this.prisma.reclamacao.findUnique({ where: { id } });
    if (!reclamacao) throw new NotFoundException('Reclamação não encontrada');
    if (!ReclamacoesService.TRANSICOES[reclamacao.estado]?.includes(estado)) {
      throw new ConflictException(`Transição de estado inválida: ${reclamacao.estado} → ${estado}`);
    }
    const updated = await this.prisma.reclamacao.update({
      where: { id },
      data: { estado, resolvidoEm: estado === 'FECHADA' ? new Date() : reclamacao.resolvidoEm },
    });
    await this.audit.log({ userId: actorUserId, action: 'RECLAMACAO_ESTADO_ALTERADO', entity: 'Reclamacao', entityId: id, oldValues: { estado: reclamacao.estado }, newValues: { estado } });
    return updated;
  }
}
