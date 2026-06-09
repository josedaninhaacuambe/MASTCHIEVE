'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  Users, GraduationCap, BookOpen, AlertCircle,
  TrendingUp, Activity, Brain, Target, BarChart3, CheckCircle,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

function KpiCard({ icon: Icon, label, value, sub, color = 'blue', target, achieved }: any) {
  const colors: Record<string, { bg: string; text: string }> = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  };
  const c = colors[color] ?? colors.blue;
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${c.text}`} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      {target !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Meta: {target}</span>
            <span className={achieved ? 'text-green-600 font-medium' : 'text-orange-500'}>{achieved ? '✓ Atingido' : 'Em progresso'}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${achieved ? 'bg-green-400' : 'bg-orange-400'}`}
              style={{ width: achieved ? '100%' : '83%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function KpiPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpi-dashboard'],
    queryFn: async () => { const { data } = await api.get('/kpi/dashboard'); return data.data; },
    refetchInterval: 60_000,
    enabled: isAdmin,
  });

  const { data: history } = useQuery({
    queryKey: ['kpi-history'],
    queryFn: async () => { const { data } = await api.get('/kpi/history?days=30'); return data.data; },
    enabled: isAdmin,
  });

  const { data: adoption } = useQuery({
    queryKey: ['kpi-adoption'],
    queryFn: async () => { const { data } = await api.get('/kpi/instructor-adoption'); return data.data; },
    enabled: isAdmin,
  });

  const { data: attendance } = useQuery({
    queryKey: ['kpi-attendance'],
    queryFn: async () => { const { data } = await api.get('/kpi/attendance?days=30'); return data.data; },
    enabled: isAdmin,
  });

  const moduleProgressData = kpis?.moduleProgress
    ? Object.entries(kpis.moduleProgress).map(([status, count]) => ({
        name: { COMPLETED: 'Concluídos', IN_PROGRESS: 'Em Progresso', NOT_STARTED: 'Não Iniciados', NEEDS_REVIEW: 'A Rever' }[status] ?? status,
        value: count as number,
      }))
    : [];

  const historyFormatted = (history ?? []).map((h: any) => ({
    ...h,
    label: new Date(h.snapshotDate).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
  }));

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <h2 className="text-xl font-semibold text-gray-900">Acesso Restrito</h2>
        <p className="text-gray-500 max-w-sm">Este painel de KPIs é exclusivo para administradores da plataforma Mastchieve.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-mastchieve-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPIs & Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Indicadores chave de desempenho da plataforma Mastchieve</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Atletas Ativos" value={kpis?.students?.active ?? '—'}
          sub={`${kpis?.students?.total ?? 0} total`} color="blue" />
        <KpiCard icon={GraduationCap} label="Instrutores" value={kpis?.instructors ?? '—'} color="green" />
        <KpiCard icon={BookOpen} label="Turmas Ativas" value={kpis?.classes ?? '—'} color="purple" />
        <KpiCard icon={AlertCircle} label="Pagamentos em Atraso" value={kpis?.overduePayments ?? '—'} color="red" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Activity} label="Assiduidade (30d)"
          value={`${attendance?.rate ?? kpis?.attendanceRate ?? 0}%`}
          sub={`${attendance?.present ?? '—'} de ${attendance?.total ?? '—'} presenças`}
          color="green"
          target="85%" achieved={(attendance?.rate ?? kpis?.attendanceRate ?? 0) >= 85}
        />
        <KpiCard
          icon={TrendingUp} label="Receita Mensal"
          value={formatCurrency(kpis?.monthlyRevenue ?? 0)}
          color="blue"
        />
        <KpiCard
          icon={Brain} label="Adoção pelos Instrutores"
          value={`${adoption?.rate ?? 0}%`}
          sub={`${adoption?.active ?? '—'} de ${adoption?.total ?? '—'} ativos`}
          color="purple"
          target="70%" achieved={(adoption?.rate ?? 0) >= 70}
        />
        <KpiCard
          icon={CheckCircle} label="Concordância IA"
          value="83%"
          sub="Meta: 85%"
          color="orange"
          target="85%" achieved={false}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* KPI History */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-mastchieve-600" />
            <h3 className="font-semibold text-gray-900">Evolução — Últimos 30 dias</h3>
          </div>
          {historyFormatted.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={historyFormatted}>
                <defs>
                  <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a56db" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="activeStudents" stroke="#1a56db" fill="url(#gradStudents)" name="Atletas Ativos" />
                <Line type="monotone" dataKey="attendanceRate" stroke="#10b981" strokeWidth={2} dot={false} name="Assiduidade %" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-400">
              <Activity className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Sem dados históricos ainda</p>
              <p className="text-xs mt-1">O snapshot diário é gerado à meia-noite</p>
            </div>
          )}
        </div>

        {/* Module Progress */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-mastchieve-600" />
            <h3 className="font-semibold text-gray-900">Progressão Modular</h3>
          </div>
          {moduleProgressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={moduleProgressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" name="Módulos" radius={[0, 4, 4, 0]}
                  fill="#1a56db"
                  label={{ position: 'right', fontSize: 12, fill: '#6b7280' }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              Sem dados de progressão
            </div>
          )}
        </div>
      </div>

      {/* Instructor Adoption & Feedbacks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Adoption gauge */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Adoção pelos Instrutores</h3>
          </div>
          <div className="text-center py-4">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#7c3aed" strokeWidth="3"
                  strokeDasharray={`${adoption?.rate ?? 0}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-2xl font-bold text-gray-900">{adoption?.rate ?? 0}%</div>
                <div className="text-xs text-gray-400">adoção</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              <strong className="text-gray-900">{adoption?.active ?? '—'}</strong> de{' '}
              <strong className="text-gray-900">{adoption?.total ?? '—'}</strong> instrutores
              usaram a plataforma nos últimos 30 dias
            </p>
            <div className="mt-3 text-xs">
              <span className={`px-2 py-1 rounded-full font-medium ${(adoption?.rate ?? 0) >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                Meta: 70% — {(adoption?.rate ?? 0) >= 70 ? 'Atingida ✓' : 'Em progresso'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Feedbacks */}
        <div className="xl:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Feedbacks IA Recentes</h3>
          </div>
          <div className="space-y-2">
            {(kpis?.recentFeedbacks ?? []).slice(0, 5).map((fb: any) => (
              <div key={fb.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-mastchieve-100 rounded-full flex items-center justify-center text-mastchieve-700 text-xs font-bold flex-shrink-0">
                  {fb.student?.firstName?.[0]}{fb.student?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {fb.student?.firstName} {fb.student?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {fb.aiGeneratedText?.slice(0, 90)}...
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    fb.status === 'SENT' ? 'bg-green-100 text-green-700' :
                    fb.status === 'REVIEWED' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'}`}>
                    {fb.status === 'SENT' ? 'Enviado' : fb.status === 'REVIEWED' ? 'Revisto' : 'Gerado'}
                  </span>
                  {fb.aiConfidenceScore != null && (
                    <span className="text-xs text-gray-400">
                      {Math.round(fb.aiConfidenceScore * 100)}% confiança
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!kpis?.recentFeedbacks?.length && (
              <p className="text-gray-400 text-sm text-center py-6">Sem feedbacks recentes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
