'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, FileSignature } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';

const TIPOS = ['EFETIVO', 'TERMO_CERTO', 'TERMO_INCERTO', 'ESTAGIO', 'PRESTACAO_SERVICOS'];
const ESTADOS_CORES: Record<string, string> = {
  RASCUNHO: 'bg-gray-100 text-gray-600',
  AGUARDA_ASSINATURA: 'bg-amber-100 text-amber-700',
  ATIVO: 'bg-green-100 text-green-700',
  EXPIRADO: 'bg-gray-200 text-gray-500',
  RESCINDIDO: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-gray-200 text-gray-500',
};

export default function ContratosPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [contratos, setContratos] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ funcionarioId: '', tipo: 'EFETIVO', cargo: '', salarioBase: '', dataInicio: '', dataFim: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/rh/contratos');
      setContratos(r.data.data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar contratos', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get('/rh/funcionarios').then(r => setFuncionarios(r.data.data?.data || r.data.data || [])).catch(() => {});
  }, []);

  const salvar = async () => {
    if (!form.funcionarioId || !form.cargo.trim() || !form.salarioBase || !form.dataInicio) {
      toast.error('Campos obrigatórios', 'Preenche o funcionário, cargo, salário base e data de início');
      return;
    }
    setSaving(true);
    try {
      await api.post('/rh/contratos', { ...form, salarioBase: Number(form.salarioBase), dataFim: form.dataFim || undefined });
      setShowForm(false);
      setForm({ funcionarioId: '', tipo: 'EFETIVO', cargo: '', salarioBase: '', dataInicio: '', dataFim: '' });
      toast.success('Contrato elaborado');
      load();
    } catch (e: any) {
      toast.error('Erro ao elaborar contrato', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const assinar = async (id: string) => {
    try { await api.put(`/rh/contratos/${id}/assinar`); load(); }
    catch (e: any) { toast.error('Erro ao assinar contrato', e?.response?.data?.message ?? 'Tenta novamente'); }
  };
  const rescindir = async (id: string) => {
    try { await api.put(`/rh/contratos/${id}/rescindir`); load(); }
    catch (e: any) { toast.error('Erro ao rescindir contrato', e?.response?.data?.message ?? 'Tenta novamente'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-500 text-sm mt-1">Elaboração e assinatura de contratos — assinatura ativa o funcionário</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Elaborar Contrato
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : contratos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <FileSignature className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhum contrato registado
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <ResponsiveTable>
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Funcionário</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Salário</th>
                <th className="text-left px-4 py-3">Início</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contratos.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{c.funcionario?.firstName} {c.funcionario?.lastName}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.tipo.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">MT {c.salarioBase}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(c.dataInicio).toLocaleDateString('pt-PT')}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${ESTADOS_CORES[c.estado] || 'bg-gray-100 text-gray-600'}`}>{c.estado.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {isSuperAdmin && ['RASCUNHO', 'AGUARDA_ASSINATURA'].includes(c.estado) && (
                        <button onClick={() => assinar(c.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Assinar</button>
                      )}
                      {c.estado === 'ATIVO' && (
                        <button onClick={() => rescindir(c.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Rescindir</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Elaborar Contrato</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário*</label>
              <select value={form.funcionarioId} onChange={(e) => setForm(f => ({ ...f, funcionarioId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Selecionar —</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
                <select value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo*</label>
                <input value={form.cargo} onChange={(e) => setForm(f => ({ ...f, cargo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salário base (MT)*</label>
                <input type="number" value={form.salarioBase} onChange={(e) => setForm(f => ({ ...f, salarioBase: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de início*</label>
                <input type="date" value={form.dataInicio} onChange={(e) => setForm(f => ({ ...f, dataInicio: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data fim (opcional)</label>
              <input type="date" value={form.dataFim} onChange={(e) => setForm(f => ({ ...f, dataFim: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.funcionarioId || !form.cargo || !form.salarioBase || !form.dataInicio || saving}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                {saving ? 'A elaborar...' : 'Elaborar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
