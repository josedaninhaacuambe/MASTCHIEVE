'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, CalendarClock } from 'lucide-react';

const TURNOS = ['MANHA', 'TARDE', 'NOITE'];
const TIPOS = ['AULA', 'SALVAMENTO', 'ADMINISTRATIVO', 'FORMACAO', 'FOLGA'];
const ESTADOS_CORES: Record<string, string> = {
  PLANEADA: 'bg-blue-100 text-blue-700',
  CONFIRMADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-gray-200 text-gray-500',
};

export default function EscalasPage() {
  const [escalas, setEscalas] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ funcionarioId: '', data: '', turno: 'MANHA', horaInicio: '', horaFim: '', tipo: 'AULA', observacoes: '' });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/rh/escalas');
    setEscalas(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/rh/funcionarios').then(r => setFuncionarios(r.data.data?.data || r.data.data || [])).catch(() => {});
  }, []);

  const salvar = async () => {
    setErro('');
    try {
      await api.post('/rh/escalas', form);
      setShowForm(false);
      setForm({ funcionarioId: '', data: '', turno: 'MANHA', horaInicio: '', horaFim: '', tipo: 'AULA', observacoes: '' });
      load();
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Erro ao criar escala');
    }
  };

  const confirmar = async (id: string) => { await api.put(`/rh/escalas/${id}/confirmar`); load(); };
  const cancelar = async (id: string) => { await api.put(`/rh/escalas/${id}/cancelar`); load(); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escalas</h1>
          <p className="text-gray-500 text-sm mt-1">Escalas de turnos — bloqueadas se certificação obrigatória estiver expirada</p>
        </div>
        <button onClick={() => { setErro(''); setShowForm(true); }} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nova Escala
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : escalas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <CalendarClock className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhuma escala registada
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Funcionário</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Turno</th>
                <th className="text-left px-4 py-3">Horário</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {escalas.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{e.funcionario?.firstName} {e.funcionario?.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(e.data).toLocaleDateString('pt-PT')}</td>
                  <td className="px-4 py-3 text-gray-600">{e.turno}</td>
                  <td className="px-4 py-3 text-gray-500">{e.horaInicio}-{e.horaFim}</td>
                  <td className="px-4 py-3 text-gray-600">{e.tipo?.replace(/_/g, ' ') || '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADOS_CORES[e.estado] || 'bg-gray-100 text-gray-600'}`}>{e.estado}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {e.estado === 'PLANEADA' && (
                        <>
                          <button onClick={() => confirmar(e.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Confirmar</button>
                          <button onClick={() => cancelar(e.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Cancelar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Nova Escala</h2>
            {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{erro}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário*</label>
              <select value={form.funcionarioId} onChange={(e) => setForm(f => ({ ...f, funcionarioId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Selecionar —</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data*</label>
                <input type="date" value={form.data} onChange={(e) => setForm(f => ({ ...f, data: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turno*</label>
                <select value={form.turno} onChange={(e) => setForm(f => ({ ...f, turno: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {TURNOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora início*</label>
                <input type="time" value={form.horaInicio} onChange={(e) => setForm(f => ({ ...f, horaInicio: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora fim*</label>
                <input type="time" value={form.horaFim} onChange={(e) => setForm(f => ({ ...f, horaFim: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={(e) => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.funcionarioId || !form.data || !form.horaInicio || !form.horaFim}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
