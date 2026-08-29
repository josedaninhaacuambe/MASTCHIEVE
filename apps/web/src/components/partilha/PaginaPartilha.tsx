'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Waves, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/api\/v1\/?$/, '');

function toAbsoluteUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}

export function toEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '');
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (u.pathname.startsWith('/embed/')) return url;
    }
    if (u.hostname.includes('vimeo.com')) {
      if (u.hostname.includes('player.vimeo.com')) return url;
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
    return url;
  } catch {
    return null;
  }
}

interface ConteudoPartilha {
  chave: string;
  label: string;
  titulo?: string | null;
  subtitulo?: string | null;
  conteudo?: string | null;
  imagemUrl?: string | null;
  videoUrl?: string | null;
  ctaTexto?: string | null;
  ctaUrl?: string | null;
}

export default function PaginaPartilha({ chave }: { chave: string }) {
  const { data, isLoading, isError } = useQuery<ConteudoPartilha>({
    queryKey: ['link-partilha-public', chave],
    queryFn: async () => {
      const { data } = await api.get(`/link-partilha/public/${chave}`);
      return data.data ?? data;
    },
    retry: false,
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">Mastchieve</span>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            A carregar...
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Página indisponível</h1>
            <p className="text-gray-500 text-sm max-w-sm">
              Este conteúdo ainda não foi publicado ou já não está disponível.
            </p>
            <Link href="/" className="mt-6 text-blue-600 text-sm font-semibold hover:underline">
              Voltar à página inicial
            </Link>
          </div>
        )}

        {data && (
          <article>
            {data.imagemUrl && (
              <img
                src={toAbsoluteUrl(data.imagemUrl) ?? undefined}
                alt={data.titulo ?? data.label}
                className="w-full max-h-96 object-cover rounded-2xl mb-8 border border-gray-100"
              />
            )}

            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              {data.titulo || data.label}
            </h1>

            {data.subtitulo && (
              <p className="text-lg text-gray-500 mb-8">{data.subtitulo}</p>
            )}

            {data.videoUrl && toEmbedUrl(data.videoUrl) && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 mb-8 shadow-lg">
                <iframe
                  src={toEmbedUrl(data.videoUrl) ?? ''}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {data.conteudo && (
              <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap mb-10">
                {data.conteudo}
              </div>
            )}

            {data.ctaTexto && data.ctaUrl && (
              <a
                href={data.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
              >
                {data.ctaTexto} <ArrowRight className="w-5 h-5" />
              </a>
            )}
          </article>
        )}
      </main>

      <footer className="border-t border-gray-100 py-8">
        <p className="text-center text-gray-400 text-xs">© 2026 Mastchieve. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
