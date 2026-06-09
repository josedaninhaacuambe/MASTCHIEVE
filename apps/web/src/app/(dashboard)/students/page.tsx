'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, getInitials, levelLabel, cn } from '@/lib/utils';
import {
  Search, Plus, Eye, Users, AlertCircle, RefreshCw, LayoutGrid,
  List, ChevronDown, MoreVertical, Activity, CreditCard, TrendingDown,
} from 'lucide-react';
import Link from 'next/link';

// ─── Avatar gradient by first character ───────────────────────────────────────
function avatarGradient(name: string) {
  const c = (name?.[0] ?? 'A').toUpperCase();
  if (c >= 'A' && c <= 'E') return 'from-blue-400 to-blue-600';
  if (c >= 'F' && c <= 'K') return 'from-emerald-400 to-emerald-600';
  if (c >= 'L' && c <= 'P') return 'from-violet-400 to-violet-600';
  return 'from-rose-400 to-rose-600';
}

// ─── Level badge classes ───────────────────────────────────────────────────────
const levelColors: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700',
  ELEMENTARY: 'bg-sky-100 text-sky-700',
  INTERMEDIATE: 'bg-purple-100 text-purple-700',
  ADVANCED: 'bg-orange-100 text-orange-700',
  COMPETITIVE: 'bg-red-100 text-red-700',
};

// ─── Mini attendance ring ──────────────────────────────────────────────────────
function AttendanceRing({ rate }: { rate: number }) {
  const r = 16, c = 2 * Math.PI * r;
  const color = rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={c} strokeDashoffset={c - (c * rate / 100)}
        strokeLinecap="round" transform="rotate(-90 22 22)" />
      <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>{rate}%</text>
    </svg>
  );
}

