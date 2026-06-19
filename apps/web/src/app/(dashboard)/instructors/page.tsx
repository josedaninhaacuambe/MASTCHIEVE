'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getInitials, formatDate, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  GraduationCap, Search, BookOpen, Users, MessageSquare,
  ChevronRight, X, Edit2, Bell, Power, PowerOff,
  Mail, Phone, Calendar, Star, TrendingUp, Activity,
  CheckCircle, XCircle, BarChart3, Award, Zap, Filter,
  Plus, Eye, ArrowUpDown, Shield,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  bio?: string;
  isActive: boolean;
  hireDate: string;
  specializations: string[];
  classes: { id: string; name: string; level: string; enrolledCount?: number }[];
  feedbackCount?: number;
  user: { id: string; email: string; lastLoginAt?: string; isActive: boolean };
  _count?: { feedbacks: number };
}

interface InstructorStats {
  classes: number;
  feedbacks: number;
  students: number;
  feedbacksByMonth: { month: string; count: number }[];
  recentMonthFeedbacks: number;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function activityStatus(lastLoginAt?: string) {
  if (!lastLoginAt) return { color: 'gray', label: 'Nunca acedeu', dot: 'bg-gray-300' };
  const days = Math.floor((Date.now() - new Date(lastLoginAt).getTime()) / 86400000);
  if (days <= 7) return { color: 'green', label: `Ativo há ${days}d`, dot: 'bg-green-400' };
  if (days <= 30) return { color: 'yellow', label: `${days}d sem acesso`, dot: 'bg-yellow-400' };
  return { color: 'red', label: `${days}d sem acesso`, dot: 'bg-red-400' };
}

function performanceBadge(feedbacks: number, students: number) {
  if (students === 0) return { label: '—', color: 'gray' };
  const ratio = feedbacks / students;
  if (ratio >= 8) return { label: 'Excelente', color: 'green' };
  if (ratio >= 4) return { label: 'Bom', color: 'blue' };
  if (ratio >= 1) return { label: 'Regular', color: 'yellow' };
  return { label: 'Baixo', color: 'red' };
}

const BADGE_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-500',
};

