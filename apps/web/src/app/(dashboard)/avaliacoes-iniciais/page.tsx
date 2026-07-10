'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, ClipboardList, Star, User, ChevronRight } from 'lucide-react';

const NIVEL_RECOMENDADO = ['AMA_1','AMA_2','AMA_3','INTERMEDIARIO_1','INTERMEDIARIO_2','INTERMEDIARIO_3','AVANCADO_1','AVANCADO_2','AVANCADO_3'];

export default function AvaliacoesIniciaisPage() {
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId:'', data:'', nivelAtual:'', nivelRecomendado:'AMA_1', observacoes:'', flutuacao:'3', respiracao:'3', propulsao:'3', coordenacao:'3', confianca:'3' });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/avaliacoes-iniciais');
    setAvaliacoes(r.data.data || r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = async () => {
    const r = await api.get('/students');
    setStudents(r.data.data || r.data);
    setShowForm(true);
  };

  const salvar = async () => {
    const criterios = JSON.stringify({ flutuacao: Number(form.flutuacao), respiracao: Number(form.respiracao), propulsao: Number(form.propulsao), coordenacao: Number(form.coordenacao), confianca: Number(form.confianca) });
    await api.post('/avaliacoes-iniciais', { studentId: form.studentId, data: form.data ? new Date(form.data).toISOString() : undefined, nivelAtual: form.nivelAtual, nivelRecomendado: form.nivelRecomendado, observacoes: form.observacoes, criterios });
    setShowForm(false);
    load();
  };

  const renderStars = (val: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-3.5 h-3.5 ${i < val ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
  ));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações Iniciais</h1>
          <p className="text-gray-500 text-sm mt-1">Diagnóstico de nível aquático na inscrição (SOP 02)</p>
        </div>
        <button onClick={openForm} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nova Avaliação
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="space-y-3">
          {avaliacoes.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhuma avaliação inicial registada</p>
            </div>
          )}
          {avaliacoes.map((a: any) => {
            const criterios = (() => { try { return JSON.parse(a.criterios || '{}'); } catch { return {}; } })();
            const mediaScores = Object.values(criterios).length > 0 ? (Object.values(criterios) as number[]).reduce((s: number, v: number) => s + v, 0) / Object.values(criterios).length : 0;
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{a.student?.nome}</h3>
                      <span className="text-xs text-gray-400">{a.data ? new Date(a.data).toLocaleDateString('pt-PT') : '—'}</span>
                      {a.avaliador && <span className="text-xs text-gray-400">por {a.avaliador.name}</span>}
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      {a.nivelAtual && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Nível atual: {a.nivelAtual}</span>}
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">Recomendado: {a.nivelRecomendado?.replace('_', ' Fase ')}</span>
                    </div>
                    {Object.keys(criterios).length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(criterios).map(([key, val]) => (
                          <div key={key} className="text-center">
                            <div className="text-xs text-gray-500 mb-1 capitalize">{key}</div>
                            <div className="flex justify-center gap-0.5">{renderStars(val as number)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {a.observacoes && <p className="text-sm text-gray-500 mt-2">{a.observacoes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-indigo-600">{mediaScores.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">média</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Nova Avaliação Inicial</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aluno*</label>
              <select value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Selecionar aluno...</option>
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível Atual (se aplicável)</label>
              <input type="text" value={form.nivelAtual} onChange={e => setForm(f => ({ ...f, nivelAtual: e.target.value }))} placeholder="Ex: Iniciante, Fase AMA 1, etc." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível Recomendado*</label>
              <select value={form.nivelRecomendado} onChange={e => setForm(f => ({ ...f, nivelRecomendado: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {NIVEL_RECOMENDADO.map(n => <option key={n} value={n}>{n.replace('_', ' Fase ')}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Pontuação por Critério (1-5)</p>
              {['flutuacao','respiracao','propulsao','coordenacao','confianca'].map(c => (
                <div key={c} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 capitalize">{c}</span>
                  <input type="range" min="1" max="5" value={(form as any)[c]} onChange={e => setForm(f => ({ ...f, [c]: e.target.value }))} className="flex-1" />
                  <span className="text-sm font-semibold text-indigo-600 w-6 text-center">{(form as any)[c]}</span>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.studentId} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
