import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class CompeticoesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    return this.prisma.competicao.findMany({
      where, orderBy: { data: 'desc' },
      include: { unidade: { select: { nome: true } }, _count: { select: { atletas: true } } },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.competicao.findUnique({
      where: { id },
      include: { unidade: true, atletas: { include: { student: { select: { firstName: true, lastName: true, avatarUrl: true } } } } },
    });
    if (!c) throw new NotFoundException('Competição não encontrada');
    return c;
  }

  async create(data: any, actorUserId?: string) {
    const competicao = await this.prisma.competicao.create({ data });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'COMPETICAO_CRIADA', entity: 'Competicao', entityId: competicao.id,
        newValues: { nome: competicao.nome },
      });
    }
    return competicao;
  }

  async update(id: string, data: any, actorUserId?: string) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.competicao.update({ where: { id }, data });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'COMPETICAO_ATUALIZADA', entity: 'Competicao', entityId: id,
        oldValues: { estado: existing.estado }, newValues: { estado: updated.estado },
      });
    }
    return updated;
  }

  async addAtleta(id: string, studentId: string, extra: any = {}, actorUserId?: string) {
    const atleta = await this.prisma.competicaoAtleta.upsert({
      where: { competicaoId_studentId: { competicaoId: id, studentId } },
      update: extra, create: { competicaoId: id, studentId, ...extra },
    });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'COMPETICAO_ATLETA_ADICIONADO', entity: 'CompeticaoAtleta',
        entityId: `${id}:${studentId}`, newValues: extra,
      });
    }
    return atleta;
  }

  async removeAtleta(id: string, studentId: string, actorUserId?: string) {
    const atleta = await this.prisma.competicaoAtleta.delete({
      where: { competicaoId_studentId: { competicaoId: id, studentId } },
    });
    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId, action: 'COMPETICAO_ATLETA_REMOVIDO', entity: 'CompeticaoAtleta',
        entityId: `${id}:${studentId}`,
      });
    }
    return atleta;
  }
}
