'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { levelLabel, getInitials, cn } from '@/lib/utils';
import { BookOpen, Plus, Users, X, ChevronRight, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

const levelOptions = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED', 'COMPETITIVE'];
const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Ativa', color: 'bg-green-100 text-green-700' },
  INACTIVE: { label: 'Inativa', color: 'bg-gray-100 text-gray-500' },
  FULL: { label: 'Lotada', color: 'bg-red-100 text-red-700' },
};

function CreateClassModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: '', level: 'BEGINNER', maxStudents: 12, description: '', poolLane: '', instructorId: '',
  });

  const { data: instructorsData } = useQuery({
    queryKey: ['instructors-select'],
    queryFn: async () => { const { data } = await api.get('/instructors?limit=50'); return data.data ?? []; },
  });

  const mutation = useMutation({
    mutationFn: () => api.post('/classes', form),
    onSuccess: () => { toast.success('Turma criada', form.name); onSuccess(); onClose(); },
    onError: (e: any) => toast.error('Erro ao criar turma', e?.response?.data?.message),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Nova Turma</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da turma</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
              placeholder="Ex: Iniciantes A — Manhã"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
              <select
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
              >
                {levelOptions.map((l) => <option key={l} value={l}>{levelLabel(l)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cap. máxima</label>
              <input
                type="number" min={1} max={50}
                value={form.maxStudents}
                onChange={(e) => setForm((f) => ({ ...f, maxStudents: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pista / Local</label>
            <input
              value={form.poolLane}
              onChange={(e) => setForm((f) => ({ ...f, poolLane: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
              placeholder="Ex: Pista 1-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instrutor <span className="text-red-400">*</span></label>
            <select
              value={form.instructorId}
              onChange={(e) => setForm((f) => ({ ...f, instructorId: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500"
            >
              <option value="">Selecionar instrutor...</option>
              {(instructorsData ?? []).map((i: any) => (
                <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500 resize-none"
            />
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.instructorId || mutation.isPending}
            className="flex-1 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {mutation.isPending ? 'A criar...' : 'Criar Turma'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [levelFilter, setLevelFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['classes', levelFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', ...(levelFilter && { level: levelFilter }) });
      const { data } = await api.get(`/classes?${params}`);
      return data;
    },
  });

  const classes = data?.data ?? [];

  return (
    <div className="space-y-6">
      {showCreate && (
        <CreateClassModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['classes'] })}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turmas</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de todas as turmas e sessões de aula</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> Nova Turma
        </button>
      </div>

      {isError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Erro ao carregar turmas. Verifica a ligação ao servidor.
          </div>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-red-600 hover:underline">
            <RefreshCw className="w-3 h-3" /> Tentar novamente
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
        <span className="text-sm text-gray-500">Nível:</span>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setLevelFilter('')}
            className={cn('text-xs px-3 py-1.5 rounded-full font-medium transition',
              levelFilter === '' ? 'bg-mastchieve-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            Todos
          </button>
          {levelOptions.map((l) => (
            <button key={l}
              onClick={() => setLevelFilter(l)}
              className={cn('text-xs px-3 py-1.5 rounded-full font-medium transition',
                levelFilter === l ? 'bg-mastchieve-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              {levelLabel(l)}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-400">{data?.meta?.total ?? 0} turmas</span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))
          : classes.map((cls: any) => {
            const occupancy = cls.maxStudents ? Math.round((cls.enrolledCount / cls.maxStudents) * 100) : 0;
            const statusKey = cls.status || 'ACTIVE';
            const statusCfg = statusConfig[statusKey] ?? statusConfig.ACTIVE;

            return (
              <div key={cls.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition group cursor-pointer"
                onClick={() => router.push(`/classes/${cls.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-mastchieve-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-mastchieve-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-blue-600 transition">{cls.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{levelLabel(cls.level)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusCfg.color)}>
                      {statusCfg.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition" />
                  </div>
                </div>

                {/* Instructor */}
                {cls.instructor && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                      {getInitials(cls.instructor.firstName, cls.instructor.lastName)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {cls.instructor.firstName} {cls.instructor.lastName}
                    </span>
                  </div>
                )}

                {/* Occupancy bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {cls.enrolledCount}/{cls.maxStudents} atletas</span>
                    <span className={occupancy >= 90 ? 'text-red-500 font-medium' : occupancy >= 70 ? 'text-yellow-500' : 'text-green-600'}>
                      {occupancy}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={cn('h-1.5 rounded-full transition-all', occupancy >= 90 ? 'bg-red-400' : occupancy >= 70 ? 'bg-yellow-400' : 'bg-green-400')}
                      style={{ width: `${Math.min(occupancy, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Schedules */}
                {cls.schedules?.length > 0 && (
                  <div className="text-xs text-gray-400">
                    {cls.schedules.slice(0, 2).map((s: any, i: number) => (
                      <span key={i} className="mr-2">{s.day} {s.startTime}–{s.endTime}</span>
                    ))}
                  </div>
                )}

                {cls.location && (
                  <div className="text-xs text-gray-400 mt-1">{cls.location}</div>
                )}
              </div>
            );
          })}
      </div>

      {!isLoading && classes.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma turma encontrada</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-mastchieve-600 text-sm hover:underline">
            Criar primeira turma
          </button>
        </div>
      )}
    </div>
  );
}
