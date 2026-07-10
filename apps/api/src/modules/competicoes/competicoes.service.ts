import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class CompeticoesService {
  constructor(private prisma: PrismaService) {}

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

  create(data: any) { return this.prisma.competicao.create({ data }); }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.competicao.update({ where: { id }, data });
  }

  async addAtleta(id: string, studentId: string, extra: any = {}) {
    return this.prisma.competicaoAtleta.upsert({
      where: { competicaoId_studentId: { competicaoId: id, studentId } },
      update: extra, create: { competicaoId: id, studentId, ...extra },
    });
  }

  async removeAtleta(id: string, studentId: string) {
    return this.prisma.competicaoAtleta.delete({
      where: { competicaoId_studentId: { competicaoId: id, studentId } },
    });
  }
}
