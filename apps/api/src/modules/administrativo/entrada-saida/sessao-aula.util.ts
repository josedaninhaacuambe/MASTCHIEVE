// Regras puras da sessão de aula de um atleta (entrada → saída), sem base de dados.
//
// - Cada ENTRADA gera logo uma SAIDA automática ao fim de DURACAO_AULA_MIN minutos.
// - Uma saída/cancelamento manual só é aceite se houver uma entrada em aberto; substitui
//   a saída automática (aula encurtada ou prolongada, falta de internet, etc.).
// - Não se aceita nova entrada enquanto o atleta ainda está numa aula.

export const DURACAO_AULA_MIN = 50;
/** Até quantas horas depois da entrada ainda se pode registar a saída manual dela. */
export const JANELA_SAIDA_MAX_H = 12;

const MIN = 60_000;
const TIPOS_SAIDA = ['SAIDA', 'CANCELAMENTO'];

export type RegistoSessao = { id: string; tipo: string; dataHora: Date; automatica: boolean };

export function saidaAutomaticaPara(entrada: Date): Date {
  return new Date(entrada.getTime() + DURACAO_AULA_MIN * MIN);
}

const ordenar = (regs: RegistoSessao[]) => [...regs].sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime());

/** Primeira saída/cancelamento depois da entrada, antes da entrada seguinte. */
function fechoDe(regs: RegistoSessao[], entrada: RegistoSessao): RegistoSessao | undefined {
  for (const r of regs) {
    if (r.id === entrada.id || r.dataHora.getTime() < entrada.dataHora.getTime()) continue;
    if (r.tipo === 'ENTRADA') return undefined;
    if (TIPOS_SAIDA.includes(r.tipo)) return r;
  }
  return undefined;
}

export function horaCurta(d: Date): string {
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Maputo' });
}

/** Devolve a mensagem de erro se não for possível registar uma entrada na hora indicada, ou null. */
export function validarNovaEntrada(registos: RegistoSessao[], hora: Date): string | null {
  const regs = ordenar(registos);
  const t = hora.getTime();
  for (const e of regs) {
    if (e.tipo !== 'ENTRADA') continue;
    const inicio = e.dataHora.getTime();
    const fim = (fechoDe(regs, e)?.dataHora ?? saidaAutomaticaPara(e.dataHora)).getTime();
    if (inicio <= t && t < fim) {
      return `O atleta já tem uma entrada às ${horaCurta(e.dataHora)} e a aula só termina às ${horaCurta(new Date(fim))}`;
    }
    if (inicio > t && inicio < saidaAutomaticaPara(hora).getTime()) {
      return `Já existe uma entrada deste atleta às ${horaCurta(e.dataHora)}, que coincide com esta aula`;
    }
  }
  return null;
}

export type DecisaoSaida =
  | { erro: string }
  | { entrada: RegistoSessao; substituir?: RegistoSessao };

/** Decide como registar uma saída/cancelamento manual na hora indicada. */
export function decidirSaidaManual(registos: RegistoSessao[], hora: Date): DecisaoSaida {
  const regs = ordenar(registos);
  const t = hora.getTime();
  const entrada = [...regs].reverse().find((r) => r.tipo === 'ENTRADA' && r.dataHora.getTime() <= t);
  if (!entrada || t - entrada.dataHora.getTime() > JANELA_SAIDA_MAX_H * 60 * MIN) {
    return { erro: 'Este atleta não tem entrada registada. Registe primeiro a entrada.' };
  }
  const fecho = fechoDe(regs, entrada);
  if (fecho && !fecho.automatica) {
    return { erro: `A saída deste atleta já foi registada às ${horaCurta(fecho.dataHora)}` };
  }
  return { entrada, substituir: fecho };
}
