import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    if (query.origem) where.origem = query.origem;
    return this.prisma.lead.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { unidade: { select: { nome: true, codigo: true } }, evento: { select: { nome: true } } },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { unidade: true, evento: true, student: true },
    });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return lead;
  }

  create(data: any) {
    return this.prisma.lead.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    if (data.estado === 'CONVERTIDO' && !data.dataConversao) data.dataConversao = new Date();
    return this.prisma.lead.update({ where: { id }, data });
  }

  async pipeline(unidadeId?: string) {
    const where = unidadeId ? { unidadeId } : {};
    const estados = ['NOVO', 'CONTACTADO', 'AGENDADO', 'CONVERTIDO', 'PERDIDO'];
    const counts = await this.prisma.lead.groupBy({
      by: ['estado'], where, _count: true,
    });
    const result: Record<string, number> = {};
    for (const e of estados) result[e] = 0;
    for (const c of counts) result[c.estado] = c._count;
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    const conversao = total > 0 ? Math.round((result['CONVERTIDO'] / total) * 100) : 0;
    return { pipeline: result, total, conversao };
  }
}
