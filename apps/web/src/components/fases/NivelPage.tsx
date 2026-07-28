'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Award, CheckCircle2, ChevronDown, ChevronRight,
  UserPlus, X, Search, Loader2, Trophy, Users, TrendingUp,
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  avatarUrl?: string | null;
}

interface Avaliacao {
  criterioIndex: number;
  valor: number;
  observacao?: string | null;
}

interface StudentFase {
  id: string;
  studentId: string;
  faseId: string;
  estado: 'NAO_INICIADO' | 'EM_PROGRESSO' | 'CONCLUIDO';
  notas?: string | null;
  iniciadoEm?: string | null;
  concluidoEm?: string | null;
  student: Student;
  avaliacoes?: Avaliacao[];
}

interface Criterio {
  nome: string;
  obrigatoria: boolean;
}

interface Fase {
  id: string;
  ordem: number;
  nome: string;
  foco?: string;
  escala: string;
  criterios: string;
  totalMinimo: number;
  assiduidade: number;
  studentFases: StudentFase[];
}

export interface NivelConfig {
  nivel: 'AMA' | 'INTERMEDIARIO' | 'AVANCADO';
  titulo: string;
  subtitulo: string;
  gradFrom: string;
  gradTo: string;
  badge: string;
  badgeCls: string;
  certLabel: string;
  Icon: React.ElementType;
}

export const NIVEL_CONFIGS: Record<string, NivelConfig> = {
  AMA: {
    nivel: 'AMA',
    titulo: 'Fase AMA',
    subtitulo: 'Adaptação ao Meio Aquático · Certificação Bronze · 3 Módulos',
    gradFrom: 'from-blue-500',
    gradTo: 'to-cyan-500',
    badge: 'BRONZE',
    badgeCls: 'bg-amber-100 text-amber-700',
    certLabel: 'Prontos p/ Bronze',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-white">
        <path d="M12 2C6.5 11 4 15 4 17a8 8 0 0 0 16 0c0-2-2.5-6-8-15z" />
      </svg>
    ),
  },
  INTERMEDIARIO: {
    nivel: 'INTERMEDIARIO',
    titulo: 'Fase Intermédio',
    subtitulo: 'Autonomia Aquática e Eficiência Corporal · Certificação Prata · 3 Módulos',
    gradFrom: 'from-purple-500',
    gradTo: 'to-violet-600',
    badge: 'PRATA',
    badgeCls: 'bg-slate-100 text-slate-600',
    certLabel: 'Prontos p/ Prata',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-white">
        <path d="M2 12c3-8 7-8 10 0s7 8 10 0" />
        <path d="M2 18c3-8 7-8 10 0s7 8 10 0" />
      </svg>
    ),
  },
  AVANCADO: {
    nivel: 'AVANCADO',
    titulo: 'Fase Avançado',
    subtitulo: 'Eficiência Técnica de Nado · Certificação Ouro · 3 Módulos',
    gradFrom: 'from-amber-500',
    gradTo: 'to-orange-600',
    badge: 'OURO',
    badgeCls: 'bg-yellow-100 text-yellow-700',
    certLabel: 'Prontos p/ Ouro',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-white">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try { return JSON.parse(raw ?? '') ?? fallback; } catch { return fallback; }
}

function scoresFromAvaliacoes(sf: StudentFase): Record<number, number> {
  const map: Record<number, number> = {};
  for (const a of sf.avaliacoes ?? []) map[a.criterioIndex] = a.valor;
  return map;
}

