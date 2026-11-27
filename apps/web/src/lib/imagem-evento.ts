const API_URL = (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/$/, '');

/**
 * Endereço público de uma imagem / cartaz de evento. Passa pela API (mesmo caminho que
 * todos os outros pedidos), em vez de depender do encaminhamento de /uploads no domínio da web.
 */
export function srcImagemEvento(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  const nome = url.split('/').pop() ?? '';
  return `${API_URL}/eventos-publicos/imagem/${encodeURIComponent(nome)}`;
}

/**
 * Outras imagens públicas carregadas (link de partilha, foto de instrutor).
 * Servidas pela API (`/ficheiros/imagem/:nome`), que só entrega imagens
 * registadas — nunca documentos ou outros uploads.
 */
export function srcImagemPublica(url?: string | null): string | null {
  if (!url) return null;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  const nome = url.split('/').pop() ?? '';
  if (!nome) return null;
  return `${API_URL}/ficheiros/imagem/${encodeURIComponent(nome)}`;
}
