import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class ComunicacaoService {
  constructor(private prisma: PrismaService) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;
    if (query.tipo) where.tipo = query.tipo;
    return this.prisma.pedidoComunicacao.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { solicitante: { select: { email: true } }, aprovadoPor: { select: { email: true } } },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.pedidoComunicacao.findUnique({ where: { id }, include: { solicitante: true, aprovadoPor: true } });
    if (!p) throw new NotFoundException('Pedido não encontrado');
    return p;
  }

  create(data: any, solicitanteId: string) {
    return this.prisma.pedidoComunicacao.create({ data: { ...data, solicitanteId } });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.pedidoComunicacao.update({ where: { id }, data });
  }

  async aprovar(id: string, aprovadoPorId: string) {
    return this.prisma.pedidoComunicacao.update({
      where: { id }, data: { estado: 'APROVADO', aprovadoPorId, aprovadoEm: new Date() },
    });
  }

  async publicar(id: string, link?: string) {
    return this.prisma.pedidoComunicacao.update({
      where: { id }, data: { estado: 'PUBLICADO', link },
    });
  }
}