function studentName(s: Student) {
  return `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || '—';
}

function studentInitial(s: Student) {
  return (s.firstName?.[0] ?? '?').toUpperCase();
}

function StatCard({ icon: Icon, value, label, colorCls }: {
  icon: React.ElementType; value: number; label: string; colorCls: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className={`w-9 h-9 rounded-xl ${colorCls} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

function AssignModal({ fase, config, onClose, onAssigned }: {
  fase: Fase; config: NivelConfig; onClose: () => void; onAssigned: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    api.get('/students?limit=100').then(r => {
      const raw = r.data?.data ?? r.data;
      const arr: Student[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      const assignedIds = new Set(fase.studentFases.map(sf => sf.studentId));
      setStudents(arr.filter(s => !assignedIds.has(s.id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [fase.studentFases]);

  const filtered = students.filter(s =>
    studentName(s).toLowerCase().includes(search.toLowerCase())
  );

  const assign = async (student: Student) => {
    setAssigning(student.id);
    try {
      await api.put(`/fases/estudante/${student.id}/fase/${fase.id}`, {
        estado: 'EM_PROGRESSO',
        iniciadoEm: new Date().toISOString(),
      });
      onAssigned();
      onClose();
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-bold text-gray-900">Adicionar Atleta</h3>
            <p className="text-xs text-gray-500 mt-0.5">Módulo {fase.ordem} — {fase.nome}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Pesquisar atleta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              {students.length === 0 ? 'Todos os atletas já foram atribuídos' : 'Nenhum atleta encontrado'}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => assign(s)}
                  disabled={assigning === s.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-left transition group"
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.gradFrom} ${config.gradTo} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {studentInitial(s)}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">{studentName(s)}</span>
                  {assigning === s.id
                    ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                    : <UserPlus className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EstudanteRow({ sf, criterios, totalMinimo, faseId, config, onUpdate }: {
  sf: StudentFase; criterios: Criterio[]; totalMinimo: number; faseId: string;
  config: NivelConfig;
  onUpdate: (updated: Partial<StudentFase> & { studentId: string; faseId: string }) => void;
}) {
  const [scores, setScores] = useState<Record<number, number>>(() => scoresFromAvaliacoes(sf));
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const isDone = sf.estado === 'CONCLUIDO';
  const scoredCount = criterios.filter((_, i) => scores[i] != null).length;
  const allScored = scoredCount === criterios.length;
  const abaixoMinimo = criterios.filter((c, i) => (scores[i] ?? 0) < (c.obrigatoria ? 4 : 3));
  const soma = Object.values(scores).reduce((s, v) => s + v, 0);
  const sumOk = soma >= totalMinimo;
  const canConcluir = allScored && abaixoMinimo.length === 0 && sumOk;
  const pct = criterios.length > 0 ? Math.round((scoredCount / criterios.length) * 100) : 0;

  const tituloConcluir = !allScored
    ? 'Falta pontuar todas as habilidades'
    : abaixoMinimo.length > 0
      ? `Habilidades abaixo do mínimo: ${abaixoMinimo.map(c => c.nome).join(', ')}`
      : !sumOk
        ? `Soma insuficiente (${soma}/${totalMinimo})`
        : 'Concluir este módulo';

  const setScore = async (idx: number, valor: number) => {
    if (isDone) return;
    const prev = scores[idx];
    const nextScores = { ...scores, [idx]: valor };
    setScores(nextScores);
    setSavingIdx(idx);
    setErro(null);
    try {
      await api.put(`/fases/estudante/${sf.studentId}/fase/${faseId}`, { avaliacoes: [{ index: idx, valor }] });
      const avaliacoes = Object.entries(nextScores).map(([i, v]) => ({ criterioIndex: Number(i), valor: v }));
      onUpdate({ studentId: sf.studentId, faseId, avaliacoes });
    } catch {
      setScores(s => {
        const next = { ...s };
        if (prev === undefined) delete next[idx]; else next[idx] = prev;
        return next;
      });
    } finally {
      setSavingIdx(null);
    }
  };

  const concluir = async () => {
    if (!canConcluir || isDone) return;
    setCompleting(true);
    setErro(null);
    try {
      await api.put(`/fases/estudante/${sf.studentId}/fase/${faseId}`, {
        estado: 'CONCLUIDO',
        concluidoEm: new Date().toISOString(),
      });
      onUpdate({ studentId: sf.studentId, faseId, estado: 'CONCLUIDO' });
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Não foi possível concluir. Verifica os mínimos e o total.');
    } finally { setCompleting(false); }
  };

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 ${isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.gradFrom} ${config.gradTo} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {studentInitial(sf.student)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{studentName(sf.student)}</span>
            {isDone && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Concluído</span>}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${isDone ? 100 : pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 flex-shrink-0 tabular-nums">
              {isDone ? criterios.length : scoredCount}/{criterios.length} · {soma}/{totalMinimo} pts
            </span>
          </div>
        </div>
        {!isDone && (
          <button
            onClick={concluir}
            disabled={!canConcluir || completing}
            title={tituloConcluir}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
              canConcluir
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {completing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Concluir
          </button>
        )}
      </div>

      {!isDone && criterios.length > 0 && (
        <div className="space-y-2 pl-11">
          {criterios.map((c, i) => {
            const valor = scores[i];
            const minimo = c.obrigatoria ? 4 : 3;
            const belowMin = valor != null && valor < minimo;
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-700">{c.nome}</span>
                  {c.obrigatoria && (
                    <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                      Obrigatória · mín. 4
                    </span>
                  )}
                  {savingIdx === i && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setScore(i, n)}
                      className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center border transition ${
                        valor === n
                          ? (n < minimo ? 'bg-red-500 border-red-500 text-white' : 'bg-blue-500 border-blue-500 text-white')
                          : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  {belowMin && <span className="text-[10px] text-red-500 ml-1">abaixo do mínimo ({minimo})</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {erro && <p className="text-xs text-red-500 pl-11">{erro}</p>}
    </div>
  );
}

function FaseCard({ fase, config, onRefresh }: { fase: Fase; config: NivelConfig; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [localStudentFases, setLocalStudentFases] = useState<StudentFase[]>(fase.studentFases);

  useEffect(() => { setLocalStudentFases(fase.studentFases); }, [fase.studentFases]);

  const criterios = parseJson<Criterio[]>(fase.criterios, []);
  const escala = parseJson<string[]>(fase.escala, []);
  const active = localStudentFases.filter(sf => sf.estado !== 'NAO_INICIADO');
  const concluidos = active.filter(sf => sf.estado === 'CONCLUIDO').length;

  const updateSf = (patch: Partial<StudentFase> & { studentId: string }) => {
    setLocalStudentFases(prev =>
      prev.map(sf => sf.studentId === patch.studentId && sf.faseId === fase.id ? { ...sf, ...patch } : sf)
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradFrom} ${config.gradTo} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
              {fase.ordem}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 text-base">{fase.nome}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${config.badgeCls}`}>
                  <Award className="w-3 h-3" /> {config.badge}
                </span>
              </div>
              {fase.foco && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-lg">{fase.foco}</p>}
            </div>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0 ml-4">
            <div className="text-right hidden sm:block">
              <div className="text-base font-bold text-gray-900">{active.length}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">atletas</div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-base font-bold text-green-600">{concluidos}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">concluídos</div>
            </div>
            {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-gray-100 p-5 space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Escala de Avaliação</p>
                <div className="flex flex-wrap gap-1.5">
                  {escala.map((op, i) => (
                    <span key={op} className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      i === escala.length - 1 ? 'bg-green-100 text-green-700 border-green-200'
                        : i === 0 ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {i + 1}. {op}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowAssign(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm flex-shrink-0"
              >
                <UserPlus className="w-4 h-4" /> Adicionar Atleta
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Habilidades ({criterios.length})</p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total mínimo acumulado: <span className="text-gray-600">{fase.totalMinimo} pts</span></p>
              </div>
              <div className="flex flex-wrap gap-y-1 gap-x-4">
                {criterios.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${config.gradFrom} ${config.gradTo} flex-shrink-0`} />
                    {c.nome}
                    {c.obrigatoria && (
                      <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                        Obrigatória
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Atletas ({active.length})</p>
              {active.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  Nenhum atleta neste módulo. Clica em "Adicionar Atleta" para começar.
                </div>
              ) : (
                <div className="space-y-2">
                  {active.map(sf => (
                    <EstudanteRow
                      key={`${sf.studentId}-${sf.faseId}`}
                      sf={sf}
                      criterios={criterios}
                      totalMinimo={fase.totalMinimo}
                      faseId={fase.id}
                      config={config}
                      onUpdate={updateSf}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAssign && (
        <AssignModal
          fase={{ ...fase, studentFases: localStudentFases }}
          config={config}
          onClose={() => setShowAssign(false)}
          onAssigned={onRefresh}
        />
      )}
    </>
  );
}

export function NivelPage({ nivel }: { nivel: 'AMA' | 'INTERMEDIARIO' | 'AVANCADO' }) {
  const config = NIVEL_CONFIGS[nivel];
  const [fases, setFases] = useState<Fase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get(`/fases/nivel/${nivel}`)
      .then(r => { const raw = r.data?.data ?? r.data; setFases(Array.isArray(raw) ? raw : []); })
      .catch(() => setError(`Erro a carregar módulos ${nivel}.`))
      .finally(() => setLoading(false));
  }, [nivel]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allSf = fases.flatMap(f => f.studentFases.filter(sf => sf.estado !== 'NAO_INICIADO'));
  const allStudentIds = new Set(allSf.map(sf => sf.studentId));
  const totalAtletas = allStudentIds.size;
  const emProgresso = allSf.filter(sf => sf.estado === 'EM_PROGRESSO').length;
  const totalFasesConcluidas = allSf.filter(sf => sf.estado === 'CONCLUIDO').length;
  const prontosCert = fases.length === 3
    ? Array.from(allStudentIds).filter(sid =>
        fases.every(f => f.studentFases.some(sf => sf.studentId === sid && sf.estado === 'CONCLUIDO'))
      ).length
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradFrom} ${config.gradTo} flex items-center justify-center shadow-md`}>
          <config.Icon />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.titulo}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{config.subtitulo}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users}        value={totalAtletas}          label="Total Atletas"       colorCls="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp}   value={emProgresso}           label="Em Progresso"        colorCls="bg-amber-50 text-amber-600" />
        <StatCard icon={CheckCircle2} value={totalFasesConcluidas}  label="Módulos Concluídos"  colorCls="bg-green-50 text-green-600" />
        <StatCard icon={Trophy}       value={prontosCert}            label={config.certLabel}   colorCls="bg-orange-50 text-orange-600" />
      </div>

      {!loading && fases.length > 0 && (
        <div className={`bg-gradient-to-r ${config.gradFrom.replace('from-', 'from-').replace('500', '50')} to-white rounded-2xl p-5 border border-gray-100`}>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Caminho de Progressão</p>
          <div className="flex items-center gap-2 flex-wrap">
            {fases.map((f, i) => {
              const done = f.studentFases.filter(sf => sf.estado === 'CONCLUIDO').length;
              const total = f.studentFases.filter(sf => sf.estado !== 'NAO_INICIADO').length;
              return (
                <div key={f.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradFrom} ${config.gradTo} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {f.ordem}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 leading-tight">{f.nome}</div>
                      <div className="text-[10px] text-gray-400">{done}/{total > 0 ? total : '—'} concluídos</div>
                    </div>
                  </div>
                  {i < fases.length - 1 && <span className="text-gray-300 font-bold">→</span>}
                  {i === fases.length - 1 && (
                    <>
                      <span className="text-amber-300 font-bold">→</span>
                      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${config.badgeCls.replace('text-', 'border-').replace('bg-', 'bg-')} bg-opacity-30`}>
                        <Award className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-bold leading-tight">{config.badge}</div>
                          <div className="text-[10px] opacity-70">{prontosCert} prontos</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">A carregar...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500 text-sm">{error}</div>
      ) : fases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <span className="text-sm">Nenhum módulo encontrado.</span>
          <button onClick={fetchData} className="text-xs text-blue-500 hover:underline">Tentar novamente</button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Módulos da Fase</p>
          {fases.map(f => (
            <FaseCard key={f.id} fase={f} config={config} onRefresh={fetchData} />
          ))}
        </div>
      )}
    </div>
  );
}
