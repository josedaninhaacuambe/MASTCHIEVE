import * as XLSX from 'xlsx';

/** Turnos fixos da folha de presenças diárias (blocos de 50 min, de hora a hora). */
export const TURNOS_PADRAO: string[] = Array.from({ length: 12 }, (_, i) => {
  const h = 5 + i;
  const fim = `${String(h + 1).padStart(2, '0')}:20`;
  return `${String(h).padStart(2, '0')}:30-${fim}`;
});

/** Linhas por bloco no modelo (o bloco cresce se houver mais atletas). */
export const LINHAS_POR_BLOCO = 8;
export const BLOCOS_POR_LINHA = 3;

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

export interface LinhaRelatorio {
  nome: string;
  trabalhadorBm: string;
  contacto: string;
  modulo: string;
  idade: number | null;
}

export interface TurnoRelatorio {
  turno: string;
  atletas: LinhaRelatorio[];
}

/** "YYYY-MM-DD" válido → Date local às 00:00; caso contrário null. */
export function parseDataRelatorio(s: unknown): Date | null {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function diaDaSemana(d: Date): string {
  return DIAS[d.getDay()];
}

export function idadeNaData(nascimento: Date, ref: Date): number {
  let anos = ref.getFullYear() - nascimento.getFullYear();
  const m = ref.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < nascimento.getDate())) anos--;
  return anos;
}

/** Hora "H:MM" ou "HH:MM" normalizada para "HH:MM"; inválida → null. */
function normHora(h: string | null | undefined): string | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(h ?? '').trim());
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

/**
 * Turno de uma aula: se começar à hora de um turno fixo, fica nesse bloco;
 * caso contrário, cria-se um bloco com o horário da própria aula.
 */
export function turnoDaAula(startTime: string, endTime: string): string {
  const ini = normHora(startTime);
  if (!ini) return 'Sem horário';
  const padrao = TURNOS_PADRAO.find((t) => t.startsWith(ini));
  if (padrao) return padrao;
  const fim = normHora(endTime);
  return fim ? `${ini}-${fim}` : ini;
}

/** Junta os turnos fixos (mesmo vazios, como na folha) aos turnos extra, por ordem de hora. */
export function ordenarTurnos(porTurno: Map<string, LinhaRelatorio[]>): TurnoRelatorio[] {
  const todos = new Set<string>([...TURNOS_PADRAO, ...porTurno.keys()]);
  return [...todos]
    .sort((a, b) => (a === 'Sem horário' ? 1 : b === 'Sem horário' ? -1 : a.localeCompare(b)))
    .map((turno) => ({
      turno,
      atletas: (porTurno.get(turno) ?? []).slice().sort((x, y) => x.nome.localeCompare(y.nome, 'pt')),
    }));
}

/** Moçambique está sempre em UTC+2 (sem hora de Verão). */
const OFFSET_MAPUTO_MIN = 120;

/** Início e fim (UTC) do dia civil de Maputo correspondente a "YYYY-MM-DD". */
export function intervaloDiaMaputo(dataStr: string): { inicio: Date; fim: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return null;
  const [y, m, d] = dataStr.split('-').map(Number);
  const inicio = new Date(Date.UTC(y, m - 1, d) - OFFSET_MAPUTO_MIN * 60_000);
  return { inicio, fim: new Date(inicio.getTime() + 24 * 60 * 60_000) };
}

/**
 * Turno da folha em que cai uma entrada registada na recepção. Cada turno fixo (HH:30-HH+1:20)
 * aceita entradas desde 10 min antes do início até ao fim; fora disso fica "Outros horários".
 */
export function turnoDaEntrada(hora: Date): string {
  const local = new Date(hora.getTime() + OFFSET_MAPUTO_MIN * 60_000);
  const min = local.getUTCHours() * 60 + local.getUTCMinutes();
  for (const t of TURNOS_PADRAO) {
    const [ini, fim] = t.split('-').map((h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; });
    if (min >= ini - 10 && min < fim) return t;
  }
  return 'Outros horários';
}

/** Folha Excel no modelo "PRESENÇAS DIÁRIAS DAS AULAS": 3 blocos de turno por linha. */
export function gerarExcelRelatorioDiario(opts: {
  titulo: string;
  data: Date;
  unidade: string | null;
  turnos: TurnoRelatorio[];
}): Buffer {
  const COLS = ['Ord', 'Nome e Apelido', 'Trabalhador do BM', 'Contacto', 'Módulo', 'Idade'];
  const LARG = COLS.length + 1; // +1 coluna de separação entre blocos
  const aoa: any[][] = [];
  const merges: XLSX.Range[] = [];
  const totalCols = BLOCOS_POR_LINHA * LARG - 1;

  const linha = (r: number) => (aoa[r] ??= []);
  linha(0)[0] = opts.titulo;
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });
  linha(1)[0] = 'Dia da Semana';
  linha(1)[1] = diaDaSemana(opts.data);
  linha(1)[3] = 'Data';
  linha(1)[4] = `${String(opts.data.getDate()).padStart(2, '0')}/${String(opts.data.getMonth() + 1).padStart(2, '0')}/${opts.data.getFullYear()}`;
  if (opts.unidade) { linha(1)[7] = 'Unidade'; linha(1)[8] = opts.unidade; }
  const total = opts.turnos.reduce((s, t) => s + t.atletas.length, 0);
  linha(1)[10] = 'Total de presenças';
  linha(1)[11] = total;

  let r = 3;
  for (let i = 0; i < opts.turnos.length; i += BLOCOS_POR_LINHA) {
    const grupo = opts.turnos.slice(i, i + BLOCOS_POR_LINHA);
    const altura = Math.max(LINHAS_POR_BLOCO, ...grupo.map((t) => t.atletas.length));
    grupo.forEach((t, b) => {
      const c0 = b * LARG;
      linha(r)[c0] = `${t.turno}  (${t.atletas.length})`;
      merges.push({ s: { r, c: c0 }, e: { r, c: c0 + COLS.length - 1 } });
      COLS.forEach((h, k) => { linha(r + 1)[c0 + k] = h; });
      for (let k = 0; k < altura; k++) {
        const a = t.atletas[k];
        const row = linha(r + 2 + k);
        row[c0] = k + 1;
        if (a) {
          row[c0 + 1] = a.nome;
          row[c0 + 2] = a.trabalhadorBm;
          row[c0 + 3] = a.contacto;
          row[c0 + 4] = a.modulo;
          row[c0 + 5] = a.idade ?? '';
        }
      }
    });
    r += altura + 3;
  }

  // Normaliza linhas em falta para o SheetJS.
  for (let k = 0; k < aoa.length; k++) aoa[k] ??= [];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;
  const larguras = [5, 26, 18, 14, 18, 6, 2];
  ws['!cols'] = Array.from({ length: totalCols }, (_, c) => ({ wch: larguras[c % LARG] }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Presenças');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function tituloRelatorio(data: Date, projecto = 'PROJETO 1C1N'): string {
  return `PRESENÇAS DIÁRIAS DAS AULAS DO ${projecto} - ${MESES[data.getMonth()]} DE ${data.getFullYear()}`;
}
