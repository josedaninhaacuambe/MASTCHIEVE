'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { timeAgo, getInitials, cn } from '@/lib/utils';
import {
  Brain, CheckCircle, Send, Eye, Filter, AlertCircle, RefreshCw,
  Plus, X, User, Sliders, Search,
} from 'lucide-react';
import AvaliacaoModal from '@/components/avaliacoes/AvaliacaoModal';

// ─── Nova Avaliação: seleção de atleta + modal partilhado ────────────────────

function NovaAvaliacaoFlow({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: studentsData } = useQuery({
    queryKey: ['students-for-feedback', studentSearch],
    queryFn: async () => {
      const params = studentSearch ? `?search=${encodeURIComponent(studentSearch)}&limit=20` : '?limit=30';
      const { data } = await api.get(`/students${params}`);
      return data;
    },
    enabled: !selectedStudent,
  });

  if (selectedStudent) {
    return (
      <AvaliacaoModal
        tipo="DIARIA"
        studentId={selectedStudent.id}
        studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
        onClose={onClose}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['feedbacks'] }); onClose(); }}
      />
    );
  }

  const students: any[] = studentsData?.data ?? [];
  const filteredStudents = students.filter((s) =>
    !studentSearch || `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92dvh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Nova Avaliação</h2>
              <p className="text-xs text-gray-500 mt-0.5">Seleciona o atleta a avaliar</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Nome do atleta..."
              className="bg-transparent text-sm outline-none flex-1"
            />
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {filteredStudents.slice(0, 20).map((s: any) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-gray-100 hover:border-gray-200 bg-white transition text-left"
              >
                <div className="w-10 h-10 bg-mastchieve-100 rounded-xl flex items-center justify-center text-mastchieve-700 text-sm font-bold flex-shrink-0">
                  {getInitials(s.firstName, s.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900">{s.firstName} {s.lastName}</div>
                  <div className="text-xs text-gray-400 truncate">{s.enrollments?.[0]?.class?.name ?? 'Sem turma'}</div>
                </div>
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhum atleta encontrado
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pendente',  color: 'bg-yellow-100 text-yellow-700' },
  GENERATED: { label: 'Gerado',   color: 'bg-blue-100 text-blue-700' },
  REVIEWED:  { label: 'Revisto',  color: 'bg-purple-100 text-purple-700' },
  SENT:      { label: 'Enviado',  color: 'bg-green-100 text-green-700' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['feedbacks', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const { data } = await api.get(`/feedback${params}`);
      return data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/feedback/${id}/send`),
    onSuccess: () => { toast.success('Feedback enviado ao atleta'); qc.invalidateQueries({ queryKey: ['feedbacks'] }); },
    onError: () => toast.error('Erro ao enviar feedback'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.patch(`/feedback/${id}/review`, { instructorNotes: notes, approve: true }),
    onSuccess: () => { toast.success('Feedback revisto e aprovado'); qc.invalidateQueries({ queryKey: ['feedbacks'] }); },
    onError: () => toast.error('Erro ao rever feedback'),
  });

  const feedbacks = data?.data ?? [];
  const counts = {
    total:     feedbacks.length,
    pending:   feedbacks.filter((f: any) => f.status === 'PENDING').length,
    generated: feedbacks.filter((f: any) => f.status === 'GENERATED').length,
    sent:      feedbacks.filter((f: any) => f.status === 'SENT').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback IA</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de feedbacks e avaliações de desempenho</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nova Avaliação
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: counts.total,     color: 'bg-white border-gray-100 text-gray-900' },
          { label: 'Pendentes', value: counts.pending,   color: 'bg-amber-50 border-amber-100 text-amber-700' },
          { label: 'Gerados',   value: counts.generated, color: 'bg-blue-50 border-blue-100 text-blue-700' },
          { label: 'Enviados',  value: counts.sent,      color: 'bg-green-50 border-green-100 text-green-700' },
        ].map((k) => (
          <div key={k.label} className={cn('rounded-2xl border p-3 text-center', k.color)}>
            <div className="text-xl font-bold">{k.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {[{ value: '', label: 'Todos' }, ...Object.entries(STATUS_CFG).map(([k, v]) => ({ value: k, label: v.label }))].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border font-medium transition',
              status === f.value ? 'bg-mastchieve-600 text-white border-mastchieve-600' : 'bg-white text-gray-600 border-gray-200 hover:border-mastchieve-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─ List ─ */}
        <div className="xl:col-span-2 space-y-3">
          {isError && (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> Erro ao carregar feedbacks.
              </div>
              <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-red-600 hover:underline">
                <RefreshCw className="w-3 h-3" /> Tentar novamente
              </button>
            </div>
          )}
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))
            : feedbacks.map((fb: any) => {
              const cfg = STATUS_CFG[fb.status];
              return (
                <div
                  key={fb.id}
                  onClick={() => setSelected(fb)}
                  className={cn(
                    'bg-white border-2 rounded-2xl p-4 cursor-pointer transition hover:shadow-md',
                    selected?.id === fb.id ? 'border-mastchieve-400 shadow-sm' : 'border-gray-100 hover:border-gray-200',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-mastchieve-100 rounded-xl flex items-center justify-center text-mastchieve-700 text-sm font-bold flex-shrink-0">
                      {getInitials(fb.student?.firstName, fb.student?.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{fb.student?.firstName} {fb.student?.lastName}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', cfg?.color)}>
                          {cfg?.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {fb.finalText || fb.aiGeneratedText || 'A gerar feedback pela IA...'}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">{timeAgo(fb.createdAt)}</span>
                        {fb.aiConfidenceScore && (
                          <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">
                            IA {Math.round(fb.aiConfidenceScore * 100)}%
                          </span>
                        )}
                        {fb.instructorNotes && (
                          <span className="text-xs text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-full font-medium">
                            Com notas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {fb.status !== 'SENT' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      {fb.status === 'GENERATED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(fb); }}
                          className="flex items-center gap-1.5 text-xs text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-xl transition border border-purple-100"
                        >
                          <Eye className="w-3 h-3" /> Rever
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); sendMutation.mutate(fb.id); }}
                        disabled={sendMutation.isPending}
                        className="flex items-center gap-1.5 text-xs text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-xl transition border border-green-100 disabled:opacity-40"
                      >
                        <Send className="w-3 h-3" /> Enviar ao atleta
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          {!isLoading && feedbacks.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum feedback encontrado</p>
              <p className="text-xs mt-1">Clica em "Nova Avaliação" para começar</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 flex items-center gap-2 mx-auto bg-mastchieve-600 hover:bg-mastchieve-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" /> Nova Avaliação
              </button>
            </div>
          )}
        </div>

        {/* ─ Detail panel ─ */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl">
          {selected ? (
            <div className="flex flex-col h-full">
              {/* Panel header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-mastchieve-100 rounded-xl flex items-center justify-center text-mastchieve-700 font-bold">
                    {getInitials(selected.student?.firstName, selected.student?.lastName)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{selected.student?.firstName} {selected.student?.lastName}</div>
                    <div className="text-xs text-gray-500">{timeAgo(selected.createdAt)}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="ml-auto text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                {/* AI feedback */}
                {selected.aiGeneratedText && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-gray-700">Feedback IA</span>
                      {selected.aiConfidenceScore && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full ml-auto">
                          {Math.round(selected.aiConfidenceScore * 100)}% confiança
                        </span>
                      )}
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-blue-100">
                      {selected.aiGeneratedText}
                    </div>
                  </div>
                )}

                {/* Instructor notes */}
                {selected.instructorNotes && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sliders className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-semibold text-gray-700">Notas do instrutor</span>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap border border-violet-100">
                      {selected.instructorNotes}
                    </div>
                  </div>
                )}

                {/* Pending: no content yet */}
                {!selected.aiGeneratedText && (
                  <div className="text-center py-8 text-gray-400">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse" />
                    <p className="text-sm">A aguardar geração pela IA...</p>
                  </div>
                )}
              </div>

              {/* Panel actions */}
              {selected.status !== 'SENT' && (
                <div className="p-4 border-t border-gray-100 space-y-2">
                  {selected.status === 'GENERATED' && (
                    <button
                      onClick={() => reviewMutation.mutate({ id: selected.id, notes: selected.instructorNotes ?? '' })}
                      disabled={reviewMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {reviewMutation.isPending ? 'A aprovar...' : 'Aprovar Feedback'}
                    </button>
                  )}
                  <button
                    onClick={() => sendMutation.mutate(selected.id)}
                    disabled={sendMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    {sendMutation.isPending ? 'A enviar...' : 'Enviar ao Atleta'}
                  </button>
                </div>
              )}

              {selected.status === 'SENT' && selected.sentToStudentAt && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl px-3 py-2.5">
                    <CheckCircle className="w-4 h-4" />
                    Enviado em {new Date(selected.sentToStudentAt).toLocaleDateString('pt-PT')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 p-5">
              <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Seleciona um feedback para ver detalhes</p>
              <p className="text-xs mt-1 text-gray-400">ou regista uma nova avaliação</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 flex items-center gap-2 mx-auto text-mastchieve-600 hover:text-mastchieve-700 text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" /> Nova Avaliação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nova avaliação */}
      {showModal && <NovaAvaliacaoFlow onClose={() => setShowModal(false)} />}
    </div>
  );
}
