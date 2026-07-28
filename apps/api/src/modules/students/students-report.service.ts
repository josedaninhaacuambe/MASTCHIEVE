import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { PDFDocument, PDFFont, PDFPage, RGB, rgb, StandardFonts } from 'pdf-lib';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const NIVEL_LABEL: Record<string, string> = {
  AMA: 'AMA — Adaptação ao Meio Aquático',
  INTERMEDIARIO: 'Intermédio — Autonomia Aquática e Eficiência Corporal',
  AVANCADO: 'Avançado — Eficiência Técnica de Nado',
};

const GENERO_LABEL: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino', OTHER: 'Outro' };

const ESCALA_LEGENDA: Array<{ pontos: number; nivel: string; descricao: string }> = [
  { pontos: 1, nivel: 'Péssimo', descricao: 'Não demonstra a habilidade, mesmo com orientação e apoio direto.' },
  { pontos: 2, nivel: 'Fraco', descricao: 'Demonstra apenas parte da habilidade, com execução instável e necessidade frequente de apoio.' },
  { pontos: 3, nivel: 'Razoável', descricao: 'Executa a habilidade num nível básico aceitável. É o mínimo exigido para as habilidades gerais.' },
  { pontos: 4, nivel: 'Bom', descricao: 'Executa com consistência, controlo e segurança. É o mínimo exigido para as habilidades obrigatórias.' },
  { pontos: 5, nivel: 'Excelente', descricao: 'Executa de forma autónoma, consistente, eficiente e tecnicamente segura.' },
];

const REGRAS_LEGENDA = [
  'Habilidade geral: pontuação mínima de 3 (Razoável).',
  'Habilidade obrigatória: pontuação mínima de 4 (Bom).',
  'Transição de módulo: exige, em simultâneo, o mínimo em cada habilidade e a soma total ≥ total mínimo do módulo.',
  'Regra de não-compensação: uma pontuação alta numa habilidade nunca compensa outra habilidade abaixo do seu próprio mínimo.',
];

const BLUE = rgb(0.1, 0.33, 0.86);
const DARK = rgb(0.07, 0.07, 0.07);
const GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93);
const RED = rgb(0.75, 0.15, 0.15);
const GREEN = rgb(0.06, 0.5, 0.35);

/** Sanitiza texto livre para a codificação WinAnsi das StandardFonts do pdf-lib. */
function pdfSafe(text: string | null | undefined): string {
  return (text ?? '')
    .replace(/↔/g, '/')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–/g, '-')
    .replace(/[^\x00-\xff]/g, '?');
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = pdfSafe(text).split(' ').filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface Criterio {
  nome: string;
  obrigatoria: boolean;
}

@Injectable()
export class StudentsReportService {
  private doc!: PDFDocument;
  private page!: PDFPage;
  private font!: PDFFont;
  private fontBold!: PDFFont;
  private y = 0;
  private studentName = '';
  private pageNumber = 0;

  constructor(private prisma: PrismaService) {}

