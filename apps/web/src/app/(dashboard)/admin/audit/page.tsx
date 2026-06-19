'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import {
  ClipboardList, Search, ChevronLeft, ChevronRight,
  User, Database, Edit2, Trash2, Plus, LogIn, Shield, RefreshCw,
} from 'lucide-react';

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  CREATE:     { label: 'Criação',    color: 'bg-green-100 text-green-700',  icon: Plus },
  UPDATE:     { label: 'Alteração',  color: 'bg-blue-100 text-blue-700',    icon: Edit2 },
  DELETE:     { label: 'Eliminação', color: 'bg-red-100 text-red-600',      icon: Trash2 },
  LOGIN:      { label: 'Login',      color: 'bg-gray-100 text-gray-600',    icon: LogIn },
  LOGOUT:     { label: 'Logout',     color: 'bg-gray-100 text-gray-500',    icon: LogIn },
  ROLE_CHANGE:{ label: 'Cargo',      color: 'bg-purple-100 text-purple-700',icon: Shield },
};

function actionCfg(action: string) {
  const key = Object.keys(ACTION_CONFIG).find(k => action.toUpperCase().includes(k)) ?? '';
  return ACTION_CONFIG[key] ?? { label: action, color: 'bg-gray-100 text-gray-500', icon: Database };
}

function tryParse(json: string | null) {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return json; }
}

function JsonPill({ data }: { data: any }) {
  if (!data) return null;
  const entries = typeof data === 'object' ? Object.entries(data).slice(0, 3) : [];
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([k, v]: any) => (
        <span key={k} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
          {k}: {String(v).slice(0, 20)}{String(v).length > 20 ? '…' : ''}
        </span>
      ))}
      {entries.length < Object.keys(data).length && (
        <span className="text-[10px] text-gray-400">+{Object.keys(data).length - entries.length} more</span>
      )}
    </div>
  );
}

const PAGE_SIZE = 25;

export default function AuditLogPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs', page, search, entity],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(search && { search }),
        ...(entity && { entity }),
      });
      const { data } = await api.get(`/users/audit-logs?${params}`);
      return data;
    },
    staleTime: 30_000,
  });

  const logs: any[] = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, totalPages: 1 };

  function applySearch() {
    setSearch(searchInput);
    setPage(1);
  }

  const ENTITIES = ['Student', 'Instructor', 'Class', 'User', 'Attendance', 'Feedback', 'Payment', 'TrainingPlan'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 text-sm mt-1">Registo de todas as acções efectuadas na plataforma</p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applySearch()}
            placeholder="Pesquisar por acção, entidade..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas as entidades</option>
          {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <button onClick={applySearch}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition">
          Filtrar
        </button>
        {(search || entity) && (
          <button onClick={() => { setSearch(''); setSearchInput(''); setEntity(''); setPage(1); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline">
            Limpar
          </button>
        )}
        <span className="ml-auto text-sm text-gray-400">{meta.total} evento(s)</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-red-500">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Erro ao carregar logs</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum evento encontrado</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Quando', 'Utilizador', 'Acção', 'Entidade', 'Alterações', 'IP'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log: any) => {
                  const cfg = actionCfg(log.action);
                  const Icon = cfg.icon;
                  const newVals = tryParse(log.newValues);
                  const oldVals = tryParse(log.oldValues);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 truncate max-w-28">{log.user?.email ?? log.userId}</p>
                            <p className="text-[10px] text-gray-400 uppercase">{log.user?.role ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium w-fit', cfg.color)}>
                          <Icon className="w-3 h-3" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-gray-900">{log.entity}</p>
                          {log.entityId && <p className="text-[10px] text-gray-400 font-mono">{log.entityId.slice(0, 8)}…</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-48">
                        {newVals && <JsonPill data={newVals} />}
                        {!newVals && oldVals && <JsonPill data={oldVals} />}
                        {!newVals && !oldVals && <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[10px] text-gray-400 font-mono">{log.ipAddress ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Página {page} de {meta.totalPages} · {meta.total} eventos
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(meta.totalPages - 4, page - 2)) + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={cn('w-8 h-8 rounded-lg text-xs font-medium transition',
                          p === page ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50')}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
