// Regras puras do registo de presenças de convidados (atletas de outra turma).
// Mantidas fora do serviço para poderem ser testadas sem base de dados.

export interface ContextoConvidado {
  atletaExiste: boolean;
  atletaAtivo: boolean;
  inscritoNaTurma: boolean;
  jaRegistadoNaAula: boolean;
}

/** Devolve a mensagem de erro, ou null se o convidado pode ser registado. */
export function validarConvidado(ctx: ContextoConvidado): string | null {
  if (!ctx.atletaExiste) return 'Atleta não encontrado';
  if (!ctx.atletaAtivo) return 'Atleta inactivo — reactive a ficha antes de registar presença';
  if (ctx.jaRegistadoNaAula) return 'Este atleta já tem presença registada nesta aula';
  if (ctx.inscritoNaTurma) return 'Este atleta pertence a esta turma — marque a presença na lista normal';
  return null;
}

/** Valida horas de entrada/saída (saída nunca anterior à entrada). */
export function validarHorario(entrada?: Date | null, saida?: Date | null): string | null {
  if (entrada && isNaN(entrada.getTime())) return 'Hora de entrada inválida';
  if (saida && isNaN(saida.getTime())) return 'Hora de saída inválida';
  if (entrada && saida && saida.getTime() < entrada.getTime()) return 'A hora de saída não pode ser anterior à hora de entrada';
  return null;
}

/**
 * Escolhe a turma de origem do convidado entre as suas inscrições activas:
 * a indicada explicitamente (se for válida), senão a da mesma unidade da aula,
 * senão a primeira.
 */
export function escolherTurmaOrigem(
  inscricoes: { classId: string; unidadeId: string | null }[],
  unidadeDaAula: string | null,
  pedida?: string,
): string | null {
  if (pedida) return inscricoes.some((i) => i.classId === pedida) ? pedida : null;
  const mesmaUnidade = unidadeDaAula ? inscricoes.find((i) => i.unidadeId === unidadeDaAula) : undefined;
  return (mesmaUnidade ?? inscricoes[0])?.classId ?? null;
}
