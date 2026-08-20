'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Share2, Copy, Check, Save, Link2 } from 'lucide-react';

function LinkCard({ link }: { link: { id: string; chave: string; label: string; url: string } }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState(link.url);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: (novaUrl: string) => api.put(`/link-partilha/${link.chave}`, { url: novaUrl }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['links-partilha'] }),
  });

  const copiar = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-4 h-4 text-cyan-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{link.label}</h3>
          <p className="text-xs text-gray-400">{link.chave}</p>
        </div>
      </div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        placeholder="https://..."
      />
      <div className="flex gap-2">
        <button
          onClick={copiar}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado!' : 'Copiar link'}
        </button>
        <button
          onClick={() => mutation.mutate(url)}
          disabled={mutation.isPending || url === link.url}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
        >
          <Save className="w-3.5 h-3.5" /> {mutation.isPending ? 'A guardar...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

export default function CentralPartilhaPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['links-partilha'],
    queryFn: async () => {
      const { data } = await api.get('/link-partilha');
      return data.data ?? [];
    },
  });

  const links: any[] = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-cyan-600" /> Central de Partilha
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Links geridos pelo Assistente Administrativo — newsletter, programa anual, open day, treinador do cliente e vídeo de indução.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400">A carregar...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
