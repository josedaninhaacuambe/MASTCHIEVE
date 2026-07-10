'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Calendar, MapPin, Users, Award } from 'lucide-react';

const ESTADOS_CORES: Record<string, string> = { PLANEADO:'bg-blue-100 text-blue-700', REALIZADO:'bg-green-100 text-green-700', CANCELADO:'bg-red-100 text-red-700' };

export default function EventosPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome:'', tipo:'OPEN_DAY', data:'', programa:'', capacidade:'', notas:'' });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/eventos');
    setEventos(r.data.data || r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const salvar = async () => {
    await api.post('/eventos', { ...form, capacidade: form.capacidade ? Number(form.capacidade) : undefined, data: new Date(form.data).toISOString() });
    setShowForm(false);
    setForm({ nome:'', tipo:'OPEN_DAY', data:'', programa:'', capacidade:'', notas:'' });
    load();
  };

  const atualizar = async (id: string, estado: string) => {
    await api.put(`/eventos/${id}`, { estado });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos e Open Days</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de Open Days, entregas de certificados e eventos (SOP 07)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Evento
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhum evento registado</p>
            </div>
          )}
          {eventos.map((e: any) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className={`px-5 pt-5 pb-4`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-400 font-medium">{e.tipo.replace('_', ' ')}</span>
                    <h3 className="font-bold text-gray-900 text-lg mt-0.5">{e.nome}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[e.estado]}`}>{e.estado}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{new Date(e.data).toLocaleDateString('pt-PT', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
                  {e.unidade && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{e.unidade.nome}</div>}
                  {e.capacidade && <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />Capacidade: {e.capacidade} pessoas</div>}
                  {e._count && <div className="flex items-center gap-2"><Award className="w-4 h-4 text-gray-400" />{e._count.certificados} certificados</div>}
                </div>
              </div>
              <div className="px-5 pb-4 flex gap-2">
                {e.estado === 'PLANEADO' && <button onClick={() => atualizar(e.id, 'REALIZADO')} className="flex-1 text-xs bg-green-100 text-green-700 py-1.5 rounded-lg hover:bg-green-200 font-medium">Marcar Realizado</button>}
                {e.estado === 'PLANEADO' && <button onClick={() => atualizar(e.id, 'CANCELADO')} className="text-xs bg-red-100 text-red-600 py-1.5 px-3 rounded-lg hover:bg-red-200">Cancelar</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Novo Evento</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="OPEN_DAY">Open Day</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            {[{ label:'Nome*', key:'nome', type:'text' }, { label:'Data*', key:'data', type:'datetime-local' }, { label:'Capacidade', key:'capacidade', type:'number' }].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
              <textarea value={form.programa} onChange={e => setForm(f => ({ ...f, programa: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.nome || !form.data} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Criar Evento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
