'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { X, Brain, CheckCircle2, XCircle, Sparkles, BookOpen } from 'lucide-react';

// Critérios são dinâmicos (vêm do módulo ativo do aluno), escala 1-5 — sugestões
// genéricas por nível em vez do antigo dicionário fixo por métrica.
const SUGESTOES: Record<'low' | 'medium' | 'high', (nome: string) => string> = {
  low: (nome) => `Precisa de trabalho dedicado em "${nome}" — reforçar nos próximos treinos`,
  medium: (nome) => `"${nome}" em consolidação — praticar com regularidade`,
  high: (nome) => `Bom nível em "${nome}" — manter e desafiar com exercícios mais exigentes`,
};

function nivelDoValor(valor: number): 'low' | 'medium' | 'high' {
  if (valor <= 2) return 'low';
  if (valor === 3) return 'medium';
  return 'high';
}

const RATING_LEVELS = [
  { value: 1, label: 'Insuficiente', emoji: '😞', bg: 'bg-red-50 hover:bg-red-100 border-red-200', active: 'bg-red-500 text-white border-red-500' },
  { value: 2, label: 'Fraco', emoji: '😐', bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200', active: 'bg-orange-500 text-white border-orange-500' },
  { value: 3, label: 'Médio', emoji: '🙂', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200', active: 'bg-amber-500 text-white border-amber-500' },
  { value: 4, label: 'Bom', emoji: '😊', bg: 'bg-green-50 hover:bg-green-100 border-green-200', active: 'bg-green-500 text-white border-green-500' },
  { value: 5, label: 'Excelente', emoji: '⭐', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200', active: 'bg-blue-600 text-white border-blue-600' },
];

interface Criterio {
  nome: string;
  obrigatoria: boolean;
}

function CriterioRater({ criterio, value, onChange }: {
  criterio: Criterio; value: number | null; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{criterio.nome}</span>
        {criterio.obrigatoria && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Obrigatória</span>
        )}
        {value != null && (
          <span className="ml-auto text-xs font-bold text-gray-700">{value}/5</span>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {RATING_LEVELS.map((lvl) => (
          <button
            key={lvl.value}
            type="button"
            onClick={() => onChange(lvl.value)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border text-center transition-all duration-150',
              value === lvl.value ? lvl.active : lvl.bg,
            )}
          >
            <span className="text-lg leading-none">{lvl.emoji}</span>
            <span className={cn('text-[9px] font-semibold leading-tight', value === lvl.value ? 'text-white' : 'text-gray-600')}>
              {lvl.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  tipo: 'DIARIA' | 'AGENDADA';
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSuccess: () => void;
  // AGENDADA: contexto da sessão agendada + módulo já carregado pelo roster
  sessaoAgendadaId?: string;
  moduloAtivo?: { id: string; nome: string; nivel: string; ordem: number };
  // DIARIA: contexto opcional da aula (para ligar o feedback à sessão)
  classSessionId?: string;
}

export default function AvaliacaoModal({
  tipo, studentId, studentName, onClose, onSuccess, sessaoAgendadaId, moduloAtivo: moduloAtivoProp, classSessionId,
}: Props) {
  const qc = useQueryClient();
  const [scores, setScores] = useState<Record<number, number>>({});
  const [observacoes, setObservacoes] = useState('');
  const [resultado, setResultado] = useState<{ aprovado: boolean; motivoReprovacao?: string } | null>(null);

  // Se o módulo ativo já vier por prop (fluxo AGENDADA, carregado pelo roster), não refaz o pedido.
  const { data, isLoading, error } = useQuery({
    queryKey: ['modulo-ativo', studentId],
    queryFn: async () => {
      const { data } = await api.get(`/avaliacoes/modulo-ativo/${studentId}`);
      return data.data ?? data;
    },
    enabled: !moduloAtivoProp,
  });

  const moduloAtivo = moduloAtivoProp ?? data?.moduloAtivo;
  const criterios: Criterio[] = data?.criterios ?? [];
  const totalMinimo: number = data?.totalMinimo ?? 0;

  const soma = Object.values(scores).reduce((a, b) => a + b, 0);
  const allScored = criterios.length > 0 && criterios.every((_, i) => scores[i] != null);

  const sugestoes = useMemo(() => {
    return criterios
      .map((c, i) => ({ criterio: c, valor: scores[i] }))
      .filter((s): s is { criterio: Criterio; valor: number } => s.valor != null && s.valor <= 3)
      .map(({ criterio, valor }) => SUGESTOES[nivelDoValor(valor)](criterio.nome));
  }, [criterios, scores]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/avaliacoes', {
        tipo,
        studentId,
        sessaoAgendadaId: tipo === 'AGENDADA' ? sessaoAgendadaId : undefined,
        classSessionId: tipo === 'DIARIA' ? classSessionId : undefined,
        avaliacoes: criterios.map((_, i) => ({ criterioIndex: i, valor: scores[i] })),
        observacoes: observacoes.trim() || undefined,
      });
      return data.data ?? data;
    },
    onSuccess: (res) => {
      if (tipo === 'AGENDADA') {
        setResultado({ aprovado: res.aprovado, motivoReprovacao: res.motivoReprovacao });
      } else {
        toast.success('Avaliação registada', 'O feedback IA será gerado em breve');
        qc.invalidateQueries({ queryKey: ['feedbacks'] });
        onSuccess();
        onClose();
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao registar avaliação'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {tipo === 'AGENDADA' ? `Avaliar ${studentName}` : 'Registar Avaliação Diária'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {tipo === 'DIARIA' && `${studentName} — `}
              {moduloAtivo ? `${moduloAtivo.nome} — Fase ${moduloAtivo.ordem} (${moduloAtivo.nivel})` : '—'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {resultado ? (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            {resultado.aprovado ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <p className="text-lg font-bold text-green-700">Aprovado</p>
                <p className="text-sm text-gray-500">O atleta transitou para o próximo módulo.</p>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 text-red-500" />
                <p className="text-lg font-bold text-red-700">Reprovado</p>
                <p className="text-sm text-gray-500">{resultado.motivoReprovacao}</p>
              </>
            )}
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="mt-2 w-full bg-mastchieve-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-mastchieve-700"
            >
              Fechar
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-6 text-center text-gray-400">A carregar...</div>
        ) : error || criterios.length === 0 ? (
          <div className="p-6 text-center text-sm text-red-600">
            {(error as any)?.response?.data?.message || 'Aluno não tem módulo em progresso para avaliar'}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {tipo === 'DIARIA' && (
                <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3">
                  <Brain className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Avalia os critérios do módulo atual do atleta. Esta avaliação não aprova nem reprova — serve para gerar o feedback IA da aula.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {criterios.map((c, i) => (
                  <CriterioRater
                    key={i}
                    criterio={c}
                    value={scores[i] ?? null}
                    onChange={(v) => setScores((s) => ({ ...s, [i]: v }))}
                  />
                ))}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">Soma corrente</span>
                <span className="font-bold text-gray-900">{soma} / {totalMinimo} mín.</span>
              </div>

              {sugestoes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Sugestões</span>
                  </div>
                  <div className="space-y-1.5">
                    {sugestoes.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl border border-gray-100 bg-white text-gray-700">
                        <BookOpen className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Observações <span className="text-xs text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500 resize-none"
                  placeholder="Observações da sessão, comportamento, pontos específicos a trabalhar..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={!allScored || mutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {tipo === 'DIARIA' && <Brain className="w-4 h-4" />}
                {mutation.isPending ? 'A registar...' : tipo === 'DIARIA' ? 'Guardar e Gerar Feedback IA' : 'Registar Avaliação'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
