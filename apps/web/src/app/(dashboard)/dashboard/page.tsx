'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  Users, GraduationCap, BookOpen, AlertCircle,
  TrendingUp, Activity, Brain, Flame, Trophy,
  ArrowUpRight, ArrowDownRight, Zap, Target,
  CheckCircle, Clock, CreditCard, Waves, ChevronRight, Star, Award, Bell,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { BulkNotificationsModal } from '@/components/bulk-notifications-modal';

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

// ─── Animated ring (SVG) ──────────────────────────────────────────────────────
function Ring({ value, max = 100, size = 80, stroke = 7, color = 'white', trackColor = 'rgba(255,255,255,0.15)', children }: {
  value: number; max?: number; size?: number; stroke?: number; color?: string; trackColor?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / max) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

// ─── Streak flame ─────────────────────────────────────────────────────────────
function StreakFlame({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <span className="text-2xl select-none" style={{ filter: count > 0 ? 'drop-shadow(0 0 6px #fb923c)' : 'grayscale(1) opacity(0.4)' }}>🔥</span>
        {count > 0 && <span className="absolute -top-1 -right-2 text-[9px] font-black text-orange-300 bg-orange-900/60 px-1 rounded-full leading-tight">{count}</span>}
      </div>
      <span className="text-[9px] text-white/50 mt-0.5">streak</span>
    </div>
  );
}

// ─── Level badge ─────────────────────────────────────────────────────────────
const LEVEL_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  BEGINNER:     { emoji: '🌱', label: 'Iniciante',    color: 'from-gray-500 to-gray-600' },
  BRONZE:       { emoji: '🥉', label: 'Bronze',       color: 'from-amber-700 to-yellow-700' },
  SILVER:       { emoji: '🥈', label: 'Prata',        color: 'from-slate-400 to-slate-500' },
  GOLD:         { emoji: '🥇', label: 'Ouro',         color: 'from-yellow-400 to-amber-500' },
  DIAMOND:      { emoji: '💎', label: 'Diamante',     color: 'from-cyan-400 to-blue-500' },
  ELITE:        { emoji: '👑', label: 'Elite',         color: 'from-violet-500 to-purple-600' },
};

function LevelBadge({ level }: { level?: string }) {
  const info = LEVEL_INFO[level ?? 'BEGINNER'] ?? LEVEL_INFO.BEGINNER;
  return (
    <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r text-white text-xs font-bold shadow-lg', info.color)}>
      <span>{info.emoji}</span> {info.label}
    </div>
  );
}

// ─── Mini sparkline bar ───────────────────────────────────────────────────────
function MiniBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex flex-col items-center gap-1 w-5">
      <div className="w-full h-12 bg-white/10 rounded-sm overflow-hidden flex items-end">
        <div className={`w-full rounded-sm transition-all duration-700 ${color}`} style={{ height: `${pct}%` }} />
      </div>
      <span className="text-[8px] text-white/40 font-medium">{value}</span>
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

