/**
 * Quem deve receber comunicações sobre um atleta: a conta do próprio atleta e as contas
 * de todos os encarregados. Os emails gerados automaticamente pelo sistema
 * (ex.: atleta_123_ab12cd34@mastchieve.com) não são contactos reais e nunca são usados para envio.
 */
const EMAIL_GERADO = /^(atleta|encarregado)_\d+_[^@]*@mastchieve\.com$/i;

export function emailContactavel(email?: string | null): string | null {
  const e = (email ?? '').trim();
  if (!e || !e.includes('@') || EMAIL_GERADO.test(e)) return null;
  return e;
}

type UserLite = { id: string; email?: string | null; isActive?: boolean } | null | undefined;

export interface Destinatario {
  userId: string;
  email: string | null;
  papel: 'ATLETA' | 'ENCARREGADO';
}

export function destinatariosDoAtleta(student: {
  user?: UserLite;
  parents?: { parent?: { user?: UserLite } | null }[];
}): Destinatario[] {
  const lista: Destinatario[] = [];
  const vistos = new Set<string>();
  const add = (u: UserLite, papel: Destinatario['papel']) => {
    if (!u?.id || vistos.has(u.id) || u.isActive === false) return;
    vistos.add(u.id);
    lista.push({ userId: u.id, email: emailContactavel(u.email), papel });
  };
  add(student.user, 'ATLETA');
  for (const sp of student.parents ?? []) add(sp.parent?.user, 'ENCARREGADO');
  return lista;
}
