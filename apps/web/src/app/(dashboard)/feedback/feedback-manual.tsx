'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Brain, Loader2, PenLine, RefreshCw, Save, Search, Sparkles, X } from 'lucide-react';

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500/30';

export const mensagemErro = (e: any, padrao?: string) => {
  const msg = e?.response?.data?.message;
  return Array.isArray(msg) ? msg.join(' · ') : msg ?? padrao;
};

/** Novo feedback para um atleta: escrito à mão, ou gerado pela IA a partir da avaliação mais recente. */
export function NovoFeedbackModal({ onClose, onSaved }: { onClose: () => void; onSaved: (fb: any) => void }) {
  const [modo, setModo] = useState<'MANUAL' | 'IA'>('MANUAL');
  const [pesquisa, setPesquisa] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [atleta, setAtleta] = useState<any | null>(null);
  const [texto, setTexto] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (atleta || pesquisa.trim().length < 2) { setResultados([]); return; }
    const t = setTimeout(() => {
      api.get(`/students?search=${encodeURIComponent(pesquisa.trim())}&limit=8`)
        .then((r) => setResultados(r.data.data ?? []))
        .catch(() => setResultados([]));
    }, 300);
    return () => clearTimeout(t);
  }, [pesquisa, atleta]);

  const valido = !!atleta && (modo === 'IA' || texto.trim().length > 0);

  const guardar = async () => {
    if (!valido) return;
    setSaving(true);
    try {
      const r = modo === 'MANUAL'
        ? await api.post('/feedback', { studentId: atleta.id, texto: texto.trim() })
        : await api.post(`/ai/feedback/student/${atleta.id}`);
      toast.success(modo === 'MANUAL' ? 'Feedback guardado' : 'Feedback gerado pela IA', 'Reveja e envie ao atleta quando estiver pronto.');
      onSaved({ ...(r.data?.data ?? {}), student: { firstName: atleta.firstName, lastName: atleta.lastName } });
    } catch (e: any) {
      toast.error(modo === 'MANUAL' ? 'Erro ao guardar feedback' : 'Erro ao gerar feedback', mensagemErro(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Novo feedback</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            {([['MANUAL', 'Escrever', PenLine], ['IA', 'Gerar com IA', Sparkles]] as const).map(([v, l, Icon]) => (
              <button key={v} onClick={() => setModo(v)}
                className={cn('flex-1 py-2 rounded-xl text-sm font-medium border flex items-center justify-center gap-1.5',
                  modo === v ? 'bg-mastchieve-600 text-white border-mastchieve-600' : 'bg-white text-gray-600 border-gray-200')}>
                <Icon className="w-4 h-4" /> {l}
              </button>
            ))}
          </div>

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

          {modo === 'MANUAL' ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Feedback*</label>
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={8} maxLength={10000}
                className={cn(inputCls, 'resize-y')}
                placeholder={'O que correu bem, o que melhorar e o objectivo para a próxima aula.'} />
              <p className="text-xs text-gray-400 mt-1">Fica guardado como revisto. O envio ao atleta é feito depois, com o botão "Enviar".</p>
            </div>
          ) : (
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs text-violet-700">
              <Brain className="w-4 h-4 inline mr-1.5" />
              A IA usa a avaliação mais recente do atleta (diária ou de conclusão de módulo). Pode editar o texto antes de enviar.
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={guardar} disabled={!valido || saving}
            className="flex-1 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {modo === 'IA' ? 'A gerar...' : 'A guardar...'}</> : modo === 'IA' ? 'Gerar com IA' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Escrever ou corrigir o texto final de um feedback ainda não enviado; e voltar a tentar a IA. */
export function EditorTextoFeedback({ feedback, onChanged }: { feedback: any; onChanged: (fb: any) => void }) {
  const inicial = feedback.finalText || feedback.aiGeneratedText || '';
  const [texto, setTexto] = useState(inicial);
  const [saving, setSaving] = useState(false);
  const [gerando, setGerando] = useState(false);

  useEffect(() => { setTexto(feedback.finalText || feedback.aiGeneratedText || ''); }, [feedback.id, feedback.finalText, feedback.aiGeneratedText]);

  const podeIa = (feedback.avaliacaoId || feedback.performanceRecordId) && ['PENDING', 'GENERATED'].includes(feedback.status);

  const guardar = async () => {
    setSaving(true);
    try {
      const r = await api.patch(`/feedback/${feedback.id}/texto`, { texto: texto.trim() });
      toast.success('Texto do feedback guardado');
      onChanged(r.data?.data ?? {});
    } catch (e: any) {
      toast.error('Erro ao guardar o texto', mensagemErro(e));
    } finally {
      setSaving(false);
    }
  };

  const gerar = async () => {
    setGerando(true);
    try {
      const r = await api.post(`/ai/feedback/${feedback.id}/regenerate`);
      toast.success('Feedback gerado pela IA');
      onChanged(r.data?.data ?? {});
    } catch (e: any) {
      toast.error('Erro ao gerar feedback com IA', mensagemErro(e, 'Pode escrever o feedback manualmente.'));
    } finally {
      setGerando(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <PenLine className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">Texto a enviar</span>
        {podeIa && (
          <button onClick={gerar} disabled={gerando}
            className="ml-auto flex items-center gap-1 text-xs text-violet-600 hover:underline disabled:opacity-50">
            {gerando ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {feedback.aiGeneratedText ? 'Gerar de novo com IA' : 'Gerar com IA'}
          </button>
        )}
      </div>
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={8} maxLength={10000}
        className={cn(inputCls, 'resize-y')} placeholder="Escreva aqui o feedback para o atleta." />
      <button onClick={guardar} disabled={saving || !texto.trim() || texto.trim() === (feedback.finalText ?? '').trim()}
        className="mt-2 w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
        <Save className="w-4 h-4" /> {saving ? 'A guardar...' : 'Guardar texto (fica revisto)'}
      </button>
    </div>
  );
}
