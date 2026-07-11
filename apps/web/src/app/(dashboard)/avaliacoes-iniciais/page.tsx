'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, ClipboardList, Star, User, AlertTriangle } from 'lucide-react';

const CRITERIOS = [
  { key: 'experienciaAquatica', label: 'Experiência Aquática' },
  { key: 'segurancaAdaptacao', label: 'Segurança / Adaptação' },
  { key: 'confortoAgua', label: 'Conforto na Água' },
  { key: 'resistenciaBasica', label: 'Resistência Básica' },
];

export default function AvaliacoesIniciaisPage() {
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [fases, setFases] = useState<any[]>([]);
  const [form, setForm] = useState({
    studentId: '',
    data: '',
    experienciaAquatica: 3,
    segurancaAdaptacao: 3,
    confortoAgua: 3,
    resistenciaBasica: 3,
    faseRecomendadaId: '',
    observacoes: '',
  });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/avaliacoes-iniciais');
    setAvaliacoes(r.data.data || r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = async () => {
    const [s, f] = await Promise.all([api.get('/students'), api.get('/fases')]);
    setStudents(s.data.data || s.data);
    setFases(f.data.data || f.data);
    setShowForm(true);
  };

  const salvar = async () => {
    await api.post('/avaliacoes-iniciais', {
      studentId: form.studentId,
      data: form.data ? new Date(form.data).toISOString() : undefined,
      experienciaAquatica: Number(form.experienciaAquatica),
      segurancaAdaptacao: Number(form.segurancaAdaptacao),
      confortoAgua: Number(form.confortoAgua),
      resistenciaBasica: Number(form.resistenciaBasica),
      faseRecomendadaId: form.faseRecomendadaId || undefined,
      observacoes: form.observacoes || undefined,
    });
    setShowForm(false);
    setForm({ studentId:'', data:'', experienciaAquatica:3, segurancaAdaptacao:3, confortoAgua:3, resistenciaBasica:3, faseRecomendadaId:'', observacoes:'' });
    load();
  };

  const renderStars = (val: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-3.5 h-3.5 ${i < val ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
  ));

  const media = (a: any) => {
    const vals = [a.experienciaAquatica, a.segurancaAdaptacao, a.confortoAgua, a.resistenciaBasica].filter(Boolean);
    return vals.length ? (vals.reduce((s: number, v: number) => s + v, 0) / vals.length).toFixed(1) : '—';
  };

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

      {/* Protocolo #4 — aviso obrigatório de avaliação individual */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <strong>Protocolo #4 — Diagnóstico Individual:</strong> cada avaliação deve ser criada separadamente, atleta a atleta. Classificar vários atletas ao mesmo tempo com a mesma nota é um risco de segurança pedagógica identificado no Documento Consolidado de Protocolos de Segurança (Jun/2026). O sistema exige seleção individual de atleta por registo.
        </p>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="space-y-3">
          {avaliacoes.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhuma avaliação inicial registada</p>
            </div>
          )}
          {avaliacoes.map((a: any) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">
                      {a.student ? `${a.student.firstName} ${a.student.lastName}` : '—'}
                    </h3>
                    <span className="text-xs text-gray-400">{a.data ? new Date(a.data).toLocaleDateString('pt-PT') : '—'}</span>
                    {a.instrutor && (
                      <span className="text-xs text-gray-400">por {a.instrutor.firstName} {a.instrutor.lastName}</span>
                    )}
                  </div>
                  {a.faseRecomendada && (
                    <div className="mb-3">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                        Fase recomendada: {a.faseRecomendada.nome}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CRITERIOS.map(({ key, label }) => (
                      <div key={key} className="text-center">
                        <div className="text-xs text-gray-500 mb-1">{label}</div>
                        <div className="flex justify-center gap-0.5">{renderStars(a[key] ?? 0)}</div>
                      </div>
                    ))}
                  </div>
                  {a.observacoes && <p className="text-sm text-gray-500 mt-2">{a.observacoes}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-indigo-600">{media(a)}</div>
                  <div className="text-xs text-gray-400">média</div>
                </div>
              </div>
            </div>
          ))}
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
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fase Recomendada</label>
              <select value={form.faseRecomendadaId} onChange={e => setForm(f => ({ ...f, faseRecomendadaId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Selecionar fase...</option>
                {fases.map((f: any) => <option key={f.id} value={f.id}>Fase {f.ordem} — {f.nome} ({f.certificacao})</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Pontuação por Critério (1–5)</p>
              {CRITERIOS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-40">{label}</span>
                  <input type="range" min="1" max="5" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} className="flex-1" />
                  <span className="text-sm font-semibold text-indigo-600 w-6 text-center">{(form as any)[key]}</span>
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
