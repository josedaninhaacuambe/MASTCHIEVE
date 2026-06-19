'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatDate, getInitials, cn } from '@/lib/utils';
import {
  ArrowLeft, ChevronRight, CheckCircle, XCircle, Clock,
  AlertCircle, Save, ClipboardList, Users, BarChart3, RefreshCw,
} from 'lucide-react';

type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

const STATUS_OPTIONS: { value: Status; label: string; color: string; icon: any }[] = [
  { value: 'PRESENT',  label: 'Presente',    color: 'bg-green-100 text-green-700 ring-green-300 border-green-200',  icon: CheckCircle },
  { value: 'ABSENT',   label: 'Ausente',     color: 'bg-red-100 text-red-600 ring-red-300 border-red-200',          icon: XCircle },
  { value: 'LATE',     label: 'Atrasado',    color: 'bg-yellow-100 text-yellow-700 ring-yellow-300 border-yellow-200', icon: Clock },
  { value: 'EXCUSED',  label: 'Justificado', color: 'bg-blue-100 text-blue-700 ring-blue-300 border-blue-200',      icon: AlertCircle },
];

export default function SessionAttendancePage() {
  const { id: classId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [notes, setNotes]           = useState<Record<string, string>>({});
  const [saved, setSaved]           = useState(false);

  // Fetch session info + existing attendance
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: async () => {
      const [attRes, classRes] = await Promise.all([
        api.get(`/attendance/sessions/${sessionId}`),
        api.get(`/classes/${classId}`),
      ]);
      return { attendance: attRes.data.data, class: classRes.data.data };
    },
    staleTime: 30_000,
  });

  // Seed local state from existing attendance records
  useEffect(() => {
    const existing: any[] = sessionData?.attendance?.records ?? [];
    if (existing.length > 0) {
      const statusMap: Record<string, Status> = {};
      const notesMap: Record<string, string>  = {};
      existing.forEach((r: any) => {
        statusMap[r.studentId] = r.status;
        if (r.notes) notesMap[r.studentId] = r.notes;
      });
      setAttendance(statusMap);
      setNotes(notesMap);
    }
  }, [sessionData]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const records = enrolled.map((e: any) => ({
        studentId: e.student.id,
        status: attendance[e.student.id] ?? 'ABSENT',
        notes: notes[e.student.id] ?? undefined,
      }));
      return api.post(`/attendance/sessions/${sessionId}/bulk`, { records });
    },
    onSuccess: () => {
      toast.success('Presenças guardadas', 'Registo actualizado com sucesso');
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['session-attendance', sessionId] });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: any) => toast.error('Erro ao guardar', e?.response?.data?.message),
  });

  const cls     = sessionData?.class;
  const session = cls?.sessions?.find((s: any) => s.id === sessionId) ?? sessionData?.attendance?.session;
  const enrolled: any[] = cls?.enrollments ?? [];

  // Mark all at once
  function markAll(status: Status) {
    const next: Record<string, Status> = {};
    enrolled.forEach((e: any) => { next[e.student.id] = status; });
    setAttendance(next);
  }

  const presentCount  = Object.values(attendance).filter(s => s === 'PRESENT').length;
  const absentCount   = Object.values(attendance).filter(s => s === 'ABSENT').length;
  const lateCount     = Object.values(attendance).filter(s => s === 'LATE').length;
  const excusedCount  = Object.values(attendance).filter(s => s === 'EXCUSED').length;
  const markedCount   = Object.keys(attendance).length;
  const rate = enrolled.length > 0 ? Math.round(((presentCount + lateCount) / enrolled.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-xl w-48" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button onClick={() => router.push('/classes')}
          className="text-gray-400 hover:text-gray-700 transition">Turmas</button>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        <button onClick={() => router.push(`/classes/${classId}`)}
          className="text-gray-400 hover:text-gray-700 transition">{cls?.name ?? 'Turma'}</button>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        <span className="text-gray-900 font-medium">Presenças da Sessão</span>
      </div>

      {/* Session header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Registo de Presenças</h1>
            {session && (
              <p className="text-indigo-100 text-sm mt-0.5">
                {formatDate(session.sessionDate)} · {session.startTime}–{session.endTime}
                {session.topic ? ` · ${session.topic}` : ''}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Presentes',   value: presentCount,  color: 'bg-green-400/30 text-white' },
            { label: 'Ausentes',    value: absentCount,   color: 'bg-red-400/30 text-white' },
            { label: 'Atrasados',   value: lateCount,     color: 'bg-yellow-400/30 text-white' },
            { label: 'Justific.',   value: excusedCount,  color: 'bg-blue-400/30 text-white' },
          ].map(({ label, value, color }) => (
            <div key={label} className={cn('rounded-xl px-3 py-2 text-center', color)}>
              <div className="text-lg font-bold">{value}</div>
              <div className="text-xs text-white/80">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-indigo-100">{markedCount}/{enrolled.length} marcados · Taxa de assiduidade: <b>{rate}%</b></span>
          <div className="w-32 bg-white/20 rounded-full h-1.5">
            <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${rate}%` }} />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 mr-1">Marcar todos:</span>
        {STATUS_OPTIONS.map(({ value, label, color }) => (
          <button key={value}
            onClick={() => markAll(value)}
            className={cn('text-xs px-3 py-1.5 rounded-full font-medium border transition hover:opacity-80', color)}>
            {label}
          </button>
        ))}
      </div>

      {/* Student list */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">{enrolled.length} atletas inscritos</span>
          </div>
        </div>

        {enrolled.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum atleta inscrito nesta turma</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {enrolled.map((e: any) => {
              const student = e.student;
              const current = attendance[student.id];
              return (
                <div key={student.id} className="px-5 py-3">
                  {/* Top row: avatar + name + status buttons */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getInitials(student.firstName, student.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {student.firstName} {student.lastName}
                      </p>
                    </div>
                    {/* Status selector */}
                    <div className="flex items-center gap-1.5">
                      {STATUS_OPTIONS.map(({ value, label, color, icon: Icon }) => (
                        <button key={value}
                          onClick={() => setAttendance(prev => ({ ...prev, [student.id]: value }))}
                          title={label}
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center border transition',
                            current === value
                              ? cn(color, 'ring-2 shadow-sm scale-110')
                              : 'border-gray-200 text-gray-300 hover:text-gray-500 hover:border-gray-300',
                          )}>
                          <Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Status label + optional note */}
                  {current && (
                    <div className="mt-2 ml-12 flex items-center gap-2">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                        STATUS_OPTIONS.find(o => o.value === current)?.color ?? '')}>
                        {STATUS_OPTIONS.find(o => o.value === current)?.label}
                      </span>
                      {(current === 'ABSENT' || current === 'EXCUSED') && (
                        <input
                          value={notes[student.id] ?? ''}
                          onChange={e => setNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                          placeholder="Nota (opcional)"
                          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 flex items-center justify-between bg-white border border-gray-200 rounded-2xl shadow-lg px-5 py-3">
        <span className="text-sm text-gray-500">
          {markedCount < enrolled.length
            ? <span className="text-yellow-600 font-medium">{enrolled.length - markedCount} atleta(s) por marcar</span>
            : <span className="text-green-600 font-medium">Todos os atletas marcados</span>}
        </span>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || enrolled.length === 0}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition',
            saved
              ? 'bg-green-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50',
          )}>
          {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Guardado!' : saveMutation.isPending ? 'A guardar...' : 'Guardar Presenças'}
        </button>
      </div>
    </div>
  );
}
