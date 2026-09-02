'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, GraduationCap, BookOpen, AlertCircle,
  TrendingUp, Activity, Brain, Flame, Trophy,
  ArrowUpRight, ArrowDownRight, Zap, Target,
  Bell, Briefcase, UserPlus, MessageSquareWarning, Banknote,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from '@/lib/recharts-dynamic';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { BulkNotificationsModal } from '@/components/bulk-notifications-modal';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const target = value;
    const duration = 900;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      ref.current = target * ease;
      setDisplay(ref.current);
      if (t < 1) requestAnimationFrame(animate);
      else setDisplay(target);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, rawValue, sub, color, trend, prefix = '', suffix = '', decimals = 0, urgent = false }: any) {
  const palettes: Record<string, { bg: string; icon: string; ring: string; glow: string }> = {
    blue:   { bg: 'from-blue-600 to-blue-700',   icon: 'bg-white/20', ring: 'ring-blue-200',   glow: 'shadow-blue-200' },
    green:  { bg: 'from-emerald-500 to-emerald-600', icon: 'bg-white/20', ring: 'ring-emerald-200', glow: 'shadow-emerald-200' },
    purple: { bg: 'from-violet-600 to-violet-700', icon: 'bg-white/20', ring: 'ring-violet-200', glow: 'shadow-violet-200' },
    red:    { bg: 'from-rose-500 to-rose-600',   icon: 'bg-white/20', ring: 'ring-rose-200',   glow: 'shadow-rose-200' },
    amber:  { bg: 'from-amber-500 to-orange-500', icon: 'bg-white/20', ring: 'ring-amber-200', glow: 'shadow-amber-200' },
  };
  const p = palettes[color] ?? palettes.blue;
  const isPositive = trend > 0;

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ring-1',
      `bg-gradient-to-br ${p.bg}`,
      p.ring,
      urgent ? 'animate-pulse-slow' : '',
    )}
      style={{ boxShadow: `0 8px 24px -4px var(--tw-shadow-color, rgba(0,0,0,0.15))` }}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-1 -bottom-6 w-16 h-16 rounded-full bg-white/5" />

      <div className="relative">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', p.icon)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-3xl font-bold tracking-tight">
          {rawValue !== undefined
            ? <AnimatedNumber value={rawValue} prefix={prefix} suffix={suffix} decimals={decimals} />
            : value}
        </div>
        <div className="text-white/80 text-sm font-medium mt-0.5">{label}</div>
        <div className="flex items-center justify-between mt-2">
          {sub && <span className="text-white/60 text-xs">{sub}</span>}
          {trend !== undefined && (
            <div className={cn('flex items-center gap-0.5 text-xs font-medium', isPositive ? 'text-emerald-200' : 'text-rose-200')}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── At-risk students widget ──────────────────────────────────────────────────
function AtRiskWidget({ feedbacks }: { feedbacks: any[] }) {
  // Simulate at-risk from low feedback/activity (no new API needed)
  if (!feedbacks?.length) return null;
  const atRisk = feedbacks.filter((f: any) => f.status !== 'SENT').slice(0, 3);
  if (!atRisk.length) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <div className="font-semibold text-amber-900 text-sm">Feedbacks por enviar</div>
          <div className="text-xs text-amber-600">{atRisk.length} atleta(s) aguardam feedback</div>
        </div>
      </div>
      <div className="space-y-2">
        {atRisk.map((f: any) => (
          <div key={f.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-amber-100">
            <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-xs font-bold">
              {f.student?.firstName?.[0]}{f.student?.lastName?.[0]}
            </div>
            <span className="text-sm text-gray-800 font-medium">{f.student?.firstName} {f.student?.lastName}</span>
            <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {f.status === 'GENERATED' ? 'Gerado — rever' : 'Pendente IA'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Achievement feed ─────────────────────────────────────────────────────────
function AchievementFeed({ feedbacks }: { feedbacks: any[] }) {
  const events = (feedbacks ?? []).slice(0, 6).map((f: any, i: number) => ({
    id: f.id,
    type: f.status === 'SENT' ? 'sent' : 'generated',
    student: `${f.student?.firstName} ${f.student?.lastName}`,
    initials: `${f.student?.firstName?.[0] ?? ''}${f.student?.lastName?.[0] ?? ''}`,
    text: f.status === 'SENT' ? 'recebeu feedback da IA' : 'feedback IA gerado',
    confidence: f.aiConfidenceScore,
    time: formatDate(f.createdAt),
    delay: i * 80,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
        <Zap className="w-4 h-4 text-violet-500" />
        <span className="font-semibold text-gray-900">Actividade Recente</span>
        <span className="ml-auto text-xs text-gray-400">tempo real</span>
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </div>
      <div className="divide-y divide-gray-50">
        {events.map((ev) => (
          <div key={ev.id}
            className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50/50 transition"
            style={{ animationDelay: `${ev.delay}ms` }}
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              ev.type === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700',
            )}>
              {ev.initials}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">{ev.student}</span>
              <span className="text-sm text-gray-500"> {ev.text}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {ev.confidence != null && (
                <span className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                  {Math.round(ev.confidence * 100)}%
                </span>
              )}
              {ev.type === 'sent'
                ? <Brain className="w-3.5 h-3.5 text-emerald-500" />
                : <Brain className="w-3.5 h-3.5 text-violet-400" />}
            </div>
          </div>
        ))}
        {!events.length && (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            Sem actividade recente
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Metric pill ─────────────────────────────────────────────────────────────
function MetricPill({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className={`flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div>
        <p className="text-white font-bold text-sm leading-tight">{value}</p>
        <p className="text-white/50 text-[10px] leading-tight">{label}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const [showBulkNotif, setShowBulkNotif] = useState(false);

  useEffect(() => {
    if (user?.role === 'INSTRUCTOR') router.replace('/instructor');
    if (user?.role === 'PARENT') router.replace('/parent');
    if (user?.role === 'VISITOR') router.replace('/visitor');
  }, [user?.role, router]);

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpi-dashboard'],
    queryFn: async () => { const { data } = await api.get('/kpi/dashboard'); return data.data; },
    refetchInterval: 30_000,
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

  if (isStudent || (!isAdmin && user?.role !== 'INSTRUCTOR')) {
    return <StudentDashboard user={user} />;
  }

  if (!isAdmin) return null;

  const historyData = (history ?? []).map((h: any) => ({
    ...h,
    label: new Date(h.snapshotDate).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
  }));

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-6">
      {showBulkNotif && <BulkNotificationsModal onClose={() => setShowBulkNotif(false)} />}

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A3A9C] via-[#1A56DB] to-[#2D7DD2] p-6 text-white">
        {/* decorative circles */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute right-20 -bottom-12 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute right-4 top-4 w-16 h-16 rounded-full bg-white/10" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-white/70 text-sm">{greeting} 👋</div>
            <h1 className="text-2xl font-bold mt-0.5">Painel de Controlo</h1>
            <p className="text-white/60 text-sm mt-1">
              {now.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setShowBulkNotif(true)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full transition"
            >
              <Bell className="w-3.5 h-3.5" />
              Notificações em Massa
            </button>
            {kpis?.overduePayments > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-500 text-white text-xs font-medium px-3 py-1.5 rounded-full animate-bounce">
                <AlertCircle className="w-3 h-3" />
                {kpis.overduePayments} pagamento(s) em atraso
              </div>
            )}
            {adoption?.rate >= 70 && (
              <div className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                <Trophy className="w-3 h-3 text-yellow-300" />
                Meta de adoção atingida!
              </div>
            )}
          </div>
        </div>

        {/* Mini bar chart in hero */}
        {historyData.length > 0 && (
          <div className="mt-4 h-14 opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData.slice(-14)}>
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="white" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="activeStudents" stroke="white" strokeWidth={1.5} fill="url(#heroGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── KPI CARDS ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <KpiCard icon={Users} label="Atletas Ativos" rawValue={kpis?.students?.active ?? 0}
              sub={`de ${kpis?.students?.total ?? 0} inscritos`} color="blue" trend={5} />
            <KpiCard icon={Activity} label="Assiduidade" rawValue={kpis?.attendanceRate ?? 0}
              suffix="%" sub="últimos 30 dias" color="green" trend={3} />
            <KpiCard icon={TrendingUp} label="Receita Mensal" rawValue={kpis?.monthlyRevenue ?? 0}
              prefix="MT " decimals={0} color="purple" />
            <KpiCard icon={AlertCircle} label="Em Atraso" rawValue={kpis?.overduePayments ?? 0}
              sub="pagamentos" color="red" urgent={kpis?.overduePayments > 0} />
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <KpiCard icon={GraduationCap} label="Instrutores" rawValue={kpis?.instructors ?? 0}
              sub="activos" color="blue" />
            <KpiCard icon={BookOpen} label="Turmas" rawValue={kpis?.classes ?? 0}
              sub="em funcionamento" color="green" />
            <KpiCard icon={Brain} label="Feedbacks IA" rawValue={kpis?.recentFeedbacks?.length ?? 0}
              sub="recentes" color="purple" />
            <KpiCard icon={Flame} label="Adoção Instrutores" rawValue={adoption?.rate ?? 0}
              suffix="%" sub={`meta: 70%`} color={adoption?.rate >= 70 ? 'green' : 'amber'} />
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">RH &amp; Administrativo</p>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <KpiCard icon={Briefcase} label="Funcionários" rawValue={kpis?.rh?.totalFuncionarios ?? 0}
              sub="ao serviço" color="blue" />
            <KpiCard icon={Banknote} label="Folhas Pendentes" rawValue={kpis?.rh?.folhasPendentes ?? 0}
              sub="aguardam aprovação" color={kpis?.rh?.folhasPendentes > 0 ? 'amber' : 'green'} />
            <KpiCard icon={MessageSquareWarning} label="Reclamações Abertas" rawValue={kpis?.administrativo?.reclamacoesAbertas ?? 0}
              sub="por resolver" color={kpis?.administrativo?.reclamacoesAbertas > 0 ? 'red' : 'green'}
              urgent={kpis?.administrativo?.reclamacoesAbertas > 0} />
            <KpiCard icon={UserPlus} label="Leads em Pipeline" rawValue={
              (kpis?.administrativo?.leadsPorEstado ?? [])
                .filter((l: any) => !['CONVERTIDO', 'PERDIDO'].includes(l.estado))
                .reduce((sum: number, l: any) => sum + l.total, 0)
            } sub="por converter" color="purple" />
          </div>
        </>
      )}

      {/* ── CHARTS + WIDGETS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Area chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">Evolução de Atletas Ativos</h3>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 30 dias</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> Atletas</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" /> Assiduidade</span>
            </div>
          </div>
          {historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="activeStudents" stroke="#1A56DB" strokeWidth={2.5} fill="url(#gradBlue)" name="Atletas Ativos" dot={false} />
                <Area type="monotone" dataKey="attendanceRate" stroke="#10b981" strokeWidth={2} fill="url(#gradGreen)" name="Assiduidade %" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-300">
              <Activity className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">Snapshot diário gerado à meia-noite</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* KPI Goals */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-900 text-sm">Metas do Projecto</span>
            </div>
            {[
              { label: 'Concordância IA', value: kpis?.aiConcordanceRate ?? 0, target: 85, color: 'bg-violet-500' },
              { label: 'Adoção Instrutores', value: adoption?.rate ?? 0, target: 70, color: 'bg-blue-500' },
              { label: 'Assiduidade', value: kpis?.attendanceRate ?? 0, target: 85, color: 'bg-emerald-500' },
            ].map((g) => {
              const pct = Math.min(100, Math.round((g.value / g.target) * 100));
              const met = g.value >= g.target;
              return (
                <div key={g.label} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{g.label}</span>
                    <span className={cn('font-semibold', met ? 'text-emerald-600' : 'text-gray-500')}>
                      {g.value.toFixed(0)}% {met ? '✓' : `/ ${g.target}%`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-1000', g.color, !met && 'opacity-70')}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* At risk */}
          <AtRiskWidget feedbacks={kpis?.recentFeedbacks} />
        </div>
      </div>

      {/* ── ACTIVITY FEED ── */}
      <AchievementFeed feedbacks={kpis?.recentFeedbacks} />
    </div>
  );
}
