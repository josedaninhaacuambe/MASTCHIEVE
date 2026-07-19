'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PieChart, ChevronLeft, ChevronRight } from 'lucide-react';

export default function RelatoriosRhPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entityFiltro, setEntityFiltro] = useState('');

  const load = async (p: number) => {
    setLoading(true);
    const r = await api.get('/rh/relatorios/auditoria', { params: { page: p, limit: 50 } });
    setLogs(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page]);

  const entidades = Array.from(new Set(logs.map((l: any) => l.entity)));
  const filtrados = entityFiltro ? logs.filter((l: any) => l.entity === entityFiltro) : logs;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios e Auditoria</h1>
        <p className="text-gray-500 text-sm mt-1">Histórico de ações realizadas no módulo de Recursos Humanos</p>
      </div>

      {entidades.length > 0 && (
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por entidade</label>
          <select value={entityFiltro} onChange={(e) => setEntityFiltro(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Todas</option>
            {entidades.map((e: string) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : filtrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <PieChart className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Sem registos de auditoria
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Ação</th>
                <th className="text-left px-4 py-3">Entidade</th>
                <th className="text-left px-4 py-3">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString('pt-PT')}</td>
                  <td className="px-4 py-3 font-medium">{l.action.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-600">{l.entity}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{l.entityId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-500">Página {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 50} className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
