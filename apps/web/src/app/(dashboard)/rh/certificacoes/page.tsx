'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, IdCard } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';

const TIPOS = ['NADADOR_SALVADOR', 'INSTRUTOR_NATACAO', 'PRIMEIROS_SOCORROS', 'REGISTO_CRIMINAL', 'ATESTADO_APTIDAO_FISICA', 'OUTRO'];
const ESTADOS_CORES: Record<string, string> = {
  ATIVA: 'bg-green-100 text-green-700',
  EXPIRADA: 'bg-red-100 text-red-700',
  REVOGADA: 'bg-gray-200 text-gray-500',
};

export default function CertificacoesPage() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [funcionarioId, setFuncionarioId] = useState('');
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'NADADOR_SALVADOR', numeroDocumento: '', entidadeEmissora: '', dataEmissao: '', dataValidade: '', documentoUrl: '' });

  useEffect(() => {
    api.get('/rh/funcionarios').then(r => setFuncionarios(r.data.data?.data || r.data.data || [])).catch(() => {});
  }, []);

  const load = async (fid: string) => {
    if (!fid) { setCerts([]); return; }
    setLoading(true);
    const r = await api.get(`/rh/certificacoes/funcionario/${fid}`);
    setCerts(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load(funcionarioId); }, [funcionarioId]);

  const salvar = async () => {
    await api.post('/rh/certificacoes', { ...form, funcionarioId, dataEmissao: form.dataEmissao || undefined, dataValidade: form.dataValidade || undefined });
    setShowForm(false);
    setForm({ tipo: 'NADADOR_SALVADOR', numeroDocumento: '', entidadeEmissora: '', dataEmissao: '', dataValidade: '', documentoUrl: '' });
    load(funcionarioId);
  };

  const revogar = async (id: string) => { await api.put(`/rh/certificacoes/${id}/revogar`); load(funcionarioId); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificações</h1>
          <p className="text-gray-500 text-sm mt-1">Certificações obrigatórias — bloqueiam atribuição a turmas/escalas se expiradas</p>
        </div>
        <button onClick={() => setShowForm(true)} disabled={!funcionarioId} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium disabled:opacity-50">
          <Plus className="w-4 h-4" /> Registar Certificação
        </button>
      </div>

      <div className="max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
        <select value={funcionarioId} onChange={(e) => setFuncionarioId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">— Selecionar funcionário —</option>
          {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
        </select>
      </div>

      {!funcionarioId ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <IdCard className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Selecione um funcionário para ver as certificações
        </div>
      ) : loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : certs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">Nenhuma certificação registada</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <ResponsiveTable>
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Nº Documento</th>
                <th className="text-left px-4 py-3">Entidade</th>
                <th className="text-left px-4 py-3">Validade</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certs.map((c: any) => {
                const expirada = c.dataValidade && new Date(c.dataValidade) < new Date();
                const estadoEfetivo = c.estado === 'REVOGADA' ? 'REVOGADA' : expirada ? 'EXPIRADA' : 'ATIVA';
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{c.tipo.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.numeroDocumento || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{c.entidadeEmissora || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.dataValidade ? new Date(c.dataValidade).toLocaleDateString('pt-PT') : '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${ESTADOS_CORES[estadoEfetivo]}`}>{estadoEfetivo}</span></td>
                    <td className="px-4 py-3">
                      {c.estado !== 'REVOGADA' && (
                        <button onClick={() => revogar(c.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 whitespace-nowrap">Revogar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ResponsiveTable>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Registar Certificação</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
              <select value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº documento</label>
                <input value={form.numeroDocumento} onChange={(e) => setForm(f => ({ ...f, numeroDocumento: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entidade emissora</label>
                <input value={form.entidadeEmissora} onChange={(e) => setForm(f => ({ ...f, entidadeEmissora: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data emissão</label>
                <input type="date" value={form.dataEmissao} onChange={(e) => setForm(f => ({ ...f, dataEmissao: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data validade</label>
                <input type="date" value={form.dataValidade} onChange={(e) => setForm(f => ({ ...f, dataValidade: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do documento</label>
              <input value={form.documentoUrl} onChange={(e) => setForm(f => ({ ...f, documentoUrl: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900">Registar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