// ─── Stats Row (per card) ─────────────────────────────────────────────────────
function StatsRow({ instructorId }: { instructorId: string }) {
  const { data } = useQuery<InstructorStats>({
    queryKey: ['instructor-stats', instructorId],
    queryFn: async () => { const { data } = await api.get(`/instructors/${instructorId}/stats`); return data.data; },
    staleTime: 120_000,
  });
  return (
    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
        <span><strong className="text-gray-700">{data?.classes ?? '—'}</strong> turmas</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Users className="w-3.5 h-3.5 text-indigo-400" />
        <span><strong className="text-gray-700">{data?.students ?? '—'}</strong> atletas</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
        <span><strong className="text-gray-700">{data?.feedbacks ?? '—'}</strong> feedbacks</span>
      </div>
      {data && (
        <div className="ml-auto">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
            BADGE_COLORS[performanceBadge(data.feedbacks, data.students).color])}>
            {performanceBadge(data.feedbacks, data.students).label}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({
  instructorId,
  onClose,
  onEdit,
  onNotify,
  onToggle,
}: {
  instructorId: string;
  onClose: () => void;
  onEdit: (inst: Instructor) => void;
  onNotify: (inst: Instructor) => void;
  onToggle: (id: string, current: boolean) => void;
}) {
  const { data: inst, isLoading } = useQuery<Instructor>({
    queryKey: ['instructor-detail', instructorId],
    queryFn: async () => { const { data } = await api.get(`/instructors/${instructorId}`); return data.data; },
    staleTime: 30_000,
  });
  const { data: stats } = useQuery<InstructorStats>({
    queryKey: ['instructor-stats', instructorId],
    queryFn: async () => { const { data } = await api.get(`/instructors/${instructorId}/stats`); return data.data; },
    staleTime: 120_000,
  });

  const activity = activityStatus(inst?.user?.lastLoginAt);
  const perf = stats ? performanceBadge(stats.feedbacks, stats.students) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="w-16 h-16 bg-white/20 rounded-full" />
              <div className="h-5 bg-white/20 rounded w-40" />
            </div>
          ) : inst && (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 border border-white/30">
                {getInitials(inst.firstName, inst.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{inst.firstName} {inst.lastName}</h2>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    inst.isActive ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100')}>
                    {inst.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-blue-100 text-sm mt-0.5">{inst.user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn('w-2 h-2 rounded-full', activity.dot)} />
                  <span className="text-blue-100 text-xs">{activity.label}</span>
                </div>
                {perf && (
                  <span className="mt-2 inline-block text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                    Performance: {perf.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {inst && (
          <>
            {/* Action buttons */}
            <div className="flex gap-2 p-4 border-b border-gray-100 bg-gray-50">
              <button onClick={() => onEdit(inst)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition">
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={() => onNotify(inst)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition">
                <Bell className="w-3.5 h-3.5" /> Notificar
              </button>
              <button onClick={() => inst?.user?.email && window.open(`mailto:${inst.user.email}`)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition">
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button onClick={() => onToggle(inst.id, inst.isActive)}
                className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition',
                  inst.isActive
                    ? 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                    : 'bg-white border-green-200 text-green-600 hover:bg-green-50')}>
                {inst.isActive ? <><PowerOff className="w-3.5 h-3.5" /> Desativar</> : <><Power className="w-3.5 h-3.5" /> Ativar</>}
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* KPI cards */}
              {stats && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: BookOpen, label: 'Turmas', value: stats.classes, color: 'blue' },
                    { icon: Users, label: 'Atletas', value: stats.students, color: 'indigo' },
                    { icon: MessageSquare, label: 'Feedbacks', value: stats.feedbacks, color: 'violet' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className={cn('rounded-xl p-3 text-center',
                      color === 'blue' ? 'bg-blue-50' : color === 'indigo' ? 'bg-indigo-50' : 'bg-violet-50')}>
                      <Icon className={cn('w-4 h-4 mx-auto mb-1',
                        color === 'blue' ? 'text-blue-500' : color === 'indigo' ? 'text-indigo-500' : 'text-violet-500')} />
                      <div className="text-lg font-bold text-gray-900">{value}</div>
                      <div className="text-xs text-gray-500">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feedbacks monthly chart */}
              {stats?.feedbacksByMonth && stats.feedbacksByMonth.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-violet-500" />
                      Feedbacks — últimos 6 meses
                    </h3>
                    <span className="text-xs text-gray-500">
                      {stats.recentMonthFeedbacks} nos últimos 30d
                    </span>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.feedbacksByMonth} barSize={24}>
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                          formatter={(v: any) => [v, 'Feedbacks']}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {stats.feedbacksByMonth.map((_, i) => (
                            <Cell key={i} fill={i === stats.feedbacksByMonth.length - 1 ? '#7c3aed' : '#c4b5fd'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Bio */}
              {inst.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Sobre</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{inst.bio}</p>
                </div>
              )}

              {/* Specializations */}
              {inst.specializations?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Especializações</h3>
                  <div className="flex flex-wrap gap-2">
                    {inst.specializations.map((s, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Contacto</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${inst.user?.email}`} className="hover:text-blue-600 transition">
                      {inst.user?.email}
                    </a>
                  </div>
                  {inst.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {inst.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Ingresso: {formatDate(inst.hireDate)}
                  </div>
                  {inst.user?.lastLoginAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Activity className="w-4 h-4 text-gray-400" />
                      Último acesso: {formatDate(inst.user.lastLoginAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Classes */}
              {inst.classes?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    Turmas ({inst.classes.length})
                  </h3>
                  <div className="space-y-2">
                    {inst.classes.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.level}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3.5 h-3.5" />
                          {c.enrolledCount ?? 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  instructor,
  onClose,
}: {
  instructor: Instructor;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    firstName: instructor.firstName,
    lastName: instructor.lastName,
    phone: instructor.phone ?? '',
    bio: instructor.bio ?? '',
    specializations: (instructor.specializations ?? []).join(', '),
  });

  const mutation = useMutation({
    mutationFn: () => api.put(`/instructors/${instructor.id}`, {
      ...form,
      specializations: form.specializations.split(',').map((s) => s.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      toast.success('Instrutor actualizado');
      qc.invalidateQueries({ queryKey: ['instructors'] });
      qc.invalidateQueries({ queryKey: ['instructor-detail', instructor.id] });
      onClose();
    },
    onError: (e: any) => toast.error('Erro ao actualizar', e?.response?.data?.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Editar instrutor</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'firstName', label: 'Primeiro nome' },
              { key: 'lastName', label: 'Apelido' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Telemóvel</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+258 84 000 0000"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Especializações <span className="text-gray-400 font-normal">(separadas por vírgula)</span>
            </label>
            <input
              value={form.specializations}
              onChange={(e) => setForm((f) => ({ ...f, specializations: e.target.value }))}
              placeholder="Natação Técnica, Competição, ..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Biografia</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={4}
              placeholder="Formação, experiência, conquistas..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
            {mutation.isPending ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notify Modal ─────────────────────────────────────────────────────────────
function NotifyModal({ instructor, onClose }: { instructor: Instructor; onClose: () => void }) {
  const [form, setForm] = useState({ title: '', body: '' });
  const mutation = useMutation({
    mutationFn: () => api.post(`/instructors/${instructor.id}/notify`, form),
    onSuccess: () => {
      toast.success('Notificação enviada', `${instructor.firstName} foi notificado(a)`);
      onClose();
    },
    onError: (e: any) => toast.error('Erro ao enviar notificação', e?.response?.data?.message),
  });

  const presets = [
    { title: 'Reunião agendada', body: 'Há uma reunião de equipa agendada. Confirma a tua presença.' },
    { title: 'Actualização do sistema', body: 'O sistema foi actualizado. Inicia sessão para ver as novidades.' },
    { title: 'Pendência de feedbacks', body: 'Tens feedbacks de atletas por preencher. Por favor, actualiza os registos.' },
    { title: 'Avaliação em falta', body: 'Existem avaliações de desempenho por registar para os teus atletas.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Notificar instrutor</h2>
            <p className="text-xs text-gray-500 mt-0.5">{instructor.firstName} {instructor.lastName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Presets */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Mensagens rápidas</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p.title} onClick={() => setForm({ title: p.title, body: p.body })}
                className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-2.5 py-1 rounded-full transition">
                {p.title}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Título</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Assunto da notificação"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mensagem</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={3}
              placeholder="Conteúdo da notificação..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.title || !form.body}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
            <Bell className="w-4 h-4" />
            {mutation.isPending ? 'A enviar...' : 'Enviar notificação'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Instructor Card ──────────────────────────────────────────────────────────
function InstructorCard({
  inst,
  onView,
  onEdit,
  onNotify,
  onToggle,
}: {
  inst: Instructor;
  onView: () => void;
  onEdit: () => void;
  onNotify: () => void;
  onToggle: () => void;
}) {
  const activity = activityStatus(inst.user?.lastLoginAt);

  return (
    <div className={cn(
      'bg-white border rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow',
      inst.isActive ? 'border-gray-200' : 'border-gray-200 opacity-75',
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {getInitials(inst.firstName, inst.lastName)}
          </div>
          <span className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white', activity.dot)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm truncate">
              {inst.firstName} {inst.lastName}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
              inst.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
              {inst.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5 truncate">{inst.user?.email}</div>
          <div className="text-xs text-gray-400 mt-0.5">{activity.label}</div>
        </div>
      </div>

      {/* Specializations */}
      {inst.specializations?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {inst.specializations.slice(0, 3).map((s, i) => (
            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {s}
            </span>
          ))}
          {inst.specializations.length > 3 && (
            <span className="text-xs text-gray-400">+{inst.specializations.length - 3}</span>
          )}
        </div>
      )}

      {/* Bio */}
      {inst.bio && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{inst.bio}</p>
      )}

      {/* Classes preview */}
      {inst.classes?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {inst.classes.slice(0, 2).map((c) => (
            <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {c.name}
            </span>
          ))}
          {inst.classes.length > 2 && (
            <span className="text-xs text-gray-400">+{inst.classes.length - 2}</span>
          )}
        </div>
      )}

      {/* Stats */}
      <StatsRow instructorId={inst.id} />

      {inst.user?.lastLoginAt && (
        <p className="text-xs text-gray-400 mt-2">
          Último acesso: {formatDate(inst.user.lastLoginAt)}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-100">
        <button onClick={onView}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
          <Eye className="w-3.5 h-3.5" /> Ver
        </button>
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
          <Edit2 className="w-3.5 h-3.5" /> Editar
        </button>
        <button onClick={onNotify}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition">
          <Bell className="w-3.5 h-3.5" /> Avisar
        </button>
        <button onClick={onToggle}
          className={cn('flex items-center justify-center py-1.5 px-2 rounded-lg transition',
            inst.isActive ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100')}>
          {inst.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InstructorsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState<'name' | 'feedbacks' | 'students' | 'lastAccess'>('name');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingInst, setEditingInst] = useState<Instructor | null>(null);
  const [notifyingInst, setNotifyingInst] = useState<Instructor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['instructors', search, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100', ...(search && { search }) });
      if (filter !== 'all') params.set('isActive', filter === 'active' ? 'true' : 'false');
      const { data } = await api.get(`/instructors?${params}`);
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/instructors/${id}/toggle`),
    onSuccess: (res) => {
      const updated = res.data?.data;
      toast.success(updated?.isActive ? 'Instrutor ativado' : 'Instrutor desativado');
      qc.invalidateQueries({ queryKey: ['instructors'] });
      qc.invalidateQueries({ queryKey: ['instructor-detail'] });
    },
    onError: (e: any) => toast.error('Erro', e?.response?.data?.message),
  });

  const instructors: Instructor[] = useMemo(() => {
    const list: Instructor[] = data?.data ?? [];
    return [...list].sort((a, b) => {
      if (sort === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sort === 'feedbacks') return (b.feedbackCount ?? b._count?.feedbacks ?? 0) - (a.feedbackCount ?? a._count?.feedbacks ?? 0);
      if (sort === 'students') return 0; // students come from stats, sort by classes as proxy
      if (sort === 'lastAccess') {
        const ta = a.user?.lastLoginAt ? new Date(a.user.lastLoginAt).getTime() : 0;
        const tb = b.user?.lastLoginAt ? new Date(b.user.lastLoginAt).getTime() : 0;
        return tb - ta;
      }
      return 0;
    });
  }, [data, sort]);

  const total = data?.meta?.total ?? 0;
  const activeCount = instructors.filter((i) => i.isActive).length;
  const totalFeedbacks = instructors.reduce((s, i) => s + (i.feedbackCount ?? i._count?.feedbacks ?? 0), 0);
  const avgClasses = instructors.length > 0
    ? (instructors.reduce((s, i) => s + (i.classes?.length ?? 0), 0) / instructors.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      {/* Title + Search */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instrutores</h1>
          <p className="text-gray-500 text-sm mt-1">Equipa docente e estatísticas de desempenho</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar instrutor..."
            className="text-sm bg-transparent outline-none w-44"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: GraduationCap, label: 'Total de instrutores', value: total, color: 'blue' },
          { icon: CheckCircle, label: 'Ativos', value: activeCount, color: 'green' },
          { icon: MessageSquare, label: 'Total de feedbacks', value: totalFeedbacks, color: 'violet' },
          { icon: BookOpen, label: 'Média de turmas', value: avgClasses, color: 'indigo', suffix: ' por inst.' },
        ].map(({ icon: Icon, label, value, color, suffix }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100'
                : color === 'violet' ? 'bg-violet-100' : 'bg-indigo-100')}>
              <Icon className={cn('w-5 h-5',
                color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600'
                  : color === 'violet' ? 'text-violet-600' : 'text-indigo-600')} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {isLoading ? <span className="inline-block w-6 h-5 bg-gray-200 rounded animate-pulse" /> : value}
                {suffix && <span className="text-xs font-normal text-gray-400">{suffix}</span>}
              </div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Sort toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([['all', 'Todos'], ['active', 'Ativos'], ['inactive', 'Inativos']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition',
                filter === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="name">Nome</option>
            <option value="feedbacks">Mais feedbacks</option>
            <option value="lastAccess">Último acesso</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))
          : instructors.map((inst) => (
            <InstructorCard
              key={inst.id}
              inst={inst}
              onView={() => setViewingId(inst.id)}
              onEdit={() => setEditingInst(inst)}
              onNotify={() => setNotifyingInst(inst)}
              onToggle={() => toggleMutation.mutate(inst.id)}
            />
          ))}
      </div>

      {!isLoading && instructors.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <GraduationCap className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">Nenhum instrutor encontrado</p>
          <p className="text-xs mt-1">Tenta ajustar os filtros de pesquisa</p>
        </div>
      )}

      {/* Drawers and Modals */}
      {viewingId && (
        <DetailDrawer
          instructorId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={(inst) => { setViewingId(null); setEditingInst(inst); }}
          onNotify={(inst) => { setViewingId(null); setNotifyingInst(inst); }}
          onToggle={(id, current) => {
            toggleMutation.mutate(id);
            setViewingId(null);
          }}
        />
      )}
      {editingInst && <EditModal instructor={editingInst} onClose={() => setEditingInst(null)} />}
      {notifyingInst && <NotifyModal instructor={notifyingInst} onClose={() => setNotifyingInst(null)} />}
    </div>
  );
}
