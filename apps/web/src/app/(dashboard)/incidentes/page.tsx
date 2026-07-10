'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

const TIPOS = ['ACIDENTE_MENOR','ACIDENTE_GRAVE','NEAR_MISS','COMPORTAMENTO','EQUIPAMENTO','INSTALACOES','OUTRO'];
const ESTADOS_CORES: Record<string, string> = { REPORTADO:'bg-red-100 text-red-700', EM_INVESTIGACAO:'bg-yellow-100 text-yellow-700', RESOLVIDO:'bg-green-100 text-green-700', FECHADO:'bg-gray-100 text-gray-600' };

export default function IncidentesPage() {
  const [incidentes, setIncidentes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo:'ACIDENTE_MENOR', descricao:'', acaoImediata:'', envolvidos:'[]' });

  const load = async () => {
    setLoading(true);
    const [inc, s] = await Promise.all([api.get('/incidentes'), api.get('/incidentes/stats')]);
    setIncidentes(inc.data.data || inc.data);
    setStats(s.data.data || s.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const salvar = async () => {
    await api.post('/incidentes', form);
    setShowForm(false);
    setForm({ tipo:'ACIDENTE_MENOR', descricao:'', acaoImediata:'', envolvidos:'[]' });
    load();
  };

  const atualizar = async (id: string, estado: string) => {
    await api.put(`/incidentes/${id}`, { estado });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Incidentes e Segurança</h1>
          <p className="text-gray-500 text-sm mt-1">Registo e acompanhamento de incidentes (SOP 09) — Meta: 0 incidentes graves</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Reportar Incidente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 ${stats.zerado ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            {stats.zerado ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <span className="text-sm font-medium text-gray-700">KPI Segurança</span>
          </div>
          <div className={`text-lg font-bold ${stats.zerado ? 'text-green-700' : 'text-red-700'}`}>{stats.zerado ? '✓ Meta atingida' : '✗ Incidentes activos'}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-800">{stats.total || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total registado</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{stats.abertos || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Em aberto</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="text-2xl font-bold text-red-700">{stats.graves || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Graves</div>
        </div>
      </div>

      {/* Lista */}
      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="space-y-3">
          {incidentes.length === 0 && (
            <div className="text-center py-12 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Nenhum incidente registado</p>
              <p className="text-green-600 text-sm">Meta de 0 incidentes atingida</p>
            </div>
          )}
          {incidentes.map((i: any) => (
            <div key={i.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[i.estado]}`}>{i.estado}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{i.tipo}</span>
                    <span className="text-xs text-gray-400">{new Date(i.data).toLocaleDateString('pt-PT')}</span>
                    {i.unidade && <span className="text-xs text-gray-400">{i.unidade.codigo}</span>}
                  </div>
                  <p className="text-sm text-gray-800 font-medium mb-1">{i.descricao}</p>
                  <p className="text-sm text-gray-500"><strong>Ação imediata:</strong> {i.acaoImediata}</p>
                </div>
                <div className="flex gap-2">
                  {i.estado === 'REPORTADO' && <button onClick={() => atualizar(i.id, 'EM_INVESTIGACAO')} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200">Investigar</button>}
                  {i.estado === 'EM_INVESTIGACAO' && <button onClick={() => atualizar(i.id, 'RESOLVIDO')} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Resolver</button>}
                  {i.estado === 'RESOLVIDO' && <button onClick={() => atualizar(i.id, 'FECHADO')} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200">Fechar</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-gray-900">Reportar Incidente</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Incidente</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TIPOS.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do incidente*</label>
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ação imediata tomada*</label>
              <textarea value={form.acaoImediata} onChange={e => setForm(f => ({ ...f, acaoImediata: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.descricao || !form.acaoImediata} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">Reportar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
