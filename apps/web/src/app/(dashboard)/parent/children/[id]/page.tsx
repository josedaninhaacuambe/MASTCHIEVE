'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, formatCurrency, getInitials, cn } from '@/lib/utils';
import {
  ArrowLeft, ChevronRight, Users, CreditCard, MessageSquare,
  Calendar, TrendingUp, CheckCircle, XCircle, Clock,
  AlertCircle, BookOpen, Star, Activity, Waves,
} from 'lucide-react';

type Tab = 'overview' | 'attendance' | 'payments' | 'feedback' | 'progress';

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Visão Geral',
  attendance: 'Presenças',
  payments: 'Pagamentos',
  feedback: 'Feedbacks',
  progress: 'Progresso',
};

const STATUS_COLOR: Record<string, string> = {
  PRESENT: 'text-green-600 bg-green-50',
  ABSENT: 'text-red-500 bg-red-50',
  LATE: 'text-yellow-600 bg-yellow-50',
  EXCUSED: 'text-blue-600 bg-blue-50',
  PAID: 'text-green-600 bg-green-50',
  PENDING: 'text-yellow-600 bg-yellow-50',
  OVERDUE: 'text-red-500 bg-red-50',
};
const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Presente', ABSENT: 'Faltou', LATE: 'Atrasado', EXCUSED: 'Justificada',
  PAID: 'Pago', PENDING: 'Pendente', OVERDUE: 'Em atraso',
};

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: student, isLoading } = useQuery({
    queryKey: ['parent-child', id],
    queryFn: async () => { const { data } = await api.get(`/parents/me/children/${id}`); return data.data; },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-xl w-32" />
        <div className="h-36 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!student) return (
    <div className="text-center py-20 text-gray-400">
      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>Atleta não encontrado</p>
    </div>
  );

  const attendances = student.attendances ?? [];
  const payments = student.payments ?? [];
  const feedbacks = student.feedbacks ?? [];
  const progress = student.progressRecords ?? [];
  const enrollments = student.enrollments ?? [];
  const stats = student.attendanceStats ?? { rate: 0, present: 0, total: 0 };

  const pendingPayments = payments.filter((p: any) => p.status === 'PENDING' || p.status === 'OVERDUE');
  const totalDue = pendingPayments.reduce((s: number, p: any) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => router.push('/parent')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft className="w-4 h-4" /> Os meus atletas
        </button>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span className="text-gray-900 font-medium">{student.firstName} {student.lastName}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white text-xl font-bold border border-white/30">
            {getInitials(student.firstName, student.lastName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{student.firstName} {student.lastName}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {enrollments.map((e: any) => (
                <span key={e.id} className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                  {e.class?.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          {[
            { label: 'Assiduidade', value: `${stats.rate}%`, sub: `${stats.present}/${stats.total} presenças` },
            { label: 'A regularizar', value: pendingPayments.length > 0 ? formatCurrency(totalDue) : 'Em dia', sub: pendingPayments.length > 0 ? `${pendingPayments.length} pagamento(s)` : 'Sem pendências' },
            { label: 'Feedbacks', value: feedbacks.length, sub: 'recebidos' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="text-blue-100 text-xs">{label}</div>
              <div className="text-blue-200 text-[10px] mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {pendingPayments.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              Pagamentos pendentes — {formatCurrency(totalDue)}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              {pendingPayments.length} mensalidade(s) por regularizar. Contacte a secretaria para efectuar o pagamento.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition',
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Informações pessoais</h3>
            <dl className="space-y-2.5 text-sm">
              {[
                { label: 'Data de nascimento', value: formatDate(student.dateOfBirth) },
                { label: 'Contacto', value: student.phone ?? '—' },
                { label: 'Inscrito desde', value: formatDate(student.enrollmentDate) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-gray-900 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" /> Turmas
            </h3>
            {enrollments.length === 0 ? <p className="text-sm text-gray-400">Sem turmas activas</p> : (
              <div className="space-y-2">
                {enrollments.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.class?.name}</p>
                      <p className="text-xs text-gray-400">
                        {e.class?.instructor ? `${e.class.instructor.firstName} ${e.class.instructor.lastName}` : e.class?.level}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance */}
      {tab === 'attendance' && (
        <div className="bg-white border border-gray-200 rounded-2xl">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Registo de presenças</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> {stats.present}</span>
                <span className="flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" /> {stats.total - stats.present}</span>
                <span className="font-semibold text-gray-900">{stats.rate}%</span>
              </div>
            </div>
          </div>
          {attendances.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem registos de presença</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {attendances.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium', STATUS_COLOR[a.status] ?? 'bg-gray-100 text-gray-500')}>
                      {a.status === 'PRESENT' ? <CheckCircle className="w-4 h-4" /> :
                        a.status === 'ABSENT' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(a.session?.sessionDate ?? a.markedAt)}
                      </p>
                      {a.session?.startTime && (
                        <p className="text-xs text-gray-400">{a.session.startTime}</p>
                      )}
                    </div>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLOR[a.status] ?? 'bg-gray-100 text-gray-500')}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payments */}
      {tab === 'payments' && (
        <div className="bg-white border border-gray-200 rounded-2xl">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Histórico de pagamentos</h3>
          </div>
          {payments.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem registos de pagamento</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-gray-400">
                      Vence: {formatDate(p.dueDate)} {p.paidAt ? `· Pago: ${formatDate(p.paidAt)}` : ''}
                    </p>
                  </div>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-500')}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {tab === 'feedback' && (
        <div className="space-y-3">
          {feedbacks.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-12 text-center text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum feedback disponível</p>
            </div>
          ) : feedbacks.map((fb: any) => (
            <div key={fb.id} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400">{formatDate(fb.createdAt)}</span>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">IA</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {fb.finalText ?? fb.aiGeneratedText ?? '—'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      {tab === 'progress' && (
        <div className="space-y-3">
          {progress.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-12 text-center text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum progresso registado</p>
            </div>
          ) : progress.map((p: any) => {
            const pct = p.status === 'COMPLETED' ? 100 : p.status === 'IN_PROGRESS' ? 50 : 0;
            return (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.module?.name}</p>
                    <p className="text-xs text-gray-400">{p.module?.level}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      p.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500')}>
                    {p.status === 'COMPLETED' ? 'Concluído' : p.status === 'IN_PROGRESS' ? 'Em progresso' : 'Por iniciar'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={cn('h-1.5 rounded-full transition-all',
                    p.status === 'COMPLETED' ? 'bg-green-400' : 'bg-blue-400')}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
