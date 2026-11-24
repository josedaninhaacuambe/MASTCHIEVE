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
