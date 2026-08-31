'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Fingerprint, MonitorSmartphone, Plus, Filter } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';

const METODOS = ['WEBAUTHN', 'USB_TEMPLATE', 'MANUAL'];

export default function PresencaBiometricaPage() {
  const [registos, setRegistos] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ funcionarioId: '', metodoVerificacao: '', dataInicio: '', dataFim: '' });
  const [showForm, setShowForm] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({ funcionarioId: '', tipo: 'ENTRADA', timestamp: '', observacao: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await api.get('/rh/presenca/registos', { params });
      setRegistos(r.data.data || []);
    } catch (e: any) {
      toast.error('Erro ao carregar registos', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get('/rh/funcionarios', { params: { limit: 500 } }).then((r) => {
      setFuncionarios(r.data.data?.data || r.data.data || []);
    }).catch(() => {});
  }, []);

  const aplicarFiltros = () => load();

  const lancarManual = async () => {
    if (!form.funcionarioId || !form.observacao.trim()) {
      setErro('Preenche o funcionário e a observação');
      return;
    }
    setErro('');
    setSaving(true);
    try {
      await api.post('/rh/presenca/registos/manual', form);
      setShowForm(false);
      setForm({ funcionarioId: '', tipo: 'ENTRADA', timestamp: '', observacao: '' });
      toast.success('Registo lançado');
      load();
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Erro ao lançar registo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Fingerprint className="w-6 h-6" /> Presença Biométrica
          </h1>
          <p className="text-gray-500 text-sm mt-1">Registos de entrada/saída marcados nos quiosques de cada unidade</p>
        </div>
        <div className="flex gap-2">
          <Link href="/rh/presenca/dispositivos" className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <MonitorSmartphone className="w-4 h-4" /> Quiosques
          </Link>
          <button onClick={() => { setErro(''); setShowForm(true); }} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
            <Plus className="w-4 h-4" /> Lançamento Manual
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Funcionário</label>
          <select value={filtros.funcionarioId} onChange={(e) => setFiltros((f) => ({ ...f, funcionarioId: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Todos</option>
            {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Método</label>
          <select value={filtros.metodoVerificacao} onChange={(e) => setFiltros((f) => ({ ...f, metodoVerificacao: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Todos</option>
            {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">De</label>
          <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Até</label>
          <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={aplicarFiltros} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium">
          <Filter className="w-4 h-4" /> Filtrar
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : registos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">Nenhum registo encontrado</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <ResponsiveTable>
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Funcionário</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Método</th>
                <th className="text-left px-4 py-3">Data/Hora</th>
                <th className="text-left px-4 py-3">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registos.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{r.funcionario?.firstName} {r.funcionario?.lastName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${r.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.tipo}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.metodoVerificacao}{r.lancadoManualmente ? ' (manual)' : ''}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.timestamp).toLocaleString('pt-PT')}</td>
                  <td className="px-4 py-3 text-gray-500">{r.observacao || '—'}</td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Lançamento Manual de Presença</h2>
            <p className="text-xs text-gray-500">Usar apenas quando a marcação biométrica falha. A observação é obrigatória.</p>
            {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{erro}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário*</label>
              <select value={form.funcionarioId} onChange={(e) => setForm((f) => ({ ...f, funcionarioId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Selecionar —</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
              <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora (opcional, padrão agora)</label>
              <input type="datetime-local" value={form.timestamp} onChange={(e) => setForm((f) => ({ ...f, timestamp: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação*</label>
              <textarea value={form.observacao} onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))} rows={2}
                placeholder="Motivo do lançamento manual" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={lancarManual} disabled={!form.funcionarioId || !form.observacao || saving}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                {saving ? 'A lançar...' : 'Lançar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
