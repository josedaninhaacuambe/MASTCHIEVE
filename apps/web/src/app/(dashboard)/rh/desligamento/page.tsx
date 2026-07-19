'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, UserPlus } from 'lucide-react';

const TIPOS = ['DEMISSAO_VOLUNTARIA', 'DESPEDIMENTO_SEM_JUSTA_CAUSA', 'DESPEDIMENTO_JUSTA_CAUSA', 'FIM_CONTRATO', 'REFORMA'];
const ESTADOS_CORES: Record<string, string> = {
  AGUARDA_APROVACAO: 'bg-amber-100 text-amber-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
  REJEITADO: 'bg-red-100 text-red-700',
};

export default function DesligamentoPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [processos, setProcessos] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ funcionarioId: '', tipo: 'DEMISSAO_VOLUNTARIA', motivo: '', dataSaida: '', avisoPrevioDias: '', valorAcertoContas: '', detalhesAcerto: '' });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/rh/desligamento');
    setProcessos(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/rh/funcionarios').then(r => setFuncionarios(r.data.data?.data || r.data.data || [])).catch(() => {});
  }, []);

  const salvar = async () => {
    await api.post('/rh/desligamento', {
      ...form,
      dataSaida: form.dataSaida || undefined,
      avisoPrevioDias: form.avisoPrevioDias ? Number(form.avisoPrevioDias) : undefined,
      valorAcertoContas: form.valorAcertoContas ? Number(form.valorAcertoContas) : undefined,
    });
    setShowForm(false);
    setForm({ funcionarioId: '', tipo: 'DEMISSAO_VOLUNTARIA', motivo: '', dataSaida: '', avisoPrevioDias: '', valorAcertoContas: '', detalhesAcerto: '' });
    load();
  };

  const aprovar = async (id: string) => { await api.put(`/rh/desligamento/${id}/aprovar`); load(); };
  const rejeitar = async (id: string) => { await api.put(`/rh/desligamento/${id}/rejeitar`); load(); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Desligamento</h1>
          <p className="text-gray-500 text-sm mt-1">Aprovação do Super Admin desativa acessos e cancela escalas futuras automaticamente</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Iniciar Processo
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : processos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <UserPlus className="w-10 h-10 mx-auto mb-2 text-gray-300 rotate-180" /> Nenhum processo de desligamento
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Funcionário</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Data saída</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processos.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.funcionario?.firstName} {p.funcionario?.lastName} <span className="text-gray-400 font-normal">{p.funcionario?.numeroFuncionario}</span></td>
                  <td className="px-4 py-3 text-gray-600">{p.tipo.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-500">{p.dataSaida ? new Date(p.dataSaida).toLocaleDateString('pt-PT') : '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[p.estado] || 'bg-gray-100 text-gray-600'}`}>{p.estado.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3">
                    {p.estado === 'AGUARDA_APROVACAO' && isSuperAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => aprovar(p.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Aprovar</button>
                        <button onClick={() => rejeitar(p.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Rejeitar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Iniciar Processo de Desligamento</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário*</label>
              <select value={form.funcionarioId} onChange={(e) => setForm(f => ({ ...f, funcionarioId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Selecionar —</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
              <select value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <textarea value={form.motivo} onChange={(e) => setForm(f => ({ ...f, motivo: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de saída</label>
                <input type="date" value={form.dataSaida} onChange={(e) => setForm(f => ({ ...f, dataSaida: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aviso prévio (dias)</label>
                <input type="number" value={form.avisoPrevioDias} onChange={(e) => setForm(f => ({ ...f, avisoPrevioDias: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor de acerto de contas (MT)</label>
              <input type="number" value={form.valorAcertoContas} onChange={(e) => setForm(f => ({ ...f, valorAcertoContas: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detalhes do acerto</label>
              <textarea value={form.detalhesAcerto} onChange={(e) => setForm(f => ({ ...f, detalhesAcerto: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.funcionarioId}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                Iniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
