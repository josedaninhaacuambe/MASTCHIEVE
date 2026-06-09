'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { timeAgo, getInitials, cn } from '@/lib/utils';
import {
  Brain, CheckCircle, Send, Eye, Filter, AlertCircle, RefreshCw,
  Plus, X, ChevronRight, ChevronLeft, User, Sliders, Lightbulb,
  ClipboardList, Waves, Star, Zap, Target, Flame, TrendingUp, ArrowUp,
  Check, Search, BookOpen, Award, Sparkles,
} from 'lucide-react';

// ─── Instruction library ─────────────────────────────────────────────────────

type ScoreLevel = 'low' | 'medium' | 'high';
type MetricKey = 'technique' | 'stamina' | 'speed' | 'coordination' | 'breathing' | 'turns' | 'startDive';

const METRICS: { key: MetricKey; label: string; icon: any; color: string; desc: string }[] = [
  { key: 'technique',    label: 'Técnica',     icon: Star,       color: 'text-blue-500 bg-blue-50 border-blue-200',    desc: 'Postura e movimento na água' },
  { key: 'stamina',      label: 'Resistência',  icon: Flame,      color: 'text-green-500 bg-green-50 border-green-200', desc: 'Capacidade de manter o ritmo' },
  { key: 'speed',        label: 'Velocidade',   icon: Zap,        color: 'text-amber-500 bg-amber-50 border-amber-200', desc: 'Rapidez e potência de nado' },
  { key: 'coordination', label: 'Coordenação',  icon: Target,     color: 'text-purple-500 bg-purple-50 border-purple-200', desc: 'Sincronização braços/pernas' },
  { key: 'breathing',    label: 'Respiração',   icon: Waves,      color: 'text-cyan-500 bg-cyan-50 border-cyan-200',   desc: 'Ritmo e eficiência respiratória' },
  { key: 'turns',        label: 'Viragens',     icon: TrendingUp, color: 'text-pink-500 bg-pink-50 border-pink-200',   desc: 'Qualidade das viragens' },
  { key: 'startDive',    label: 'Saída',        icon: ArrowUp,    color: 'text-indigo-500 bg-indigo-50 border-indigo-200', desc: 'Arranque e mergulho inicial' },
];

