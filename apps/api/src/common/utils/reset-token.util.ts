import { createHash, randomBytes } from 'crypto';

// Tokens de definição/recuperação de palavra-passe: só o hash fica na base de dados.
export const VALIDADE_RECUPERACAO_MS = 60 * 60 * 1000; // 1 hora
export const VALIDADE_CONVITE_MS = 72 * 60 * 60 * 1000; // 72 horas

/** Início do valor guardado para um token; serve também para o procurar. */
export function prefixoReset(token: string): string {
  return `reset:${createHash('sha256').update(token).digest('hex')}:`;
}

export function gerarTokenReset(validadeMs: number, agora: number = Date.now()) {
  const token = randomBytes(32).toString('hex');
  const expira = agora + validadeMs;
  return { token, armazenado: `${prefixoReset(token)}${expira}`, expiraEm: new Date(expira) };
}

export function tokenResetValido(armazenado: string | null | undefined, token: string, agora: number = Date.now()): boolean {
  const prefixo = prefixoReset(token);
  if (!armazenado?.startsWith(prefixo)) return false;
  const expira = Number(armazenado.slice(prefixo.length));
  return Number.isFinite(expira) && expira > agora;
}
