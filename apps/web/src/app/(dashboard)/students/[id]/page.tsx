'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, formatCurrency, getInitials, levelLabel, cn } from '@/lib/utils';
import {
  ArrowLeft, User, Brain, Activity, BookOpen, CreditCard,
  CheckCircle, XCircle, Clock, AlertCircle, Dumbbell, Send, TrendingUp,
  Upload, FileText, Trash2, Waves, History, FileDown,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import PerformanceModal from '@/components/feedback/performance-modal';
import Link from 'next/link';

// ─── Tab definition ────────────────────────────────────────────────────────────
const tabs = ['Desempenho', 'Feedbacks IA', 'Módulos', 'Planos de Treino', 'Financeiro', 'Documentos', 'Histórico'] as const;
type Tab = typeof tabs[number];

// ─── Lookup maps ──────────────────────────────────────────────────────────────
const attendanceIcon: Record<string, any> = {
  PRESENT: CheckCircle, ABSENT: XCircle, LATE: Clock, EXCUSED: AlertCircle,
};
const attendanceColor: Record<string, string> = {
  PRESENT: 'text-green-500', ABSENT: 'text-red-400', LATE: 'text-yellow-500', EXCUSED: 'text-blue-400',
};
const paymentColor: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700', PENDING: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-500',
};
const paymentLabel: Record<string, string> = {
  PAID: 'Pago', PENDING: 'Pendente', OVERDUE: 'Em atraso', CANCELLED: 'Cancelado',
};
const moduleStatusColor: Record<string, string> = {
  COMPLETED: 'bg-green-500', IN_PROGRESS: 'bg-mastchieve-500',
  NOT_STARTED: 'bg-gray-200', NEEDS_REVIEW: 'bg-yellow-400',
};
const moduleStatusLabel: Record<string, string> = {
  COMPLETED: 'Concluído', IN_PROGRESS: 'Em Progresso',
  NOT_STARTED: 'Não Iniciado', NEEDS_REVIEW: 'A Rever',
};

const levelColors: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700',
  ELEMENTARY: 'bg-sky-100 text-sky-700',
  INTERMEDIATE: 'bg-purple-100 text-purple-700',
  ADVANCED: 'bg-orange-100 text-orange-700',
  COMPETITIVE: 'bg-red-100 text-red-700',
};

// ─── Avatar gradient ──────────────────────────────────────────────────────────
function avatarGradient(name: string) {
  const c = (name?.[0] ?? 'A').toUpperCase();
  if (c >= 'A' && c <= 'E') return 'from-blue-400 to-blue-600';
  if (c >= 'F' && c <= 'K') return 'from-emerald-400 to-emerald-600';
  if (c >= 'L' && c <= 'P') return 'from-violet-400 to-violet-600';
  return 'from-rose-400 to-rose-600';
}

