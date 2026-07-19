'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, Banknote } from 'lucide-react';

const ESTADOS_CORES: Record<string, string> = {
  RASCUNHO: 'bg-gray-100 text-gray-600',
  PENDENTE_APROVACAO: 'bg-amber-100 text-amber-700',
  APROVADA: 'bg-blue-100 text-blue-700',
  PAGA: 'bg-green-100 text-green-700',
  REJEITADA: 'bg-red-100 text-red-700',
};

export default function FolhaPagamentoPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [folhas, setFolhas] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ funcionarioId: '', mes: String(new Date().getMonth() + 1), ano: String(new Date().getFullYear()), salarioBase: '', premios: '0', descontos: '0', horasExtras: '0', detalhes: '' });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/rh/folha-pagamento');
    setFolhas(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/rh/funcionarios').then(r => setFuncionarios(r.data.data?.data || r.data.data || [])).catch(() => {});
  }, []);

  const salvar = async () => {
    await api.post('/rh/folha-pagamento', {
      ...form,
      mes: Number(form.mes), ano: Number(form.ano), salarioBase: Number(form.salarioBase),
      premios: Number(form.premios), descontos: Number(form.descontos), horasExtras: Number(form.horasExtras),
    });
    setShowForm(false);
    setForm({ funcionarioId: '', mes: String(new Date().getMonth() + 1), ano: String(new Date().getFullYear()), salarioBase: '', premios: '0', descontos: '0', horasExtras: '0', detalhes: '' });
    load();
  };

  const aprovar = async (id: string) => { await api.put(`/rh/folha-pagamento/${id}/aprovar`); load(); };
  const rejeitar = async (id: string) => { await api.put(`/rh/folha-pagamento/${id}/rejeitar`); load(); };
  const marcarPaga = async (id: string) => { await api.put(`/rh/folha-pagamento/${id}/marcar-paga`); load(); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Folha de Pagamento</h1>
          <p className="text-gray-500 text-sm mt-1">Processamento mensal — aprovação do Super Admin antes do pagamento</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Processar Folha
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : folhas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <Banknote className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhuma folha processada
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Funcionário</th>
                <th className="text-left px-4 py-3">Mês/Ano</th>
                <th className="text-left px-4 py-3">Líquido</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {folhas.map((f: any) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{f.funcionario?.firstName} {f.funcionario?.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{f.mes}/{f.ano}</td>
                  <td className="px-4 py-3 text-gray-600">MT {f.valorLiquido}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[f.estado] || 'bg-gray-100 text-gray-600'}`}>{f.estado.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {f.estado === 'PENDENTE_APROVACAO' && isSuperAdmin && (
                        <>
                          <button onClick={() => aprovar(f.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Aprovar</button>
                          <button onClick={() => rejeitar(f.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Rejeitar</button>
                        </>
                      )}
                      {f.estado === 'APROVADA' && (
                        <button onClick={() => marcarPaga(f.id)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">Marcar Paga</button>
                      )}
                    </div>
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
            <h2 className="text-lg font-bold text-gray-900">Processar Folha de Pagamento</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário*</label>
              <select value={form.funcionarioId} onChange={(e) => setForm(f => ({ ...f, funcionarioId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Selecionar —</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mês*</label>
                <input type="number" min={1} max={12} value={form.mes} onChange={(e) => setForm(f => ({ ...f, mes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano*</label>
                <input type="number" value={form.ano} onChange={(e) => setForm(f => ({ ...f, ano: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salário base (MT)*</label>
              <input type="number" value={form.salarioBase} onChange={(e) => setForm(f => ({ ...f, salarioBase: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prémios</label>
                <input type="number" value={form.premios} onChange={(e) => setForm(f => ({ ...f, premios: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descontos</label>
                <input type="number" value={form.descontos} onChange={(e) => setForm(f => ({ ...f, descontos: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas extras</label>
                <input type="number" value={form.horasExtras} onChange={(e) => setForm(f => ({ ...f, horasExtras: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detalhes</label>
              <textarea value={form.detalhes} onChange={(e) => setForm(f => ({ ...f, detalhes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.funcionarioId || !form.salarioBase}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                Processar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
