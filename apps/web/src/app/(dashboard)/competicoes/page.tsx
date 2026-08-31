'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Plus, Trophy, Calendar, MapPin, Medal, Users } from 'lucide-react';

const ESTADOS_CORES: Record<string, string> = { PLANEADA:'bg-blue-100 text-blue-700', REALIZADA:'bg-green-100 text-green-700', CANCELADA:'bg-red-100 text-red-700' };
const MODALIDADES = ['CROL','COSTAS','BRUCOS','MARIPOSA','MEDLEY','REVEZAMENTO'];

export default function CompeticoesPage() {
  const [competicoes, setCompeticoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome:'', data:'', local:'', organizador:'', modalidades:'[]', categorias:'[]', notas:'' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/competicoes');
      setCompeticoes(r.data.data || r.data);
    } catch (e: any) {
      toast.error('Erro ao carregar competições', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const salvar = async () => {
    if (!form.nome.trim() || !form.data) {
      toast.error('Campos obrigatórios', 'Preenche o nome e a data da competição');
      return;
    }
    setSaving(true);
    try {
      await api.post('/competicoes', { ...form, data: new Date(form.data).toISOString() });
      setShowForm(false);
      setForm({ nome:'', data:'', local:'', organizador:'', modalidades:'[]', categorias:'[]', notas:'' });
      toast.success('Competição criada');
      load();
    } catch (e: any) {
      toast.error('Erro ao criar competição', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const atualizar = async (id: string, estado: string) => {
    try {
      await api.put(`/competicoes/${id}`, { estado });
      load();
    } catch (e: any) {
      toast.error('Erro ao atualizar competição', e?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  const totais = { total: competicoes.length, realizadas: competicoes.filter(c => c.estado === 'REALIZADA').length, atletas: competicoes.reduce((acc, c) => acc + (c._count?.atletas || 0), 0) };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competições</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de participação em competições e resultados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nova Competição
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-3xl font-bold text-gray-800">{totais.total}</div>
          <div className="text-sm text-gray-500 mt-1">Total de competições</div>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
          <div className="text-3xl font-bold text-green-700">{totais.realizadas}</div>
          <div className="text-sm text-gray-500 mt-1">Realizadas</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <div className="text-3xl font-bold text-blue-700">{totais.atletas}</div>
          <div className="text-sm text-gray-500 mt-1">Participações totais</div>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competicoes.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhuma competição registada</p>
            </div>
          )}
          {competicoes.map((c: any) => {
            const modalidades = (() => { try { return JSON.parse(c.modalidades || '[]'); } catch { return []; } })();
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Trophy className="w-5 h-5 text-amber-500 mb-1" />
                      <h3 className="font-bold text-gray-900">{c.nome}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[c.estado]}`}>{c.estado}</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{new Date(c.data).toLocaleDateString('pt-PT', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}</div>
                    {c.local && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{c.local}</div>}
                    {c._count?.atletas > 0 && <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />{c._count.atletas} atletas inscritos</div>}
                  </div>
                  {modalidades.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {modalidades.map((m: string) => <span key={m} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{m}</span>)}
                    </div>
                  )}
                </div>
                <div className="px-5 pb-4 flex gap-2">
                  {c.estado === 'PLANEADA' && <button onClick={() => atualizar(c.id, 'REALIZADA')} className="flex-1 text-xs bg-green-100 text-green-700 py-1.5 rounded-lg hover:bg-green-200 font-medium">Marcar Realizada</button>}
                  {c.estado === 'PLANEADA' && <button onClick={() => atualizar(c.id, 'CANCELADA')} className="text-xs bg-red-100 text-red-600 py-1.5 px-3 rounded-lg hover:bg-red-200">Cancelar</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Nova Competição</h2>
            {[{ label:'Nome*', key:'nome', type:'text' }, { label:'Data*', key:'data', type:'datetime-local' }, { label:'Local', key:'local', type:'text' }, { label:'Organizador', key:'organizador', type:'text' }].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.nome || !form.data || saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'A criar...' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
