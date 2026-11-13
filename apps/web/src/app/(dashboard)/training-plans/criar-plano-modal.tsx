'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { FileUp, Loader2, Plus, Search, Trash2, X } from 'lucide-react';

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30';
const TAMANHO_MAX = 200 * 1024; // 200 KB de texto chega para qualquer plano

interface ExercicioForm {
  name: string;
  description: string;
  duration: string;
  sets: string;
  reps: string;
}

const exercicioVazio = (): ExercicioForm => ({ name: '', description: '', duration: '', sets: '', reps: '' });

/**
 * Lê um CSV/TXT com uma linha por exercício: nome;descrição;duração;séries;repetições
 * (também aceita vírgula ou tabulação). Linhas que não parecem exercícios vão para a descrição.
 */
function lerFicheiroPlano(texto: string): { exercicios: ExercicioForm[]; resto: string } {
  const exercicios: ExercicioForm[] = [];
  const resto: string[] = [];
  for (const linha of texto.split(/\r?\n/)) {
    const l = linha.trim();
    if (!l) { resto.push(''); continue; }
    const sep = l.includes(';') ? ';' : l.includes('\t') ? '\t' : null;
    if (sep) {
      const [name, description = '', duration = '', sets = '', reps = ''] = l.split(sep).map((c) => c.trim());
      if (/^nome$/i.test(name)) continue; // cabeçalho
      if (name) { exercicios.push({ name, description, duration, sets, reps }); continue; }
    }
    resto.push(linha);
  }
  return { exercicios, resto: resto.join('\n').trim() };
}