const INSTRUCTIONS: Record<MetricKey, Record<ScoreLevel, string[]>> = {
  technique: {
    low: [
      'Rever posição horizontal — manter o corpo alinhado e paralelo à superfície',
      'Corrigir entrada da mão — o cotovelo deve preceder os dedos',
      'Exercício de pernas com prancha: 4×25m focando batimento ritmado',
      'Corrigir posição da cabeça — olhar para o fundo, não para a frente',
      'Trabalhar o pull: maximizar propulsão em cada braçada',
    ],
    medium: [
      'Consolidar técnica de braçada — manter ritmo constante a velocidade moderada',
      'Praticar coordenação braços-respiração: 3×50m controlado',
      'Melhorar a fase de recuperação do braço — cotovelo alto saindo da água',
    ],
    high: [
      'Excelente técnica! Testar consistência em distâncias maiores',
      'Experimentar aumento de velocidade mantendo a forma correta',
    ],
  },
  stamina: {
    low: [
      'Aumentar distância gradualmente: começar com 4×25m, progredir para 4×50m',
      'Incluir treino aeróbico complementar (corrida leve 20 min)',
      'Rever eficiência respiratória — expirações mais completas economizam energia',
      'Introduzir pausas programadas com recuperação ativa entre séries',
    ],
    medium: [
      'Progredir para séries mais longas: 4×100m com 30s descanso',
      'Trabalhar pace constante — evitar arranques rápidos seguidos de abrandamento',
    ],
    high: [
      'Ótima resistência! Trabalhar intensidade — pace mais exigente',
      'Experimentar interval training com sprints curtos intercalados',
    ],
  },
  speed: {
    low: [
      'Treinar arranques: trabalhar a saída dos blocos 6×15m máximo',
      'Exercícios de velocidade máxima em distâncias curtas (4×10m)',
      'Melhorar deslize após viragem — pode ganhar 0.5s por comprimento',
      'Trabalhar a frequência de braçada — mais ciclos por segundo',
    ],
    medium: [
      'Trabalhar aceleração progressiva: início lento → meio rápido → final máximo',
      'Treino de velocidade específico: 6×25m com 1min descanso completo',
    ],
    high: [
      'Velocidade excelente! Manter consistência ao longo da distância completa',
      'Trabalhar manutenção de pace em ritmo de competição',
    ],
  },
  coordination: {
    low: [
      'Exercício de sincronização: nadar com um braço de cada vez, alternando',
      'Usar pull buoy para isolar e trabalhar coordenação de braços',
      'Treino de coordenação a seco — simular movimento de nado em terra',
      'Exercício de contagem: contar cada braçada, garantir ritmo regular',
    ],
    medium: [
      'Consolidar sincronização braços-pernas em ritmo moderado',
      'Praticar coordenação em 4×25m a velocidade controlada',
    ],
    high: ['Boa coordenação! Manter e testar em velocidades mais elevadas'],
  },
  breathing: {
    low: [
      'Praticar respiração lateral — o rosto gira, não levanta',
      'Exercício: 6×25m respirando de 3 em 3 braçadas',
      'Trabalhar expiração dentro de água — expirar pelo nariz, não segurar ar',
      'Praticar respiração bilateral (alternar lados)',
      'Exercício em pé: simular rotação de cabeça para respirar',
    ],
    medium: [
      'Consolidar padrão de respiração — consistência é chave',
      'Aumentar frequência respiratória em treinos de resistência',
    ],
    high: [
      'Ótima gestão de respiração! Experimentar padrões mais exigentes',
      'Tentar nado com menos respirações em distâncias curtas',
    ],
  },
  turns: {
    low: [
      'Praticar viragem carpada: rolar rápido, empurrar forte',
      'Treino específico de viragens: 8×50m focando qualidade das viragens',
      'Trabalhar distância de chegada — as bandeiras a 5m indicam momento de virar',
      'Fortalecer empurrão nas pernas após a viragem',
    ],
    medium: [
      'Otimizar tempo de viragem — cronometrar e tentar melhorar progressivamente',
      'Trabalhar deslize após empurrão — corpo aerodinâmico e alongado',
    ],
    high: ['Excelentes viragens! Manter qualidade em ritmo de competição'],
  },
  startDive: {
    low: [
      'Rever posição nos blocos — peso à frente, joelhos ligeiramente fletidos',
      'Treinar ângulo de entrada na água — nem muito plano nem a pique',
      'Praticar saídas repetidas: 6×15m focando exclusivamente no arranque',
      'Trabalhar deslize após entrada — manter corpo aerodinâmico subaquático',
    ],
    medium: [
      'Otimizar ângulo de entrada: entrada suave, quase sem salpicos',
      'Trabalhar transição do deslize para o nado — sem interrupção',
    ],
    high: [
      'Saída excelente! Um dos pontos fortes — manter esta qualidade',
      'Tentar maximizar distância de deslize subaquático após entrada',
    ],
  },
};

function scoreToLevel(score: number): ScoreLevel {
  if (score <= 5) return 'low';
  if (score <= 7) return 'medium';
  return 'high';
}

function levelColor(level: ScoreLevel) {
  return { low: 'bg-red-500', medium: 'bg-amber-500', high: 'bg-green-500' }[level];
}

// ─── Visual Rating Selector ───────────────────────────────────────────────────

