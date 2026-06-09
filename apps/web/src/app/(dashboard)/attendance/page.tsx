'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { getInitials, formatDate, cn } from '@/lib/utils';
import {
  ClipboardList, ChevronRight, CheckCircle, XCircle, Clock, AlertCircle,
  Save, Plus, CalendarDays, ChevronLeft, Users, Activity, TrendingUp, BarChart3,
} from 'lucide-react';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

const statusConfig: Record<AttendanceStatus, { label: string; color: string; icon: any }> = {
  PRESENT:  { label: 'Presente',    color: 'bg-green-100 text-green-700 ring-green-300',    icon: CheckCircle },
  ABSENT:   { label: 'Ausente',     color: 'bg-red-100 text-red-700 ring-red-300',          icon: XCircle },
  LATE:     { label: 'Atrasado',    color: 'bg-yellow-100 text-yellow-700 ring-yellow-300', icon: Clock },
  EXCUSED:  { label: 'Justificado', color: 'bg-blue-100 text-blue-700 ring-blue-300',       icon: AlertCircle },
};

const MONTH_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DOW_PT   = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function sessionRate(session: any): number | null {
  const att = session.attendances ?? session.attendance ?? null;
  if (!att || att.length === 0) return null;
  const present = att.filter((a: any) => a.status === 'PRESENT').length;
  return Math.round((present / att.length) * 100);
}

