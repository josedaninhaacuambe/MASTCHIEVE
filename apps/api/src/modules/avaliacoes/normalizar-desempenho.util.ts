export interface CriterioDesempenho {
  nome: string;
  valor: number | null;
  max: number;
}

export interface RegistoDesempenho {
  id: string;
  origem: 'PERFORMANCE_RECORD' | 'AVALIACAO';
  recordedAt: Date;
  overallScore: number | null;
  criterios: CriterioDesempenho[];
  notes: string | null;
}

const LEGACY_CRITERIOS: { key: string; nome: string }[] = [
  { key: 'technique', nome: 'Técnica' },
  { key: 'stamina', nome: 'Resistência' },
  { key: 'speed', nome: 'Velocidade' },
  { key: 'coordination', nome: 'Coordenação' },
  { key: 'breathing', nome: 'Respiração' },
  { key: 'turns', nome: 'Viragens' },
  { key: 'startDive', nome: 'Saída' },
];

// Registo antigo (7 métricas fixas, escala 1-10) — sintetiza criterios[] a partir dos campos fixos.
export function normalizarPerformanceRecord(record: any): RegistoDesempenho {
  return {
    id: record.id,
    origem: 'PERFORMANCE_RECORD',
    recordedAt: record.recordedAt,
    overallScore: record.overallScore ?? null,
    criterios: LEGACY_CRITERIOS.map(({ key, nome }) => ({ nome, valor: record[key] ?? null, max: 10 })),
    notes: record.instructorNotes ?? null,
  };
}

// Avaliação diária nova — critérios do módulo ativo do aluno, escala 1-5.
export function normalizarAvaliacaoDiaria(avaliacao: any): RegistoDesempenho {
  const pontuacoes: { nome: string; valor: number | null }[] = JSON.parse(avaliacao.pontuacoes);
  return {
    id: avaliacao.id,
    origem: 'AVALIACAO',
    recordedAt: avaliacao.avaliadoEm,
    overallScore: avaliacao.notaGlobal ?? null,
    criterios: pontuacoes.map(p => ({ nome: p.nome, valor: p.valor, max: 5 })),
    notes: avaliacao.observacoes ?? null,
  };
}

export function mesclarRegistosDesempenho(performanceRecords: any[], avaliacoesDiarias: any[]): RegistoDesempenho[] {
  return [
    ...performanceRecords.map(normalizarPerformanceRecord),
    ...avaliacoesDiarias.map(normalizarAvaliacaoDiaria),
  ].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}
