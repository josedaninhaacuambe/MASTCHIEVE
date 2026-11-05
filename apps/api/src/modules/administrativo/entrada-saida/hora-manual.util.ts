// Regras da hora indicada manualmente nos registos de entrada/saída.
export const HORA_MANUAL_MAX_DIAS = 7;
const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000; // relógios ligeiramente desacertados

/** Devolve a mensagem de erro, ou null se a hora for aceitável. */
export function validarHoraManual(hora: Date, agora: Date = new Date()): string | null {
  if (Number.isNaN(hora.getTime())) return 'Hora inválida';
  if (hora.getTime() > agora.getTime() + TOLERANCIA_FUTURO_MS) return 'A hora do registo não pode estar no futuro';
  if (agora.getTime() - hora.getTime() > HORA_MANUAL_MAX_DIAS * 24 * 60 * 60 * 1000) {
    return `Só é possível registar até ${HORA_MANUAL_MAX_DIAS} dias atrás`;
  }
  return null;
}
