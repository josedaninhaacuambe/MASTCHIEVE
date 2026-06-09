'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn, timeAgo } from '@/lib/utils';
import {
  Brain, ChevronDown, ChevronUp, Star, Clock, CheckCircle,
  Send, Sparkles, Play, ExternalLink, Timer, RotateCcw,
  Check, Dumbbell, Youtube, MessageSquare, BookOpen,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /embed\/([^?&#]+)/,
    /shorts\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── Exercise timer ──────────────────────────────────────────────────────────

function ExerciseTimer({ durationMinutes }: { durationMinutes: number }) {
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setRemaining((s) => {
          if (s <= 1) { clearInterval(ref.current!); setRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  const reset = useCallback(() => { setRunning(false); setRemaining(totalSeconds); }, [totalSeconds]);
  const pct = Math.round(((totalSeconds - remaining) / totalSeconds) * 100);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const done = remaining === 0;

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E7EB" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            stroke={done ? '#10b981' : '#1A56DB'} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${pct * 87.96 / 100} 87.96`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done
            ? <Check className="w-4 h-4 text-green-500" />
            : <Timer className="w-3 h-3 text-mastchieve-600" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn('text-base font-bold tabular-nums', done ? 'text-green-600' : 'text-gray-800')}>
          {done ? 'Concluído!' : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
        </div>
        <div className="text-xs text-gray-400">{durationMinutes} min</div>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => setRunning((v) => !v)}
          disabled={done}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-white transition',
            running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-mastchieve-600 hover:bg-mastchieve-700',
            done && 'opacity-40 cursor-not-allowed',
          )}
        >
          {running
            ? <span className="w-2.5 h-2.5 border-2 border-white rounded-sm" />
            : <Play className="w-3 h-3 fill-white" />}
        </button>
        <button onClick={reset} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition">
          <RotateCcw className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    </div>
  );
}

// ─── Lesson card ──────────────────────────────────────────────────────────────

function LessonCard({ lesson, index }: { lesson: any; index: number }) {
  const [imgError, setImgError] = useState(false);
  const videoId = extractYoutubeId(lesson.url);
  const thumbnailUrl = videoId && !imgError ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  const isYoutube = !!videoId;

  return (
    <a
      href={lesson.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-mastchieve-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 relative bg-gray-100">
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={lesson.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center shadow">
                <Play className="w-3 h-3 fill-white text-white ml-0.5" />
              </div>
            </div>
            {/* Duration badge */}
            {lesson.duration && (
              <span className="absolute bottom-1 right-1 text-[10px] font-bold text-white bg-black/70 px-1 rounded">
                {lesson.duration}
              </span>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            {isYoutube
              ? <Youtube className="w-5 h-5 text-red-500" />
              : <BookOpen className="w-5 h-5 text-mastchieve-400" />}
            {lesson.duration && <span className="text-[9px] text-gray-400">{lesson.duration}</span>}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-mastchieve-600 transition">
            {lesson.title || `Aula recomendada ${index + 1}`}
          </h4>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5 group-hover:text-mastchieve-500 transition" />
        </div>
        {lesson.why && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{lesson.why}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          {isYoutube && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              <Youtube className="w-2.5 h-2.5" /> YouTube
            </span>
          )}
          {lesson.duration && !thumbnailUrl && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> {lesson.duration}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// ─── Exercise card ────────────────────────────────────────────────────────────

function ExerciseCard({ exercise, fbId, index }: { exercise: any; fbId: string; index: number }) {
  const key = `ex-done-${fbId}-${index}`;
  const [done, setDone] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(key) === '1';
    return false;
  });

  const toggle = () => {
    const next = !done;
    setDone(next);
    localStorage.setItem(key, next ? '1' : '0');
  };

  return (
    <div className={cn(
      'rounded-xl border-2 p-4 transition-all duration-200',
      done
        ? 'border-green-200 bg-green-50/50'
        : 'border-gray-100 bg-white hover:border-mastchieve-100',
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={toggle}
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200',
            done
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-mastchieve-400',
          )}
        >
          {done && <Check className="w-3.5 h-3.5 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn('text-sm font-bold leading-tight', done ? 'line-through text-gray-400' : 'text-gray-900')}>
              {exercise.name || `Exercício ${index + 1}`}
            </h4>
            {done && (
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                Feito!
              </span>
            )}
          </div>

          {/* Sets / Reps / Duration chips */}
          <div className="flex flex-wrap gap-2 mt-2">
            {exercise.sets > 0 && (
              <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1">
                <Dumbbell className="w-3 h-3 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700">{exercise.sets} séries</span>
              </div>
            )}
            {exercise.reps > 0 && (
              <div className="flex items-center gap-1 bg-violet-50 border border-violet-100 rounded-lg px-2 py-1">
                <RotateCcw className="w-3 h-3 text-violet-500" />
                <span className="text-xs font-semibold text-violet-700">{exercise.reps} rep.</span>
              </div>
            )}
            {exercise.durationMinutes > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                <Timer className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">{exercise.durationMinutes} min</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {exercise.description && (
        <p className={cn('text-sm leading-relaxed mt-3 ml-9', done ? 'text-gray-400' : 'text-gray-600')}>
          {exercise.description}
        </p>
      )}
      {exercise.notes && (
        <div className="ml-9 mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          <Star className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 fill-amber-400 text-amber-400" />
          <span>{exercise.notes}</span>
        </div>
      )}

      {/* Timer */}
      {exercise.durationMinutes > 0 && !done && (
        <div className="ml-9 mt-3 border-t border-gray-100 pt-3">
          <ExerciseTimer durationMinutes={exercise.durationMinutes} />
        </div>
      )}
    </div>
  );
}

// ─── Feedback card ────────────────────────────────────────────────────────────

const statusCfg: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:   { label: 'Pendente',  color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: Clock },
  GENERATED: { label: 'Gerado',   color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: Sparkles },
  REVIEWED:  { label: 'Revisto',  color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Star },
  SENT:      { label: 'Recebido', color: 'bg-green-100 text-green-700 border-green-200',    icon: CheckCircle },
};

type Tab = 'feedback' | 'aulas' | 'exercicios';

function FeedbackCard({ fb }: { fb: any }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>('feedback');

  const cfg = statusCfg[fb.status] ?? statusCfg.PENDING;
  const Icon = cfg.icon;
  const text = fb.finalText || fb.aiGeneratedText;
  const confidence = fb.aiConfidenceScore ? Math.round(fb.aiConfidenceScore * 100) : null;
  const lessons: any[] = Array.isArray(fb.recommendedLessons) ? fb.recommendedLessons : [];
  const exercises: any[] = Array.isArray(fb.interactiveExercises) ? fb.interactiveExercises : [];
  const hasLessons = lessons.length > 0;
  const hasExercises = exercises.length > 0;
  const hasExtras = hasLessons || hasExercises;

  const tabs: { id: Tab; label: string; icon: any; count?: number; show: boolean }[] = ([
    { id: 'feedback' as Tab,   label: 'Feedback IA', icon: MessageSquare, show: true },
    { id: 'aulas' as Tab,      label: 'Aulas',        icon: Youtube,       count: lessons.length,   show: hasLessons },
    { id: 'exercicios' as Tab, label: 'Exercícios',   icon: Dumbbell,      count: exercises.length, show: hasExercises },
  ] as const).filter((t) => t.show) as { id: Tab; label: string; icon: any; count?: number; show: boolean }[];

  return (
    <div className={cn(
      'bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden',
      expanded ? 'border-mastchieve-200 shadow-lg shadow-mastchieve-100/50' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm',
    )}>
      {/* Header — always visible */}
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-start gap-3 p-4 md:p-5 text-left">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5', cfg.color)}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', cfg.color)}>
              {cfg.label}
            </span>
            {confidence !== null && (
              <span className="text-xs text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">
                IA {confidence}%
              </span>
            )}
            {hasLessons && (
              <span className="text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Youtube className="w-2.5 h-2.5" /> {lessons.length} aulas
              </span>
            )}
            {hasExercises && (
              <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Dumbbell className="w-2.5 h-2.5" /> {exercises.length} exercícios
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{timeAgo(fb.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">
            {text || 'A aguardar geração do feedback pela IA...'}
          </p>
        </div>

        <span className="flex-shrink-0 mt-1.5 text-gray-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Tabs */}
          {hasExtras && (
            <div className="flex border-b border-gray-100 px-4 md:px-5 bg-gray-50/50">
              {tabs.map((t) => {
                const TIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all -mb-px',
                      tab === t.id
                        ? 'border-mastchieve-600 text-mastchieve-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700',
                    )}
                  >
                    <TIcon className="w-3.5 h-3.5" />
                    {t.label}
                    {t.count !== undefined && t.count > 0 && (
                      <span className={cn(
                        'min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1',
                        tab === t.id ? 'bg-mastchieve-600 text-white' : 'bg-gray-200 text-gray-600',
                      )}>
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-4 md:p-5">
            {/* ── Tab: Feedback ── */}
            {tab === 'feedback' && (
              <div className="space-y-4">
                {text ? (
                  <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-blue-100">
                    {text}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Feedback ainda a ser gerado pela IA...
                  </div>
                )}
                {fb.sentToStudentAt && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
                    <Send className="w-3.5 h-3.5" />
                    Enviado em {new Date(fb.sentToStudentAt).toLocaleDateString('pt-PT')}
                  </div>
                )}
                {/* Quick navigation to other tabs */}
                {hasExtras && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {hasLessons && (
                      <button
                        onClick={() => setTab('aulas')}
                        className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition text-left"
                      >
                        <Youtube className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-red-800">{lessons.length} Aulas</div>
                          <div className="text-[10px] text-red-600">Ver vídeos recomendados</div>
                        </div>
                      </button>
                    )}
                    {hasExercises && (
                      <button
                        onClick={() => setTab('exercicios')}
                        className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition text-left"
                      >
                        <Dumbbell className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-blue-800">{exercises.length} Exercícios</div>
                          <div className="text-[10px] text-blue-600">Praticar e melhorar</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Aulas ── */}
            {tab === 'aulas' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                  Vídeos selecionados pela IA para ajudar na tua evolução
                </p>
                {lessons.map((lesson: any, i: number) => (
                  <LessonCard key={i} lesson={lesson} index={i} />
                ))}
              </div>
            )}

            {/* ── Tab: Exercícios ── */}
            {tab === 'exercicios' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-blue-500" />
                    Exercícios práticos para melhorar o teu desempenho
                  </p>
                  <span className="text-xs text-gray-400">
                    {exercises.filter((_: any, i: number) => {
                      if (typeof window !== 'undefined') {
                        return localStorage.getItem(`ex-done-${fb.id}-${i}`) === '1';
                      }
                      return false;
                    }).length}/{exercises.length} feitos
                  </span>
                </div>
                {exercises.map((ex: any, i: number) => (
                  <ExerciseCard key={i} exercise={ex} fbId={fb.id} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentFeedbackPage() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-feedbacks', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/feedback/me${params}`);
      return data;
    },
  });

  const feedbacks = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const sent = feedbacks.filter((f: any) => f.status === 'SENT').length;
  const withContent = feedbacks.filter((f: any) => f.aiGeneratedText || f.finalText).length;
  const withLessons = feedbacks.filter((f: any) => Array.isArray(f.recommendedLessons) && f.recommendedLessons.length > 0).length;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Os Meus Feedbacks IA</h1>
        <p className="text-gray-500 text-sm mt-1">Relatórios, aulas e exercícios gerados pela inteligência artificial Mastchieve</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {[
          { label: 'Total',      value: total,       color: 'text-gray-900 bg-white',         border: 'border-gray-100' },
          { label: 'Recebidos',  value: sent,         color: 'text-green-700 bg-green-50',     border: 'border-green-100' },
          { label: 'Com Aulas',  value: withLessons,  color: 'text-red-700 bg-red-50',         border: 'border-red-100' },
          { label: 'Completos',  value: withContent,  color: 'text-violet-700 bg-violet-50',   border: 'border-violet-100' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-2xl p-3 md:p-4 text-center border', s.color, s.border)}>
            <div className="text-xl md:text-2xl font-bold">{s.value}</div>
            <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Todos' },
          ...Object.entries(statusCfg).map(([k, v]) => ({ value: k, label: v.label })),
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full font-medium transition border',
              statusFilter === f.value
                ? 'bg-mastchieve-600 text-white border-mastchieve-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-mastchieve-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* AI explanation banner */}
      <div className="flex items-start gap-3 bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 rounded-2xl p-4">
        <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-violet-900">Como funciona o Feedback IA?</div>
          <p className="text-xs text-violet-700 mt-0.5 leading-relaxed">
            Após cada avaliação, a IA Mastchieve analisa o teu desempenho e gera um relatório personalizado
            com <strong>feedback técnico</strong>, <strong>aulas em vídeo</strong> recomendadas e <strong>exercícios interativos</strong> para melhorar.
          </p>
        </div>
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-5 bg-gray-200 rounded-full w-20" />
                    <div className="h-5 bg-gray-200 rounded-full w-16" />
                  </div>
                  <div className="h-3.5 bg-gray-100 rounded w-full" />
                  <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))
          : feedbacks.map((fb: any) => <FeedbackCard key={fb.id} fb={fb} />)
        }

        {!isLoading && feedbacks.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum feedback encontrado</p>
            <p className="text-xs mt-1 text-gray-400">Os feedbacks são gerados automaticamente após cada avaliação</p>
          </div>
        )}
      </div>
    </div>
  );
}
