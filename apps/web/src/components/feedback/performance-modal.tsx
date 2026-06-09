'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { X, Brain, Dumbbell, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const metrics = [
  { key: 'technique',    label: 'Técnica',      description: 'Posição corporal, estilo geral' },
  { key: 'stamina',      label: 'Resistência',   description: 'Capacidade aeróbica, ritmo' },
  { key: 'speed',        label: 'Velocidade',    description: 'Tempo por percurso' },
  { key: 'coordination', label: 'Coordenação',   description: 'Sincronização de movimentos' },
  { key: 'breathing',    label: 'Respiração',    description: 'Ritmo e controlo respiratório' },
  { key: 'turns',        label: 'Viragens',      description: 'Rolamento e impulsão na parede' },
  { key: 'startDive',    label: 'Saída',         description: 'Arranque e mergulho inicial' },
] as const;

type MetricKey = typeof metrics[number]['key'];

function ScoreSlider({ label, description, value, onChange }: {
  label: string; description: string; value: number | null; onChange: (v: number) => void;
}) {
  const filled = value ?? 0;
  const color = filled >= 8 ? 'text-green-600' : filled >= 5 ? 'text-mastchieve-600' : 'text-red-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-800">{label}</span>
          <span className="text-xs text-gray-400 ml-2">{description}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onChange(Math.max(0, (value ?? 0) - 1))}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition">
            <ChevronDown className="w-4 h-4" />
          </button>
          <span className={cn('text-lg font-bold w-8 text-center tabular-nums', value == null ? 'text-gray-300' : color)}>
            {value ?? '—'}
          </span>
          <button onClick={() => onChange(Math.min(10, (value ?? 0) + 1))}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition">
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <button key={i}
            onClick={() => onChange(i + 1)}
            className={cn(
              'flex-1 h-2 rounded-full transition',
              value != null && i < value
                ? value >= 8 ? 'bg-green-400' : value >= 5 ? 'bg-mastchieve-500' : 'bg-red-400'
                : 'bg-gray-200 hover:bg-gray-300',
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface Props {
  studentId: string;
  studentName: string;
  sessionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PerformanceModal({ studentId, studentName, sessionId, onClose, onSuccess }: Props) {
  const [scores, setScores] = useState<Partial<Record<MetricKey, number>>>({});
  const [notes, setNotes] = useState('');

  const overall = (() => {
    const vals = Object.values(scores).filter((v): v is number => v != null);
    return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null;
  })();

  const overallColor = overall == null ? 'text-gray-300' : overall >= 8 ? 'text-green-600' : overall >= 5 ? 'text-mastchieve-600' : 'text-red-500';

  const mutation = useMutation({
    mutationFn: () => api.post('/feedback/performance', {
      studentId,
      ...(sessionId && { sessionId }),
      ...scores,
      instructorNotes: notes || undefined,
    }),
    onSuccess: () => { toast.success('Desempenho registado', 'O feedback IA será gerado em breve'); onSuccess(); },
    onError: () => toast.error('Erro ao registar desempenho'),
  });

  const hasAnyScore = Object.keys(scores).length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mastchieve-100 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-mastchieve-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Registar Desempenho</h2>
              <p className="text-xs text-gray-400">{studentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Overall preview */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Nota global (calculada automaticamente)</div>
            <div className={cn('text-3xl font-bold tabular-nums', overallColor)}>
              {overall ?? '—'}<span className="text-base text-gray-400">/10</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-4">
            {metrics.map(({ key, label, description }) => (
              <ScoreSlider
                key={key}
                label={label}
                description={description}
                value={scores[key] ?? null}
                onChange={(v) => setScores((s) => ({ ...s, [key]: v }))}
              />
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notas do instrutor <span className="text-xs text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500 resize-none"
              placeholder="Observações da sessão, comportamento, pontos específicos a trabalhar..."
            />
          </div>

          {/* AI info */}
          <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3">
            <Brain className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Após guardar, a IA da Mastchieve irá gerar automaticamente um feedback personalizado com base nestas métricas e no histórico do atleta.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!hasAnyScore || mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            <Brain className="w-4 h-4" />
            {mutation.isPending ? 'A guardar...' : 'Guardar e Gerar Feedback IA'}
          </button>
        </div>
      </div>
    </div>
  );
}