// ─── Student dashboard ────────────────────────────────────────────────────────
function StudentDashboard({ user }: { user: any }) {
  const { data: me, isLoading } = useQuery({
    queryKey: ['student-me'],
    queryFn: async () => { const { data } = await api.get('/students/me'); return data.data; },
    refetchInterval: 120_000,
  });

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const greetingEmoji = hour < 12 ? '☀️' : hour < 18 ? '⚡' : '🌙';
  const name = me?.firstName ?? '';
  const activeClass = me?.enrollments?.[0]?.class;
  const latestFeedback = me?.feedbacks?.[0];
  const attendance = me?.attendanceStats ?? { rate: 0, present: 0, total: 0 };
  const overduePayments = (me?.payments ?? []).filter((p: any) => p.status === 'OVERDUE');
  const pendingPayments = (me?.payments ?? []).filter((p: any) => p.status === 'PENDING');
  const paidPayments = (me?.payments ?? []).filter((p: any) => p.status === 'PAID');
  const progressRecords = me?.progressRecords ?? [];
  const latestPerf = me?.performanceRecords?.[0];
  const prevPerf = me?.performanceRecords?.[1];

  // Derived metrics
  const attendanceRateNum = attendance.rate ?? 0;
  const overallScore = latestPerf
    ? Math.round((latestPerf.technique + latestPerf.stamina + latestPerf.speed + latestPerf.coordination + latestPerf.breathing) / 5)
    : 0;
  const prevScore = prevPerf
    ? Math.round((prevPerf.technique + prevPerf.stamina + prevPerf.speed + prevPerf.coordination + prevPerf.breathing) / 5)
    : 0;
  const scoreDelta = overallScore - prevScore;

  // Attendance rank insight (simulate based on rate)
  const attendanceInsight =
    attendanceRateNum >= 95 ? { text: 'Top 5% de assiduidade', color: 'text-yellow-300', bg: 'bg-yellow-400/20' } :
    attendanceRateNum >= 85 ? { text: 'Top 15% de assiduidade', color: 'text-emerald-300', bg: 'bg-emerald-400/20' } :
    attendanceRateNum >= 70 ? { text: 'Acima da média do clube', color: 'text-blue-300', bg: 'bg-blue-400/20' } :
    { text: 'Podes melhorar a assiduidade', color: 'text-amber-300', bg: 'bg-amber-400/20' };

  // Streak (simulate from paid count / attendance)
  const streak = Math.min(paidPayments.length * 3, 21);

  // Current level from best progress
  const bestLevel = progressRecords[0]?.status ?? 'BEGINNER';

  // Motivational messages
  const MOTIVATION = [
    'Cada treino é um passo rumo ao pódio.',
    'Os campeões são feitos na piscina. Tu estás no caminho certo.',
    'Consiste e a evolução é inevitável.',
    'A água não te resiste — tu dominas.',
  ];
  const motivationMsg = MOTIVATION[now.getDay() % MOTIVATION.length];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 rounded-3xl skeleton" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl skeleton" />)}
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      href: '/student/progress',
      icon: TrendingUp,
      label: 'O Meu Progresso',
      sub: progressRecords[0] ? `${progressRecords[0]?.module?.name ?? 'Módulo activo'}` : 'Ver módulos',
      grad: 'from-violet-600 to-purple-700',
      glow: 'shadow-violet-500/30',
      stat: progressRecords.length > 0 ? `${progressRecords.filter((p: any) => p.status === 'COMPLETED').length}/${progressRecords.length}` : '—',
      statLabel: 'concluídos',
    },
    {
      href: '/student/feedback',
      icon: Brain,
      label: 'Feedback IA',
      sub: latestFeedback?.status === 'SENT' ? 'Novo relatório disponível!' : `${me?.feedbacks?.length ?? 0} relatórios`,
      grad: 'from-blue-600 to-cyan-600',
      glow: 'shadow-blue-500/30',
      badge: latestFeedback?.status === 'GENERATED' || latestFeedback?.status === 'SENT' ? '1 novo' : undefined,
      stat: me?.feedbacks?.length ?? 0,
      statLabel: 'relatórios',
    },
    {
      href: '/student/attendance',
      icon: Activity,
      label: 'As Minhas Presenças',
      sub: attendanceRateNum >= 85 ? 'Excelente assiduidade!' : 'Ver histórico',
      grad: attendanceRateNum >= 85 ? 'from-emerald-500 to-teal-600' : attendanceRateNum >= 70 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600',
      glow: attendanceRateNum >= 85 ? 'shadow-emerald-500/30' : 'shadow-amber-500/30',
      stat: `${attendanceRateNum}%`,
      statLabel: 'assiduidade',
    },
    {
      href: '/student/payments',
      icon: CreditCard,
      label: 'Pagamentos',
      sub: overduePayments.length > 0 ? `${overduePayments.length} em atraso!` : pendingPayments.length > 0 ? `${pendingPayments.length} a vencer` : 'Tudo em dia ✓',
      grad: overduePayments.length > 0 ? 'from-rose-500 to-red-600' : pendingPayments.length > 0 ? 'from-amber-500 to-orange-500' : 'from-teal-500 to-emerald-600',
      glow: overduePayments.length > 0 ? 'shadow-red-500/30' : 'shadow-teal-500/30',
      badge: overduePayments.length > 0 ? `${overduePayments.length}` : undefined,
      urgent: overduePayments.length > 0,
      stat: paidPayments.length,
      statLabel: 'pagos',
    },
  ];

  const perfMetrics = latestPerf ? [
    { key: 'technique',    label: 'Técnica',    value: latestPerf.technique },
    { key: 'stamina',      label: 'Resistência', value: latestPerf.stamina },
    { key: 'speed',        label: 'Velocidade',  value: latestPerf.speed },
    { key: 'coordination', label: 'Coord.',      value: latestPerf.coordination },
    { key: 'breathing',    label: 'Respiração',  value: latestPerf.breathing },
  ] : [];

  const barColors = ['bg-violet-400', 'bg-blue-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-yellow-400'];

  return (
    <div className="space-y-5 max-w-none">

      {/* ══ HERO ═══════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-3xl text-white"
        style={{ background: 'linear-gradient(135deg, #0B1640 0%, #0F1F5C 30%, #1A3A9C 65%, #1A56DB 100%)', minHeight: 260 }}
      >
        {/* Decorative blobs */}
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 top-0 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <div className="relative p-6 md:p-8">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              {/* Greeting */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{greetingEmoji}</span>
                <span className="text-white/50 text-xs font-medium uppercase tracking-widest">
                  {now.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight mb-3">
                {greeting}{name ? `, ${name}` : ''}!
              </h1>

              {/* Level + class badges */}
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge level={bestLevel} />
                {activeClass && (
                  <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-xs font-medium">
                    <Waves className="w-3 h-3 text-cyan-300" />
                    <span className="text-white/80">{activeClass.name}</span>
                    {activeClass.instructor && (
                      <span className="text-white/40">· {activeClass.instructor.firstName}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Motivational quote */}
              <p className="mt-3 text-white/40 text-xs italic hidden md:block max-w-sm">
                &ldquo;{motivationMsg}&rdquo;
              </p>
            </div>

            {/* Right: rings */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Attendance ring */}
              <div className="flex flex-col items-center gap-1">
                <Ring value={attendanceRateNum} size={72} stroke={6}
                  color={attendanceRateNum >= 85 ? '#34d399' : attendanceRateNum >= 70 ? '#fbbf24' : '#f87171'}
                  trackColor="rgba(255,255,255,0.12)"
                >
                  <span className="text-sm font-black leading-none">{attendanceRateNum}%</span>
                  <span className="text-[8px] text-white/40 leading-none mt-0.5">presença</span>
                </Ring>
              </div>

              {/* Score ring (if available) */}
              {overallScore > 0 && (
                <div className="flex-col items-center gap-1 hidden sm:flex">
                  <Ring value={overallScore * 10} size={72} stroke={6}
                    color="#a78bfa" trackColor="rgba(255,255,255,0.12)"
                  >
                    <span className="text-sm font-black leading-none">{overallScore}</span>
                    <span className="text-[8px] text-white/40 leading-none mt-0.5">score</span>
                  </Ring>
                </div>
              )}

              {/* Streak */}
              <div className="hidden sm:flex flex-col items-center justify-center h-[72px]">
                <StreakFlame count={streak} />
              </div>
            </div>
          </div>

          {/* Bottom row: quick metric pills + mini performance bars */}
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2">
              {/* Insight pill */}
              <div className={`flex items-center gap-1.5 ${attendanceInsight.bg} border border-white/10 rounded-full px-3 py-1.5`}>
                <Star className="w-3 h-3 text-yellow-300" />
                <span className={`text-xs font-semibold ${attendanceInsight.color}`}>{attendanceInsight.text}</span>
              </div>

              {/* Active module pill */}
              {progressRecords[0] && (
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3 py-1.5">
                  <Target className="w-3 h-3 text-blue-300" />
                  <span className="text-xs text-white/70 font-medium">
                    {progressRecords[0]?.module?.name ?? 'Em progresso'}
                  </span>
                </div>
              )}

              {/* Overdue alert */}
              {overduePayments.length > 0 && (
                <Link href="/student/payments"
                  className="flex items-center gap-1.5 bg-rose-500/30 border border-rose-400/50 rounded-full px-3 py-1.5 hover:bg-rose-500/50 transition animate-pulse-slow"
                >
                  <AlertCircle className="w-3 h-3 text-rose-300" />
                  <span className="text-xs text-rose-200 font-semibold">{overduePayments.length} pagamento(s) em atraso</span>
                </Link>
              )}
            </div>

            {/* Mini perf bars */}
            {perfMetrics.length > 0 && (
              <div className="flex items-end gap-1.5">
                {perfMetrics.map((m, i) => (
                  <MiniBar key={m.key} value={m.value} color={barColors[i % barColors.length]} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ QUICK ACTION CARDS ═════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'group relative rounded-2xl p-4 text-white overflow-hidden transition-all duration-250',
                'hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.97]',
                `bg-gradient-to-br ${action.grad} shadow-lg ${action.glow}`,
                action.urgent && 'ring-2 ring-red-400 ring-offset-1 animate-pulse-slow',
              )}
            >
              {/* Sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* Decorative circle */}
              <div className="absolute -right-5 -bottom-5 w-20 h-20 rounded-full bg-white/10" />

              {/* Badge */}
              {action.badge && (
                <span className="absolute top-2.5 right-2.5 bg-yellow-400 text-yellow-900 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-badge-pop">
                  {action.badge}
                </span>
              )}

              {/* Icon */}
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
              </div>

              {/* Label */}
              <p className="font-bold text-sm leading-tight mb-0.5">{action.label}</p>
              <p className="text-white/65 text-[11px] leading-snug line-clamp-2 mb-3">{action.sub}</p>

              {/* Stat footer */}
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black leading-none">{action.stat}</span>
                <span className="text-white/50 text-[10px] font-medium">{action.statLabel}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ══ MAIN GRID ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ─ Column 1+2: Performance + AI Feedback ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Performance snapshot */}
          {latestPerf ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Último Desempenho Avaliado</p>
                    <p className="text-gray-400 text-[11px]">
                      {latestPerf.recordedAt ? new Date(latestPerf.recordedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {scoreDelta !== 0 && (
                    <span className={cn('flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full',
                      scoreDelta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                      {scoreDelta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(scoreDelta)} pts
                    </span>
                  )}
                  <div className="text-right">
                    <p className="text-2xl font-black text-gray-900">{overallScore}<span className="text-sm text-gray-400 font-normal">/10</span></p>
                    <p className="text-[10px] text-gray-400">score global</p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-5 gap-3">
                  {perfMetrics.map((m, i) => {
                    const pct = (m.value / 10) * 100;
                    const prevVal = prevPerf ? (prevPerf as any)[m.key] : m.value;
                    const delta = m.value - prevVal;
                    return (
                      <div key={m.key} className="flex flex-col items-center gap-1.5">
                        <div className="relative w-12 h-12">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                            <circle cx="18" cy="18" r="14" fill="none"
                              stroke={['#8b5cf6','#3b82f6','#06b6d4','#10b981','#f59e0b'][i]}
                              strokeWidth="4" strokeLinecap="round"
                              strokeDasharray={`${pct * 0.8796} 87.96`}
                              style={{ transition: 'stroke-dasharray 1s ease' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-black text-gray-800">{m.value}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium text-center leading-tight">{m.label}</p>
                        {delta !== 0 && (
                          <span className={cn('text-[9px] font-bold', delta > 0 ? 'text-emerald-500' : 'text-rose-500')}>
                            {delta > 0 ? '+' : ''}{delta}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {latestPerf.instructorNotes && (
                  <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-600 leading-relaxed border border-gray-100">
                    <span className="font-semibold text-gray-800">Nota do instrutor: </span>{latestPerf.instructorNotes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* No performance yet — teaser card */
            <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-100 p-6 flex items-center gap-5">
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-7 h-7 text-violet-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-0.5">Ainda sem avaliação de desempenho</p>
                <p className="text-gray-500 text-sm">O teu instrutor irá registar a tua primeira avaliação em breve. Mantém-te focado!</p>
              </div>
            </div>
          )}

          {/* AI Feedback card */}
          {latestFeedback ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Feedback da IA</p>
                    <p className="text-gray-400 text-[11px]">Análise personalizada para ti</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border',
                    latestFeedback.status === 'SENT'      ? 'bg-green-100 text-green-700 border-green-200' :
                    latestFeedback.status === 'GENERATED' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-amber-100 text-amber-700 border-amber-200')}>
                    {latestFeedback.status === 'SENT' ? '✓ Recebido' : latestFeedback.status === 'GENERATED' ? '⚡ Novo' : '⏳ A processar'}
                  </span>
                  <Link href="/student/feedback" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5 whitespace-nowrap">
                    Ver todos <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="p-5">
                {latestFeedback.aiConfidenceScore && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                        style={{ width: `${Math.round(latestFeedback.aiConfidenceScore * 100)}%` }} />
                    </div>
                    <span className="text-xs text-violet-600 font-bold flex-shrink-0">
                      IA {Math.round(latestFeedback.aiConfidenceScore * 100)}% confiança
                    </span>
                  </div>
                )}
                <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 rounded-xl p-4 border border-blue-100">
                  <div className="absolute top-3 left-3 w-5 h-5 text-blue-200 text-2xl leading-none select-none">&ldquo;</div>
                  <p className="text-sm text-gray-700 leading-relaxed pl-4 line-clamp-5">
                    {latestFeedback.finalText || latestFeedback.aiGeneratedText || 'A aguardar geração pela IA...'}
                  </p>
                </div>
                <Link
                  href="/student/feedback"
                  className="mt-3 flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <Brain className="w-4 h-4" /> Ver plano de treino completo
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Brain className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-0.5">O teu primeiro feedback IA está a caminho</p>
                <p className="text-gray-500 text-sm">Assim que o teu instrutor registar uma sessão, a IA irá gerar uma análise personalizada para ti.</p>
              </div>
            </div>
          )}
        </div>

        {/* ─ Column 3: Right sidebar widgets ───────────────────────────────── */}
        <div className="space-y-4">

          {/* Module progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="font-bold text-gray-900 text-sm">Módulos</p>
              </div>
              <Link href="/student/progress" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                Detalhes <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {progressRecords.length > 0 ? progressRecords.slice(0, 4).map((pr: any, i: number) => {
                const pct = pr.score ? Math.round((pr.score / 10) * 100) : 0;
                const statusEmoji = pr.status === 'COMPLETED' ? '✅' : pr.status === 'IN_PROGRESS' ? '🔄' : '⏳';
                const barColor = ['bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500'][i % 4];
                return (
                  <div key={pr.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm">{statusEmoji}</span>
                        <span className="text-xs font-semibold text-gray-800 truncate">{pr.module?.name ?? 'Módulo'}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 flex-shrink-0 ml-1">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : (
                <div className="py-4 text-center text-gray-400 text-sm">
                  <Waves className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Sem módulos activos</p>
                </div>
              )}
            </div>
          </div>

          {/* Payments mini card */}
          <div className={cn(
            'rounded-2xl border overflow-hidden shadow-sm',
            overduePayments.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100',
          )}>
            <div className={cn(
              'px-4 py-3.5 border-b flex items-center justify-between',
              overduePayments.length > 0 ? 'border-rose-100' : 'border-gray-50',
            )}>
              <div className="flex items-center gap-2">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center',
                  overduePayments.length > 0 ? 'bg-rose-100' : 'bg-teal-100')}>
                  <CreditCard className={cn('w-3.5 h-3.5', overduePayments.length > 0 ? 'text-rose-600' : 'text-teal-600')} />
                </div>
                <p className="font-bold text-gray-900 text-sm">Pagamentos</p>
              </div>
              <Link href="/student/payments" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                Ver todos <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(me?.payments ?? []).slice(0, 3).map((p: any) => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {p.monthlyFee ? `Mensalidade ${p.monthlyFee?.month}/${p.monthlyFee?.year}` : 'Mensalidade'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {p.status === 'PAID' ? `Pago em ${p.paidAt ? new Date(p.paidAt).toLocaleDateString('pt-PT') : '—'}` : `Vence ${new Date(p.dueDate).toLocaleDateString('pt-PT')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className="text-sm font-black text-gray-900">€{p.amount}</span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                      p.status === 'PAID'    ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700')}>
                      {p.status === 'PAID' ? '✓ Pago' : p.status === 'OVERDUE' ? '⚠ Atraso' : '⏰ Pendente'}
                    </span>
                  </div>
                </div>
              ))}
              {!me?.payments?.length && (
                <div className="px-4 py-6 text-center text-gray-400 text-xs">Sem pagamentos registados</div>
              )}
            </div>
          </div>

          {/* Motivational achievement card */}
          <div className="bg-gradient-to-br from-[#0F1F5C] to-[#1A56DB] rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <p className="font-bold text-sm">O teu próximo objectivo</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Assiduidade 90%',  current: attendanceRateNum, target: 90, color: 'bg-emerald-400' },
                { label: 'Score médio 8.0',   current: overallScore * 10, target: 80, color: 'bg-violet-400' },
                { label: '3 módulos activos', current: Math.min(progressRecords.length * 33, 100), target: 100, color: 'bg-blue-400' },
              ].map((g) => {
                const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                return (
                  <div key={g.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-white/70">{g.label}</span>
                      <span className="text-white font-bold">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${g.color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-white/40 text-[10px] mt-3 text-center italic">{motivationMsg}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [showBulkNotif, setShowBulkNotif] = useState(false);

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

  if (!isAdmin) {
    return <StudentDashboard user={user} />;
  }

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
              prefix="€" decimals={0} color="purple" />
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
              { label: 'Concordância IA', value: 83, target: 85, color: 'bg-violet-500' },
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