const inteiro = (v: string) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** Plano de treino escrito pelo instrutor, ou importado de um ficheiro de texto. Não usa IA. */
export function CriarPlanoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pesquisa, setPesquisa] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [atleta, setAtleta] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectivos, setObjectivos] = useState('');
  const [exercicios, setExercicios] = useState<ExercicioForm[]>([]);
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (atleta || pesquisa.trim().length < 2) { setResultados([]); return; }
    const t = setTimeout(() => {
      api.get(`/students?search=${encodeURIComponent(pesquisa.trim())}&limit=8`)
        .then((r) => setResultados(r.data.data ?? []))
        .catch(() => setResultados([]));
    }, 300);
    return () => clearTimeout(t);
  }, [pesquisa, atleta]);

  const importar = async (file: File) => {
    if (!/\.(txt|csv|md)$/i.test(file.name)) {
      toast.error('Formato não suportado', 'Use um ficheiro .txt, .csv ou .md. Para PDF ou Word, copie o texto e cole na descrição.');
      return;
    }
    if (file.size > TAMANHO_MAX) { toast.error('Ficheiro demasiado grande', 'Máximo 200 KB.'); return; }
    // O ficheiro é lido só no navegador; não é guardado no servidor.
    const texto = await file.text();
    const { exercicios: lidos, resto } = lerFicheiroPlano(texto);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 190));
    if (resto) setDescription((d) => (d ? `${d}\n\n${resto}` : resto).slice(0, 20000));
    if (lidos.length) setExercicios((e) => [...e.filter((x) => x.name.trim()), ...lidos].slice(0, 100));
    toast.success('Ficheiro importado', `${lidos.length} exercício(s) reconhecido(s). Reveja antes de guardar.`);
  };

  const mudarExercicio = (i: number, campo: keyof ExercicioForm, v: string) =>
    setExercicios((lista) => lista.map((e, j) => (j === i ? { ...e, [campo]: v } : e)));

  const objectivosLista = objectivos.split('\n').map((o) => o.trim()).filter(Boolean);
  const exerciciosValidos = exercicios.filter((e) => e.name.trim());
  const valido = !!atleta && title.trim().length > 0 &&
    (description.trim().length > 0 || objectivosLista.length > 0 || exerciciosValidos.length > 0);

  const guardar = async () => {
    if (!valido) return;
    setSaving(true);
    try {
      await api.post('/training-plans', {
        studentId: atleta.id,
        title: title.trim(),
        description: description.trim() || undefined,
        objectives: objectivosLista,
        exercises: exerciciosValidos.map((e) => ({
          name: e.name.trim(),
          description: e.description.trim() || undefined,
          duration: e.duration.trim() || undefined,
          sets: inteiro(e.sets),
          reps: inteiro(e.reps),
        })),
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
      });
      toast.success('Plano de treino criado', `${atleta.firstName} ${atleta.lastName}`);
      onSuccess();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error('Erro ao criar plano', Array.isArray(msg) ? msg.join(' · ') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Criar plano de treino</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Atleta*</label>
            {atleta ? (
              <div className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">{atleta.firstName} {atleta.lastName}</span>
                <button onClick={() => { setAtleta(null); setPesquisa(''); }} className="text-xs text-blue-600 hover:underline">Alterar</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar pelo nome..." className={cn(inputCls, 'pl-9')} autoFocus />
                {resultados.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {resultados.map((s) => (
                      <button key={s.id} onClick={() => { setAtleta(s); setResultados([]); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                        {s.firstName} {s.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border border-dashed border-gray-300 rounded-xl p-3 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Já tem o plano num ficheiro? Importe um <strong>.txt</strong>, <strong>.csv</strong> ou <strong>.md</strong>.
              No CSV use uma linha por exercício: <code>nome;descrição;duração;séries;repetições</code>.
            </p>
            <input ref={fileRef} type="file" accept=".txt,.csv,.md,text/plain,text/csv,text/markdown" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = ''; }} />
            <button onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 flex items-center gap-1.5 border border-gray-200 px-3 py-2 rounded-xl text-sm hover:bg-gray-50">
              <FileUp className="w-4 h-4" /> Importar ficheiro
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Título*</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={190} className={inputCls} placeholder="Ex: Plano de resistência — Dezembro" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={20000}
              className={cn(inputCls, 'resize-y')} placeholder="Explicação geral do plano, ou cole aqui o texto do seu plano." />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Objectivos <span className="text-gray-400 font-normal">(um por linha)</span></label>
            <textarea value={objectivos} onChange={(e) => setObjectivos(e.target.value)} rows={3} className={cn(inputCls, 'resize-y')}
              placeholder={'Melhorar a respiração bilateral\nAumentar a resistência em crol'} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">Exercícios</label>
              <button onClick={() => setExercicios((l) => [...l, exercicioVazio()])} disabled={exercicios.length >= 100}
                className="flex items-center gap-1 text-xs text-violet-600 hover:underline disabled:opacity-50">
                <Plus className="w-3.5 h-3.5" /> Adicionar exercício
              </button>
            </div>
            {exercicios.length === 0 ? (
              <p className="text-xs text-gray-400 border border-gray-100 rounded-xl px-3 py-3">Sem exercícios. Opcional se a descrição já tiver o plano.</p>
            ) : (
              <div className="space-y-2">
                {exercicios.map((ex, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <input value={ex.name} onChange={(e) => mudarExercicio(i, 'name', e.target.value)} maxLength={200} className={inputCls} placeholder={`Exercício ${i + 1}*`} />
                      <button onClick={() => setExercicios((l) => l.filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-600" title="Remover">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input value={ex.description} onChange={(e) => mudarExercicio(i, 'description', e.target.value)} maxLength={2000} className={inputCls} placeholder="Descrição" />
                    <div className="grid grid-cols-3 gap-2">
                      <input value={ex.duration} onChange={(e) => mudarExercicio(i, 'duration', e.target.value)} maxLength={50} className={inputCls} placeholder="Duração (ex: 10 min)" />
                      <input value={ex.sets} onChange={(e) => mudarExercicio(i, 'sets', e.target.value)} inputMode="numeric" className={inputCls} placeholder="Séries" />
                      <input value={ex.reps} onChange={(e) => mudarExercicio(i, 'reps', e.target.value)} inputMode="numeric" className={inputCls} placeholder="Repetições" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Início</label>
              <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fim <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input type="date" value={validUntil} min={validFrom} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={guardar} disabled={!valido || saving}
            className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-black disabled:opacity-50 transition flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> A guardar...</> : 'Guardar plano'}
          </button>
        </div>
      </div>
    </div>
  );
}
