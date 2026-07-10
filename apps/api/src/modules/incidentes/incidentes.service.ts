import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class IncidentesService {
  constructor(private prisma: PrismaService) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    if (query.tipo) where.tipo = query.tipo;
    return this.prisma.incidente.findMany({
      where, orderBy: { data: 'desc' },
      include: { unidade: { select: { nome: true, codigo: true } }, reportadoPor: { select: { email: true } } },
    });
  }

  async findOne(id: string) {
    const i = await this.prisma.incidente.findUnique({
      where: { id }, include: { unidade: true, reportadoPor: { select: { email: true, role: true } } },
    });
    if (!i) throw new NotFoundException('Incidente não encontrado');
    return i;
  }

  create(data: any, userId: string) {
    return this.prisma.incidente.create({ data: { ...data, reportadoPorId: userId } });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    if (data.estado === 'RESOLVIDO' && !data.resolvidoEm) data.resolvidoEm = new Date();
    return this.prisma.incidente.update({ where: { id }, data });
  }

  async stats() {
    const [total, abertos, graves] = await Promise.all([
      this.prisma.incidente.count(),
      this.prisma.incidente.count({ where: { estado: { in: ['REPORTADO', 'EM_INVESTIGACAO'] } } }),
      this.prisma.incidente.count({ where: { tipo: 'ACIDENTE_GRAVE' } }),
    ]);
    return { total, abertos, graves, zerado: total === 0 };
  }
}
