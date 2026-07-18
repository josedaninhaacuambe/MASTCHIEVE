'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { getInitials, formatDate, cn } from '@/lib/utils';
import {
  Dumbbell, Plus, X, Search, Brain, Target, ChevronDown, ChevronUp,
  Calendar, Clock, RefreshCw, CheckCircle, Loader2, Sparkles,
  Users, BookOpen, Star, Zap, LayoutGrid, Fish, Printer,
} from 'lucide-react';

function printPlan(plan: any, objectives: any[], exercises: any[]) {
  const nomeAluno = plan.student ? `${plan.student.firstName} ${plan.student.lastName}` : '—';
  const exRows = exercises.map((ex: any, i: number) => `
    <tr style="background:${i%2===0?'#fff':'#f9fafb'}">
      <td style="padding:8px 12px;font-weight:600">${i+1}. ${ex.name}</td>
      <td style="padding:8px 12px">${ex.description||''}</td>
      <td style="padding:8px 12px;text-align:center">${ex.duration||'—'}</td>
      <td style="padding:8px 12px;text-align:center">${ex.sets||'—'}</td>
      <td style="padding:8px 12px;text-align:center">${ex.reps||'—'}</td>
    </tr>`).join('');
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plano — ${plan.title}</title>
<style>
  body{margin:0;font-family:Arial,sans-serif;color:#111}
  .header{background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px;color:#fff}
  .header h1{margin:0 0 4px;font-size:22px}
  .header p{margin:0;opacity:.8;font-size:13px}
  .body{padding:32px}
  h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin:24px 0 8px}
  ul{margin:0 0 0 20px;padding:0}
  li{margin:4px 0;font-size:13px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#f3f4f6;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280}
  .footer{border-top:1px solid #e5e7eb;padding:16px 32px;font-size:11px;color:#9ca3af}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <h1>${plan.title}</h1>
  <p>Atleta: ${nomeAluno} · ${plan.aiGenerated?'Gerado por IA':'Manual'}</p>
</div>
<div class="body">
  ${plan.description?`<p style="color:#374151;font-size:14px">${plan.description}</p>`:''}
  ${objectives.length?`<h2>Objetivos</h2><ul>${objectives.map((o:string)=>`<li>${o}</li>`).join('')}</ul>`:''}
  ${exercises.length?`<h2>Exercícios</h2><table><thead><tr><th>Exercício</th><th>Descrição</th><th>Duração</th><th>Séries</th><th>Reps</th></tr></thead><tbody>${exRows}</tbody></table>`:''}
</div>
<div class="footer">Mastchieve · mastchieve@gmail.com · Gerado em ${new Date().toLocaleDateString('pt-PT')}</div>
<script>window.onload=()=>window.print()<\/script>
</body></html>`);
  w.document.close();
}

// ─── Templates de Plano de Aula (Padrão por Módulo) ─────────────────────────

const PARTES_AULA = ['Aquecimento em Seco', 'Aquecimento H₂O', 'Parte Principal', 'Habilidades / Segurança', 'Relaxamento'];

const TEMPLATES_MODULO = [
  {
    nivel: 'AMA',
    nome: 'AMA — Adaptação ao Meio Aquático',
    fases: 'Estrela-do-Mar · Cavalo-Marinho · Polvo',
    objetivo: 'Desenvolver conforto no meio aquático, controlo respiratório, flutuação e primeiros deslizes',
    competencias: [
      'Respiração ventral com maior controlo',
      'Flutuação ventral, dorsal e vertical',
      'Deslizes em alinhamento ventral e dorsal',
      'Transição ventral ↔ dorsal',
      'Flutuação vertical independente',
    ],
    cor: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  {
    nivel: 'INTERMEDIARIO',
    nome: 'Intermédio — Autonomia Aquática e Eficiência Corporal',
    fases: 'Tartaruga · Dugongo · Crocodilo',
    objetivo: 'Desenvolver consciência espacial, deslocamento hidrodinâmico, sculling e pernadas simétricas',
    competencias: [
      'Respiração ventral e lateral coordenada',
      'Sculling – sustentação e propulsão',
      'Deslocamento ventral, dorsal e lateral em alinhamento',
      'Pernada contínua alternada',
      'Introdução às pernadas simétricas (bruços e mariposa)',
    ],
    cor: 'from-purple-500 to-violet-500',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
  },
  {
    nivel: 'AVANCADO',
    nome: 'Avançado — Eficiência Técnica de Nado',
    fases: 'Tubarão · Marlim · Golfinho',
    objetivo: 'Desenvolver fundamentos das técnicas de nado: posição do corpo, respiração, propulsão e coordenação motora',
    competencias: [
      'Posição hidrodinâmica aplicada às técnicas de nado',
      'Técnicas alternadas: origem da pernada & pernada contínua',
      'Técnicas simultâneas: movimentos simétricos',
      'Mergulhos e viragens',
      'Respiração lateral e ventral aplicada ao nado',
      'Sculling aplicado às braçadas',
    ],
    cor: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
];

const DIAS_SEMANA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];

function TemplatesModulo() {
  const [openModulo, setOpenModulo] = useState<string | null>('AMA');

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>Plano de Aula Padrão</strong> — modelo base por módulo. O instrutor preenche o "Objetivo da Semana" e adapta
        os exercícios de cada parte. Atletas com limitações físicas ou necessidades especiais recebem adaptações individuais.
        A IA distribui o plano conforme o pacote de frequência contratado (2, 3 ou 6 dias/semana).
      </div>

      {TEMPLATES_MODULO.map(tmpl => (
        <div key={tmpl.nivel} className={`rounded-2xl border ${tmpl.border} overflow-hidden`}>
          <button
            onClick={() => setOpenModulo(openModulo === tmpl.nivel ? null : tmpl.nivel)}
            className={`w-full flex items-center justify-between p-5 text-left ${tmpl.bg} hover:opacity-90 transition`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tmpl.cor} flex items-center justify-center flex-shrink-0`}>
                <Fish className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`text-sm font-bold ${tmpl.text}`}>{tmpl.nome}</p>
                <p className="text-xs text-gray-500 mt-0.5">Fases: {tmpl.fases}</p>
              </div>
            </div>
            {openModulo === tmpl.nivel
              ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          </button>

          {openModulo === tmpl.nivel && (
            <div className="p-5 space-y-5 bg-white">
              {/* Module info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Objetivo do Módulo</p>
                  <p className="text-sm text-gray-700">{tmpl.objetivo}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Competências-chave</p>
                  <ul className="space-y-1">
                    {tmpl.competencias.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 bg-gradient-to-br ${tmpl.cor}`} />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Objetivo da Semana */}
              <div className={`${tmpl.bg} border ${tmpl.border} rounded-xl p-3`}>
                <p className={`text-xs font-semibold ${tmpl.text} mb-1`}>Objetivo da Semana (preenchido pelo instrutor)</p>
                <div className="h-6 border-b border-dashed border-gray-300 w-full" />
              </div>

              {/* Weekly grid */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Grelha Semanal</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 w-40">Parte da Aula</th>
                        {DIAS_SEMANA.map(d => (
                          <th key={d} className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-600">{d}</th>
                        ))}
                        <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-600 w-16">Tempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PARTES_AULA.map((parte, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="border border-gray-200 px-3 py-3 font-medium text-gray-700 align-top">{parte}</td>
                          {DIAS_SEMANA.map(d => (
                            <td key={d} className="border border-gray-200 px-2 py-3 text-gray-300 text-center align-top">
                              <span className="text-[10px]">— exercício —</span>
                            </td>
                          ))}
                          <td className="border border-gray-200 px-2 py-3 text-gray-300 text-center">—</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-semibold">
                        <td className="border border-gray-200 px-3 py-2 text-gray-700">Total</td>
                        {DIAS_SEMANA.map(d => (
                          <td key={d} className="border border-gray-200 px-2 py-2 text-center text-gray-400">—</td>
                        ))}
                        <td className="border border-gray-200 px-2 py-2 text-center text-gray-400">50 min</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Rodapé: Mastchieve Serviços, EI · Rua do Capelo, 109, 3º andar · +258 84 1058312 · mastchieve@gmail.com · NUIT: 105522126
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <button onClick={() => printPlan(plan, objectives, exercises)} title="Imprimir plano" className="p-1.5 rounded-lg hover:bg-white/20 transition">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
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
  const [tab, setTab] = useState<'plans' | 'templates'>('plans');
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
          <p className="text-gray-500 text-sm mt-1">Planos por atleta gerados por IA + templates de plano de aula por módulo</p>
        </div>
        {tab === 'plans' && (
          <button onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
            <Sparkles className="w-4 h-4" /> Gerar com IA
          </button>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('plans')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
            tab === 'plans' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
          <Sparkles className="w-4 h-4" /> Planos por Atleta (IA)
        </button>
        <button onClick={() => setTab('templates')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
            tab === 'templates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
          <LayoutGrid className="w-4 h-4" /> Templates por Módulo
        </button>
      </div>

      {tab === 'templates' && <TemplatesModulo />}

      {tab === 'plans' && (
        <>
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
        </>
      )}
    </div>
  );
}
