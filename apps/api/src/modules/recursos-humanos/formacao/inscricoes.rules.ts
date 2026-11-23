// Regras puras da gestão de inscrições em formações (sem base de dados, testáveis).

/** Estados de inscrição que ocupam uma vaga. Desistências e cancelamentos libertam-na. */
export const ESTADOS_QUE_OCUPAM_VAGA = ['INSCRITO', 'CONCLUIDO'] as const;

/** Só se inscreve em formações com orçamento aprovado ou já em curso. */
export const ESTADOS_FORMACAO_ABERTOS = ['APROVADA_ORCAMENTO', 'EM_CURSO'] as const;

export function ocupaVaga(estado: string): boolean {
  return (ESTADOS_QUE_OCUPAM_VAGA as readonly string[]).includes(estado);
}

export function formacaoAceitaInscricoes(estado: string): boolean {
  return (ESTADOS_FORMACAO_ABERTOS as readonly string[]).includes(estado);
}

export interface ResumoVagas {
  vagas: number | null;
  ocupadas: number;
  disponiveis: number | null;
  esgotada: boolean;
}

export function resumoVagas(vagas: number | null | undefined, estados: string[]): ResumoVagas {
  const ocupadas = estados.filter(ocupaVaga).length;
  if (vagas == null) return { vagas: null, ocupadas, disponiveis: null, esgotada: false };
  const disponiveis = Math.max(0, vagas - ocupadas);
  return { vagas, ocupadas, disponiveis, esgotada: disponiveis === 0 };
}

/** Conta por estado, para o painel (inscritos, concluídos, desistências, cancelados). */
export function contagemPorEstado(estados: string[]): Record<string, number> {
  const r: Record<string, number> = { INSCRITO: 0, CONCLUIDO: 0, DESISTIU: 0, CANCELADA: 0 };
  for (const e of estados) r[e] = (r[e] ?? 0) + 1;
  return r;
}