// ─── 3-dot menu ───────────────────────────────────────────────────────────────
function StudentMenu({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
            <Link href={`/students/${id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
              <Eye className="w-3.5 h-3.5" /> Ver perfil
            </Link>
            <Link href={`/students/${id}#performance`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
              <Activity className="w-3.5 h-3.5" /> Registar desempenho
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, iconBg, iconColor,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 leading-none">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Level dropdown ───────────────────────────────────────────────────────────
const LEVELS = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED', 'COMPETITIVE'] as const;

function LevelDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition',
          value
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
        )}
      >
        {value ? levelLabel(value) : 'Nível'}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40">
            {value && (
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50 transition"
              >
                Todos os níveis
              </button>
            )}
            {LEVELS.map((l) => (
              <button key={l} onClick={() => { onChange(l); setOpen(false); }}
                className={cn('w-full text-left px-4 py-2 text-sm transition hover:bg-gray-50',
                  value === l ? 'font-semibold text-indigo-600' : 'text-gray-700')}>
                {levelLabel(l)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-4 opacity-25">
        <ellipse cx="40" cy="62" rx="24" ry="4" fill="#94a3b8" />
        <path d="M22 38 Q28 18 40 18 Q52 18 58 38" stroke="#94a3b8" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="40" cy="14" r="6" fill="#94a3b8" />
        <path d="M30 42 Q40 52 50 42" stroke="#94a3b8" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M22 38 L16 48 M58 38 L64 48" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">Nenhum atleta encontrado</h3>
      <p className="text-sm text-gray-400 mb-4">Tenta ajustar os filtros ou a pesquisa.</p>
      <button onClick={onReset}
        className="px-4 py-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white text-sm font-medium rounded-lg transition">
        Limpar filtros
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [levelFilter, setLevelFilter] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['students', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...(search && { search }) });
      const { data } = await api.get(`/students?${params}`);
      return data;
    },
  });

  const allStudents: any[] = data?.data ?? [];

  // ── KPI derivations ──────────────────────────────────────────────────────
  const totalStudents = data?.meta?.total ?? allStudents.length;
  const activeCount = allStudents.filter((s) => s.isActive).length;
  const overdueCount = allStudents.filter((s) =>
    s.payments?.some((p: any) => p.status === 'OVERDUE'),
  ).length;

  // Attendance: use perf data if present, otherwise fall back to placeholder
  const attendanceRates = allStudents
    .map((s) => s.attendanceRate)
    .filter((r) => typeof r === 'number');
  const avgAttendance = attendanceRates.length
    ? Math.round(attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length)
    : null;

  // ── Client-side filtering ─────────────────────────────────────────────────
  const filtered = allStudents.filter((s) => {
    if (statusFilter === 'active' && !s.isActive) return false;
    if (statusFilter === 'inactive' && s.isActive) return false;
    if (levelFilter) {
      const level = s.enrollments?.[0]?.class?.level ?? s.level;
      if (level !== levelFilter) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setLevelFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atletas</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de todos os atletas inscritos</p>
        </div>
        <Link href="/students/new"
          className="flex items-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          <Plus className="w-4 h-4" /> Novo Atleta
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total atletas" value={totalStudents}
          iconBg="bg-blue-50" iconColor="text-blue-600" />
        <KpiCard icon={Activity} label="Atletas ativos" value={isLoading ? '—' : activeCount}
          sub={isLoading ? undefined : `${totalStudents - activeCount} inativos`}
          iconBg="bg-green-50" iconColor="text-green-600" />
        <KpiCard icon={TrendingDown} label="Taxa de assiduidade"
          value={isLoading ? '—' : avgAttendance !== null ? `${avgAttendance}%` : '—'}
          sub="Média do grupo"
          iconBg="bg-amber-50" iconColor="text-amber-600" />
        <KpiCard icon={CreditCard} label="Mensalidades em atraso"
          value={isLoading ? '—' : overdueCount}
          iconBg="bg-red-50" iconColor="text-red-500" />
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-48 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Pesquisar por nome ou email..."
            className="bg-transparent text-sm outline-none flex-1"
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition',
                statusFilter === s
                  ? 'bg-mastchieve-600 text-white border-mastchieve-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
              )}>
              {s === 'all' ? 'Todos' : s === 'active' ? 'Ativo' : 'Inativo'}
            </button>
          ))}
          <LevelDropdown value={levelFilter} onChange={(v) => { setLevelFilter(v); setPage(1); }} />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Count */}
        <span className="text-sm text-gray-400 hidden sm:block">{filtered.length} atletas</span>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setView('grid')}
            className={cn('p-1.5 rounded-md transition', view === 'grid' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')}
            className={cn('p-1.5 rounded-md transition', view === 'list' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Erro ao carregar atletas. Verifica a ligação ao servidor.
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-1 text-xs text-red-600 hover:underline">
            <RefreshCw className="w-3 h-3" /> Tentar novamente
          </button>
        </div>
      )}

      {/* ── GRID VIEW ──────────────────────────────────────────────────────── */}
      {view === 'grid' && (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="w-6 h-6 bg-gray-100 rounded-full" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                  <div className="h-6 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl">
              <EmptyState onReset={resetFilters} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((student: any) => {
                const initials = getInitials(student.firstName, student.lastName);
                const grad = avatarGradient(student.firstName);
                const level = student.enrollments?.[0]?.class?.level ?? student.level;
                const attendance = typeof student.attendanceRate === 'number' ? student.attendanceRate : null;
                return (
                  <div key={student.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition group relative flex flex-col">
                    {/* Top row: avatar + menu */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn('w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold flex-shrink-0', grad)}>
                        {initials}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Status dot */}
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0',
                          student.isActive ? 'bg-green-500' : 'bg-gray-300')}
                          title={student.isActive ? 'Ativo' : 'Inativo'} />
                        <StudentMenu id={student.id} />
                      </div>
                    </div>

                    {/* Name + email */}
                    <div className="mb-3 flex-1">
                      <div className="font-semibold text-gray-900 text-sm leading-tight">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{student.user?.email ?? '—'}</div>
                    </div>

                    {/* Level badge */}
                    {level && (
                      <span className={cn('self-start text-xs px-2.5 py-0.5 rounded-full font-medium mb-3',
                        levelColors[level] ?? 'bg-gray-100 text-gray-600')}>
                        {levelLabel(level)}
                      </span>
                    )}

                    {/* Attendance ring + Ver perfil */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      {attendance !== null ? (
                        <AttendanceRing rate={attendance} />
                      ) : (
                        <div className="w-11 h-11 rounded-full border-4 border-gray-100 flex items-center justify-center">
                          <span className="text-xs text-gray-300">—</span>
                        </div>
                      )}
                      <Link href={`/students/${student.id}`}
                        className="text-xs font-medium text-mastchieve-600 hover:text-mastchieve-700 hover:underline transition">
                        Ver perfil →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW ──────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
              : filtered.length === 0
              ? <EmptyState onReset={resetFilters} />
              : filtered.map((student: any) => {
                  const grad = avatarGradient(student.firstName);
                  const level = student.enrollments?.[0]?.class?.level ?? student.level;
                  return (
                    <Link key={student.id} href={`/students/${student.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
                      <div className={cn('w-10 h-10 bg-gradient-to-br rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', grad)}>
                        {getInitials(student.firstName, student.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{student.enrollments?.[0]?.class?.name ?? '—'}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {level && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium hidden xs:inline',
                            levelColors[level] ?? 'bg-gray-100 text-gray-600')}>
                            {levelLabel(level)}
                          </span>
                        )}
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                          student.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                          {student.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
          </div>

          {/* Desktop table */}
          <table className="hidden sm:table w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Atleta</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Nível</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Assiduidade</th>
                <th className="hidden lg:table-cell text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Última sessão</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState onReset={resetFilters} />
                  </td>
                </tr>
              ) : (
                filtered.map((student: any) => {
                  const grad = avatarGradient(student.firstName);
                  const level = student.enrollments?.[0]?.class?.level ?? student.level;
                  const attendance = typeof student.attendanceRate === 'number' ? student.attendanceRate : null;
                  const lastSession = student.lastSessionDate ?? student.enrollments?.[0]?.updatedAt;
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-9 h-9 bg-gradient-to-br rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', grad)}>
                            {getInitials(student.firstName, student.lastName)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{student.firstName} {student.lastName}</div>
                            <div className="text-xs text-gray-400">{student.user?.email ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {level ? (
                          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', levelColors[level] ?? 'bg-gray-100 text-gray-600')}>
                            {levelLabel(level)}
                          </span>
                        ) : <span className="text-gray-300 text-sm">—</span>}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        {attendance !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', attendance >= 80 ? 'bg-green-500' : attendance >= 60 ? 'bg-amber-400' : 'bg-red-400')}
                                style={{ width: `${attendance}%` }} />
                            </div>
                            <span className="text-sm text-gray-700 font-medium">{attendance}%</span>
                          </div>
                        ) : <span className="text-gray-300 text-sm">—</span>}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-500">
                        {lastSession ? formatDate(lastSession) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium',
                          student.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                          {student.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/students/${student.id}`}
                          className="p-2 text-gray-400 hover:text-mastchieve-600 hover:bg-mastchieve-50 rounded-lg transition inline-flex">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {data?.meta && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {((page - 1) * 20) + 1}–{Math.min(page * 20, data.meta.total)} de {data.meta.total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  Anterior
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.meta.totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid-view pagination */}
      {view === 'grid' && data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-6 py-4">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * 20) + 1}–{Math.min(page * 20, data.meta.total)} de {data.meta.total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">
              Anterior
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.meta.totalPages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
