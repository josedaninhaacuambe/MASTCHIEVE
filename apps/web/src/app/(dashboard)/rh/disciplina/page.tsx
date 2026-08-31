'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, Gavel } from 'lucide-react';

const TIPOS = ['ATRASO', 'ABSENTISMO', 'CONDUTA_INADEQUADA', 'VIOLACAO_SEGURANCA', 'REINCIDENCIA', 'OUTRO'];
const GRAVIDADES = ['LEVE', 'MODERADA', 'GRAVE'];
const DECISOES = ['ADVERTENCIA', 'SUSPENSAO', 'RESCISAO_JUSTA_CAUSA', 'SEM_ACAO'];
const ESTADOS_CORES: Record<string, string> = {
  REGISTADA: 'bg-gray-100 text-gray-600',
  EM_ANALISE: 'bg-amber-100 text-amber-700',
  RESOLVIDA_RH: 'bg-green-100 text-green-700',
  ESCALADA_SUPER_ADMIN: 'bg-indigo-100 text-indigo-700',
  DECIDIDA_SUPER_ADMIN: 'bg-green-100 text-green-700',
};
const GRAVIDADE_CORES: Record<string, string> = {
  LEVE: 'bg-gray-100 text-gray-600',
  MODERADA: 'bg-amber-100 text-amber-700',
  GRAVE: 'bg-red-100 text-red-700',
};

export default function DisciplinaPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ funcionarioId: '', tipo: 'ATRASO', gravidade: 'LEVE', descricao: '' });
  const [decidindo, setDecidindo] = useState<any>(null);
  const [dForm, setDForm] = useState({ decisaoFinal: 'ADVERTENCIA', medidaAplicada: '' });
  const [saving, setSaving] = useState(false);
  const [savingDecisao, setSavingDecisao] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/rh/disciplina');
      setOcorrencias(r.data.data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar ocorrências', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get('/rh/funcionarios').then(r => setFuncionarios(r.data.data?.data || r.data.data || [])).catch(() => {});
  }, []);

  const salvar = async () => {
    if (!form.funcionarioId || !form.descricao.trim()) {
      toast.error('Campos obrigatórios', 'Seleciona o funcionário e descreve a ocorrência');
      return;
    }
    setSaving(true);
    try {
      await api.post('/rh/disciplina', form);
      setShowForm(false);
      setForm({ funcionarioId: '', tipo: 'ATRASO', gravidade: 'LEVE', descricao: '' });
      toast.success('Ocorrência registada');
      load();
    } catch (e: any) {
      toast.error('Erro ao registar ocorrência', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const salvarDecisao = async () => {
    setSavingDecisao(true);
    try {
      await api.put(`/rh/disciplina/${decidindo.id}/decidir`, dForm);
      setDecidindo(null);
      toast.success('Decisão registada');
      load();
    } catch (e: any) {
      toast.error('Erro ao registar decisão', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSavingDecisao(false);
    }
  };

  const podeDecidir = (o: any) => o.gravidade !== 'GRAVE' || isSuperAdmin;
  const naoDecidida = (o: any) => !['RESOLVIDA_RH', 'DECIDIDA_SUPER_ADMIN'].includes(o.estado);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplina</h1>
          <p className="text-gray-500 text-sm mt-1">Ocorrências graves são automaticamente escaladas ao Super Admin</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Registar Ocorrência
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : ocorrencias.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <Gavel className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhuma ocorrência registada
        </div>
      ) : (
        <div className="space-y-3">
          {ocorrencias.map((o: any) => (
            <div key={o.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[o.estado] || 'bg-gray-100 text-gray-600'}`}>{o.estado.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${GRAVIDADE_CORES[o.gravidade]}`}>{o.gravidade}</span>
                    <span className="text-xs text-gray-400">{o.tipo.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{o.funcionario?.firstName} {o.funcionario?.lastName}</p>
                  <p className="text-sm text-gray-500 mt-1">{o.descricao}</p>
                  {o.decisaoFinal && <p className="text-xs text-gray-500 mt-1">Decisão: {o.decisaoFinal.replace(/_/g, ' ')} {o.medidaAplicada ? `— ${o.medidaAplicada}` : ''}</p>}
                </div>
                {naoDecidida(o) && podeDecidir(o) && (
                  <button onClick={() => { setDecidindo(o); setDForm({ decisaoFinal: 'ADVERTENCIA', medidaAplicada: '' }); }} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 flex-shrink-0">Decidir</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Registar Ocorrência Disciplinar</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Gravidade</label>
                <select value={form.gravidade} onChange={(e) => setForm(f => ({ ...f, gravidade: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {GRAVIDADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição*</label>
              <textarea value={form.descricao} onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.funcionarioId || !form.descricao || saving}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                {saving ? 'A registar...' : 'Registar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {decidindo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Decidir Ocorrência</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decisão final*</label>
              <select value={dForm.decisaoFinal} onChange={(e) => setDForm(f => ({ ...f, decisaoFinal: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {DECISOES.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medida aplicada</label>
              <textarea value={dForm.medidaAplicada} onChange={(e) => setDForm(f => ({ ...f, medidaAplicada: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDecidindo(null)} disabled={savingDecisao} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvarDecisao} disabled={savingDecisao} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">{savingDecisao ? 'A guardar...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
