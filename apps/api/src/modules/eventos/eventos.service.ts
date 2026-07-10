import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class EventosService {
  constructor(private prisma: PrismaService) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.estado) where.estado = query.estado;
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    return this.prisma.evento.findMany({
      where, orderBy: { data: 'desc' },
      include: { unidade: { select: { nome: true, codigo: true } }, _count: { select: { certificados: true, leads: true } } },
    });
  }

  async findOne(id: string) {
    const e = await this.prisma.evento.findUnique({
      where: { id }, include: { unidade: true, certificados: { include: { student: true, fase: true } }, leads: true },
    });
    if (!e) throw new NotFoundException('Evento não encontrado');
    return e;
  }

  create(data: any) { return this.prisma.evento.create({ data }); }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.evento.update({ where: { id }, data });
  }
}
