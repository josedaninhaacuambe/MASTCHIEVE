'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, FolderOpen } from 'lucide-react';

const TIPOS = ['RECICLAGEM', 'CERTIFICACAO', 'SOFT_SKILLS', 'SEGURANCA', 'OUTRO'];
const ESTADOS_CORES: Record<string, string> = {
  PROPOSTA: 'bg-amber-100 text-amber-700',
  APROVADA_ORCAMENTO: 'bg-green-100 text-green-700',
  REJEITADA: 'bg-red-100 text-red-700',
};

export default function FormacaoPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [formacoes, setFormacoes] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', tipo: 'RECICLAGEM', descricao: '', custoEstimado: '', dataInicio: '', dataFim: '' });
  const [inscrevendo, setInscrevendo] = useState<any>(null);
  const [funcionarioParaInscrever, setFuncionarioParaInscrever] = useState('');

  const load = async () => {
    setLoading(true);
    const r = await api.get('/rh/formacao');
    setFormacoes(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/rh/funcionarios').then(r => setFuncionarios(r.data.data?.data || r.data.data || [])).catch(() => {});
  }, []);

  const salvar = async () => {
    await api.post('/rh/formacao', { ...form, custoEstimado: form.custoEstimado ? Number(form.custoEstimado) : undefined, dataInicio: form.dataInicio || undefined, dataFim: form.dataFim || undefined });
    setShowForm(false);
    setForm({ titulo: '', tipo: 'RECICLAGEM', descricao: '', custoEstimado: '', dataInicio: '', dataFim: '' });
    load();
  };

  const aprovarOrcamento = async (id: string) => { await api.put(`/rh/formacao/${id}/aprovar-orcamento`); load(); };
  const rejeitar = async (id: string) => { await api.put(`/rh/formacao/${id}/rejeitar`); load(); };

  const inscrever = async () => {
    await api.post(`/rh/formacao/${inscrevendo.id}/inscrever`, { funcionarioId: funcionarioParaInscrever });
    setInscrevendo(null);
    setFuncionarioParaInscrever('');
    load();
  };

  const concluir = async (participanteId: string) => {
    const notaFinal = prompt('Nota final (opcional):');
    await api.put(`/rh/formacao/participantes/${participanteId}/concluir`, { notaFinal: notaFinal ? Number(notaFinal) : undefined });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formação</h1>
          <p className="text-gray-500 text-sm mt-1">Propostas de formação — orçamento aprovado pelo Super Admin</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Propor Formação
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : formacoes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhuma formação registada
        </div>
      ) : (
        <div className="space-y-3">
          {formacoes.map((f: any) => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[f.estado] || 'bg-gray-100 text-gray-600'}`}>{f.estado.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-400">{f.tipo.replace(/_/g, ' ')}</span>
                    {f.custoEstimado && <span className="text-xs text-gray-400">MT {f.custoEstimado}</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{f.titulo}</p>
                  {f.descricao && <p className="text-sm text-gray-500 mt-1">{f.descricao}</p>}
                  {f.participantes?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {f.participantes.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{p.funcionario?.firstName} {p.funcionario?.lastName}</span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{p.estado}</span>
                          {p.estado !== 'CONCLUIDO' && (
                            <button onClick={() => concluir(p.id)} className="text-blue-600 hover:underline">Concluir</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {f.estado === 'PROPOSTA' && isSuperAdmin && (
                    <>
                      <button onClick={() => aprovarOrcamento(f.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Aprovar orçamento</button>
                      <button onClick={() => rejeitar(f.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Rejeitar</button>
                    </>
                  )}
                  {f.estado === 'APROVADA_ORCAMENTO' && (
                    <button onClick={() => setInscrevendo(f)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">Inscrever</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Propor Formação</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título*</label>
              <input value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
              <select value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea value={form.descricao} onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo estimado (MT)</label>
                <input type="number" value={form.custoEstimado} onChange={(e) => setForm(f => ({ ...f, custoEstimado: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                <input type="date" value={form.dataInicio} onChange={(e) => setForm(f => ({ ...f, dataInicio: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                <input type="date" value={form.dataFim} onChange={(e) => setForm(f => ({ ...f, dataFim: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.titulo}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                Propor
              </button>
            </div>
          </div>
        </div>
      )}

      {inscrevendo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Inscrever em: {inscrevendo.titulo}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário*</label>
              <select value={funcionarioParaInscrever} onChange={(e) => setFuncionarioParaInscrever(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Selecionar —</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setInscrevendo(null); setFuncionarioParaInscrever(''); }} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={inscrever} disabled={!funcionarioParaInscrever} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">Inscrever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
