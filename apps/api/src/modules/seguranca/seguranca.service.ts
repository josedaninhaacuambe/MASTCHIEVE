import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class SegurancaService {
  constructor(private prisma: PrismaService) {}

  async dashboardSemanal(unidadeId?: string) {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const where: any = { data: { gte: inicioSemana } };
    if (unidadeId) where.unidadeId = unidadeId;

    const [incidentes, quaseIncidentes, checklists, protocolos] = await Promise.all([
      this.prisma.incidente.findMany({
        where: { ...where, tipoOcorrencia: 'INCIDENTE_CONFIRMADO' },
        include: {
          protocolo: { select: { nome: true, ranking: true } },
          reportadoPor: { select: { email: true } },
        },
        orderBy: { data: 'desc' },
      }),
      this.prisma.incidente.count({
        where: { ...where, tipoOcorrencia: 'QUASE_INCIDENTE' },
      }),
      this.prisma.checklistProtocolo.findMany({
        where: { data: { gte: inicioSemana } },
        include: {
          protocolo: { select: { nome: true, ranking: true, dimensao: true } },
          instrutor: { select: { firstName: true, lastName: true } },
        },
        orderBy: { data: 'desc' },
      }),
      this.prisma.protocolo.findMany({ where: { isAtivo: true }, orderBy: { ranking: 'asc' }, select: { id: true, nome: true, ranking: true, dimensao: true } }),
    ]);

    const checklistsByProtocolo = protocolos.map((p) => ({
      ...p,
      completadas: checklists.filter((c) => c.protocoloId === p.id && c.completado).length,
      total: checklists.filter((c) => c.protocoloId === p.id).length,
    }));

    return {
      periodo: { inicio: inicioSemana, fim: hoje },
      incidentes: { total: incidentes.length, lista: incidentes },
      quaseIncidentes,
      checklists: { total: checklists.length, completadas: checklists.filter((c) => c.completado).length, porProtocolo: checklistsByProtocolo },
    };
  }

  async dashboardMensal(unidadeId?: string) {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const where: any = { data: { gte: inicioMes } };
    if (unidadeId) where.unidadeId = unidadeId;

    const todos = await this.prisma.incidente.findMany({
      where,
      include: { protocolo: { select: { nome: true, ranking: true, dimensao: true } } },
    });

    const confirmados = todos.filter((i) => i.tipoOcorrencia === 'INCIDENTE_CONFIRMADO');
    const quaseIncidentes = todos.filter((i) => i.tipoOcorrencia === 'QUASE_INCIDENTE');

    const porDimensao = this.agruparPorDimensao(todos);
    const porProtocolo = this.agruparPorProtocolo(todos);

    const metaZeroGraves = confirmados.filter((i) => i.tipo === 'ACIDENTE_GRAVE').length;

    return {
      periodo: { inicio: inicioMes, fim: hoje },
      totais: { incidentes: confirmados.length, quaseIncidentes: quaseIncidentes.length, graves: metaZeroGraves },
      metaZeroGraves: metaZeroGraves === 0,
      porDimensao,
      porProtocolo,
      tendencia: await this.tendencia3Meses(unidadeId),
    };
  }

  async reincidencias(unidadeId?: string) {
    const inicio30Dias = new Date();
    inicio30Dias.setDate(inicio30Dias.getDate() - 30);

    const where: any = { data: { gte: inicio30Dias } };
    if (unidadeId) where.unidadeId = unidadeId;

    const incidentes = await this.prisma.incidente.findMany({
      where,
      include: {
        protocolo: { select: { nome: true, ranking: true } },
        reportadoPor: { select: { id: true, email: true } },
        unidade: { select: { nome: true, codigo: true } },
      },
    });

    // Agrupar por instrutor + protocolo
    const porInstrutorProtocolo = new Map<string, { count: number; items: any[] }>();
    for (const i of incidentes) {
      if (!i.protocoloId) continue;
      const key = `${i.reportadoPorId}|${i.protocoloId}`;
      const entry = porInstrutorProtocolo.get(key) || { count: 0, items: [] };
      entry.count++;
      entry.items.push(i);
      porInstrutorProtocolo.set(key, entry);
    }

    const alertas = Array.from(porInstrutorProtocolo.entries())
      .filter(([, v]) => v.count >= 3)
      .map(([key, v]) => {
        const [instrutorId, protocoloId] = key.split('|');
        const sample = v.items[0];
        return {
          tipo: 'REINCIDENCIA_INSTRUTOR_PROTOCOLO',
          instrutorEmail: sample.reportadoPor?.email,
          protocoloNome: sample.protocolo?.nome,
          contagem: v.count,
          periodo: '30 dias',
          escalado: v.items.some((i: any) => i.escalado),
          incidentes: v.items.map((i: any) => ({ id: i.id, data: i.data, tipo: i.tipo, tipoOcorrencia: i.tipoOcorrencia })),
        };
      });

    return {
      periodo: { inicio: inicio30Dias, fim: new Date() },
      alertas,
      totalReincidencias: alertas.length,
      semAlertas: alertas.length === 0,
    };
  }

  private agruparPorDimensao(incidentes: any[]) {
    const dims = ['FISICA', 'OPERACIONAL', 'EMOCIONAL', 'PEDAGOGICA', 'GESTAO'];
    return dims.map((d) => {
      const matching = incidentes.filter((i) => {
        try { return (JSON.parse(i.dimensoes || '[]') as string[]).includes(d); } catch { return false; }
      });
      return { dimensao: d, total: matching.length, incidentes: matching.length, quaseIncidentes: matching.filter((i: any) => i.tipoOcorrencia === 'QUASE_INCIDENTE').length };
    }).filter((d) => d.total > 0);
  }

  private agruparPorProtocolo(incidentes: any[]) {
    const map = new Map<string, { protocolo: any; total: number; quaseIncidentes: number }>();
    for (const i of incidentes) {
      if (!i.protocolo) continue;
      const key = i.protocoloId;
      const entry = map.get(key) || { protocolo: i.protocolo, total: 0, quaseIncidentes: 0 };
      entry.total++;
      if (i.tipoOcorrencia === 'QUASE_INCIDENTE') entry.quaseIncidentes++;
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  private async tendencia3Meses(unidadeId?: string) {
    const meses = [];
    for (let m = 2; m >= 0; m--) {
      const hoje = new Date();
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - m, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() - m + 1, 0);
      const where: any = { data: { gte: inicio, lte: fim } };
      if (unidadeId) where.unidadeId = unidadeId;
      const count = await this.prisma.incidente.count({ where });
      meses.push({ mes: inicio.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }), total: count });
    }
    return meses;
  }
}
