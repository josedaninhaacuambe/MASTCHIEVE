'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Share2, Copy, Check, Save, Link2, Pencil, X,
  Upload, Eye, EyeOff, ExternalLink, Trash2, AlertTriangle,
} from 'lucide-react';

const SLUGS: Record<string, string> = {
  NEWSLETTER: '/newsletter',
  OPEN_DAY: '/open-day',
  PROGRAMA_ANUAL: '/programa-anual',
  TREINADOR_CLIENTE: '/treinador-cliente',
  VIDEO_INDUCAO: '/video-inducao',
};

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/api\/v1\/?$/, '');

interface LinkPartilha {
  id: string;
  chave: string;
  label: string;
  titulo?: string | null;
  subtitulo?: string | null;
  conteudo?: string | null;
  imagemUrl?: string | null;
  videoUrl?: string | null;
  ctaTexto?: string | null;
  ctaUrl?: string | null;
  ativo: boolean;
}

function EditModal({ link, onClose }: { link: LinkPartilha; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    titulo: link.titulo ?? '',
    subtitulo: link.subtitulo ?? '',
    conteudo: link.conteudo ?? '',
    videoUrl: link.videoUrl ?? '',
    ctaTexto: link.ctaTexto ?? '',
    ctaUrl: link.ctaUrl ?? '',
    ativo: link.ativo,
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const salvar = useMutation({
    mutationFn: async () => {
      await api.put(`/link-partilha/${link.chave}`, form);
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await api.post(`/link-partilha/${link.chave}/imagem`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links-partilha'] });
      onClose();
    },
  });

  const imagemAtual = preview ?? (link.imagemUrl ? `${API_ORIGIN}${link.imagemUrl}` : null);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-gray-900">Editar conteúdo — {link.label}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Título</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={link.label}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Subtítulo</label>
            <input
              value={form.subtitulo}
              onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Conteúdo</label>
            <textarea
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Imagem de capa</label>
            {imagemAtual && (
              <img src={imagemAtual} alt="" className="w-full h-32 object-cover rounded-xl mb-2 border border-gray-100" />
            )}
            <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" /> {file ? file.name : 'Escolher imagem'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Vídeo (YouTube ou Vimeo)</label>
            <input
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Texto do botão</label>
              <input
                value={form.ctaTexto}
                onChange={(e) => setForm({ ...form, ctaTexto: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Inscrever-me"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Link do botão</label>
              <input
                value={form.ctaUrl}
                onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Página publicada (visível ao público)</span>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => salvar.mutate()}
            disabled={salvar.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
          >
            <Save className="w-4 h-4" /> {salvar.isPending ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteContentModal({ link, onClose }: { link: LinkPartilha; onClose: () => void }) {
  const qc = useQueryClient();

  const apagar = useMutation({
    mutationFn: () => api.delete(`/link-partilha/${link.chave}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links-partilha'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <h2 className="font-bold text-lg text-gray-900 mb-1.5">Apagar conteúdo?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Isto remove o título, texto, imagem, vídeo e botão de <strong>{link.label}</strong> e volta a página a
          rascunho (deixa de ficar visível ao público). Não pode ser desfeito.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => apagar.mutate()}
            disabled={apagar.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
          >
            <Trash2 className="w-4 h-4" /> {apagar.isPending ? 'A apagar...' : 'Apagar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkCard({ link, onEdit, onDelete }: { link: LinkPartilha; onEdit: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const slug = SLUGS[link.chave] ?? `/${link.chave.toLowerCase()}`;
  const realUrl = typeof window !== 'undefined' ? `${window.location.origin}${slug}` : slug;

  const copiar = async () => {
    await navigator.clipboard.writeText(realUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{link.label}</h3>
            <p className="text-xs text-gray-400">{link.chave}</p>
          </div>
        </div>
        {link.ativo ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
            <Eye className="w-3 h-3" /> Publicado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            <EyeOff className="w-3 h-3" /> Rascunho
          </span>
        )}
      </div>

      <a
        href={realUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-3 truncate"
      >
        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" /> {realUrl}
      </a>

      <div className="flex gap-2">
        <button
          onClick={copiar}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado!' : 'Copiar link'}
        </button>
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
        >
          <Pencil className="w-3.5 h-3.5" /> Editar conteúdo
        </button>
        <button
          onClick={onDelete}
          title="Apagar conteúdo"
          className="flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
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

  const [editing, setEditing] = useState<LinkPartilha | null>(null);
  const [deleting, setDeleting] = useState<LinkPartilha | null>(null);
  const links: LinkPartilha[] = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-cyan-600" /> Central de Partilha
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Páginas públicas geridas pelo Assistente Administrativo — newsletter, programa anual, open day, treinador do cliente e vídeo de indução.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400">A carregar...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onEdit={() => setEditing(link)}
              onDelete={() => setDeleting(link)}
            />
          ))}
        </div>
      )}

      {editing && <EditModal link={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteContentModal link={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
