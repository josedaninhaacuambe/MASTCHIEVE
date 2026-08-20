import { Injectable, NotFoundException } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { GerarRelatorioDto } from './dto/gerar-relatorio.dto';

@Injectable()
export class RelatoriosMensaisService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAll(query: any) {
    const where: any = {};
    if (query.unidadeId) where.unidadeId = query.unidadeId;
    if (query.ano) where.ano = parseInt(query.ano);
    return this.prisma.relatorioMensal.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
      include: { unidade: { select: { id: true, nome: true } }, geradoPor: { select: { id: true, email: true } } },
    });
  }

  async findOne(id: string) {
    const relatorio = await this.prisma.relatorioMensal.findUnique({
      where: { id },
      include: { unidade: { select: { id: true, nome: true } }, geradoPor: { select: { id: true, email: true } } },
    });
    if (!relatorio) throw new NotFoundException('Relatório mensal não encontrado');
    return relatorio;
  }

  async gerar(dto: GerarRelatorioDto, actorUserId: string) {
    const start = new Date(dto.ano, dto.mes - 1, 1);
    const end = new Date(dto.ano, dto.mes, 1);
    const unidadeId = dto.unidadeId;
    const studentWhere = unidadeId ? { unidadeId } : {};

    const [
      totalAlunos,
      novasInscricoes,
      attendances,
      pagamentosPeriodo,
      pagamentosEmAtraso,
      totalIncidentes,
      incidentesGraves,
      totalReclamacoes,
      totalEventos,
      itensInventario,
    ] = await Promise.all([
      this.prisma.student.count({ where: { ...studentWhere, isActive: true } }),
      this.prisma.student.count({ where: { ...studentWhere, enrollmentDate: { gte: start, lt: end } } }),
      this.prisma.attendance.findMany({
        where: { markedAt: { gte: start, lt: end }, student: studentWhere },
        select: { status: true },
      }),
      this.prisma.payment.findMany({
        where: { status: 'PAID', paidAt: { gte: start, lt: end }, student: studentWhere },
        select: { amount: true },
      }),
      this.prisma.payment.count({
        where: { status: { in: ['PENDING', 'OVERDUE'] }, isento: false, dueDate: { lt: end }, student: studentWhere },
      }),
      this.prisma.incidente.count({ where: { data: { gte: start, lt: end }, ...(unidadeId ? { unidadeId } : {}) } }),
      this.prisma.incidente.count({ where: { data: { gte: start, lt: end }, gravidade: { in: ['ALTA', 'CRITICA'] }, ...(unidadeId ? { unidadeId } : {}) } }),
      this.prisma.reclamacao.count({ where: { createdAt: { gte: start, lt: end }, ...(unidadeId ? { unidadeId } : {}) } }),
      this.prisma.evento.count({ where: { data: { gte: start, lt: end }, ...(unidadeId ? { unidadeId } : {}) } }),
      this.prisma.itemInventario.findMany({ where: { ativo: true, ...(unidadeId ? { unidadeId } : {}) } }),
    ]);

    const taxaPresencaMedia = attendances.length
      ? Math.round((attendances.filter((a) => a.status === 'PRESENT').length / attendances.length) * 1000) / 10
      : 0;
    const receitaTotal = pagamentosPeriodo.reduce((sum, p) => sum + p.amount, 0);
    const itensStockBaixo = itensInventario.filter((i) => i.quantidade <= i.quantidadeMin).length;

    const dados = {
      totalAlunos,
      novasInscricoes,
      taxaPresencaMedia,
      receitaTotal,
      pagamentosEmAtraso,
      totalIncidentes,
      incidentesGraves,
      totalReclamacoes,
      totalEventos,
      itensStockBaixo,
      geradoPorId: actorUserId,
    };

    // Prisma's compound-unique `where` (unidadeId_mes_ano) rejects `null` for the
    // nullable unidadeId field even though the column itself allows it, so `upsert`
    // can't be used directly for the "todas as unidades" (unidadeId=null) case.
    const relatorio = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.relatorioMensal.findFirst({
        where: { unidadeId: unidadeId ?? null, mes: dto.mes, ano: dto.ano },
      });
      return existing
        ? tx.relatorioMensal.update({ where: { id: existing.id }, data: dados })
        : tx.relatorioMensal.create({ data: { unidadeId: unidadeId ?? null, mes: dto.mes, ano: dto.ano, ...dados } });
    });

    await this.audit.log({ userId: actorUserId, action: 'RELATORIO_MENSAL_GERADO', entity: 'RelatorioMensal', entityId: relatorio.id, newValues: { mes: dto.mes, ano: dto.ano, unidadeId } });
    return relatorio;
  }

  async exportPdf(id: string): Promise<Buffer> {
    const relatorio = await this.findOne(id);
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();

    const blue = rgb(0.1, 0.33, 0.86);
    const dark = rgb(0.07, 0.07, 0.07);
    const gray = rgb(0.45, 0.45, 0.45);

    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue });
    page.drawText('Mastchieve — Relatório Mensal', { x: 40, y: height - 45, size: 18, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText(
      `${meses[relatorio.mes - 1]} ${relatorio.ano}${relatorio.unidade ? ' · ' + relatorio.unidade.nome : ' · Todas as unidades'}  ·  Gerado em ${new Date().toLocaleDateString('pt-PT')}`,
      { x: 40, y: height - 65, size: 10, font, color: rgb(0.8, 0.85, 1) },
    );

    let y = height - 120;
    const rows: [string, string][] = [
      ['Total de alunos ativos', String(relatorio.totalAlunos)],
      ['Novas inscrições', String(relatorio.novasInscricoes)],
      ['Taxa de presença média', `${relatorio.taxaPresencaMedia}%`],
      ['Receita total (pagamentos)', `MT ${relatorio.receitaTotal.toFixed(2)}`],
      ['Pagamentos em atraso', String(relatorio.pagamentosEmAtraso)],
      ['Total de incidentes', String(relatorio.totalIncidentes)],
      ['Incidentes graves (ALTA/CRÍTICA)', String(relatorio.incidentesGraves)],
      ['Reclamações e sugestões', String(relatorio.totalReclamacoes)],
      ['Eventos realizados', String(relatorio.totalEventos)],
      ['Itens de inventário em stock baixo', String(relatorio.itensStockBaixo)],
    ];

    for (const [label, value] of rows) {
      page.drawText(label, { x: 40, y, size: 11, font, color: dark });
      page.drawText(value, { x: 400, y, size: 11, font: fontBold, color: blue });
      y -= 12;
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) });
      y -= 20;
    }

    page.drawText('Documento gerado automaticamente pelo sistema Mastchieve.', { x: 40, y: 40, size: 8, font, color: gray });

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }
}
