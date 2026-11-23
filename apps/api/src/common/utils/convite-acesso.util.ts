import * as crypto from 'crypto';

/** Validade de um convite de acesso (link de uso único para definir a password). */
export const VALIDADE_CONVITE_HORAS = 72;

/** O token em claro só existe no link; na base de dados fica apenas o SHA-256. */
export function hashTokenConvite(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function gerarTokenConvite(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashTokenConvite(token) };
}

/** Token com formato válido (64 hex) — evita consultas à base de dados com lixo. */
export function tokenConviteValido(token: unknown): token is string {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
}

/** Emails gerados automaticamente pelo sistema não são caixas de correio reais. */
export function emailGeradoAutomaticamente(email: string | null | undefined): boolean {
  return !!email && /^(atleta|encarregado)_\d+_.*@mastchieve\.com$/i.test(email);
}
