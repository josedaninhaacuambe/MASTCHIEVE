'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

const statusCfg: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PRESENT:  { label: 'Presente',    color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  ABSENT:   { label: 'Ausente',     color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle },
  LATE:     { label: 'Atrasado',    color: 'text-amber-700',  bg: 'bg-amber-100',  icon: Clock },
  EXCUSED:  { label: 'Justificado', color: 'text-blue-700',   bg: 'bg-blue-100',   icon: AlertCircle },
};

export default function StudentAttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => { const { data } = await api.get('/attendance/me'); return data.data; },
  });

  const records: any[] = data?.records ?? [];
  const rate: number = data?.attendanceRate ?? 0;

  const counts = records.reduce((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const rateColor = rate >= 85 ? 'text-green-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600';
  const rateGrad = rate >= 85 ? 'from-green-500 to-emerald-600' : rate >= 70 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600';

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">As Minhas Presenças</h1>
        <p className="text-gray-500 text-sm mt-1">Historial de assiduidade nas sessões de treino</p>
      </div>

      {/* Rate card */}
      <div className={cn('rounded-2xl p-6 text-white bg-gradient-to-br', rateGrad)}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-bold">{rate}%</div>
            <div className="text-white/80 mt-1 text-sm font-medium">Taxa de Assiduidade</div>
            <div className="text-white/60 text-xs mt-0.5">{records.length} sessões no total</div>
          </div>
          <div className="w-20 h-20 relative">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="white" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${rate} ${100 - rate}`}
                strokeDashoffset="0"
              />
            </svg>
            <TrendingUp className="w-6 h-6 text-white absolute inset-0 m-auto" />
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Object.entries(statusCfg).map(([key, cfg]) => (
            <div key={key} className="bg-white/15 rounded-xl p-2 text-center">
              <div className="text-lg font-bold">{counts[key] ?? 0}</div>
              <div className="text-white/70 text-[10px] mt-0.5">{cfg.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Records list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-mastchieve-500" />
          <span className="font-semibold text-gray-900 text-sm">Histórico de Sessões</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
            {records.map((r: any) => {
              const cfg = statusCfg[r.status] ?? statusCfg.ABSENT;
              const Icon = cfg.icon;
              return (
                <div key={r.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
                    <Icon className={cn('w-4 h-4', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">
                      {r.session?.sessionDate ? formatDate(r.session.sessionDate) : formatDate(r.markedAt)}
                    </div>
                    {r.session?.startTime && (
                      <div className="text-xs text-gray-400">{r.session.startTime}</div>
                    )}
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
            {records.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sem registos de presença</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
