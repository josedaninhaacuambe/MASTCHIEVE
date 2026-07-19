'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, Briefcase } from 'lucide-react';

const CARGOS = ['INSTRUTOR_NATACAO', 'SALVA_VIDAS', 'RECEPCIONISTA', 'ADMINISTRATIVO', 'COORDENADOR', 'MANUTENCAO', 'OUTRO'];
const ESTADOS_CORES: Record<string, string> = {
  RASCUNHO: 'bg-gray-100 text-gray-600',
  EM_APROVACAO: 'bg-amber-100 text-amber-700',
  APROVADA: 'bg-blue-100 text-blue-700',
  REJEITADA: 'bg-red-100 text-red-700',
  PUBLICADA: 'bg-green-100 text-green-700',
  EM_TRIAGEM: 'bg-indigo-100 text-indigo-700',
  ENCERRADA: 'bg-gray-200 text-gray-500',
  CANCELADA: 'bg-gray-200 text-gray-500',
};

export default function VagasPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [vagas, setVagas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', cargo: 'INSTRUTOR_NATACAO', descricao: '', requisitos: '', numeroVagas: '1', orcamentoEstimado: '' });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/rh/vagas');
    setVagas(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const salvar = async () => {
    await api.post('/rh/vagas', {
      ...form,
      numeroVagas: form.numeroVagas ? Number(form.numeroVagas) : undefined,
      orcamentoEstimado: form.orcamentoEstimado ? Number(form.orcamentoEstimado) : undefined,
    });
    setShowForm(false);
    setForm({ titulo: '', cargo: 'INSTRUTOR_NATACAO', descricao: '', requisitos: '', numeroVagas: '1', orcamentoEstimado: '' });
    load();
  };

  const aprovar = async (id: string) => { await api.put(`/rh/vagas/${id}/aprovar`); load(); };
  const rejeitar = async (id: string) => {
    const motivoRejeicao = prompt('Motivo da rejeição:') || '';
    await api.put(`/rh/vagas/${id}/rejeitar`, { motivoRejeicao });
    load();
  };
  const publicar = async (id: string) => { await api.put(`/rh/vagas/${id}/publicar`); load(); };
  const encerrar = async (id: string) => { await api.put(`/rh/vagas/${id}/encerrar`); load(); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vagas</h1>
          <p className="text-gray-500 text-sm mt-1">Recrutamento — abertura e aprovação de vagas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Solicitar Vaga
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : vagas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhuma vaga registada
        </div>
      ) : (
        <div className="space-y-3">
          {vagas.map((v: any) => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[v.estado] || 'bg-gray-100 text-gray-600'}`}>{v.estado.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-400">{v.cargo?.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-400">{v._count?.candidaturas || 0} candidatura(s)</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{v.titulo}</p>
                  <p className="text-sm text-gray-500 mt-1">{v.descricao}</p>
                  {v.orcamentoEstimado && <p className="text-xs text-gray-400 mt-1">Orçamento: MT {v.orcamentoEstimado}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {v.estado === 'EM_APROVACAO' && isSuperAdmin && (
                    <>
                      <button onClick={() => aprovar(v.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Aprovar</button>
                      <button onClick={() => rejeitar(v.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Rejeitar</button>
                    </>
                  )}
                  {v.estado === 'APROVADA' && <button onClick={() => publicar(v.id)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">Publicar</button>}
                  {['PUBLICADA', 'EM_TRIAGEM'].includes(v.estado) && <button onClick={() => encerrar(v.id)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200">Encerrar</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Solicitar Abertura de Vaga</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título*</label>
              <input value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo*</label>
              <select value={form.cargo} onChange={(e) => setForm(f => ({ ...f, cargo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {CARGOS.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição*</label>
              <textarea value={form.descricao} onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requisitos</label>
              <textarea value={form.requisitos} onChange={(e) => setForm(f => ({ ...f, requisitos: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº vagas</label>
                <input type="number" value={form.numeroVagas} onChange={(e) => setForm(f => ({ ...f, numeroVagas: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento estimado (MT)</label>
                <input type="number" value={form.orcamentoEstimado} onChange={(e) => setForm(f => ({ ...f, orcamentoEstimado: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.titulo || !form.descricao}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                Solicitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
