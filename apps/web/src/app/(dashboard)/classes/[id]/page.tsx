'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { levelLabel, getInitials, formatDate, cn } from '@/lib/utils';
import {
  BookOpen, Users, ArrowLeft, Edit2, Plus, X, Check,
  Calendar, Clock, ChevronRight, Search, UserMinus,
  ClipboardList, BarChart3, Waves, AlertCircle, Save,
} from 'lucide-react';

const LEVEL_OPTIONS = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED', 'COMPETITIVE'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'FULL'];
const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Ativa', INACTIVE: 'Inativa', FULL: 'Lotada' };
const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

type Tab = 'overview' | 'athletes' | 'sessions' | 'stats';

// ─── Edit Class Form ──────────────────────────────────────────────────────────
function EditClassPanel({ cls, onSave, onCancel }: { cls: any; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: cls.name,
    level: cls.level,
    status: cls.status,
    maxStudents: cls.maxStudents,
    poolLane: cls.poolLane ?? '',
    description: cls.description ?? '',
    instructorId: cls.instructor?.id ?? '',
  });
  const [schedules, setSchedules] = useState<{ day: string; startTime: string; endTime: string }[]>(
    cls.schedules ?? []
  );

  const { data: instructorsData } = useQuery({
    queryKey: ['instructors-select'],
    queryFn: async () => { const { data } = await api.get('/instructors?limit=50'); return data.data ?? []; },
    staleTime: 300_000,
  });

  const mutation = useMutation({
    mutationFn: () => api.put(`/classes/${cls.id}`, { ...form, schedules }),
    onSuccess: () => { toast.success('Turma actualizada'); onSave(); },
    onError: (e: any) => toast.error('Erro ao actualizar', e?.response?.data?.message),
  });

  const addSchedule = () => setSchedules((s) => [...s, { day: 'Segunda', startTime: '09:00', endTime: '10:00' }]);
  const removeSchedule = (i: number) => setSchedules((s) => s.filter((_, idx) => idx !== i));
  const updateSchedule = (i: number, key: string, value: string) =>
    setSchedules((s) => s.map((sch, idx) => (idx === i ? { ...sch, [key]: value } : sch)));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Editar turma</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
            <Save className="w-3.5 h-3.5" />
            {mutation.isPending ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Nome da turma</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nível</label>
          <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            {LEVEL_OPTIONS.map((l) => <option key={l} value={l}>{levelLabel(l)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Capacidade máx.</label>
          <input type="number" min={1} max={50} value={form.maxStudents}
            onChange={(e) => setForm((f) => ({ ...f, maxStudents: Number(e.target.value) }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Pista / Local</label>
          <input value={form.poolLane} onChange={(e) => setForm((f) => ({ ...f, poolLane: e.target.value }))}
            placeholder="Ex: Pista 1-2"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Instrutor</label>
          <select value={form.instructorId} onChange={(e) => setForm((f) => ({ ...f, instructorId: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">Selecionar instrutor...</option>
            {(instructorsData ?? []).map((i: any) => (
              <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
        </div>
      </div>

      {/* Schedules */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700">Horários</label>
          <button onClick={addSchedule} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Adicionar horário
          </button>
        </div>
        <div className="space-y-2">
          {schedules.map((sch, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
              <select value={sch.day} onChange={(e) => updateSchedule(i, 'day', e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none flex-1">
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="time" value={sch.startTime} onChange={(e) => updateSchedule(i, 'startTime', e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none w-24" />
              <span className="text-gray-400 text-xs">–</span>
              <input type="time" value={sch.endTime} onChange={(e) => updateSchedule(i, 'endTime', e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none w-24" />
              <button onClick={() => removeSchedule(i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {schedules.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">Nenhum horário definido</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Student Modal ────────────────────────────────────────────────────────
function AddStudentModal({ classId, enrolled, onClose, onSuccess }: {
  classId: string; enrolled: string[]; onClose: () => void; onSuccess: () => void;
}) {
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['students-enroll', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '30', ...(search && { search }) });
      const { data } = await api.get(`/students?${params}`);
      return data.data ?? [];
    },
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (studentId: string) => api.post(`/classes/${classId}/enroll`, { studentId }),
    onSuccess: () => { toast.success('Atleta inscrito'); onSuccess(); },
    onError: (e: any) => toast.error('Erro ao inscrever', e?.response?.data?.message),
  });

  const available = (data ?? []).filter((s: any) => !enrolled.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Inscrever atleta</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-4">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar atleta..."
            className="flex-1 text-sm bg-transparent outline-none" />
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {available.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">Nenhum atleta disponível</p>
          )}
          {available.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                  {getInitials(s.firstName, s.lastName)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-400">{s.user?.email}</p>
                </div>
              </div>
              <button onClick={() => mutation.mutate(s.id)} disabled={mutation.isPending}
                className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                Inscrever
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Create Session Modal ─────────────────────────────────────────────────────
function CreateSessionModal({ classId, onClose, onSuccess }: {
  classId: string; onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    topic: '',
    notes: '',
  });
  const mutation = useMutation({
    mutationFn: () => api.post(`/classes/${classId}/sessions`, form),
    onSuccess: () => { toast.success('Sessão criada'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error('Erro ao criar sessão', e?.response?.data?.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Nova sessão de aula</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data</label>
            <input type="date" value={form.sessionDate}
              onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Início</label>
              <input type="time" value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fim</label>
              <input type="time" value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tema / conteúdo</label>
            <input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="Ex: Técnica de costas — viragens"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {mutation.isPending ? 'A criar...' : 'Criar sessão'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [editing, setEditing] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);

  const { data: cls, isLoading } = useQuery({
    queryKey: ['class-detail', id],
    queryFn: async () => { const { data } = await api.get(`/classes/${id}`); return data.data; },
    staleTime: 30_000,
  });

  const unenrollMutation = useMutation({
    mutationFn: (studentId: string) => api.delete(`/classes/${id}/enroll/${studentId}`),
    onSuccess: () => { toast.success('Atleta removido'); qc.invalidateQueries({ queryKey: ['class-detail', id] }); },
    onError: (e: any) => toast.error('Erro ao remover atleta', e?.response?.data?.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-xl w-48" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!cls) return (
    <div className="text-center py-20 text-gray-400">
      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>Turma não encontrada</p>
    </div>
  );

  const enrolled = cls.enrollments ?? [];
  const enrolledIds = enrolled.map((e: any) => e.student?.id).filter(Boolean);
  const occupancy = cls.maxStudents ? Math.round((enrolled.length / cls.maxStudents) * 100) : 0;

  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-gray-100 text-gray-500',
    FULL: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-5">
      {showAddStudent && (
        <AddStudentModal classId={id} enrolled={enrolledIds}
          onClose={() => setShowAddStudent(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['class-detail', id] })} />
      )}
      {showCreateSession && (
        <CreateSessionModal classId={id}
          onClose={() => setShowCreateSession(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['class-detail', id] })} />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => router.push('/classes')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft className="w-4 h-4" /> Turmas
        </button>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span className="text-gray-900 font-medium">{cls.name}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{cls.name}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-blue-100 text-sm">{levelLabel(cls.level)}</span>
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium bg-white/20 text-white')}>
                  {STATUS_LABEL[cls.status] ?? cls.status}
                </span>
                {cls.poolLane && (
                  <span className="text-blue-100 text-sm">📍 {cls.poolLane}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm transition">
            <Edit2 className="w-4 h-4" /> Editar
          </button>
        </div>

        {/* Instructor + stats row */}
        <div className="mt-4 flex items-center gap-6 flex-wrap">
          {cls.instructor && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {getInitials(cls.instructor.firstName, cls.instructor.lastName)}
              </div>
              <span className="text-blue-100 text-sm">
                {cls.instructor.firstName} {cls.instructor.lastName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-blue-100 text-sm">
            <Users className="w-4 h-4" />
            {enrolled.length}/{cls.maxStudents} atletas
            <div className="w-20 bg-white/20 rounded-full h-1.5 ml-1">
              <div className="h-1.5 bg-white rounded-full transition-all" style={{ width: `${Math.min(occupancy, 100)}%` }} />
            </div>
          </div>
          {cls.schedules?.length > 0 && (
            <div className="flex items-center gap-1.5 text-blue-100 text-sm">
              <Clock className="w-4 h-4" />
              {cls.schedules.map((s: any, i: number) => (
                <span key={i}>{s.day} {s.startTime}–{s.endTime}{i < cls.schedules.length - 1 ? ' · ' : ''}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <EditClassPanel cls={cls} onCancel={() => setEditing(false)}
          onSave={() => { setEditing(false); qc.invalidateQueries({ queryKey: ['class-detail', id] }); }} />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          ['overview', BookOpen, 'Visão Geral'],
          ['athletes', Users, `Atletas (${enrolled.length})`],
          ['sessions', Calendar, `Sessões (${cls.sessions?.length ?? 0})`],
          ['stats', BarChart3, 'Estatísticas'],
        ] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition',
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Informações gerais</h3>
            <dl className="space-y-2.5">
              {[
                { label: 'Nível', value: levelLabel(cls.level) },
                { label: 'Estado', value: STATUS_LABEL[cls.status] ?? cls.status },
                { label: 'Capacidade', value: `${enrolled.length}/${cls.maxStudents} (${occupancy}%)` },
                { label: 'Pista / Local', value: cls.poolLane ?? '—' },
                { label: 'Criada em', value: formatDate(cls.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between text-sm gap-2">
                  <dt className="text-gray-500 flex-shrink-0">{label}</dt>
                  <dd className="text-gray-900 font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {cls.description && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Descrição</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{cls.description}</p>
            </div>
          )}
          {cls.schedules?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> Horários
              </h3>
              <div className="space-y-2">
                {cls.schedules.map((sch: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                    <span className="font-medium text-gray-900 w-20 flex-shrink-0">{sch.day}</span>
                    <span className="text-gray-600">{sch.startTime} – {sch.endTime}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      {(() => {
                        const [sh, sm] = sch.startTime.split(':').map(Number);
                        const [eh, em] = sch.endTime.split(':').map(Number);
                        return `${(eh * 60 + em) - (sh * 60 + sm)}min`;
                      })()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Athletes Tab ── */}
      {tab === 'athletes' && (
        <div className="bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Atletas inscritos</h3>
            <button onClick={() => setShowAddStudent(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-xl hover:bg-blue-700 transition">
              <Plus className="w-3.5 h-3.5" /> Inscrever atleta
            </button>
          </div>
          {enrolled.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum atleta inscrito</p>
              <button onClick={() => setShowAddStudent(true)} className="mt-2 text-blue-600 text-sm hover:underline">
                Inscrever primeiro atleta
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {enrolled.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold">
                      {getInitials(e.student?.firstName, e.student?.lastName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {e.student?.firstName} {e.student?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Inscrito em {formatDate(e.enrolledAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      e.student?.gender === 'MALE' ? 'bg-blue-50 text-blue-700' :
                        e.student?.gender === 'FEMALE' ? 'bg-pink-50 text-pink-700' : 'bg-gray-100 text-gray-500')}>
                      {e.student?.gender === 'MALE' ? 'M' : e.student?.gender === 'FEMALE' ? 'F' : '—'}
                    </span>
                    <button onClick={() => unenrollMutation.mutate(e.student?.id)}
                      disabled={unenrollMutation.isPending}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sessions Tab ── */}
      {tab === 'sessions' && (
        <div className="bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Sessões de aula</h3>
            <button onClick={() => setShowCreateSession(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-xl hover:bg-blue-700 transition">
              <Plus className="w-3.5 h-3.5" /> Nova sessão
            </button>
          </div>
          {(!cls.sessions || cls.sessions.length === 0) ? (
            <div className="py-12 text-center text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma sessão registada</p>
              <button onClick={() => setShowCreateSession(true)} className="mt-2 text-blue-600 text-sm hover:underline">
                Criar primeira sessão
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cls.sessions.map((sess: any) => (
                <div key={sess.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(sess.sessionDate)} — {sess.startTime}–{sess.endTime}
                      </p>
                      {sess.topic && (
                        <p className="text-xs text-gray-500 mt-0.5">{sess.topic}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/classes/${classId}/sessions/${sess.id}`)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" /> Presenças
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Stats Tab ── */}
      {tab === 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Atletas inscritos', value: enrolled.length, icon: Users, color: 'blue' },
            { label: 'Sessões realizadas', value: cls.sessions?.length ?? 0, icon: Calendar, color: 'indigo' },
            { label: 'Ocupação', value: `${occupancy}%`, icon: BarChart3, color: occupancy >= 90 ? 'red' : 'green' },
            { label: 'Vagas disponíveis', value: Math.max(0, cls.maxStudents - enrolled.length), icon: Waves, color: 'violet' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
              <div className={cn('w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center',
                color === 'blue' ? 'bg-blue-100' : color === 'indigo' ? 'bg-indigo-100' :
                  color === 'red' ? 'bg-red-100' : color === 'green' ? 'bg-green-100' : 'bg-violet-100')}>
                <Icon className={cn('w-5 h-5',
                  color === 'blue' ? 'text-blue-600' : color === 'indigo' ? 'text-indigo-600' :
                    color === 'red' ? 'text-red-500' : color === 'green' ? 'text-green-600' : 'text-violet-600')} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
