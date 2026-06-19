'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  Waves, Award, TrendingUp, Star, Zap, Target,
  ChevronDown, ChevronUp, Lock, CheckCircle, Clock,
  Dumbbell, Brain, Calendar, Trophy, Flame, Shield,
  ArrowUp, ArrowDown, Minus, BarChart3, BookOpen,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_ORDER = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED', 'COMPETITIVE'];
const LEVEL_LABEL: Record<string, string> = {
  BEGINNER:     'Iniciante',
  ELEMENTARY:   'Elementar',
  INTERMEDIATE: 'Intermédio',
  ADVANCED:     'Avançado',
  COMPETITIVE:  'Competição',
};
const LEVEL_GRADIENT: Record<string, string> = {
  BEGINNER:     'from-emerald-400 to-green-500',
  ELEMENTARY:   'from-blue-400 to-cyan-500',
  INTERMEDIATE: 'from-violet-500 to-purple-600',
  ADVANCED:     'from-orange-500 to-amber-500',
  COMPETITIVE:  'from-red-500 to-rose-600',
};
const LEVEL_BG: Record<string, string> = {
  BEGINNER:     'bg-green-100 text-green-800 border-green-200',
  ELEMENTARY:   'bg-blue-100 text-blue-800 border-blue-200',
  INTERMEDIATE: 'bg-violet-100 text-violet-800 border-violet-200',
  ADVANCED:     'bg-orange-100 text-orange-800 border-orange-200',
  COMPETITIVE:  'bg-red-100 text-red-800 border-red-200',
};
const STATUS_CFG: Record<string, { label: string; icon: any; color: string }> = {
  NOT_STARTED: { label: 'Por iniciar', icon: Clock,        color: 'text-gray-500 bg-gray-100 border-gray-200' },
  IN_PROGRESS: { label: 'Em progresso', icon: TrendingUp,  color: 'text-blue-600 bg-blue-50 border-blue-200' },
  COMPLETED:   { label: 'Concluído',    icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
};
const METRIC_CFG: Record<string, { label: string; icon: any; color: string; barColor: string }> = {
  technique:    { label: 'Técnica',     icon: Star,       color: 'text-blue-500',   barColor: 'from-blue-400 to-blue-600' },
  stamina:      { label: 'Resistência', icon: Flame,      color: 'text-green-500',  barColor: 'from-green-400 to-emerald-600' },
  speed:        { label: 'Velocidade',  icon: Zap,        color: 'text-amber-500',  barColor: 'from-amber-400 to-orange-500' },
  coordination: { label: 'Coordenação', icon: Target,     color: 'text-purple-500', barColor: 'from-purple-400 to-violet-600' },
  breathing:    { label: 'Respiração',  icon: Waves,      color: 'text-cyan-500',   barColor: 'from-cyan-400 to-teal-500' },
  turns:        { label: 'Viragens',    icon: TrendingUp, color: 'text-pink-500',   barColor: 'from-pink-400 to-rose-500' },
  startDive:    { label: 'Saída',       icon: ArrowUp,    color: 'text-indigo-500', barColor: 'from-indigo-400 to-blue-500' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseJson<T>(val: any, fallback: T): T {
  if (Array.isArray(val)) return val as T;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
}

function scoreColor(v: number): string {
  if (v >= 8) return 'text-green-600';
  if (v >= 6) return 'text-amber-600';
  return 'text-red-500';
}

function moduleProgress(pr: any): number {
  if (pr.status === 'COMPLETED') return 100;
  if (pr.status === 'NOT_STARTED') return 0;
  if (pr.score != null) return Math.min(99, Math.round((pr.score / 10) * 100));
  return 40; // default in-progress
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

function AnimatedBar({ pct, gradient, height = 'h-2.5', delay = 0 }: { pct: number; gradient: string; height?: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 120 + delay);
    return () => clearTimeout(timer);
  }, [pct, delay]);

  return (
    <div ref={ref} className={cn('bg-gray-100 rounded-full overflow-hidden', height)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', gradient)}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ─── Metric row ───────────────────────────────────────────────────────────────

function MetricRow({ metricKey, current, prev, delay }: { metricKey: string; current: number; prev?: number; delay?: number }) {
  const cfg = METRIC_CFG[metricKey];
  if (!cfg || current == null) return null;
  const Icon = cfg.icon;
  const pct = (current / 10) * 100;
  const trend = prev != null ? (current > prev ? 'up' : current < prev ? 'down' : 'same') : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
          <span className="font-medium text-gray-700">{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {trend === 'up'   && <ArrowUp   className="w-3 h-3 text-green-500" />}
          {trend === 'down' && <ArrowDown  className="w-3 h-3 text-red-500" />}
          {trend === 'same' && <Minus      className="w-3 h-3 text-gray-400" />}
          <span className={cn('font-bold', scoreColor(current))}>{current}/10</span>
        </div>
      </div>
      <AnimatedBar pct={pct} gradient={cfg.barColor} delay={delay ?? 0} />
    </div>
  );
}

// ─── Module card ─────────────────────────────────────────────────────────────

function ModuleCard({ pr, index }: { pr: any; index: number }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[pr.status] ?? STATUS_CFG.NOT_STARTED;
  const SIcon = cfg.icon;
  const pct = moduleProgress(pr);
  const skills = parseJson<string[]>(pr.module?.skills, []);

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden transition-all duration-200',
      open ? 'border-mastchieve-200 shadow-md' : 'border-gray-100 hover:border-gray-200',
    )}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-start gap-3 p-4 text-left">
        {/* Order badge */}
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br',
          LEVEL_GRADIENT[pr.module?.level] ?? 'from-gray-400 to-gray-500',
        )}>
          {pr.module?.order ?? index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-gray-900 leading-tight">{pr.module?.name ?? 'Módulo'}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', LEVEL_BG[pr.module?.level])}>
                  {LEVEL_LABEL[pr.module?.level] ?? pr.module?.level}
                </span>
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1', cfg.color)}>
                  <SIcon className="w-2.5 h-2.5" /> {cfg.label}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={cn('text-base font-bold', pct === 100 ? 'text-green-600' : 'text-gray-900')}>{pct}%</div>
              {pr.score != null && <div className="text-[10px] text-gray-400">nota {pr.score}/10</div>}
            </div>
          </div>
          <div className="mt-2">
            <AnimatedBar pct={pct} gradient={LEVEL_GRADIENT[pr.module?.level] ?? 'from-mastchieve-500 to-mastchieve-600'} delay={index * 80} />
          </div>
        </div>

        <span className="text-gray-400 mt-1 flex-shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 space-y-3">
          {pr.module?.description && (
            <p className="text-xs text-gray-500 leading-relaxed pt-3">{pr.module.description}</p>
          )}

          {skills.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">Competências do módulo</div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill: string, i: number) => (
                  <span key={i} className={cn(
                    'text-xs px-2.5 py-1 rounded-full border font-medium',
                    pr.status === 'COMPLETED'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200',
                  )}>
                    {pr.status === 'COMPLETED' && <CheckCircle className="w-2.5 h-2.5 inline mr-1 text-green-500" />}
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            {pr.startedAt && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-gray-400 text-[10px] uppercase tracking-wide">Início</div>
                <div className="font-semibold text-gray-700 mt-0.5">{new Date(pr.startedAt).toLocaleDateString('pt-PT')}</div>
              </div>
            )}
            {pr.completedAt && (
              <div className="bg-green-50 rounded-xl p-3">
                <div className="text-green-500 text-[10px] uppercase tracking-wide">Concluído</div>
                <div className="font-semibold text-green-700 mt-0.5">{new Date(pr.completedAt).toLocaleDateString('pt-PT')}</div>
              </div>
            )}
            {pr.notes && (
              <div className="col-span-2 bg-amber-50 rounded-xl p-3">
                <div className="text-amber-500 text-[10px] uppercase tracking-wide">Nota do instrutor</div>
                <div className="font-medium text-amber-800 mt-0.5">{pr.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Performance session row ─────────────────────────────────────────────────

function SessionRow({ record, index }: { record: any; index: number }) {
  const [open, setOpen] = useState(false);
  const metrics = Object.keys(METRIC_CFG).filter((k) => record[k] != null);
  const score = record.overallScore;

  return (
    <div className={cn('rounded-xl border transition-all', open ? 'border-mastchieve-200' : 'border-gray-100')}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3 text-left">
        <div className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
          score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-400',
        )}>
          {score != null ? score.toFixed(1) : '—'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-800">
            Sessão #{index + 1}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {new Date(record.recordedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
        {/* Mini sparkline of scores */}
        <div className="flex items-end gap-0.5 h-6">
          {metrics.slice(0, 5).map((k) => (
            <div
              key={k}
              className={cn('w-2 rounded-sm', METRIC_CFG[k]?.barColor.includes('blue') ? 'bg-blue-400' : METRIC_CFG[k]?.barColor.includes('green') ? 'bg-green-400' : METRIC_CFG[k]?.barColor.includes('amber') ? 'bg-amber-400' : METRIC_CFG[k]?.barColor.includes('purple') ? 'bg-purple-400' : 'bg-cyan-400')}
              style={{ height: `${((record[k] / 10) * 24)}px` }}
            />
          ))}
        </div>
        <span className="text-gray-400">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-50 px-3 pb-3 space-y-2.5 pt-3">
          {metrics.map((k) => (
            <MetricRow key={k} metricKey={k} current={record[k]} />
          ))}
          {record.instructorNotes && (
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800">
              <div className="text-amber-500 text-[10px] font-semibold uppercase mb-1">Nota do instrutor</div>
              {record.instructorNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Achievements ─────────────────────────────────────────────────────────────

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  check: (me: any) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'enrolled',    name: 'Bem-vindo!',      description: 'Inscrito numa turma de natação',           icon: Waves,        iconColor: 'text-blue-600',   bgColor: 'bg-blue-50',   check: (m) => (m.enrollments?.length ?? 0) > 0 },
  { id: 'in_progress', name: 'Em Marcha',        description: 'Iniciou o primeiro módulo',                icon: TrendingUp,   iconColor: 'text-violet-600', bgColor: 'bg-violet-50', check: (m) => m.progressRecords?.some((p: any) => p.status !== 'NOT_STARTED') },
  { id: 'completed',   name: 'Módulo Concluído', description: 'Completou um módulo com sucesso',          icon: Award,        iconColor: 'text-yellow-600', bgColor: 'bg-yellow-50', check: (m) => m.progressRecords?.some((p: any) => p.status === 'COMPLETED') },
  { id: 'attendance',  name: 'Assíduo',          description: 'Assiduidade superior a 90%',               icon: Calendar,     iconColor: 'text-green-600',  bgColor: 'bg-green-50',  check: (m) => (m.attendanceStats?.rate ?? 0) >= 90 },
  { id: 'feedback_ai', name: 'Feedback IA',      description: 'Recebeu o primeiro feedback da IA',        icon: Brain,        iconColor: 'text-purple-600', bgColor: 'bg-purple-50', check: (m) => m.feedbacks?.some((f: any) => ['SENT','REVIEWED'].includes(f.status)) },
  { id: 'high_score',  name: 'Alta Performance', description: 'Nota global acima de 8',                   icon: Trophy,       iconColor: 'text-orange-600', bgColor: 'bg-orange-50', check: (m) => (m.performanceRecords?.[0]?.overallScore ?? 0) >= 8 },
  { id: 'ten_sessions',name: 'Veterano',          description: 'Participou em 10 ou mais sessões',         icon: Shield,       iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50', check: (m) => (m.attendanceStats?.total ?? 0) >= 10 },
  { id: 'training',    name: 'Plano de Treino',  description: 'Tem um plano de treino IA ativo',          icon: Dumbbell,     iconColor: 'text-red-600',    bgColor: 'bg-red-50',    check: (m) => (m.trainingPlans?.length ?? 0) > 0 },
];

function AchievementBadge({ a, unlocked }: { a: Achievement; unlocked: boolean }) {
  const Icon = a.icon;
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-300',
      unlocked
        ? `${a.bgColor} border-transparent shadow-sm`
        : 'bg-gray-50 border-dashed border-gray-200 opacity-60',
    )}>
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
        unlocked ? a.bgColor : 'bg-gray-200',
      )}>
        {unlocked
          ? <Icon className={cn('w-5 h-5', a.iconColor)} />
          : <Lock className="w-4 h-4 text-gray-400" />}
      </div>
      <div className="min-w-0">
        <div className={cn('text-xs font-bold', unlocked ? 'text-gray-900' : 'text-gray-400')}>{a.name}</div>
        <div className="text-[10px] text-gray-500 leading-tight">{a.description}</div>
      </div>
      {unlocked && <CheckCircle className={cn('w-4 h-4 flex-shrink-0', a.iconColor)} />}
    </div>
  );
}

// ─── Level Path ───────────────────────────────────────────────────────────────

function LevelPath({ currentLevel }: { currentLevel: string }) {
  const currentIdx = LEVEL_ORDER.indexOf(currentLevel);

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {LEVEL_ORDER.map((lvl, i) => {
          const reached = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <div key={lvl} className="flex flex-col items-center gap-1 flex-1">
              {/* connector line */}
              {i > 0 && (
                <div className={cn(
                  'absolute h-0.5 transition-all duration-500',
                  reached ? 'bg-mastchieve-500' : 'bg-gray-200',
                )} style={{ left: `${((i - 0.5) / (LEVEL_ORDER.length - 1)) * 100}%`, width: `${100 / (LEVEL_ORDER.length - 1)}%`, top: '14px' }} />
              )}
              <div className={cn(
                'relative w-7 h-7 rounded-full flex items-center justify-center border-2 z-10 transition-all',
                current
                  ? 'bg-mastchieve-600 border-mastchieve-600 shadow-lg ring-2 ring-mastchieve-300'
                  : reached
                  ? 'bg-mastchieve-500 border-mastchieve-500'
                  : 'bg-white border-gray-300',
              )}>
                {reached
                  ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                  : <div className="w-2 h-2 rounded-full bg-gray-200" />}
              </div>
              <div className={cn('text-[9px] font-semibold text-center leading-tight',
                current ? 'text-mastchieve-700' : reached ? 'text-gray-700' : 'text-gray-400')}>
                {LEVEL_LABEL[lvl]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'modulos' | 'desempenho' | 'conquistas';

export default function StudentProgressPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const { user } = useAuthStore();

  const { data: me, isLoading } = useQuery({
    queryKey: ['student-me'],
    queryFn: async () => {
      const { data } = await api.get('/students/me');
      return data.data;
    },
    enabled: user?.role === 'STUDENT',
  });

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className="h-8 bg-gray-200 rounded-xl w-48 animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-56 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const activeClass = me?.enrollments?.[0]?.class;
  const classLevel = activeClass?.level ?? 'BEGINNER';
  const progressRecords: any[] = me?.progressRecords ?? [];
  const performanceRecords: any[] = me?.performanceRecords ?? [];
  const trainingPlans: any[] = me?.trainingPlans ?? [];
  const attendanceRate: number = me?.attendanceStats?.rate ?? 0;
  const totalSessions: number = me?.attendanceStats?.total ?? 0;
  const completedModules = progressRecords.filter((p) => p.status === 'COMPLETED').length;
  const latestPerf = performanceRecords[0];
  const prevPerf = performanceRecords[1];
  const avgScore = performanceRecords.length
    ? parseFloat((performanceRecords.reduce((s, r) => s + (r.overallScore ?? 0), 0) / performanceRecords.length).toFixed(1))
    : 0;
  const schedules = parseJson<any[]>(activeClass?.schedules, []);
  const unlockedAchievements = me ? ACHIEVEMENTS.filter((a) => a.check(me)) : [];

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview',   label: 'Visão Geral', icon: BarChart3 },
    { id: 'modulos',    label: 'Módulos',     icon: BookOpen },
    { id: 'desempenho', label: 'Desempenho',  icon: TrendingUp },
    { id: 'conquistas', label: 'Conquistas',  icon: Trophy },
  ];

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">O Meu Progresso</h1>
          <p className="text-gray-500 text-sm mt-1">Evolução nos módulos de natação e métricas de desempenho</p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-700">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
        </div>
      </div>

      {/* Hero KPI bar */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {/* Attendance circle */}
        <div className="col-span-1 bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center justify-center gap-1">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E7EB" strokeWidth="3.5" />
              <circle
                cx="18" cy="18" r="14" fill="none" strokeWidth="3.5" strokeLinecap="round"
                stroke={attendanceRate >= 85 ? '#10b981' : attendanceRate >= 70 ? '#f59e0b' : '#ef4444'}
                strokeDasharray={`${(attendanceRate / 100) * 87.96} 87.96`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-sm font-bold', attendanceRate >= 85 ? 'text-green-600' : attendanceRate >= 70 ? 'text-amber-600' : 'text-red-500')}>
                {attendanceRate}%
              </span>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 font-medium text-center">Assiduidade</div>
          <div className="text-[10px] text-gray-400">{totalSessions} sessões</div>
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-violet-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-[10px] font-semibold uppercase text-gray-500">Média</span>
            </div>
            <div>
              <div className={cn('text-2xl font-bold', scoreColor(avgScore))}>{avgScore > 0 ? avgScore : '—'}</div>
              <div className="text-[10px] text-gray-400">pontuação global</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-green-500">
              <Award className="w-4 h-4" />
              <span className="text-[10px] font-semibold uppercase text-gray-500">Módulos</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{completedModules}<span className="text-sm text-gray-400">/{progressRecords.length}</span></div>
              <div className="text-[10px] text-gray-400">concluídos</div>
            </div>
          </div>
          {latestPerf && (
            <div className="col-span-2 bg-gradient-to-br from-mastchieve-50 to-blue-50 rounded-2xl border border-mastchieve-100 p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-mastchieve-600 font-semibold uppercase">Última sessão</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {new Date(latestPerf.recordedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn('text-2xl font-bold', scoreColor(latestPerf.overallScore))}>
                  {latestPerf.overallScore?.toFixed(1) ?? '—'}
                </span>
                {prevPerf?.overallScore != null && (
                  latestPerf.overallScore > prevPerf.overallScore
                    ? <ArrowUp className="w-4 h-4 text-green-500" />
                    : latestPerf.overallScore < prevPerf.overallScore
                    ? <ArrowDown className="w-4 h-4 text-red-500" />
                    : <Minus className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Class card */}
      {activeClass && (
        <div className={cn('rounded-2xl p-5 text-white bg-gradient-to-br relative overflow-hidden', LEVEL_GRADIENT[classLevel] ?? 'from-mastchieve-600 to-mastchieve-700')}>
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <Waves className="w-full h-full" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white/70 text-[10px] font-semibold uppercase tracking-widest">A tua turma atual</div>
              <div className="text-white font-bold text-lg leading-tight">{activeClass.name}</div>
              <div className="text-white/70 text-sm">
                {LEVEL_LABEL[classLevel]} · {activeClass.instructor?.firstName} {activeClass.instructor?.lastName}
              </div>
            </div>
          </div>

          {/* Level path */}
          <div className="bg-white/10 rounded-2xl p-3 mb-3">
            <div className="text-white/70 text-[10px] font-semibold uppercase mb-3">Jornada de níveis</div>
            <LevelPath currentLevel={classLevel} />
          </div>

          {/* Schedule chips */}
          {schedules.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {schedules.map((s: any, i: number) => (
                <span key={i} className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full">
                  {typeof s === 'string' ? s : `${s.day ?? ''} ${s.time ?? s.startTime ?? ''}`.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {tabs.map((t) => {
            const TIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all -mb-px',
                  tab === t.id
                    ? 'border-mastchieve-600 text-mastchieve-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                )}
              >
                <TIcon className="w-3.5 h-3.5 hidden sm:block" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 md:p-5">

          {/* ── Visão Geral ── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Latest performance metrics */}
              {latestPerf && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-900">Última Avaliação</div>
                    <span className="text-xs text-gray-400">
                      {new Date(latestPerf.recordedAt).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {Object.keys(METRIC_CFG)
                      .filter((k) => latestPerf[k] != null)
                      .map((k, i) => (
                        <MetricRow
                          key={k}
                          metricKey={k}
                          current={latestPerf[k]}
                          prev={prevPerf?.[k]}
                          delay={i * 60}
                        />
                      ))}
                  </div>
                  {latestPerf.overallScore != null && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                      <span className="text-sm font-semibold text-gray-700">Pontuação Global</span>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-2xl font-bold', scoreColor(latestPerf.overallScore))}>
                          {latestPerf.overallScore.toFixed(1)}/10
                        </span>
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Training plan preview */}
              {trainingPlans.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border border-purple-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-purple-600 rounded-xl flex items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-purple-900">Plano de Treino Ativo</div>
                      {trainingPlans[0].aiGenerated && (
                        <span className="text-[10px] text-purple-500 flex items-center gap-0.5">
                          <Brain className="w-2.5 h-2.5" /> Gerado por IA
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-purple-900">{trainingPlans[0].title}</div>
                  {trainingPlans[0].description && (
                    <p className="text-xs text-purple-700 mt-1 leading-relaxed">{trainingPlans[0].description}</p>
                  )}
                  {(() => {
                    const objectives = parseJson<string[]>(trainingPlans[0].objectives, []);
                    return objectives.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {objectives.slice(0, 3).map((obj, i) => (
                          <li key={i} className="text-xs text-purple-800 flex items-start gap-1.5">
                            <Target className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    ) : null;
                  })()}
                  {trainingPlans[0].validUntil && (
                    <div className="mt-2 text-[10px] text-purple-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Válido até {new Date(trainingPlans[0].validUntil).toLocaleDateString('pt-PT')}
                    </div>
                  )}
                </div>
              )}

              {/* No data state */}
              {!latestPerf && trainingPlans.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma avaliação registada ainda</p>
                  <p className="text-xs mt-1">O teu instrutor irá registar os dados após cada sessão</p>
                </div>
              )}
            </div>
          )}

          {/* ── Módulos ── */}
          {tab === 'modulos' && (
            <div className="space-y-3">
              {progressRecords.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum módulo atribuído ainda</p>
                  <p className="text-xs mt-1">O teu instrutor irá atribuir módulos de acordo com o teu nível</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{completedModules} de {progressRecords.length} concluídos</span>
                    <span className="font-semibold text-mastchieve-600">
                      {progressRecords.length > 0
                        ? Math.round((completedModules / progressRecords.length) * 100)
                        : 0}% completo
                    </span>
                  </div>
                  <AnimatedBar
                    pct={progressRecords.length > 0 ? Math.round((completedModules / progressRecords.length) * 100) : 0}
                    gradient="from-mastchieve-500 to-mastchieve-600"
                    height="h-1.5"
                  />
                  <div className="pt-2 space-y-3">
                    {progressRecords.map((pr: any, i: number) => (
                      <ModuleCard key={pr.id} pr={pr} index={i} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Desempenho ── */}
          {tab === 'desempenho' && (
            <div className="space-y-4">
              {performanceRecords.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma avaliação de desempenho ainda</p>
                  <p className="text-xs mt-1">Os dados aparecem após cada sessão avaliada</p>
                </div>
              ) : (
                <>
                  {/* Score trend summary */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-lg font-bold text-gray-900">{performanceRecords.length}</div>
                      <div className="text-[10px] text-gray-500">Sessões</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className={cn('text-lg font-bold', scoreColor(avgScore))}>{avgScore || '—'}</div>
                      <div className="text-[10px] text-gray-500">Média</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className={cn('text-lg font-bold', scoreColor(Math.max(...performanceRecords.map((r: any) => r.overallScore ?? 0))))}>
                        {Math.max(...performanceRecords.map((r: any) => r.overallScore ?? 0)) || '—'}
                      </div>
                      <div className="text-[10px] text-gray-500">Máximo</div>
                    </div>
                  </div>

                  {/* Sessions list */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-600">Histórico de sessões</div>
                    {performanceRecords.map((rec: any, i: number) => (
                      <SessionRow key={rec.id} record={rec} index={i} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Conquistas ── */}
          {tab === 'conquistas' && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-8 h-8 text-amber-500" />
                </div>
                <div className="text-sm font-bold text-gray-900">{unlockedAchievements.length} de {ACHIEVEMENTS.length} conquistas desbloqueadas</div>
                <div className="text-xs text-gray-500 mt-0.5">Continua a treinar para desbloquear mais!</div>
              </div>
              <AnimatedBar
                pct={Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}
                gradient="from-amber-400 to-orange-500"
                height="h-2"
              />
              <div className="pt-2 grid grid-cols-1 gap-2">
                {ACHIEVEMENTS.map((a) => (
                  <AchievementBadge key={a.id} a={a} unlocked={a.check(me)} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
