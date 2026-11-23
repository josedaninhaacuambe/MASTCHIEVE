'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, FolderOpen, Users } from 'lucide-react';
import InscricoesFormacao from './inscricoes-formacao';

const TIPOS = ['RECICLAGEM', 'CERTIFICACAO', 'SOFT_SKILLS', 'SEGURANCA', 'OUTRO'];
const ESTADOS_CORES: Record<string, string> = {
  PROPOSTA: 'bg-amber-100 text-amber-700',
  APROVADA_ORCAMENTO: 'bg-green-100 text-green-700',
  REJEITADA: 'bg-red-100 text-red-700',
  EM_CURSO: 'bg-blue-100 text-blue-700',
  CONCLUIDA: 'bg-gray-200 text-gray-700',
};
const FORM_VAZIO = { titulo: '', tipo: 'RECICLAGEM', descricao: '', custoEstimado: '', dataInicio: '', dataFim: '', vagas: '', local: '' };

export default function FormacaoPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  // Propor formações e dar conclusões é do RH; gerir inscrições também é dos assistentes administrativos.
  const isRH = user?.role === 'GESTOR_RH' || isSuperAdmin;
  const [formacoes, setFormacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [gerir, setGerir] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/rh/formacao');
      setFormacoes(r.data.data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar formações', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const salvar = async () => {
    if (!form.titulo.trim()) {
      toast.error('Campo obrigatório', 'Indica o título da formação');
      return;
    }
    setSaving(true);
    try {
      await api.post('/rh/formacao', {
        ...form,
        custoEstimado: form.custoEstimado ? Number(form.custoEstimado) : undefined,
        dataInicio: form.dataInicio || undefined,
        dataFim: form.dataFim || undefined,
        vagas: form.vagas ? Number(form.vagas) : undefined,
        local: form.local.trim() || undefined,
      });
      setShowForm(false);
      setForm(FORM_VAZIO);
      toast.success('Formação proposta');
      load();
    } catch (e: any) {
      toast.error('Erro ao propor formação', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const aprovarOrcamento = async (id: string) => {
    try { await api.put(`/rh/formacao/${id}/aprovar-orcamento`); load(); }
    catch (e: any) { toast.error('Erro ao aprovar orçamento', e?.response?.data?.message ?? 'Tenta novamente'); }
  };
  const rejeitar = async (id: string) => {
    try { await api.put(`/rh/formacao/${id}/rejeitar`); load(); }
    catch (e: any) { toast.error('Erro ao rejeitar formação', e?.response?.data?.message ?? 'Tenta novamente'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formação</h1>
          <p className="text-gray-500 text-sm mt-1">Propostas (orçamento aprovado pelo Super Admin), vagas e inscrições dos colaboradores</p>
        </div>
        {isRH && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
            <Plus className="w-4 h-4" /> Propor Formação
          </button>
        )}
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
                  {f.resumo && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {f.resumo.ocupadas} inscrito(s){f.resumo.vagas != null ? ` de ${f.resumo.vagas} vagas` : ''}
                      </span>
                      {f.resumo.vagas != null && (
                        f.resumo.esgotada
                          ? <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">Esgotada</span>
                          : <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">{f.resumo.disponiveis} vaga(s) livre(s)</span>
                      )}
                      {f.resumo.porEstado?.CANCELADA + f.resumo.porEstado?.DESISTIU > 0 && (
                        <span className="text-gray-400">{f.resumo.porEstado.CANCELADA + f.resumo.porEstado.DESISTIU} cancelada(s)/desistência(s)</span>
                      )}
                      {f.local && <span className="text-gray-400">· {f.local}</span>}
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
                  {f.estado !== 'PROPOSTA' && f.estado !== 'REJEITADA' && (
                    <button onClick={() => setGerir(f.id)} className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">
                      <Users className="w-3.5 h-3.5" /> Gerir inscrições
                    </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vagas (capacidade)</label>
                <input type="number" min={1} value={form.vagas} onChange={(e) => setForm(f => ({ ...f, vagas: e.target.value }))} placeholder="Sem limite" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                <input value={form.local} onChange={(e) => setForm(f => ({ ...f, local: e.target.value }))} maxLength={191} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.titulo || saving}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                {saving ? 'A propor...' : 'Propor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {gerir && (
        <InscricoesFormacao formacaoId={gerir} podeConcluir={isRH} onClose={() => setGerir(null)} onChange={load} />
      )}
    </div>
  );
}
