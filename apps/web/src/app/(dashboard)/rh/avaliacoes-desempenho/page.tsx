'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, ClipboardCheck } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';

const ESTADOS_CORES: Record<string, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700',
  REALIZADA: 'bg-green-100 text-green-700',
};

export default function AvaliacoesDesempenhoPage() {
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ funcionarioId: '', periodo: '', dataLimite: '' });
  const [realizando, setRealizando] = useState<any>(null);
  const [rForm, setRForm] = useState({ pontualidade: '3', competenciaTecnica: '3', trabalhoEquipa: '3', atendimento: '3', pontosFortes: '', areasMelhoria: '', planoDesenvolvimento: '' });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/rh/avaliacoes-desempenho');
    setAvaliacoes(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/rh/funcionarios').then(r => setFuncionarios(r.data.data?.data || r.data.data || [])).catch(() => {});
  }, []);

  const salvar = async () => {
    await api.post('/rh/avaliacoes-desempenho', { ...form, dataLimite: form.dataLimite || undefined });
    setShowForm(false);
    setForm({ funcionarioId: '', periodo: '', dataLimite: '' });
    load();
  };

  const abrirRealizar = (a: any) => {
    setRealizando(a);
    setRForm({ pontualidade: '3', competenciaTecnica: '3', trabalhoEquipa: '3', atendimento: '3', pontosFortes: '', areasMelhoria: '', planoDesenvolvimento: '' });
  };

  const salvarRealizar = async () => {
    await api.put(`/rh/avaliacoes-desempenho/${realizando.id}/realizar`, {
      pontualidade: Number(rForm.pontualidade),
      competenciaTecnica: Number(rForm.competenciaTecnica),
      trabalhoEquipa: Number(rForm.trabalhoEquipa),
      atendimento: Number(rForm.atendimento),
      pontosFortes: rForm.pontosFortes || undefined,
      areasMelhoria: rForm.areasMelhoria || undefined,
      planoDesenvolvimento: rForm.planoDesenvolvimento || undefined,
    });
    setRealizando(null);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações de Desempenho</h1>
          <p className="text-gray-500 text-sm mt-1">Agendamento e registo de avaliações periódicas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Agendar Avaliação
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : avaliacoes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhuma avaliação registada
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <ResponsiveTable>
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Funcionário</th>
                <th className="text-left px-4 py-3">Período</th>
                <th className="text-left px-4 py-3">Data limite</th>
                <th className="text-left px-4 py-3">Pontuação</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {avaliacoes.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{a.funcionario?.firstName} {a.funcionario?.lastName}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.periodo}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{a.dataLimite ? new Date(a.dataLimite).toLocaleDateString('pt-PT') : '—'}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.pontuacaoGeral != null ? Number(a.pontuacaoGeral).toFixed(1) : '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${ESTADOS_CORES[a.estado] || 'bg-gray-100 text-gray-600'}`}>{a.estado}</span></td>
                  <td className="px-4 py-3">
                    {a.estado === 'PENDENTE' && (
                      <button onClick={() => abrirRealizar(a)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 whitespace-nowrap">Registar resultado</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Agendar Avaliação</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário*</label>
              <select value={form.funcionarioId} onChange={(e) => setForm(f => ({ ...f, funcionarioId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Selecionar —</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Período*</label>
                <input value={form.periodo} onChange={(e) => setForm(f => ({ ...f, periodo: e.target.value }))} placeholder="ex: 2026-T3" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data limite</label>
                <input type="date" value={form.dataLimite} onChange={(e) => setForm(f => ({ ...f, dataLimite: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.funcionarioId || !form.periodo}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}

      {realizando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Registar Resultado — {realizando.funcionario?.firstName} {realizando.funcionario?.lastName}</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['pontualidade', 'competenciaTecnica', 'trabalhoEquipa', 'atendimento'] as const).map(k => (
                <div key={k}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
                  <select value={(rForm as any)[k]} onChange={(e) => setRForm(f => ({ ...f, [k]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pontos fortes</label>
              <textarea value={rForm.pontosFortes} onChange={(e) => setRForm(f => ({ ...f, pontosFortes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Áreas de melhoria</label>
              <textarea value={rForm.areasMelhoria} onChange={(e) => setRForm(f => ({ ...f, areasMelhoria: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plano de desenvolvimento</label>
              <textarea value={rForm.planoDesenvolvimento} onChange={(e) => setRForm(f => ({ ...f, planoDesenvolvimento: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setRealizando(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvarRealizar} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
