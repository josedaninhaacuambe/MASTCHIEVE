'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import {
  BookOpen, Users, MessageSquare, Activity, Brain,
  Clock, ChevronRight, AlertCircle, CheckCircle,
  TrendingUp, Zap, ClipboardList,
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function todayLabel() {
  return new Date().toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function isWithinLastNDays(dateStr: string | undefined, days: number): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

/* ── Skeleton row ────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
        <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

/* ── Section card wrapper ────────────────────────────────────────────────── */
function SectionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  action,
  children,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{title}</p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({
  icon: Icon,
  message,
  actionLabel,
  actionHref,
}: {
  icon: any;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 mb-3">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="text-xs font-semibold text-[#1A56DB] hover:text-blue-800 hover:underline"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/* ── Quick stat card ─────────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function InstructorPage() {
  const { user } = useAuthStore();

  const firstName = user?.profile?.firstName ?? user?.email?.split('@')[0] ?? 'Instrutor';
  const instructorId = user?.profile?.id;

  /* ── Classes today ── */
  const { data: classesResp, isLoading: classesLoading } = useQuery({
    queryKey: ['instructor-classes', instructorId],
    queryFn: async () => {
      const params = instructorId
        ? `/classes?instructorId=${instructorId}&status=ACTIVE&limit=20`
        : `/classes?status=ACTIVE&limit=20`;
      const { data } = await api.get(params);
      return (data.data ?? data ?? []) as any[];
    },
    staleTime: 60_000,
  });

  /* ── Students (for "to evaluate") ── */
  const { data: studentsResp, isLoading: studentsLoading } = useQuery({
    queryKey: ['instructor-students'],
    queryFn: async () => {
      const { data } = await api.get('/students?limit=20');
      return (data.data ?? data ?? []) as any[];
    },
    staleTime: 60_000,
  });

  /* ── Pending feedbacks ── */
  const { data: feedbacksResp, isLoading: feedbacksLoading } = useQuery({
    queryKey: ['instructor-feedbacks-pending'],
    queryFn: async () => {
      const { data } = await api.get('/feedback?status=GENERATED&limit=10');
      return (data.data ?? data ?? []) as any[];
    },
    staleTime: 30_000,
  });

  /* ── Recent performance records ── */
  const { data: perfResp, isLoading: perfLoading } = useQuery({
    queryKey: ['instructor-perf-recent'],
    queryFn: async () => {
      // Pull recent students and derive performance from their records
      const { data } = await api.get('/students?limit=20');
      return (data.data ?? data ?? []) as any[];
    },
    staleTime: 60_000,
  });

  const classes: any[] = classesResp ?? [];
  const students: any[] = studentsResp ?? [];
  const feedbacks: any[] = feedbacksResp ?? [];
  const allStudentsPerf: any[] = perfResp ?? [];

  /* Students who haven't been evaluated in last 7 days */
  const toEvaluate = students.filter((s: any) => {
    const lastRecord = s.performanceRecords?.[0]?.recordedAt ?? s.perf?.records?.[0]?.recordedAt;
    return !isWithinLastNDays(lastRecord, 7);
  });

  /* Recent 5 performance evaluations (students with records) */
  const recentEvals = allStudentsPerf
    .filter((s: any) => s.performanceRecords?.[0])
    .slice(0, 5)
    .map((s: any) => ({
      id: s.id,
      name: `${s.profile?.firstName ?? s.firstName ?? ''} ${s.profile?.lastName ?? s.lastName ?? ''}`.trim() || s.email,
      initials: `${(s.profile?.firstName ?? s.firstName ?? '')[0] ?? ''}${(s.profile?.lastName ?? s.lastName ?? '')[0] ?? ''}`.toUpperCase(),
      score: s.performanceRecords[0]
        ? Math.round(
            (s.performanceRecords[0].technique +
              s.performanceRecords[0].stamina +
              s.performanceRecords[0].speed +
              s.performanceRecords[0].coordination +
              s.performanceRecords[0].breathing) / 5,
          )
        : null,
      date: s.performanceRecords[0]?.recordedAt,
    }));

  /* Quick stats */
  const totalAthletes = students.length;
  const classesToday = classes.length;
  const pendingFeedbacks = feedbacks.length;
  const evalsThisWeek = allStudentsPerf.filter((s: any) =>
    isWithinLastNDays(s.performanceRecords?.[0]?.recordedAt, 7),
  ).length;

  return (
    <div className="space-y-6">

      {/* ── HERO BANNER ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A3A9C] via-[#1A56DB] to-violet-600 p-6 md:p-8 text-white">
        {/* decorations */}
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-24 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-6 top-6 w-14 h-14 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/60 text-xs font-medium uppercase tracking-widest">{todayLabel()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">
              {greeting()}, {firstName}!
            </h1>
            <p className="text-white/60 text-sm mt-1">Portal do Instrutor — Mastchieve IA</p>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <Brain className="w-3.5 h-3.5 text-violet-200" />
                INSTRUCTOR
              </span>
            </div>
          </div>

          {/* Quick metric pills */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-2.5">
              <Users className="w-4 h-4 text-white/70" />
              <div>
                <p className="text-white font-black text-lg leading-none">{totalAthletes}</p>
                <p className="text-white/50 text-[10px] leading-none mt-0.5">atletas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-2.5">
              <MessageSquare className="w-4 h-4 text-white/70" />
              <div>
                <p className="text-white font-black text-lg leading-none">{pendingFeedbacks}</p>
                <p className="text-white/50 text-[10px] leading-none mt-0.5">feedbacks</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={Users}
          label="Total Atletas"
          value={totalAthletes}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          sub="inscritos activos"
        />
        <StatCard
          icon={BookOpen}
          label="Aulas Activas"
          value={classesToday}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          sub="turmas em funcionamento"
        />
        <StatCard
          icon={MessageSquare}
          label="Feedbacks Pendentes"
          value={pendingFeedbacks}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          sub="aguardam revisão"
        />
        <StatCard
          icon={TrendingUp}
          label="Avaliações esta semana"
          value={evalsThisWeek}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          sub="últimos 7 dias"
        />
      </div>

      {/* ── MAIN GRID ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ─ Today's Classes ─ */}
        <SectionCard
          icon={BookOpen}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          title="As Minhas Turmas"
          subtitle="Turmas activas atribuídas"
          action={
            <Link href="/classes" className="text-xs text-[#1A56DB] font-semibold hover:underline flex items-center gap-0.5">
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          }
        >
          {classesLoading ? (
            <div className="divide-y divide-gray-50">
              {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : classes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              message="Nenhuma turma activa atribuída"
              actionLabel="Ver todas as turmas"
              actionHref="/classes"
            />
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {classes.map((cls: any) => {
                const enrolled = cls._count?.enrollments ?? cls.enrolledCount ?? 0;
                const schedule = cls.schedule ?? cls.scheduleTime ?? '';
                return (
                  <Link
                    key={cls.id}
                    href={`/classes/${cls.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{cls.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {schedule && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />{schedule}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Users className="w-3 h-3" />{enrolled} atleta{enrolled !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      cls.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {cls.status === 'ACTIVE' ? 'Activa' : cls.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ─ Athletes to Evaluate ─ */}
        <SectionCard
          icon={ClipboardList}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          title="Atletas por Avaliar"
          subtitle="Sem avaliação nos últimos 7 dias"
          action={
            <Link href="/students" className="text-xs text-[#1A56DB] font-semibold hover:underline flex items-center gap-0.5">
              Ver atletas <ChevronRight className="w-3 h-3" />
            </Link>
          }
        >
          {studentsLoading ? (
            <div className="divide-y divide-gray-50">
              {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : toEvaluate.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              message="Todos os atletas foram avaliados recentemente"
              actionLabel="Ver lista completa"
              actionHref="/students"
            />
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {toEvaluate.slice(0, 8).map((student: any) => {
                const fn = student.profile?.firstName ?? student.firstName ?? '';
                const ln = student.profile?.lastName ?? student.lastName ?? '';
                const name = `${fn} ${ln}`.trim() || student.email;
                const initials = `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || (student.email?.[0]?.toUpperCase() ?? '?');
                const lastEval = student.performanceRecords?.[0]?.recordedAt;
                return (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A3A9C] to-[#1A56DB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                      <p className="text-xs text-gray-400">
                        {lastEval
                          ? `Última: ${new Date(lastEval).toLocaleDateString('pt-PT')}`
                          : 'Nunca avaliado'}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                      <AlertCircle className="w-3 h-3" />
                      Avaliar
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ─ Pending Feedbacks ─ */}
        <SectionCard
          icon={MessageSquare}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="Feedbacks por Rever"
          subtitle="Gerados pela IA — aguardam aprovação"
          action={
            <Link href="/feedback" className="text-xs text-[#1A56DB] font-semibold hover:underline flex items-center gap-0.5">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          }
        >
          {feedbacksLoading ? (
            <div className="divide-y divide-gray-50">
              {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : feedbacks.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              message="Nenhum feedback pendente de revisão"
              actionLabel="Ver todos os feedbacks"
              actionHref="/feedback"
            />
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {feedbacks.map((fb: any) => {
                const fn = fb.student?.firstName ?? '';
                const ln = fb.student?.lastName ?? '';
                const studentName = `${fn} ${ln}`.trim() || 'Atleta';
                const initials = `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '?';
                const confidence = fb.aiConfidenceScore != null
                  ? `${Math.round(fb.aiConfidenceScore * 100)}% conf.`
                  : null;
                return (
                  <div key={fb.id} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{studentName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-blue-500">
                          <Brain className="w-3 h-3" />IA Gerado
                        </span>
                        {confidence && (
                          <span className="text-xs text-gray-400">{confidence}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/students/${fb.studentId}`}
                      className="text-xs font-semibold text-white bg-[#1A56DB] hover:bg-blue-700 px-3 py-1.5 rounded-lg transition flex-shrink-0"
                    >
                      Revisar
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ─ Recent Performance ─ */}
        <SectionCard
          icon={TrendingUp}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          title="Avaliações Recentes"
          subtitle="Últimas 5 avaliações registadas"
          action={
            <Link href="/students" className="text-xs text-[#1A56DB] font-semibold hover:underline flex items-center gap-0.5">
              Ver atletas <ChevronRight className="w-3 h-3" />
            </Link>
          }
        >
          {perfLoading ? (
            <div className="divide-y divide-gray-50">
              {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : recentEvals.length === 0 ? (
            <EmptyState
              icon={Activity}
              message="Nenhuma avaliação registada ainda"
              actionLabel="Registar avaliação"
              actionHref="/students"
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {recentEvals.map((ev) => {
                const scoreColor =
                  ev.score == null ? 'text-gray-400'
                  : ev.score >= 8 ? 'text-emerald-600'
                  : ev.score >= 6 ? 'text-amber-600'
                  : 'text-rose-600';
                const scoreBg =
                  ev.score == null ? 'bg-gray-100'
                  : ev.score >= 8 ? 'bg-emerald-100'
                  : ev.score >= 6 ? 'bg-amber-100'
                  : 'bg-rose-100';
                return (
                  <Link
                    key={ev.id}
                    href={`/students/${ev.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {ev.initials || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ev.name}</p>
                      {ev.date && (
                        <p className="text-xs text-gray-400">
                          {new Date(ev.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    {ev.score != null && (
                      <span className={`text-sm font-black px-2.5 py-1 rounded-xl flex-shrink-0 ${scoreBg} ${scoreColor}`}>
                        {ev.score}<span className="text-xs font-normal">/10</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── QUICK ACTIONS BAR ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-gray-500" />
          <span className="font-bold text-gray-900 text-sm">Acções Rápidas</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Registar Presenças', icon: ClipboardList, href: '/attendance', color: 'from-blue-600 to-blue-700' },
            { label: 'Gerar Feedback IA', icon: Brain, href: '/feedback', color: 'from-violet-600 to-purple-700' },
            { label: 'Ver Atletas', icon: Users, href: '/students', color: 'from-[#1A3A9C] to-[#1A56DB]' },
            { label: 'As Minhas Turmas', icon: BookOpen, href: '/classes', color: 'from-emerald-600 to-teal-600' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${action.color} text-white hover:opacity-90 hover:shadow-md transition-all text-center`}
              >
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold leading-tight">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
