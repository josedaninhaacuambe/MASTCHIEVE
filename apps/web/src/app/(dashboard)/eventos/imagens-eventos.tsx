'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { ImagePlus, Star, Trash2, Check } from 'lucide-react';
import { erroMsg } from './programa-eventos';

const MAX_MB = 8;
const MAX_IMAGENS = 12;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

/** Imagens e cartazes de um evento. Ficam públicos no link de inscrição. */
export function ImagensTab({ evento, podeEditar, onChanged }: { evento: any; podeEditar: boolean; onChanged?: () => void }) {
  const [imagens, setImagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [legendas, setLegendas] = useState<Record<string, string>>({});
  const input = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/eventos/${evento.id}/imagens`);
      const lista = r.data.data ?? r.data;
      setImagens(lista);
      setLegendas(Object.fromEntries(lista.map((i: any) => [i.id, i.legenda ?? ''])));
    } catch (e) { toast.error(erroMsg(e)); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [evento.id]);

  const enviar = async (files: FileList | null) => {
    if (!files?.length) return;
    const lista = Array.from(files).slice(0, Math.max(0, MAX_IMAGENS - imagens.length));
    if (lista.length < files.length) toast.error(`Máximo de ${MAX_IMAGENS} imagens por evento`);
    setEnviando(true);
    let ok = 0;
    for (const f of lista) {
      if (!TIPOS.includes(f.type)) { toast.error(`${f.name}: use JPEG, PNG ou WEBP`); continue; }
      if (f.size > MAX_MB * 1024 * 1024) { toast.error(`${f.name}: maior que ${MAX_MB} MB`); continue; }
      try {
        const fd = new FormData();
        fd.append('file', f);
        await api.post(`/eventos/${evento.id}/imagens`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        ok++;
      } catch (e) { toast.error(`${f.name}: ${erroMsg(e)}`); }
    }
    setEnviando(false);
    if (input.current) input.current.value = '';
    if (ok) { toast.success(ok === 1 ? 'Imagem adicionada' : `${ok} imagens adicionadas`); onChanged?.(); }
    load();
  };

  const actualizar = async (id: string, dados: any, msg: string) => {
    try {
      await api.put(`/eventos/imagens/${id}`, dados);
      toast.success(msg);
      onChanged?.();
      load();
    } catch (e) { toast.error(erroMsg(e)); }
  };

  const remover = async (img: any) => {
    if (!confirm('Remover esta imagem? Deixa de aparecer no link público.')) return;
    try {
      await api.delete(`/eventos/imagens/${img.id}`);
      toast.success('Imagem removida');
      onChanged?.();
      load();
    } catch (e) { toast.error(erroMsg(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-3">
        As imagens aparecem no <strong>link público</strong> do evento. A marcada com ★ é o <strong>cartaz principal</strong>.
        Não publique dados pessoais nem fotografias de crianças sem autorização dos encarregados.
      </div>

      {podeEditar && (
        <div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => enviar(e.target.files)} />
          <button onClick={() => input.current?.click()} disabled={enviando || imagens.length >= MAX_IMAGENS}
            className="inline-flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <ImagePlus className="w-4 h-4" />{enviando ? 'A enviar…' : 'Adicionar imagens / cartaz'}
          </button>
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG ou WEBP · até {MAX_MB} MB cada · máximo {MAX_IMAGENS} por evento ({imagens.length}/{MAX_IMAGENS})</p>
        </div>
      )}

      {loading ? <p className="text-sm text-gray-400">A carregar…</p> : imagens.length === 0 ? (
        <p className="text-sm text-gray-400">Este evento ainda não tem imagens.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {imagens.map((img) => (
            <div key={img.id} className={`rounded-xl border overflow-hidden ${img.cartaz ? 'border-amber-400 ring-1 ring-amber-300' : 'border-gray-200'}`}>
              <a href={img.url} target="_blank" rel="noopener noreferrer" className="block bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.legenda || 'Imagem do evento'} className="w-full h-44 object-contain" loading="lazy" />
              </a>
              <div className="p-2 space-y-2">
                {img.cartaz && <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><Star className="w-3.5 h-3.5 fill-amber-400" />Cartaz principal</span>}
                {podeEditar ? (
                  <>
                    <div className="flex gap-1">
                      <input value={legendas[img.id] ?? ''} maxLength={150} placeholder="Legenda (opcional)"
                        onChange={(e) => setLegendas((l) => ({ ...l, [img.id]: e.target.value }))}
                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-1 text-xs" />
                      {(legendas[img.id] ?? '') !== (img.legenda ?? '') && (
                        <button onClick={() => actualizar(img.id, { legenda: legendas[img.id] }, 'Legenda guardada')} className="p-1.5 text-green-700 hover:bg-green-50 rounded-lg" title="Guardar legenda"><Check className="w-4 h-4" /></button>
                      )}
                    </div>
                    <div className="flex justify-between gap-2">
                      {!img.cartaz ? (
                        <button onClick={() => actualizar(img.id, { cartaz: true }, 'Cartaz principal definido')} className="inline-flex items-center gap-1 text-xs text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg"><Star className="w-3.5 h-3.5" />Definir como cartaz</button>
                      ) : <span />}
                      <button onClick={() => remover(img)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg"><Trash2 className="w-3.5 h-3.5" />Remover</button>
                    </div>
                  </>
                ) : img.legenda ? <p className="text-xs text-gray-600">{img.legenda}</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
