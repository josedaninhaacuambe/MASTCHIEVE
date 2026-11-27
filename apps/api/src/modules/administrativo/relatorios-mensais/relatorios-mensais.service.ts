import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { GerarRelatorioDto } from './dto/gerar-relatorio.dto';
import { calcularIdade } from '../../../common/utils/contacto-atleta.util';
import { calcularPresencasPorFaixaEtaria, FaixaEtariaPresenca } from '../../../common/utils/faixa-etaria.util';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const PRESENTE = ['PRESENT', 'LATE'];

export interface DetalhesRelatorio {
  atletasComPresenca: number;
  totalEntradas: number;
  presencasMarcadas: number;
  faltas: number;
  feedbacksEnviados: number;
  avaliacoesRegistadas: number;
  modulosConcluidos: number;
  certificadosEmitidos: number;
  resumo: string[];
}

type Actor = { id: string; role: string };

function lerJson<T>(v: string | null, padrao: T): T {
  if (!v) return padrao;
  try { return JSON.parse(v) as T; } catch { return padrao; }
}

function parseRelatorio<T extends { presencasPorFaixaEtaria: string | null; detalhes?: string | null }>(relatorio: T) {
  return {
    ...relatorio,
    presencasPorFaixaEtaria: lerJson<FaixaEtariaPresenca[]>(relatorio.presencasPorFaixaEtaria, []),
    detalhes: lerJson<DetalhesRelatorio | null>(relatorio.detalhes ?? null, null),
  };
}

/** Diferença em texto ("mais 3", "menos 2", "igual") face ao mês anterior. */
function variacao(actual: number, anterior: number | undefined, unidade = ''): string {
  if (anterior === undefined) return '';
  const d = Math.round((actual - anterior) * 10) / 10;
  if (d === 0) return ' (igual ao mês anterior)';
  return ` (${d > 0 ? 'mais' : 'menos'} ${Math.abs(d)}${unidade} que no mês anterior)`;
}

/** Frases do resumo do mês, construídas só a partir dos números calculados (sem texto inventado). */
export function resumoDoMes(
  d: { totalAlunos: number; novasInscricoes: number; taxaPresencaMedia: number; receitaTotal: number; pagamentosEmAtraso: number; incidentesGraves: number; totalReclamacoes: number },
  det: Omit<DetalhesRelatorio, 'resumo'>,
  anterior?: { totalAlunos: number; taxaPresencaMedia: number; receitaTotal: number; detalhes: DetalhesRelatorio | null } | null,
): string[] {
  const r: string[] = [];
  r.push(`${d.totalAlunos} atletas activos e ${d.novasInscricoes} novas inscrições${variacao(d.totalAlunos, anterior?.totalAlunos, ' atletas')}.`);
  if (det.atletasComPresenca === 0 && det.presencasMarcadas === 0) {
    r.push('Não há presenças nem entradas registadas neste mês.');
  } else {
    r.push(`${det.atletasComPresenca} atletas estiveram presentes pelo menos uma vez (${det.totalEntradas} entradas na recepção, ${det.presencasMarcadas} presenças marcadas nas aulas).`);
    if (det.presencasMarcadas + det.faltas > 0) {
      r.push(`Taxa de presença nas aulas de ${d.taxaPresencaMedia}%${variacao(d.taxaPresencaMedia, anterior?.taxaPresencaMedia, ' p.p.')}, com ${det.faltas} faltas.`);
    }
  }
  r.push(`Receita de MT ${d.receitaTotal.toFixed(2)}${variacao(d.receitaTotal, anterior?.receitaTotal, ' MT')}; ${d.pagamentosEmAtraso} mensalidades por pagar.`);
  r.push(`${det.avaliacoesRegistadas} avaliações registadas, ${det.feedbacksEnviados} feedbacks enviados, ${det.modulosConcluidos} módulos concluídos e ${det.certificadosEmitidos} certificados emitidos.`);
  if (d.incidentesGraves > 0) r.push(`Atenção: ${d.incidentesGraves} incidente(s) grave(s) registado(s).`);
  if (d.totalReclamacoes > 0) r.push(`${d.totalReclamacoes} reclamação(ões) ou sugestão(ões) recebida(s).`);
  return r;
}

