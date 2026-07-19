'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, UserPlus } from 'lucide-react';

const TIPOS_CONTRATO = ['EFETIVO', 'TERMO_CERTO', 'TERMO_INCERTO', 'ESTAGIO', 'PRESTACAO_SERVICOS'];
const ESTADOS_CORES: Record<string, string> = {
  RECEBIDA: 'bg-gray-100 text-gray-600',
  TRIAGEM: 'bg-blue-100 text-blue-700',
  ENTREVISTA_AGENDADA: 'bg-indigo-100 text-indigo-700',
  ENTREVISTADO: 'bg-indigo-100 text-indigo-700',
  TESTE_PRATICO: 'bg-purple-100 text-purple-700',
  APROVADA_RH: 'bg-amber-100 text-amber-700',
  APROVADA_FINAL: 'bg-green-100 text-green-700',
  REJEITADA: 'bg-red-100 text-red-700',
  CONTRATADA: 'bg-green-200 text-green-800',
};

export default function CandidaturasPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [candidaturas, setCandidaturas] = useState<any[]>([]);
  const [vagas, setVagas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [avaliarId, setAvaliarId] = useState<string | null>(null);
  const [aprovarId, setAprovarId] = useState<string | null>(null);
  const [form, setForm] = useState({ vagaId: '', nomeCandidato: '', email: '', telefone: '', cvUrl: '', cartaMotivacao: '' });
  const [avaliarForm, setAvaliarForm] = useState({ notaEntrevista: '', notaTestePratico: '', observacoesRH: '' });
  const [aprovarForm, setAprovarForm] = useState({ email: '', password: '', salarioBase: '', dataInicio: '', tipoContrato: 'EFETIVO' });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/rh/candidaturas');
    setCandidaturas(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/rh/vagas').then(r => setVagas(r.data.data || [])).catch(() => {});
  }, []);

  const salvar = async () => {
    await api.post('/rh/candidaturas', form);
    setShowForm(false);
    setForm({ vagaId: '', nomeCandidato: '', email: '', telefone: '', cvUrl: '', cartaMotivacao: '' });
    load();
  };

  const salvarAvaliacao = async () => {
    if (!avaliarId) return;
    await api.put(`/rh/candidaturas/${avaliarId}/avaliar`, {
      notaEntrevista: avaliarForm.notaEntrevista ? Number(avaliarForm.notaEntrevista) : undefined,
      notaTestePratico: avaliarForm.notaTestePratico ? Number(avaliarForm.notaTestePratico) : undefined,
      observacoesRH: avaliarForm.observacoesRH || undefined,
    });
    setAvaliarId(null);
    setAvaliarForm({ notaEntrevista: '', notaTestePratico: '', observacoesRH: '' });
    load();
  };

  const rejeitar = async (id: string) => {
    const motivoRejeicao = prompt('Motivo da rejeição:') || '';
    await api.put(`/rh/candidaturas/${id}/rejeitar`, { motivoRejeicao });
    load();
  };

  const salvarAprovacaoFinal = async () => {
    if (!aprovarId) return;
    await api.put(`/rh/candidaturas/${aprovarId}/aprovar-final`, {
      email: aprovarForm.email || undefined,
      password: aprovarForm.password || undefined,
      salarioBase: Number(aprovarForm.salarioBase),
      dataInicio: aprovarForm.dataInicio,
      tipoContrato: aprovarForm.tipoContrato,
    });
    setAprovarId(null);
    setAprovarForm({ email: '', password: '', salarioBase: '', dataInicio: '', tipoContrato: 'EFETIVO' });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidaturas</h1>
          <p className="text-gray-500 text-sm mt-1">Triagem, entrevista e contratação final</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Registar Candidatura
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : candidaturas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <UserPlus className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhuma candidatura registada
        </div>
      ) : (
        <div className="space-y-3">
          {candidaturas.map((c: any) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[c.estado] || 'bg-gray-100 text-gray-600'}`}>{c.estado.replace(/_/g, ' ')}</span>
                    {c.vaga?.titulo && <span className="text-xs text-gray-400">{c.vaga.titulo}</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{c.nomeCandidato}</p>
                  <p className="text-sm text-gray-500">{c.email || '—'} {c.telefone ? `· ${c.telefone}` : ''}</p>
                  {(c.notaEntrevista || c.notaTestePratico) && (
                    <p className="text-xs text-gray-400 mt-1">Entrevista: {c.notaEntrevista ?? '—'} · Teste prático: {c.notaTestePratico ?? '—'}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  {!['REJEITADA', 'CONTRATADA'].includes(c.estado) && (
                    <button onClick={() => setAvaliarId(c.id)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">Avaliar</button>
                  )}
                  {!['REJEITADA', 'CONTRATADA'].includes(c.estado) && (
                    <button onClick={() => rejeitar(c.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Rejeitar</button>
                  )}
                  {isSuperAdmin && !['REJEITADA', 'CONTRATADA'].includes(c.estado) && (
                    <button onClick={() => setAprovarId(c.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Aprovar Contratação</button>
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
            <h2 className="text-lg font-bold text-gray-900">Registar Candidatura</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vaga*</label>
              <select value={form.vagaId} onChange={(e) => setForm(f => ({ ...f, vagaId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Selecionar —</option>
                {vagas.map((v: any) => <option key={v.id} value={v.id}>{v.titulo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do candidato*</label>
              <input value={form.nomeCandidato} onChange={(e) => setForm(f => ({ ...f, nomeCandidato: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input value={form.telefone} onChange={(e) => setForm(f => ({ ...f, telefone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CV (URL)</label>
              <input value={form.cvUrl} onChange={(e) => setForm(f => ({ ...f, cvUrl: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carta de motivação</label>
              <textarea value={form.cartaMotivacao} onChange={(e) => setForm(f => ({ ...f, cartaMotivacao: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.vagaId || !form.nomeCandidato}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                Registar
              </button>
            </div>
          </div>
        </div>
      )}

      {avaliarId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Avaliar Candidatura</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota entrevista (0-10)</label>
                <input type="number" min={0} max={10} value={avaliarForm.notaEntrevista} onChange={(e) => setAvaliarForm(f => ({ ...f, notaEntrevista: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota teste prático</label>
                <input type="number" min={0} max={10} value={avaliarForm.notaTestePratico} onChange={(e) => setAvaliarForm(f => ({ ...f, notaTestePratico: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea value={avaliarForm.observacoesRH} onChange={(e) => setAvaliarForm(f => ({ ...f, observacoesRH: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setAvaliarId(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvarAvaliacao} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {aprovarId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Aprovar Contratação Final</h2>
            <p className="text-xs text-gray-500">Cria automaticamente o Funcionário e um Contrato em rascunho.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (se candidatura não tiver)</label>
              <input type="email" value={aprovarForm.email} onChange={(e) => setAprovarForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salário base (MT)*</label>
              <input type="number" value={aprovarForm.salarioBase} onChange={(e) => setAprovarForm(f => ({ ...f, salarioBase: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de início*</label>
              <input type="date" value={aprovarForm.dataInicio} onChange={(e) => setAprovarForm(f => ({ ...f, dataInicio: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de contrato*</label>
              <select value={aprovarForm.tipoContrato} onChange={(e) => setAprovarForm(f => ({ ...f, tipoContrato: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TIPOS_CONTRATO.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setAprovarId(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvarAprovacaoFinal} disabled={!aprovarForm.salarioBase || !aprovarForm.dataInicio}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                Aprovar e Contratar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