// ─── Quick stat card ──────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, gradient, iconBg, iconColor,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; gradient: string; iconBg: string; iconColor: string;
}) {
  return (
    <div className={cn('rounded-xl p-5 border', gradient)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 leading-none">{value}</div>
      <div className="text-xs font-medium text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'bg-green-100 text-green-700' : score >= 6 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return (
    <span className={cn('text-sm font-bold px-2.5 py-0.5 rounded-full', color)}>
      {score?.toFixed(1)}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('Desempenho');
  const [showPerf, setShowPerf] = useState(false);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => { const { data } = await api.get(`/students/${id}`); return data.data; },
  });

  const { data: perf, isLoading: loadingPerf } = useQuery({
    queryKey: ['student-perf', id],
    queryFn: async () => { const { data } = await api.get(`/students/${id}/performance`); return data.data; },
    enabled: !!id,
  });

  const sendMutation = useMutation({
    mutationFn: (fbId: string) => api.post(`/feedback/${fbId}/send`),
    onSuccess: () => { toast.success('Feedback enviado'); qc.invalidateQueries({ queryKey: ['student-perf', id] }); },
    onError: () => toast.error('Erro ao enviar feedback'),
  });

  const { data: documents } = useQuery({
    queryKey: ['student-docs', id],
    queryFn: async () => { const { data } = await api.get(`/documents/students/${id}`); return data.data ?? []; },
    enabled: activeTab === 'Documentos',
  });

  const deletDocMutation = useMutation({
    mutationFn: (docId: string) => api.delete(`/documents/${docId}`),
    onSuccess: () => { toast.success('Documento removido'); qc.invalidateQueries({ queryKey: ['student-docs', id] }); },
    onError: () => toast.error('Erro ao remover documento'),
  });

  const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('type', 'OTHER');
    try {
      await api.post(`/documents/students/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Documento enviado', file.name);
      qc.invalidateQueries({ queryKey: ['student-docs', id] });
    } catch {
      toast.error('Erro ao enviar documento');
    }
    e.target.value = '';
  };

  const handleGenerateFeedback = async () => {
    setGeneratingFeedback(true);
    try {
      await api.post(`/feedback/generate/${id}`);
      toast.success('Feedback IA gerado com sucesso');
      qc.invalidateQueries({ queryKey: ['student-perf', id] });
      setActiveTab('Feedbacks IA');
    } catch {
      toast.error('Erro ao gerar feedback IA');
    } finally {
      setGeneratingFeedback(false);
    }
  };

  const exportPdf = async () => {
    try {
      const resp = await api.get(`/students/${id}/report`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `atleta-${student.firstName}-${student.lastName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.success('Em desenvolvimento', 'A funcionalidade de exportação em PDF está a ser implementada.');
    }
  };

  // ── Loading / empty ────────────────────────────────────────────────────────
  if (loadingStudent) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <div className="animate-spin w-8 h-8 border-4 border-mastchieve-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!student) return null;

  // ── Derived data ───────────────────────────────────────────────────────────
  const enrollment = student.enrollments?.[0];
  const level = enrollment?.class?.level ?? student.level;
  const attendanceRate = perf?.attendanceRate ?? null;
  const grad = avatarGradient(student.firstName);

  const chartData = (perf?.records ?? []).slice().reverse().map((r: any, i: number) => ({
    label: `#${i + 1}`,
    Nota: r.overallScore,
    Técnica: r.technique,
    Resistência: r.stamina,
  }));

  // Financial summary
  const payments: any[] = student.payments ?? [];
  const totalPago = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const totalPendente = payments.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const totalAtraso = payments.filter((p) => p.status === 'OVERDUE').reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      {showPerf && (
        <PerformanceModal
          studentId={id}
          studentName={`${student.firstName} ${student.lastName}`}
          onClose={() => setShowPerf(false)}
          onSuccess={() => {
            setShowPerf(false);
            qc.invalidateQueries({ queryKey: ['student-perf', id] });
          }}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Back button */}
          <button onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition self-start flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className={cn('w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold flex-shrink-0', grad)}>
            {getInitials(student.firstName, student.lastName)}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{student.user?.email ?? '—'}</p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Status */}
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium',
                student.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                {student.isActive ? 'Ativo' : 'Inativo'}
              </span>

              {/* Level */}
              {level && (
                <span className={cn('flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium',
                  levelColors[level] ?? 'bg-gray-100 text-gray-600')}>
                  <Waves className="w-3 h-3" />
                  {levelLabel(level)}
                </span>
              )}

              {/* Attendance badge */}
              {attendanceRate !== null && (
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium',
                  attendanceRate >= 80 ? 'bg-green-100 text-green-700'
                  : attendanceRate >= 60 ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700')}>
                  {attendanceRate}% assiduidade
                </span>
              )}

              {/* Class */}
              {enrollment && (
                <span className="text-xs text-gray-400">{enrollment.class.name}</span>
              )}
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button
              onClick={() => setShowPerf(true)}
              className="flex items-center gap-1.5 bg-mastchieve-600 hover:bg-mastchieve-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <Dumbbell className="w-4 h-4" /> Registar Desempenho
            </button>

            <button onClick={exportPdf} className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-medium transition">
              <FileDown className="w-4 h-4" /> Exportar PDF
            </button>

            {enrollment?.class?.id && (
              <Link href={`/classes/${enrollment.class.id}`}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition">
                <User className="w-4 h-4" /> Ver Turma
              </Link>
            )}

            <button
              onClick={handleGenerateFeedback}
              disabled={generatingFeedback}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait text-white px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <Brain className="w-4 h-4" />
              {generatingFeedback ? 'A gerar...' : 'Gerar Feedback IA'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp} label="Nota média"
          value={perf?.avgScore != null ? `${perf.avgScore.toFixed(1)}/10` : '—'}
          gradient="bg-white border-blue-100" iconBg="bg-blue-50" iconColor="text-blue-600"
        />
        <StatCard
          icon={Activity} label="Assiduidade"
          value={attendanceRate !== null ? `${attendanceRate}%` : '—'}
          gradient="bg-white border-green-100" iconBg="bg-green-50" iconColor="text-green-600"
        />
        <StatCard
          icon={Brain} label="Feedbacks IA"
          value={perf?.feedbacks?.length ?? '—'}
          gradient="bg-white border-purple-100" iconBg="bg-purple-50" iconColor="text-purple-600"
        />
        <StatCard
          icon={BookOpen} label="Módulos concluídos"
          value={perf?.progress?.filter((p: any) => p.status === 'COMPLETED').length ?? '—'}
          gradient="bg-white border-orange-100" iconBg="bg-orange-50" iconColor="text-orange-500"
        />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap',
                activeTab === tab
                  ? 'border-mastchieve-600 text-mastchieve-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* DESEMPENHO */}
        {activeTab === 'Desempenho' && (
          <div className="space-y-4">
            {chartData.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-mastchieve-500" /> Evolução de Desempenho
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Nota" stroke="#1a56db" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Técnica" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Avaliações Recentes</h3>
              {loadingPerf ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
              ) : perf?.records?.length ? (
                <div className="space-y-2">
                  {perf.records.slice(0, 8).map((r: any) => (
                    <div key={r.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-400 w-20 flex-shrink-0">{formatDate(r.recordedAt)}</div>
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        {[['Técnica', r.technique], ['Resistência', r.stamina], ['Velocidade', r.speed], ['Coordenação', r.coordination]].map(([label, val]) => (
                          <div key={label as string} className="text-center">
                            <div className="text-xs text-gray-400">{label as string}</div>
                            <div className="text-sm font-semibold text-gray-900">{val ?? '—'}</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-mastchieve-600">{r.overallScore?.toFixed(1)}</div>
                        <div className="text-xs text-gray-400">geral</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">Sem avaliações ainda</p>
              )}
            </div>

            {/* Attendance */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Historial de Presenças (30 aulas)</h3>
              <div className="flex flex-wrap gap-1.5">
                {(perf?.attendance ?? []).map((a: any, i: number) => {
                  const Icon = attendanceIcon[a.status] ?? CheckCircle;
                  return (
                    <div key={i} title={`${formatDate(a.markedAt)} — ${a.status}`}
                      className={cn('w-6 h-6 rounded flex items-center justify-center', attendanceColor[a.status] ?? 'text-gray-300')}>
                      <Icon className="w-4 h-4" />
                    </div>
                  );
                })}
                {!perf?.attendance?.length && <p className="text-gray-400 text-sm">Sem registos</p>}
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACKS IA */}
        {activeTab === 'Feedbacks IA' && (
          <div className="space-y-3">
            {perf?.feedbacks?.map((fb: any) => (
              <div key={fb.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">{formatDate(fb.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {fb.aiConfidenceScore != null && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {Math.round(fb.aiConfidenceScore * 100)}% confiança
                      </span>
                    )}
                    <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium',
                      fb.status === 'SENT' ? 'bg-green-100 text-green-700' :
                      fb.status === 'REVIEWED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                      {fb.status === 'SENT' ? 'Enviado' : fb.status === 'REVIEWED' ? 'Revisto' : 'Gerado'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 rounded-lg p-3 whitespace-pre-wrap">
                  {fb.finalText || fb.aiGeneratedText || 'A gerar...'}
                </p>
                {fb.status !== 'SENT' && (
                  <button onClick={() => sendMutation.mutate(fb.id)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-mastchieve-600 hover:bg-mastchieve-50 px-3 py-1.5 rounded-lg transition font-medium">
                    <Send className="w-3 h-3" /> Enviar ao Atleta
                  </button>
                )}
              </div>
            ))}
            {!perf?.feedbacks?.length && (
              <div className="text-center py-12 text-gray-400">
                <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem feedbacks ainda</p>
                <button
                  onClick={handleGenerateFeedback}
                  disabled={generatingFeedback}
                  className="mt-3 flex items-center gap-1.5 mx-auto text-xs text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition font-medium"
                >
                  <Brain className="w-3 h-3" />
                  {generatingFeedback ? 'A gerar...' : 'Gerar primeiro feedback'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MÓDULOS */}
        {activeTab === 'Módulos' && (
          <div className="space-y-3">
            {perf?.progress?.map((p: any) => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                <div className={cn('w-3 h-3 rounded-full flex-shrink-0', moduleStatusColor[p.status] ?? 'bg-gray-200')} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{p.module?.name}</div>
                  {p.module?.description && (
                    <div className="text-xs text-gray-400 mt-0.5">{p.module.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {p.score != null && (
                    <span className="text-sm font-semibold text-gray-900">{p.score}/10</span>
                  )}
                  <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium',
                    p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    p.status === 'IN_PROGRESS' ? 'bg-mastchieve-100 text-mastchieve-700' :
                    p.status === 'NEEDS_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500')}>
                    {moduleStatusLabel[p.status] ?? p.status}
                  </span>
                </div>
              </div>
            ))}
            {!perf?.progress?.length && (
              <div className="text-center py-12 text-gray-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem módulos atribuídos</p>
              </div>
            )}
          </div>
        )}

        {/* PLANOS DE TREINO */}
        {activeTab === 'Planos de Treino' && (
          <div className="space-y-3">
            {perf?.trainingPlans?.map((plan: any) => (
              <div key={plan.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-mastchieve-500" />
                      <span className="font-semibold text-gray-900">{plan.title}</span>
                      {plan.aiGenerated && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">IA</span>
                      )}
                    </div>
                    {plan.description && <p className="text-xs text-gray-500 mt-1">{plan.description}</p>}
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    {plan.validFrom && <div>De: {formatDate(plan.validFrom)}</div>}
                    {plan.validUntil && <div>Até: {formatDate(plan.validUntil)}</div>}
                  </div>
                </div>
                {Array.isArray(plan.objectives) && plan.objectives.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-600 mb-1.5">Objetivos</div>
                    <ul className="space-y-1">
                      {plan.objectives.map((o: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /> {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(plan.exercises) && plan.exercises.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600">Exercícios ({plan.exercises.length})</div>
                    {plan.exercises.map((ex: any, i: number) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-gray-800">{i + 1}. {ex.name}</div>
                        {ex.description && <div className="text-xs text-gray-500 mt-0.5">{ex.description}</div>}
                        <div className="flex gap-3 mt-1.5">
                          {ex.sets && <span className="text-xs text-gray-500">{ex.sets} séries</span>}
                          {ex.reps && <span className="text-xs text-gray-500">{ex.reps} reps</span>}
                          {ex.duration && <span className="text-xs text-gray-500">⏱ {ex.duration}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!perf?.trainingPlans?.length && (
              <div className="text-center py-12 text-gray-400">
                <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem planos de treino ativos</p>
              </div>
            )}
          </div>
        )}

        {/* FINANCEIRO */}
        {activeTab === 'Financeiro' && (
          <div className="space-y-4">
            {/* Financial summary row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="text-xs text-green-600 font-medium mb-1">Total pago</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(totalPago)}</div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="text-xs text-amber-600 font-medium mb-1">Pendente</div>
                <div className="text-xl font-bold text-amber-700">{formatCurrency(totalPendente)}</div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <div className="text-xs text-red-600 font-medium mb-1">Em atraso</div>
                <div className="text-xl font-bold text-red-700">{formatCurrency(totalAtraso)}</div>
              </div>
            </div>

            {/* Payments table */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Mês</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Valor</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Vencimento</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Estado</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 text-sm text-gray-700">{p.referenceMonth}/{p.referenceYear}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{formatDate(p.dueDate)}</td>
                      <td className="px-5 py-3">
                        <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium', paymentColor[p.status] ?? 'bg-gray-100 text-gray-600')}>
                          {paymentLabel[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{p.receiptNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sem registos financeiros</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTOS */}
        {activeTab === 'Documentos' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Documentos do Atleta</h3>
                <label className="flex items-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Enviar ficheiro
                  <input type="file" className="hidden" onChange={uploadDoc}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls" />
                </label>
              </div>
              <div className="space-y-2">
                {(documents ?? []).map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{doc.name}</div>
                      <div className="text-xs text-gray-400">
                        {doc.type} · {doc.size ? `${Math.round(doc.size / 1024)} KB` : '—'}
                      </div>
                    </div>
                    <a href={`http://localhost:4301${doc.url}`} target="_blank" rel="noreferrer"
                      className="text-xs text-mastchieve-600 hover:underline flex-shrink-0">
                      Ver
                    </a>
                    <button onClick={() => deletDocMutation.mutate(doc.id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(documents ?? []).length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum documento carregado</p>
                    <p className="text-xs mt-1">Suporta PDF, Word, Excel e imagens (máx. 10 MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HISTÓRICO */}
        {activeTab === 'Histórico' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <History className="w-4 h-4 text-mastchieve-500" /> Últimos 10 registos de desempenho
              </h3>

              {loadingPerf ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-3 h-3 bg-gray-200 rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1 space-y-2 pb-6 border-l border-gray-100 pl-4">
                        <div className="h-3 bg-gray-200 rounded w-24" />
                        <div className="h-10 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : perf?.records?.length ? (
                <ol className="relative border-l border-gray-200 space-y-0">
                  {(perf.records as any[]).slice(0, 10).map((r, i) => (
                    <li key={r.id} className="mb-8 ml-4 last:mb-0">
                      {/* Timeline dot */}
                      <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-white bg-mastchieve-500" />

                      {/* Date + score */}
                      <div className="flex items-center justify-between mb-2">
                        <time className="text-xs text-gray-400 font-medium">
                          {formatDate(r.recordedAt, 'dd MMM yyyy')} · Registo #{perf.records.length - i}
                        </time>
                        {r.overallScore != null && <ScoreBadge score={r.overallScore} />}
                      </div>

                      {/* Metrics mini-row */}
                      <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          ['Técnica', r.technique],
                          ['Resistência', r.stamina],
                          ['Velocidade', r.speed],
                          ['Coordenação', r.coordination],
                        ].map(([label, val]) => (
                          <div key={label as string} className="text-center">
                            <div className="text-xs text-gray-400 mb-0.5">{label as string}</div>
                            <div className="text-sm font-bold text-gray-800">{val ?? <span className="text-gray-300">—</span>}</div>
                            {typeof val === 'number' && (
                              <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-mastchieve-500"
                                  style={{ width: `${(val / 10) * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Optional notes */}
                      {r.notes && (
                        <p className="mt-2 text-xs text-gray-500 italic">"{r.notes}"</p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sem histórico de desempenho registado</p>
                  <button onClick={() => setShowPerf(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-mastchieve-600 hover:bg-mastchieve-50 px-3 py-1.5 rounded-lg transition font-medium">
                    <Dumbbell className="w-3 h-3" /> Registar primeira avaliação
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
