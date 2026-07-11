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

  create(data: any, userId: string) {
    const { protocoloId, dimensoes, ...rest } = data;
    return this.prisma.incidente.create({
      data: {
        ...rest,
        reportadoPorId: userId,
        dimensoes: Array.isArray(dimensoes) ? JSON.stringify(dimensoes) : (dimensoes || '[]'),
        ...(protocoloId ? { protocoloId } : {}),
      },
    });
  }

  createRelampago(userId: string, unidadeId?: string) {
    return this.prisma.incidente.create({
      data: {
        tipo: 'ACIDENTE_GRAVE',
        tipoOcorrencia: 'INCIDENTE_CONFIRMADO',
        isRelampago: true,
        descricao: 'RELÂMPAGO ZERO — Evacuação imediata acionada pelo instrutor',
        acaoImediata: 'Atletas evacuados da piscina imediatamente. Aguardar 30 min após último trovão.',
        dimensoes: JSON.stringify(['FISICA']),
        estado: 'REPORTADO',
        reportadoPorId: userId,
        ...(unidadeId && { unidadeId }),
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    if (data.estado === 'RESOLVIDO' && !data.resolvidoEm) data.resolvidoEm = new Date();
    if (data.dimensoes && Array.isArray(data.dimensoes)) data.dimensoes = JSON.stringify(data.dimensoes);
    return this.prisma.incidente.update({ where: { id }, data });
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