function rateColor(rate: number | null) {
  if (rate === null) return 'bg-gray-200';
  if (rate >= 80) return 'bg-green-500';
  if (rate >= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

function rateTextColor(rate: number | null) {
  if (rate === null) return 'text-gray-400';
  if (rate >= 80) return 'text-green-600';
  if (rate >= 60) return 'text-amber-600';
  return 'text-red-600';
}

// ──────────────────────────────────────────────────────────────────────────────
// Marcar Presenças — Step 1: choose class
// ──────────────────────────────────────────────────────────────────────────────

function Step1({ onSelect }: { onSelect: (cls: any) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['classes-attendance'],
    queryFn: async () => { const { data } = await api.get('/classes?limit=50&status=ACTIVE'); return data.data ?? []; },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Selecionar Turma</h2>
        <p className="text-sm text-gray-500 mt-1">Escolhe a turma para registar presenças</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse h-24" />
        )) : data?.map((cls: any) => (
          <button key={cls.id} onClick={() => onSelect(cls)}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-mastchieve-400 hover:shadow-md transition group">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{cls.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{cls.instructor?.firstName} {cls.instructor?.lastName}</div>
                <div className="text-xs text-gray-500 mt-1">{cls.enrolledCount}/{cls.maxStudents} atletas</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-mastchieve-500 transition" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 2: choose or create session
// ──────────────────────────────────────────────────────────────────────────────

function Step2({ cls, onSelect, onBack }: { cls: any; onSelect: (session: any) => void; onBack: () => void }) {
  const today = new Date().toISOString().split('T')[0];

  const { data: classDetail, isLoading } = useQuery({
    queryKey: ['class-detail', cls.id],
    queryFn: async () => { const { data } = await api.get(`/classes/${cls.id}`); return data.data; },
  });

  const createSessionMutation = useMutation({
    mutationFn: () => api.post(`/classes/${cls.id}/sessions`, {
      sessionDate: today, startTime: '09:00', endTime: '10:00', topic: 'Aula do dia',
    }),
    onSuccess: (res) => { toast.success('Sessão criada'); onSelect(res.data.data); },
    onError: () => toast.error('Erro ao criar sessão'),
  });

  const sessions = classDetail?.sessions ?? [];
  const todaySession = sessions.find((s: any) => s.sessionDate?.startsWith(today));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">← Voltar</button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{cls.name}</h2>
          <p className="text-sm text-gray-500">Selecionar sessão</p>
        </div>
      </div>

      {!isLoading && !todaySession && (
        <div className="bg-mastchieve-50 border border-mastchieve-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-mastchieve-800">Criar sessão para hoje</div>
            <div className="text-xs text-mastchieve-600">{formatDate(today)}</div>
          </div>
          <button onClick={() => createSessionMutation.mutate()} disabled={createSessionMutation.isPending}
            className="flex items-center gap-1.5 bg-mastchieve-600 hover:bg-mastchieve-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-60">
            <Plus className="w-3.5 h-3.5" />
            {createSessionMutation.isPending ? 'A criar...' : 'Criar Sessão'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse h-16" />
        )) : sessions.map((session: any) => (
          <button key={session.id} onClick={() => onSelect(session)}
            className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-mastchieve-400 hover:shadow-sm transition flex items-center justify-between group">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {formatDate(session.sessionDate)}
                {session.sessionDate?.startsWith(today) && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Hoje</span>
                )}
              </div>
              {session.topic && <div className="text-xs text-gray-400 mt-0.5">{session.topic}</div>}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-mastchieve-500 transition" />
          </button>
        ))}
        {!isLoading && sessions.length === 0 && !todaySession && (
          <p className="text-gray-400 text-sm text-center py-6">Sem sessões anteriores</p>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 3: mark attendance
// ──────────────────────────────────────────────────────────────────────────────

function Step3({ cls, session, onBack }: { cls: any; session: any; onBack: () => void }) {
  const { data: classDetail } = useQuery({
    queryKey: ['class-detail', cls.id],
    queryFn: async () => { const { data } = await api.get(`/classes/${cls.id}`); return data.data; },
  });

  const { data: existing } = useQuery({
    queryKey: ['session-attendance', session.id],
    queryFn: async () => { const { data } = await api.get(`/attendance/sessions/${session.id}`); return data.data ?? []; },
  });

  const students = classDetail?.enrollments?.map((e: any) => e.student) ?? [];
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing && existing.length > 0 && Object.keys(attendance).length === 0) {
      const init: Record<string, AttendanceStatus> = {};
      existing.forEach((r: any) => { init[r.studentId] = r.status; });
      setAttendance(init);
    }
  }, [existing]);

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    students.forEach((s: any) => { all[s.id] = status; });
    setAttendance(all);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const records = students.map((s: any) => ({ studentId: s.id, status: attendance[s.id] ?? 'ABSENT' }));
      return api.post(`/attendance/sessions/${session.id}/bulk`, { records });
    },
    onSuccess: () => { setSaved(true); toast.success('Presenças guardadas', `${students.length} registos atualizados`); },
    onError: () => toast.error('Erro ao guardar presenças'),
  });

  const presentCount = Object.values(attendance).filter((s) => s === 'PRESENT').length;
  const totalMarked = Object.keys(attendance).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">← Voltar</button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{cls.name}</h2>
          <p className="text-sm text-gray-500">{formatDate(session.sessionDate)} — {students.length} atletas</p>
        </div>
        {saved && <span className="flex items-center gap-1 text-sm text-green-600 font-medium"><CheckCircle className="w-4 h-4" /> Guardado</span>}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">{presentCount} presentes</span>
          <span className="text-gray-400">{totalMarked}/{students.length} marcados</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => markAll('PRESENT')} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium">Todos Presentes</button>
          <button onClick={() => markAll('ABSENT')} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium">Todos Ausentes</button>
        </div>
      </div>

      <div className="space-y-2">
        {students.map((student: any) => {
          const status = attendance[student.id];
          return (
            <div key={student.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-mastchieve-100 rounded-full flex items-center justify-center text-mastchieve-700 text-sm font-bold flex-shrink-0">
                {getInitials(student.firstName, student.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{student.firstName} {student.lastName}</div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {(Object.keys(statusConfig) as AttendanceStatus[]).map((s) => {
                  const cfg = statusConfig[s];
                  const Icon = cfg.icon;
                  return (
                    <button key={s} onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: s }))}
                      title={cfg.label}
                      className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition',
                        status === s ? `${cfg.color} ring-2` : 'bg-gray-100 text-gray-400 hover:bg-gray-200')}>
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || totalMarked === 0}
        className="w-full flex items-center justify-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50">
        <Save className="w-4 h-4" />
        {saveMutation.isPending ? 'A guardar...' : 'Guardar Presenças'}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Calendário tab
// ──────────────────────────────────────────────────────────────────────────────

function CalendarioTab({ onMarkSession }: { onMarkSession: (cls: any, session: any) => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [selectedClassId, setSelectedClassId] = useState('');

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const { data: classes } = useQuery({
    queryKey: ['classes-cal'],
    queryFn: async () => { const { data } = await api.get('/classes?limit=50&status=ACTIVE'); return data.data ?? []; },
  });

  const { data: classDetail, isLoading } = useQuery({
    queryKey: ['class-detail-cal', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return null;
      const { data } = await api.get(`/classes/${selectedClassId}`);
      return data.data;
    },
    enabled: !!selectedClassId,
  });

  // Filter sessions in selected month
  const allSessions: any[] = classDetail?.sessions ?? [];
  const monthSessions = allSessions.filter((s) => {
    const d = new Date(s.sessionDate);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  // Build session map: day -> session
  const sessionByDay: Record<number, any> = {};
  monthSessions.forEach((s) => {
    const day = new Date(s.sessionDate).getDate();
    sessionByDay[day] = s;
  });

  // Stats
  const rates = monthSessions.map(sessionRate).filter((r) => r !== null) as number[];
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;
  const totalPresent = monthSessions.reduce((acc, s) => {
    const att = s.attendances ?? s.attendance ?? [];
    return acc + att.filter((a: any) => a.status === 'PRESENT').length;
  }, 0);
  const totalAbsent = monthSessions.reduce((acc, s) => {
    const att = s.attendances ?? s.attendance ?? [];
    return acc + att.filter((a: any) => a.status === 'ABSENT').length;
  }, 0);

  // Calendar grid
  const daysInMonth = new Date(year, month, 0).getDate();
  const rawFirst = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const firstDow = (rawFirst + 6) % 7; // Mon=0
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDow + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
  const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : null;

  return (
    <div className="space-y-5">
      {/* Month navigator + class filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-700 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">
            {MONTH_PT[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-700 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-mastchieve-500">
          <option value="">— Selecionar turma —</option>
          {(classes ?? []).map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CalendarDays, label: 'Sessões no mês', value: monthSessions.length, color: 'text-mastchieve-600 bg-mastchieve-50' },
          { icon: TrendingUp,   label: 'Taxa média',     value: avgRate !== null ? `${avgRate}%` : '—', color: 'text-green-600 bg-green-50' },
          { icon: CheckCircle,  label: 'Presenças',      value: totalPresent, color: 'text-emerald-600 bg-emerald-50' },
          { icon: XCircle,      label: 'Ausências',      value: totalAbsent,  color: 'text-red-600 bg-red-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DOW_PT.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const session = day ? sessionByDay[day] : null;
            const rate = session ? sessionRate(session) : null;
            const isToday = day === todayDay;
            return (
              <div key={i}
                className={cn(
                  'min-h-[68px] p-1.5 border-b border-r border-gray-50 flex flex-col items-center',
                  !day && 'bg-gray-50/50',
                  day && session && 'cursor-pointer hover:bg-mastchieve-50/40 transition',
                )}
                onClick={() => day && session && selectedClassId && onMarkSession(classDetail, session)}
              >
                {day && (
                  <>
                    <span className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                      isToday ? 'bg-mastchieve-600 text-white' : 'text-gray-700',
                    )}>
                      {day}
                    </span>
                    {session && (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={cn('w-2 h-2 rounded-full', rateColor(rate))} />
                        <span className={cn('text-[10px] font-semibold', rateTextColor(rate))}>
                          {rate !== null ? `${rate}%` : '—'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> ≥80%</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> ≥60%</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;60%</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" /> sem sessão</span>
        </div>
      </div>

      {/* Session list */}
      {!selectedClassId && (
        <div className="text-center py-10 text-gray-400">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Seleciona uma turma para ver o calendário</p>
        </div>
      )}

      {selectedClassId && isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {selectedClassId && !isLoading && monthSessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Sessões de {MONTH_PT[month - 1]}</h3>
          {monthSessions.map((session: any) => {
            const rate = sessionRate(session);
            const att = session.attendances ?? session.attendance ?? [];
            const present = att.filter((a: any) => a.status === 'PRESENT').length;
            return (
              <div key={session.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{formatDate(session.sessionDate)}</span>
                    {session.topic && <span className="text-xs text-gray-400">{session.topic}</span>}
                  </div>
                  {att.length > 0 && (
                    <div className="mt-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', rateColor(rate))}
                            style={{ width: `${rate ?? 0}%` }} />
                        </div>
                        <span className={cn('text-xs font-semibold', rateTextColor(rate))}>
                          {present}/{att.length} · {rate ?? 0}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onMarkSession(classDetail, session)}
                  className="flex-shrink-0 text-xs bg-mastchieve-50 text-mastchieve-700 hover:bg-mastchieve-100 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5" /> Marcar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedClassId && !isLoading && monthSessions.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sem sessões em {MONTH_PT[month - 1]} {year}</p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Root page
// ──────────────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [mode, setMode] = useState<'marcar' | 'calendario'>('marcar');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  // Called from CalendarioTab "Marcar" button
  const handleMarkSession = (cls: any, session: any) => {
    setSelectedClass(cls);
    setSelectedSession(session);
    setStep(3);
    setMode('marcar');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-mastchieve-100 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-mastchieve-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presenças</h1>
          <p className="text-gray-500 text-sm mt-0.5">Registo e análise de assiduidade</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setMode('marcar')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition',
            mode === 'marcar' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>
          <span className="flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Marcar Presenças</span>
        </button>
        <button onClick={() => setMode('calendario')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition',
            mode === 'calendario' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>
          <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Calendário</span>
        </button>
      </div>

      {/* Marcar Presenças mode */}
      {mode === 'marcar' && (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className={step === 1 ? 'text-mastchieve-600 font-medium' : ''}>Turma</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={step === 2 ? 'text-mastchieve-600 font-medium' : ''}>Sessão</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={step === 3 ? 'text-mastchieve-600 font-medium' : ''}>Marcar Presenças</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            {step === 1 && (
              <Step1 onSelect={(cls) => { setSelectedClass(cls); setStep(2); }} />
            )}
            {step === 2 && selectedClass && (
              <Step2 cls={selectedClass}
                onSelect={(session) => { setSelectedSession(session); setStep(3); }}
                onBack={() => setStep(1)} />
            )}
            {step === 3 && selectedClass && selectedSession && (
              <Step3 cls={selectedClass} session={selectedSession} onBack={() => setStep(2)} />
            )}
          </div>
        </>
      )}

      {/* Calendário mode */}
      {mode === 'calendario' && (
        <CalendarioTab onMarkSession={handleMarkSession} />
      )}
    </div>
  );
}