  async generate(studentId: string): Promise<Buffer> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        unidade: { select: { nome: true } },
        parents: { include: { parent: true } },
        enrollments: {
          where: { isActive: true },
          include: { class: { include: { instructor: { select: { firstName: true, lastName: true } } } } },
        },
        studentFases: { include: { avaliacoes: true } },
      },
    });
    if (!student) throw new NotFoundException('Atleta não encontrado');

    const fases = await this.prisma.faseProgressao.findMany({
      where: { isActive: true },
      orderBy: { ordem: 'asc' },
    });

    this.studentName = `${student.firstName} ${student.lastName}`.trim();
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.fontBold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.pageNumber = 0;
    this.newPage(true);

    const primaryParent = student.parents.find(p => p.isPrimary)?.parent ?? student.parents[0]?.parent;
    const contacto = student.phone || primaryParent?.phone || '—';
    const professor = student.enrollments[0]?.class?.instructor;
    const professorNome = professor ? `${professor.firstName} ${professor.lastName}`.trim() : '—';

    this.drawIdentificacao({
      nome: this.studentName,
      dataNascimento: new Date(student.dateOfBirth).toLocaleDateString('pt-PT'),
      sexo: GENERO_LABEL[student.gender] ?? student.gender,
      contacto,
      unidade: student.unidade?.nome ?? '—',
      professor: professorNome,
    });

    this.drawHabilidades(fases, student.studentFases);

    this.drawLegenda(fases);

    const bytes = await this.doc.save();
    return Buffer.from(bytes);
  }

  private ensureSpace(height: number) {
    if (this.y - height < MARGIN + 20) this.newPage(false);
  }

  private newPage(first: boolean) {
    this.pageNumber++;
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    if (first) {
      this.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 80, width: PAGE_WIDTH, height: 80, color: BLUE });
      this.page.drawText('Ficha Técnica do Atleta', {
        x: MARGIN, y: PAGE_HEIGHT - 45, size: 18, font: this.fontBold, color: rgb(1, 1, 1),
      });
      this.page.drawText(`${this.studentName}  ·  Gerado em ${new Date().toLocaleDateString('pt-PT')}`, {
        x: MARGIN, y: PAGE_HEIGHT - 65, size: 10, font: this.font, color: rgb(0.8, 0.85, 1),
      });
      this.y = PAGE_HEIGHT - 110;
    } else {
      this.page.drawText(`Ficha Técnica do Atleta — ${this.studentName} (cont.)`, {
        x: MARGIN, y: PAGE_HEIGHT - 35, size: 9, font: this.font, color: GRAY,
      });
      this.page.drawLine({
        start: { x: MARGIN, y: PAGE_HEIGHT - 42 }, end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 42 },
        thickness: 0.5, color: LIGHT_GRAY,
      });
      this.y = PAGE_HEIGHT - 60;
    }
    this.page.drawText(`${this.pageNumber}`, {
      x: PAGE_WIDTH - MARGIN, y: MARGIN - 20, size: 8, font: this.font, color: GRAY,
    });
  }

  private drawSectionTitle(title: string) {
    this.ensureSpace(30);
    this.page.drawText(title.toUpperCase(), { x: MARGIN, y: this.y, size: 11, font: this.fontBold, color: BLUE });
    this.y -= 6;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y }, end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.75, color: BLUE,
    });
    this.y -= 18;
  }

  private drawIdentificacao(fields: Record<'nome' | 'dataNascimento' | 'sexo' | 'contacto' | 'unidade' | 'professor', string>) {
    this.drawSectionTitle('Identificação');
    const rows: Array<[string, string, string, string]> = [
      ['Nome', fields.nome, 'Data de Nascimento', fields.dataNascimento],
      ['Sexo', fields.sexo, 'Contacto', fields.contacto],
      ['Unidade', fields.unidade, 'Professor', fields.professor],
    ];
    const colX = [MARGIN, MARGIN + 260];
    for (const [label1, value1, label2, value2] of rows) {
      this.ensureSpace(32);
      this.page.drawText(label1.toUpperCase(), { x: colX[0], y: this.y, size: 8, font: this.fontBold, color: GRAY });
      this.page.drawText(label2.toUpperCase(), { x: colX[1], y: this.y, size: 8, font: this.fontBold, color: GRAY });
      this.y -= 14;
      this.page.drawText(pdfSafe(value1), { x: colX[0], y: this.y, size: 11, font: this.font, color: DARK });
      this.page.drawText(pdfSafe(value2), { x: colX[1], y: this.y, size: 11, font: this.font, color: DARK });
      this.y -= 20;
    }
    this.y -= 6;
  }

  private drawHabilidades(fases: any[], studentFases: any[]) {
    this.drawSectionTitle('Habilidades e Avaliação');

    let historicalGap = false;

    for (const fase of fases) {
      this.ensureSpace(24);
      this.page.drawText(pdfSafe(NIVEL_LABEL[fase.nivel] ?? fase.nivel), {
        x: MARGIN, y: this.y, size: 10, font: this.fontBold, color: DARK,
      });
      this.y -= 18;

      const criterios: Criterio[] = JSON.parse(fase.criterios);
      const sf = studentFases.find((x: any) => x.faseId === fase.id);
      const avaliacoesMap = new Map<number, { valor: number; observacao?: string | null }>(
        (sf?.avaliacoes ?? []).map((a: any) => [a.criterioIndex, a]),
      );

      this.ensureSpace(36);
      this.page.drawRectangle({ x: MARGIN, y: this.y - 4, width: CONTENT_WIDTH, height: 18, color: LIGHT_GRAY });
      this.page.drawText(
        `Módulo ${fase.ordem} — ${pdfSafe(fase.nome)} (${fase.certificacao})  ·  Total mínimo: ${fase.totalMinimo} pts`,
        { x: MARGIN + 6, y: this.y, size: 9, font: this.fontBold, color: DARK },
      );
      this.y -= 24;

      const colHabilidade = MARGIN;
      const colHabilidadeWidth = 230;
      const colPontuacao = MARGIN + 240;
      const colObs = MARGIN + 300;
      const colObsWidth = CONTENT_WIDTH - 300;

      this.page.drawText('Habilidade', { x: colHabilidade, y: this.y, size: 8, font: this.fontBold, color: GRAY });
      this.page.drawText('Pontuação', { x: colPontuacao, y: this.y, size: 8, font: this.fontBold, color: GRAY });
      this.page.drawText('Observações', { x: colObs, y: this.y, size: 8, font: this.fontBold, color: GRAY });
      this.y -= 14;

      criterios.forEach((c, i) => {
        const av = avaliacoesMap.get(i);
        let pontuacaoText: string;
        let pontuacaoColor: RGB = DARK;
        if (av) {
          const minimo = c.obrigatoria ? 4 : 3;
          pontuacaoText = String(av.valor);
          pontuacaoColor = av.valor < minimo ? RED : GREEN;
        } else if (sf?.estado === 'CONCLUIDO') {
          pontuacaoText = 'N/D*';
          historicalGap = true;
        } else {
          pontuacaoText = '—';
        }

        const nomeLabel = c.obrigatoria ? `${c.nome} (obrigatória)` : c.nome;
        const nomeLines = wrapText(this.font, nomeLabel, 9, colHabilidadeWidth);
        const obsLines = av?.observacao ? wrapText(this.font, av.observacao, 8, colObsWidth) : [''];
        const rowLines = Math.max(nomeLines.length, obsLines.length);
        const rowHeight = rowLines * 12 + 6;

        this.ensureSpace(rowHeight + 4);

        nomeLines.forEach((line, li) => {
          this.page.drawText(line, { x: colHabilidade, y: this.y - li * 12, size: 9, font: this.font, color: DARK });
        });
        this.page.drawText(pontuacaoText, { x: colPontuacao, y: this.y, size: 9, font: this.fontBold, color: pontuacaoColor });
        obsLines.forEach((line, li) => {
          this.page.drawText(pdfSafe(line), { x: colObs, y: this.y - li * 11, size: 8, font: this.font, color: GRAY });
        });

        this.y -= rowHeight;
        this.page.drawLine({
          start: { x: MARGIN, y: this.y + 4 }, end: { x: PAGE_WIDTH - MARGIN, y: this.y + 4 },
          thickness: 0.3, color: LIGHT_GRAY,
        });
      });

      this.y -= 12;
    }

    if (historicalGap) {
      this.ensureSpace(20);
      this.page.drawText('* Pontuação não disponível — módulo concluído antes da introdução da avaliação numérica.', {
        x: MARGIN, y: this.y, size: 7.5, font: this.font, color: GRAY,
      });
      this.y -= 20;
    }
  }

  private drawLegenda(fases: any[]) {
    this.drawSectionTitle('Legenda');

    this.ensureSpace(16);
    this.page.drawText('Escala de Avaliação', { x: MARGIN, y: this.y, size: 9, font: this.fontBold, color: DARK });
    this.y -= 16;

    const colPontos = MARGIN;
    const colNivel = MARGIN + 45;
    const colDesc = MARGIN + 120;
    const colDescWidth = CONTENT_WIDTH - 120;

    for (const item of ESCALA_LEGENDA) {
      const descLines = wrapText(this.font, item.descricao, 8, colDescWidth);
      const rowHeight = descLines.length * 11 + 6;
      this.ensureSpace(rowHeight);
      this.page.drawText(String(item.pontos), { x: colPontos, y: this.y, size: 9, font: this.fontBold, color: DARK });
      this.page.drawText(item.nivel, { x: colNivel, y: this.y, size: 9, font: this.fontBold, color: DARK });
      descLines.forEach((line, li) => {
        this.page.drawText(line, { x: colDesc, y: this.y - li * 11, size: 8, font: this.font, color: GRAY });
      });
      this.y -= rowHeight;
    }

    this.y -= 10;
    this.ensureSpace(16);
    this.page.drawText('Regras de Progressão', { x: MARGIN, y: this.y, size: 9, font: this.fontBold, color: DARK });
    this.y -= 16;

    for (const regra of REGRAS_LEGENDA) {
      const lines = wrapText(this.font, `• ${regra}`, 8.5, CONTENT_WIDTH);
      const rowHeight = lines.length * 12 + 2;
      this.ensureSpace(rowHeight);
      lines.forEach((line, li) => {
        this.page.drawText(line, { x: MARGIN, y: this.y - li * 12, size: 8.5, font: this.font, color: DARK });
      });
      this.y -= rowHeight;
    }

    this.y -= 10;
    this.ensureSpace(16);
    this.page.drawText('Total Mínimo Acumulado por Módulo', { x: MARGIN, y: this.y, size: 9, font: this.fontBold, color: DARK });
    this.y -= 16;

    const perRow = 3;
    const colWidth = CONTENT_WIDTH / perRow;
    for (let i = 0; i < fases.length; i += perRow) {
      this.ensureSpace(16);
      const chunk = fases.slice(i, i + perRow);
      chunk.forEach((f, idx) => {
        this.page.drawText(`${f.ordem}. ${pdfSafe(f.nome)}: ${f.totalMinimo} pts`, {
          x: MARGIN + idx * colWidth, y: this.y, size: 8, font: this.font, color: DARK,
        });
      });
      this.y -= 14;
    }
  }
}