const RATING_LEVELS = [
  { value: 2,  label: 'Insuficiente', emoji: '😞', bg: 'bg-red-50   hover:bg-red-100   border-red-200',    active: 'bg-red-500 text-white border-red-500' },
  { value: 4,  label: 'Fraco',        emoji: '😐', bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200', active: 'bg-orange-500 text-white border-orange-500' },
  { value: 6,  label: 'Médio',        emoji: '🙂', bg: 'bg-amber-50  hover:bg-amber-100  border-amber-200',  active: 'bg-amber-500 text-white border-amber-500' },
  { value: 8,  label: 'Bom',          emoji: '😊', bg: 'bg-green-50  hover:bg-green-100  border-green-200',  active: 'bg-green-500 text-white border-green-500' },
  { value: 10, label: 'Excelente',    emoji: '⭐', bg: 'bg-blue-50   hover:bg-blue-100   border-blue-200',   active: 'bg-blue-600 text-white border-blue-600' },
];

function MetricRater({ metric, value, onChange }: { metric: typeof METRICS[0]; value: number | null; onChange: (v: number) => void }) {
  const Icon = metric.icon;
  const [colorClass, bgClass, borderClass] = metric.color.split(' ');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center border', bgClass, borderClass)}>
          <Icon className={cn('w-3.5 h-3.5', colorClass)} />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{metric.label}</div>
          <div className="text-[10px] text-gray-400">{metric.desc}</div>
        </div>
        {value !== null && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', levelColor(scoreToLevel(value)))} />
            <span className="text-xs font-bold text-gray-700">{value}/10</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {RATING_LEVELS.map((lvl) => (
          <button
            key={lvl.value}
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

// ─── Performance Modal ────────────────────────────────────────────────────────

function PerformanceModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [ratings, setRatings] = useState<Partial<Record<MetricKey, number>>>({});
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [freeNotes, setFreeNotes] = useState('');

  const { data: studentsData } = useQuery({
    queryKey: ['students-for-feedback', studentSearch],
    queryFn: async () => {
      const params = studentSearch ? `?search=${encodeURIComponent(studentSearch)}&limit=20` : '?limit=30';
      const { data } = await api.get(`/students${params}`);
      return data;
    },
  });

  // Load student details to get active modules
  const { data: studentDetail } = useQuery({
    queryKey: ['student-detail-feedback', selectedStudent?.id],
    queryFn: async () => {
      const { data } = await api.get(`/students/${selectedStudent.id}`);
      return data.data;
    },
    enabled: !!selectedStudent?.id,
  });

  const students: any[] = studentsData?.data ?? [];
  const filteredStudents = students.filter((s) =>
    !studentSearch || `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()),
  );

  const ratedMetrics = METRICS.filter((m) => ratings[m.key] != null);
  const ratingCount = ratedMetrics.length;
  const canProceedToStep2 = !!selectedStudent && ratingCount >= 2;

  // Smart suggestions based on ratings
  const suggestions = useMemo(() => {
    const all: { key: MetricKey; label: string; level: ScoreLevel; items: string[] }[] = [];
    METRICS.forEach((m) => {
      const score = ratings[m.key];
      if (score == null) return;
      const level = scoreToLevel(score);
      const items = INSTRUCTIONS[m.key][level];
      if (items.length > 0) all.push({ key: m.key, label: m.label, level, items });
    });
    return all.sort((a, b) => {
      const order = { low: 0, medium: 1, high: 2 };
      return order[a.level] - order[b.level];
    });
  }, [ratings]);

  // Module skills
  const moduleSkills = useMemo(() => {
    if (!studentDetail?.progressRecords) return [];
    const active = studentDetail.progressRecords.filter((p: any) => p.status === 'IN_PROGRESS');
    const skills: string[] = [];
    active.forEach((p: any) => {
      try {
        const parsed = typeof p.module?.skills === 'string' ? JSON.parse(p.module.skills) : p.module?.skills ?? [];
        skills.push(...parsed.map((s: string) => `[${p.module?.name}] ${s}`));
      } catch {}
    });
    return skills;
  }, [studentDetail]);

  const toggleInstruction = useCallback((text: string) => {
    setSelectedInstructions((prev) =>
      prev.includes(text) ? prev.filter((i) => i !== text) : [...prev, text],
    );
  }, []);

  // Build final notes from selected instructions + free text
  const compiledNotes = useMemo(() => {
    const parts: string[] = [];
    if (selectedInstructions.length > 0) {
      parts.push('Instruções para o próximo treino:\n' + selectedInstructions.map((i) => `• ${i}`).join('\n'));
    }
    if (freeNotes.trim()) parts.push(freeNotes.trim());
    return parts.join('\n\n');
  }, [selectedInstructions, freeNotes]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const body: any = { studentId: selectedStudent.id };
      METRICS.forEach((m) => { if (ratings[m.key] != null) body[m.key] = ratings[m.key]; });
      if (compiledNotes) body.instructorNotes = compiledNotes;
      const { data } = await api.post('/feedback/performance', body);
      return data;
    },
    onSuccess: () => {
      toast.success('Avaliação registada! O feedback IA está a ser gerado.');
      qc.invalidateQueries({ queryKey: ['feedbacks'] });
      onClose();
    },
    onError: () => toast.error('Erro ao registar avaliação'),
  });

  const STEP_LABELS = ['Atleta', 'Avaliação', 'Instruções'];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92dvh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Nova Avaliação</h2>
              <p className="text-xs text-gray-500 mt-0.5">Passo {step} de 3 — {STEP_LABELS[step - 1]}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={cn(
                'h-1.5 rounded-full flex-1 transition-all duration-300',
                s <= step ? 'bg-mastchieve-600' : 'bg-gray-200',
              )} />
            ))}
          </div>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── Step 1: Student selection ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Pesquisar atleta</label>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Nome do atleta..."
                    className="bg-transparent text-sm outline-none flex-1"
                  />
                </div>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {filteredStudents.slice(0, 20).map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition text-left',
                      selectedStudent?.id === s.id
                        ? 'border-mastchieve-500 bg-mastchieve-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white',
                    )}
                  >
                    <div className="w-10 h-10 bg-mastchieve-100 rounded-xl flex items-center justify-center text-mastchieve-700 text-sm font-bold flex-shrink-0">
                      {getInitials(s.firstName, s.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900">{s.firstName} {s.lastName}</div>
                      <div className="text-xs text-gray-400 truncate">{s.enrollments?.[0]?.class?.name ?? 'Sem turma'}</div>
                    </div>
                    {selectedStudent?.id === s.id && (
                      <CheckCircle className="w-5 h-5 text-mastchieve-600 flex-shrink-0" />
                    )}
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
          )}

          {/* ── Step 2: Visual ratings ── */}
          {step === 2 && (
            <div className="space-y-5">
              {selectedStudent && (
                <div className="flex items-center gap-3 bg-mastchieve-50 rounded-2xl p-3 border border-mastchieve-100">
                  <div className="w-9 h-9 bg-mastchieve-600 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {getInitials(selectedStudent.firstName, selectedStudent.lastName)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-mastchieve-900">{selectedStudent.firstName} {selectedStudent.lastName}</div>
                    <div className="text-xs text-mastchieve-600">{selectedStudent.enrollments?.[0]?.class?.name ?? '—'}</div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-2 text-xs text-blue-700">
                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                Avalia cada competência. As instruções são geradas automaticamente com base nas notas baixas.
              </div>

              {/* Active modules info */}
              {studentDetail?.progressRecords?.some((p: any) => p.status === 'IN_PROGRESS') && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500 mr-1">Módulos ativos:</span>
                  {studentDetail.progressRecords.filter((p: any) => p.status === 'IN_PROGRESS').map((p: any) => (
                    <span key={p.id} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-medium">
                      <BookOpen className="w-2.5 h-2.5 inline mr-1" />{p.module?.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {METRICS.map((m) => (
                  <MetricRater
                    key={m.key}
                    metric={m}
                    value={ratings[m.key] ?? null}
                    onChange={(v) => setRatings((prev) => ({ ...prev, [m.key]: v }))}
                  />
                ))}
              </div>

              {ratingCount < 2 && (
                <div className="text-center text-xs text-gray-400 pt-2">
                  Avalia pelo menos 2 competências para continuar
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Instruction selection ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 flex items-start gap-2 text-xs text-violet-700">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-violet-500" />
                Seleciona as instruções que o atleta deve seguir. As que estão selecionadas aparecem no feedback.
              </div>

              {/* Module-specific skills */}
              {moduleSkills.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Competências do módulo</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {moduleSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleInstruction(`Trabalhar: ${skill}`)}
                        className={cn(
                          'text-xs px-2.5 py-1.5 rounded-xl border font-medium transition',
                          selectedInstructions.includes(`Trabalhar: ${skill}`)
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50',
                        )}
                      >
                        {selectedInstructions.includes(`Trabalhar: ${skill}`) && <Check className="w-2.5 h-2.5 inline mr-1" />}
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart suggestions by metric */}
              {suggestions.map((group) => {
                const metric = METRICS.find((m) => m.key === group.key)!;
                const Icon = metric.icon;
                const [colorClass, bgClass, borderClass] = metric.color.split(' ');
                const levelColors = { low: 'text-red-600 bg-red-50 border-red-200', medium: 'text-amber-600 bg-amber-50 border-amber-200', high: 'text-green-600 bg-green-50 border-green-200' };
                const levelLabels = { low: 'Precisa melhorar', medium: 'A consolidar', high: 'Bom nível' };

                return (
                  <div key={group.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center border', bgClass, borderClass)}>
                        <Icon className={cn('w-3 h-3', colorClass)} />
                      </div>
                      <span className="text-xs font-bold text-gray-700">{group.label}</span>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border ml-auto', levelColors[group.level])}>
                        {levelLabels[group.level]}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => toggleInstruction(item)}
                          className={cn(
                            'w-full text-left text-xs px-3 py-2.5 rounded-xl border transition flex items-start gap-2',
                            selectedInstructions.includes(item)
                              ? 'bg-mastchieve-50 border-mastchieve-300 text-mastchieve-800'
                              : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300',
                          )}
                        >
                          <div className={cn(
                            'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition',
                            selectedInstructions.includes(item)
                              ? 'bg-mastchieve-600 border-mastchieve-600'
                              : 'border-gray-300',
                          )}>
                            {selectedInstructions.includes(item) && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="leading-snug">{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {suggestions.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  Excelente avaliação! Sem pontos críticos a trabalhar.
                </div>
              )}

              {/* Free text notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  <ClipboardList className="w-3.5 h-3.5 inline mr-1" />
                  Notas adicionais (opcional)
                </label>
                <textarea
                  value={freeNotes}
                  onChange={(e) => setFreeNotes(e.target.value)}
                  rows={3}
                  placeholder="Observações livres, contexto da sessão..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-mastchieve-300 focus:border-mastchieve-400 transition"
                />
              </div>

              {/* Preview */}
              {(selectedInstructions.length > 0 || freeNotes) && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Pré-visualização do feedback
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 rounded-2xl p-4 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                    {compiledNotes || '—'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {selectedInstructions.length} instrução{selectedInstructions.length !== 1 ? 'ões' : ''} selecionada{selectedInstructions.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0 flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 ? !selectedStudent : step === 2 ? !canProceedToStep2 : false}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mastchieve-600 hover:bg-mastchieve-700 text-white text-sm font-semibold disabled:opacity-40 transition"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mastchieve-600 hover:bg-mastchieve-700 text-white text-sm font-semibold disabled:opacity-60 transition"
            >
              <Brain className="w-4 h-4" />
              {submitMutation.isPending ? 'A registar...' : 'Registar & Gerar IA'}
            </button>
          )}
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
      <div className="grid grid-cols-4 gap-3">
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

      {/* Performance modal */}
      {showModal && <PerformanceModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
