'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { getInitials, formatDate, cn } from '@/lib/utils';
import {
  Dumbbell, Plus, X, Search, Brain, Target, ChevronDown, ChevronUp,
  Calendar, Clock, RefreshCw, CheckCircle, Loader2, Sparkles,
  Users, BookOpen, Star, Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Exercise {
  name: string;
  description: string;
  duration: string;
  sets: number;
  reps: number;
  notes?: string;
}

interface TrainingPlan {
  id: string;
  title: string;
  description?: string;
  objectives: string[];
  exercises: Exercise[];
  aiGenerated: boolean;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  student: { id: string; firstName: string; lastName: string };
  instructor?: { firstName: string; lastName: string };
}

// ─── Generate Plan Modal ──────────────────────────────────────────────────────
function GeneratePlanModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');

  const { data: studentsData } = useQuery({
    queryKey: ['students-select', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '20', ...(search && { search }) });
      const { data } = await api.get(`/students?${params}`);
      return data.data ?? [];
    },
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: () => api.post(`/ai/training-plan/${selectedStudent}`, { instructorNotes: notes }),
    onSuccess: () => {
      toast.success('Plano de treino gerado pela IA!');
      onSuccess();
      onClose();
    },
    onError: (e: any) => toast.error('Erro ao gerar plano', e?.response?.data?.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Gerar plano com IA</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pesquisar atleta</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-2">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome do atleta..."
                className="flex-1 text-sm bg-transparent outline-none" />
            </div>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
              <option value="">Selecionar atleta...</option>
              {(studentsData ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notas do instrutor (opcional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Objetivos específicos, limitações, foco da semana..."
              rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none" />
          </div>
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs text-violet-700">
            <Brain className="w-4 h-4 inline mr-1.5" />
            A IA irá analisar o progresso do atleta, nível, turma e feedbacks anteriores para gerar um plano personalizado.
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={() => mutation.mutate()} disabled={!selectedStudent || mutation.isPending}
            className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {mutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> A gerar...</>
              : <><Sparkles className="w-4 h-4" /> Gerar com IA</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Detail Drawer ───────────────────────────────────────────────────────
function PlanDrawer({ plan, onClose }: { plan: TrainingPlan; onClose: () => void }) {
  const [openExercise, setOpenExercise] = useState<number | null>(null);

  const objectives = Array.isArray(plan.objectives)
    ? plan.objectives
    : (() => { try { return JSON.parse(plan.objectives as any); } catch { return []; } })();

  const exercises: Exercise[] = Array.isArray(plan.exercises)
    ? plan.exercises
    : (() => { try { return JSON.parse(plan.exercises as any); } catch { return []; } })();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-6 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            {plan.aiGenerated && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gerado por IA
              </span>
            )}
            <span className={cn('text-xs px-2 py-0.5 rounded-full',
              plan.isActive ? 'bg-green-400/30 text-green-100' : 'bg-gray-400/30 text-gray-200')}>
              {plan.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <h2 className="text-xl font-bold mt-2">{plan.title}</h2>
          <div className="flex items-center gap-2 mt-2 text-violet-100 text-sm">
            <Users className="w-4 h-4" />
            {plan.student?.firstName} {plan.student?.lastName}
          </div>
          {plan.description && (
            <p className="mt-3 text-violet-100 text-sm leading-relaxed">{plan.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-violet-100 text-xs">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> De {formatDate(plan.validFrom)}</span>
            {plan.validUntil && <span>até {formatDate(plan.validUntil)}</span>}
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Objectives */}
          {objectives.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" /> Objetivos
              </h3>
              <ul className="space-y-2">
                {objectives.map((obj: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exercises */}
          {exercises.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-violet-500" /> Exercícios ({exercises.length})
              </h3>
              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenExercise(openExercise === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                          <p className="text-xs text-gray-400">
                            {[ex.duration && `${ex.duration}`, ex.sets && `${ex.sets} séries`, ex.reps && `${ex.reps} reps`].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                      {openExercise === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {openExercise === i && (
                      <div className="px-4 pb-4 space-y-2.5 border-t border-gray-100 pt-3">
                        {ex.description && <p className="text-sm text-gray-600 leading-relaxed">{ex.description}</p>}
                        <div className="flex gap-3 flex-wrap">
                          {ex.duration && (
                            <div className="flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">
                              <Clock className="w-3 h-3" /> {ex.duration}
                            </div>
                          )}
                          {ex.sets && (
                            <div className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{ex.sets} séries</div>
                          )}
                          {ex.reps && (
                            <div className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">{ex.reps} reps</div>
                          )}
                        </div>
                        {ex.notes && <p className="text-xs text-gray-500 italic">{ex.notes}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
            <div className="flex justify-between">
              <span>Criado em</span><span className="text-gray-700">{formatDate(plan.createdAt)}</span>
            </div>
            {plan.instructor && (
              <div className="flex justify-between">
                <span>Instrutor</span>
                <span className="text-gray-700">{plan.instructor.firstName} {plan.instructor.lastName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Gerado por IA</span>
              <span className={plan.aiGenerated ? 'text-violet-600' : 'text-gray-700'}>
                {plan.aiGenerated ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onClick }: { plan: TrainingPlan; onClick: () => void }) {
  const objectives = Array.isArray(plan.objectives)
    ? plan.objectives
    : (() => { try { return JSON.parse(plan.objectives as any); } catch { return []; } })();
  const exercises: Exercise[] = Array.isArray(plan.exercises)
    ? plan.exercises
    : (() => { try { return JSON.parse(plan.exercises as any); } catch { return []; } })();

  const isExpired = plan.validUntil && new Date(plan.validUntil) < new Date();

  return (
    <div onClick={onClick} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {plan.aiGenerated && (
            <span className="flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3" /> IA
            </span>
          )}
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
            isExpired ? 'bg-red-100 text-red-600' :
              plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
            {isExpired ? 'Expirado' : plan.isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <div className="text-xs text-gray-400">{formatDate(plan.createdAt)}</div>
      </div>

      <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition">{plan.title}</h3>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-[10px] font-bold">
          {getInitials(plan.student?.firstName, plan.student?.lastName)}
        </div>
        {plan.student?.firstName} {plan.student?.lastName}
      </div>

      {plan.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{plan.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" /> {exercises.length} exercícios</span>
        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {objectives.length} objetivos</span>
        {plan.validUntil && (
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="w-3 h-3" /> até {formatDate(plan.validUntil)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TrainingPlansPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'ai'>('all');
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['training-plans', search, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', ...(search && { search }) });
      if (filter === 'active') params.set('isActive', 'true');
      if (filter === 'ai') params.set('aiGenerated', 'true');
      const { data } = await api.get(`/training-plans?${params}`);
      return data;
    },
    staleTime: 60_000,
  });

  const plans: TrainingPlan[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const aiCount = plans.filter((p) => p.aiGenerated).length;
  const activeCount = plans.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      {showGenerate && (
        <GeneratePlanModal onClose={() => setShowGenerate(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['training-plans'] })} />
      )}
      {selectedPlan && (
        <PlanDrawer plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos de Treino</h1>
          <p className="text-gray-500 text-sm mt-1">Planos personalizados gerados por IA para cada atleta</p>
        </div>
        <button onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          <Sparkles className="w-4 h-4" /> Gerar com IA
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Dumbbell, label: 'Total de planos', value: total, color: 'blue' },
          { icon: CheckCircle, label: 'Planos ativos', value: activeCount, color: 'green' },
          { icon: Sparkles, label: 'Gerados por IA', value: aiCount, color: 'violet' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
              color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : 'bg-violet-100')}>
              <Icon className={cn('w-5 h-5',
                color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : 'text-violet-600')} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {isLoading ? <span className="inline-block w-6 h-4 bg-gray-200 rounded animate-pulse" /> : value}
              </div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([['all', 'Todos'], ['active', 'Ativos'], ['ai', 'Gerados por IA']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition',
                filter === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar..."
            className="text-sm bg-transparent outline-none w-36" />
          {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))
          : plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onClick={() => setSelectedPlan(plan)} />
          ))}
      </div>

      {!isLoading && plans.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Dumbbell className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">Nenhum plano de treino encontrado</p>
          <p className="text-xs mt-1 mb-4">Gera o primeiro plano personalizado com IA</p>
          <button onClick={() => setShowGenerate(true)}
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-violet-700 transition">
            <Sparkles className="w-4 h-4" /> Gerar com IA
          </button>
        </div>
      )}
    </div>
  );
}
