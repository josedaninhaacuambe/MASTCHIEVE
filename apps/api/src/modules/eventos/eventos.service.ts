import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class EventosService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.estado) where.estado = query.estado;
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    return this.prisma.evento.findMany({
      where, orderBy: { data: 'desc' },
      include: { unidade: { select: { nome: true, codigo: true } }, _count: { select: { certificados: true, leads: true, participantes: true } } },
    });
  }

  async findOne(id: string) {
    const e = await this.prisma.evento.findUnique({
      where: { id },
      include: { unidade: true, certificados: { include: { student: true, fase: true } }, leads: true, participantes: true },
    });
    if (!e) throw new NotFoundException('Evento não encontrado');
    return e;
  }

  async create(data: any, actorUserId?: string) {
    const evento = await this.prisma.evento.create({ data });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_CRIADO', entity: 'Evento', entityId: evento.id,
        newValues: { nome: evento.nome, tipo: evento.tipo },
      });
    }
    return evento;
  }

  async update(id: string, data: any, actorUserId?: string) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.evento.update({ where: { id }, data });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_ATUALIZADO', entity: 'Evento', entityId: id,
        oldValues: { estado: existing.estado }, newValues: { estado: updated.estado },
      });
    }
    return updated;
  }

  async listParticipantes(eventoId: string) {
    await this.findOne(eventoId);
    return this.prisma.eventoParticipante.findMany({
      where: { eventoId }, include: { student: { select: { firstName: true, lastName: true } } },
    });
  }

  async addParticipante(
    eventoId: string,
    data: { studentId?: string; nome?: string; contacto?: string; pagamentoId?: string },
    actorUserId?: string,
  ) {
    await this.findOne(eventoId);
    const participante = await this.prisma.eventoParticipante.create({ data: { eventoId, ...data } });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_PARTICIPANTE_ADICIONADO', entity: 'EventoParticipante', entityId: participante.id,
        newValues: { eventoId, ...data },
      });
    }
    return participante;
  }

  async marcarPresencaParticipante(participanteId: string, presente: boolean, actorUserId?: string) {
    const participante = await this.prisma.eventoParticipante.update({ where: { id: participanteId }, data: { presente } });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_PRESENCA_MARCADA', entity: 'EventoParticipante', entityId: participanteId,
        newValues: { presente },
      });
    }
    return participante;
  }

  async removeParticipante(participanteId: string, actorUserId?: string) {
    const participante = await this.prisma.eventoParticipante.delete({ where: { id: participanteId } });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'EVENTO_PARTICIPANTE_REMOVIDO', entity: 'EventoParticipante', entityId: participanteId,
        oldValues: { eventoId: participante.eventoId },
      });
    }
    return participante;
  }
}