@Injectable()
export class RelatoriosMensaisService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  /** O assistente administrativo só trabalha com os relatórios da sua unidade. */
  private async unidadeDoAssistente(actor: Actor): Promise<string | null> {
    if (actor.role !== 'ASSISTENTE_ADMIN') return null;
    const f = await this.prisma.funcionario.findUnique({ where: { userId: actor.id }, select: { unidadeId: true } });
    if (!f?.unidadeId) throw new ForbiddenException('A sua conta não tem unidade atribuída — peça a um Admin para a configurar.');
    return f.unidadeId;
  }

  async findAll(query: any, actor: Actor) {
    const where: any = {};
    const propria = await this.unidadeDoAssistente(actor);
    if (propria) where.unidadeId = propria;
    else if (typeof query.unidadeId === 'string' && query.unidadeId) where.unidadeId = query.unidadeId;
    if (query.ano && Number.isInteger(parseInt(query.ano))) where.ano = parseInt(query.ano);
    const relatorios = await this.prisma.relatorioMensal.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
      include: { unidade: { select: { id: true, nome: true } }, geradoPor: { select: { id: true, email: true } } },
    });
    return relatorios.map(parseRelatorio);
  }

  async findOne(id: string, actor: Actor) {
    const relatorio = await this.prisma.relatorioMensal.findUnique({
      where: { id },
      include: { unidade: { select: { id: true, nome: true } }, geradoPor: { select: { id: true, email: true } } },
    });
    if (!relatorio) throw new NotFoundException('Relatório mensal não encontrado');
    const propria = await this.unidadeDoAssistente(actor);
    if (propria && relatorio.unidadeId !== propria) throw new NotFoundException('Relatório mensal não encontrado');
    return parseRelatorio(relatorio);
  }

  /** Apaga um relatório (por exemplo, um duplicado). Pode voltar a ser gerado a qualquer momento. */
  async remove(id: string, actor: Actor) {
    const r = await this.findOne(id, actor);
    await this.prisma.relatorioMensal.delete({ where: { id } });
    await this.audit.log({
      userId: actor.id, action: 'RELATORIO_MENSAL_APAGADO', entity: 'RelatorioMensal', entityId: id,
      oldValues: { mes: r.mes, ano: r.ano, unidadeId: r.unidadeId },
    });
    return { apagado: true };
  }

  async gerar(dto: GerarRelatorioDto, actor: Actor) {
    const actorUserId = actor.id;
    const start = new Date(dto.ano, dto.mes - 1, 1);
    const end = new Date(dto.ano, dto.mes, 1);
    const propria = await this.unidadeDoAssistente(actor);
    if (propria && dto.unidadeId && dto.unidadeId !== propria) throw new ForbiddenException('Só pode gerar relatórios da sua unidade.');
    const unidadeId = propria ?? (dto.unidadeId || undefined);
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
        select: { status: true, studentId: true, student: { select: { dateOfBirth: true } } },
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

    const [registos, feedbacksEnviados, avaliacoesRegistadas, modulosConcluidos, certificadosEmitidos, anteriorBruto] = await Promise.all([
      this.prisma.registoEntradaSaidaAluno.findMany({
        where: { dataHora: { gte: start, lt: end }, tipo: { in: ['ENTRADA', 'CANCELAMENTO'] }, student: studentWhere },
        select: { studentId: true, tipo: true },
      }),
      this.prisma.feedback.count({ where: { status: 'SENT', updatedAt: { gte: start, lt: end }, student: studentWhere } }),
      this.prisma.avaliacao.count({ where: { avaliadoEm: { gte: start, lt: end }, student: studentWhere } }),
      this.prisma.studentFase.count({ where: { estado: 'CONCLUIDO', concluidoEm: { gte: start, lt: end }, student: studentWhere } }),
      this.prisma.certificado.count({ where: { dataEmissao: { gte: start, lt: end }, student: studentWhere } }),
      this.prisma.relatorioMensal.findFirst({
        where: { unidadeId: unidadeId ?? null, mes: dto.mes === 1 ? 12 : dto.mes - 1, ano: dto.mes === 1 ? dto.ano - 1 : dto.ano },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Atrasados contam como presentes, como na folha de presenças diárias.
    const presencasMarcadas = attendances.filter((a) => PRESENTE.includes(a.status)).length;
    const taxaPresencaMedia = attendances.length ? Math.round((presencasMarcadas / attendances.length) * 1000) / 10 : 0;
    const receitaTotal = pagamentosPeriodo.reduce((sum, p) => sum + p.amount, 0);
    const itensStockBaixo = itensInventario.filter((i) => i.quantidade <= i.quantidadeMin).length;
    const presencasPorFaixaEtaria = calcularPresencasPorFaixaEtaria(
      attendances.map((a) => ({
        presente: PRESENTE.includes(a.status),
        idade: calcularIdade(new Date(a.student.dateOfBirth)),
      })),
    );

    const totalEntradas = Math.max(0, registos.filter((r) => r.tipo === 'ENTRADA').length - registos.filter((r) => r.tipo === 'CANCELAMENTO').length);
    const presentes = new Set<string>([
      ...registos.filter((r) => r.tipo === 'ENTRADA').map((r) => r.studentId),
      ...attendances.filter((a) => PRESENTE.includes(a.status)).map((a) => a.studentId),
    ]);
    const base = {
      atletasComPresenca: presentes.size,
      totalEntradas,
      presencasMarcadas,
      faltas: attendances.filter((a) => a.status === 'ABSENT').length,
      feedbacksEnviados,
      avaliacoesRegistadas,
      modulosConcluidos,
      certificadosEmitidos,
    };
    const anterior = anteriorBruto ? parseRelatorio(anteriorBruto) : null;
    const detalhes: DetalhesRelatorio = {
      ...base,
      resumo: resumoDoMes(
        { totalAlunos, novasInscricoes, taxaPresencaMedia, receitaTotal, pagamentosEmAtraso, incidentesGraves, totalReclamacoes },
        base,
        anterior,
      ),
    };

    const dados = {
      detalhes: JSON.stringify(detalhes),
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
      presencasPorFaixaEtaria: JSON.stringify(presencasPorFaixaEtaria),
      geradoPorId: actorUserId,
    };

    // Prisma's compound-unique `where` (unidadeId_mes_ano) rejects `null` for the
    // nullable unidadeId field even though the column itself allows it, so `upsert`
    // can't be used directly for the "todas as unidades" (unidadeId=null) case.
    // Um único relatório por mês/unidade: regenerar actualiza o mais recente e retira os duplicados.
    const { relatorio, duplicadosRemovidos } = await this.prisma.$transaction(async (tx) => {
      const existentes = await tx.relatorioMensal.findMany({
        where: { unidadeId: unidadeId ?? null, mes: dto.mes, ano: dto.ano },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      const [manter, ...duplicados] = existentes;
      if (duplicados.length) await tx.relatorioMensal.deleteMany({ where: { id: { in: duplicados.map((d) => d.id) } } });
      const relatorio = manter
        ? await tx.relatorioMensal.update({ where: { id: manter.id }, data: dados })
        : await tx.relatorioMensal.create({ data: { unidadeId: unidadeId ?? null, mes: dto.mes, ano: dto.ano, ...dados } });
      return { relatorio, duplicadosRemovidos: duplicados.map((d) => d.id) };
    });

    await this.audit.log({ userId: actorUserId, action: 'RELATORIO_MENSAL_GERADO', entity: 'RelatorioMensal', entityId: relatorio.id, newValues: { mes: dto.mes, ano: dto.ano, unidadeId, ...(duplicadosRemovidos.length && { duplicadosRemovidos }) } });
    return parseRelatorio(relatorio);
  }

  async exportPdf(id: string, actor: Actor): Promise<Buffer> {
    const relatorio = await this.findOne(id, actor);
    const meses = MESES;

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
    const det = relatorio.detalhes;
    if (det) {
      rows.splice(3, 0,
        ['Atletas com pelo menos uma presença', String(det.atletasComPresenca)],
        ['Entradas registadas na recepção', String(det.totalEntradas)],
        ['Presenças / faltas marcadas nas aulas', `${det.presencasMarcadas} / ${det.faltas}`],
      );
      rows.push(
        ['Avaliações registadas', String(det.avaliacoesRegistadas)],
        ['Feedbacks enviados', String(det.feedbacksEnviados)],
        ['Módulos concluídos', String(det.modulosConcluidos)],
        ['Certificados emitidos', String(det.certificadosEmitidos)],
      );
    }

    for (const [label, value] of rows) {
      page.drawText(label, { x: 40, y, size: 11, font, color: dark });
      page.drawText(value, { x: 400, y, size: 11, font: fontBold, color: blue });
      y -= 8;
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) });
      y -= 13;
    }

    if (det?.resumo?.length) {
      y -= 6;
      page.drawText('Resumo do mês', { x: 40, y, size: 12, font: fontBold, color: dark });
      y -= 16;
      for (const frase of det.resumo) {
        // Quebra simples de linha para frases longas.
        const palavras = `• ${frase}`.split(' ');
        let linha = '';
        for (const p of palavras) {
          const teste = linha ? `${linha} ${p}` : p;
          if (font.widthOfTextAtSize(teste, 9.5) > width - 80) {
            page.drawText(linha, { x: 40, y, size: 9.5, font, color: dark });
            y -= 13;
            linha = `   ${p}`;
          } else linha = teste;
        }
        if (linha) { page.drawText(linha, { x: 40, y, size: 9.5, font, color: dark }); y -= 13; }
      }
    }

    if (relatorio.presencasPorFaixaEtaria.length > 0) {
      y -= 8;
      page.drawText('Presenças por Faixa Etária', { x: 40, y, size: 12, font: fontBold, color: dark });
      y -= 20;
      page.drawText('Faixa', { x: 40, y, size: 9, font: fontBold, color: gray });
      page.drawText('Total', { x: 260, y, size: 9, font: fontBold, color: gray });
      page.drawText('Presentes', { x: 340, y, size: 9, font: fontBold, color: gray });
      page.drawText('Taxa', { x: 440, y, size: 9, font: fontBold, color: gray });
      y -= 14;
      for (const faixa of relatorio.presencasPorFaixaEtaria) {
        page.drawText(faixa.label, { x: 40, y, size: 10, font, color: dark });
        page.drawText(String(faixa.total), { x: 260, y, size: 10, font, color: dark });
        page.drawText(String(faixa.presentes), { x: 340, y, size: 10, font, color: dark });
        page.drawText(`${faixa.taxa}%`, { x: 440, y, size: 10, font: fontBold, color: blue });
        y -= 18;
      }
    }

    page.drawText('Documento gerado automaticamente pelo sistema Mastchieve.', { x: 40, y: 40, size: 8, font, color: gray });

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }
}
