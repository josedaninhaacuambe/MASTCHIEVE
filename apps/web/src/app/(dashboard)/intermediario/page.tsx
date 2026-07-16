'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Waves, Award, CheckCircle2, Circle, ChevronDown, ChevronRight,
  UserPlus, X, Search, Loader2, Trophy, Users, TrendingUp,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  dateOfBirth?: string;
  profilePicture?: string | null;
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
}

interface Fase {
  id: string;
  ordem: number;
  nome: string;
  foco?: string;
  escala: string;
  criterios: string;
  assiduidade: number;
  studentFases: StudentFase[];
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try { return JSON.parse(raw ?? '') ?? fallback; } catch { return fallback; }
}

function getVerificados(sf: StudentFase): number[] {
  return parseJson<{ criteriosVerificados?: number[] }>(sf.notas, {}).criteriosVerificados ?? [];
}

/* ── Stat card ── */
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

/* ── Assign modal ── */
function AssignModal({ fase, onClose, onAssigned }: {
  fase: Fase; onClose: () => void; onAssigned: () => void;
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    api.get('/students?limit=200').then(r => {
      const raw = r.data?.data ?? r.data;
      const arr: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      const assignedIds = new Set(fase.studentFases.map(sf => sf.studentId));
      setStudents(arr.filter(s => !assignedIds.has(s.id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [fase.studentFases]);

  const filtered = students.filter(s =>
    (s.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const assign = async (student: any) => {
    setAssigning(student.id);
    try {
      await api.put(`/fases/estudante/${student.id}/fase/${fase.id}`, {
        estado: 'EM_PROGRESSO',
        iniciadoEm: new Date().toISOString(),
        notas: JSON.stringify({ criteriosVerificados: [] }),
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
            <p className="text-xs text-gray-500 mt-0.5">Fase {fase.ordem} — {fase.nome}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Pesquisar atleta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              {students.length === 0 ? 'Todos os atletas já foram atribuídos a esta fase' : 'Nenhum atleta encontrado'}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => assign(s)}
                  disabled={assigning === s.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 text-left transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(s.name ?? '?')[0].toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">{s.name}</span>
                  {assigning === s.id
                    ? <Loader2 className="w-4 h-4 text-purple-500 animate-spin flex-shrink-0" />
                    : <UserPlus className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition flex-shrink-0" />
                  }
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Student row ── */
function EstudanteRow({ sf, criterios, faseId, onUpdate }: {
  sf: StudentFase; criterios: string[]; faseId: string;
  onUpdate: (updated: Partial<StudentFase> & { studentId: string; faseId: string }) => void;
}) {
  const [verificados, setVerificados] = useState<number[]>(() => getVerificados(sf));
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const isDone = sf.estado === 'CONCLUIDO';
  const allVerified = verificados.length === criterios.length;
  const pct = criterios.length > 0 ? Math.round((verificados.length / criterios.length) * 100) : 0;

  const toggleCriterio = async (idx: number) => {
    if (isDone) return;
    const next = verificados.includes(idx)
      ? verificados.filter(v => v !== idx)
      : [...verificados, idx];
    setVerificados(next);
    setSaving(true);
    const notas = JSON.stringify({ criteriosVerificados: next });
    try {
      const r = await api.put(`/fases/estudante/${sf.studentId}/fase/${faseId}`, { notas });
      onUpdate({ studentId: sf.studentId, faseId, notas, ...(r.data?.data ?? r.data ?? {}) });
    } finally {
      setSaving(false);
    }
  };

  const concluir = async () => {
    if (!allVerified || isDone) return;
    setCompleting(true);
    const notas = JSON.stringify({ criteriosVerificados: verificados });
    try {
      const r = await api.put(`/fases/estudante/${sf.studentId}/fase/${faseId}`, {
        estado: 'CONCLUIDO',
        concluidoEm: new Date().toISOString(),
        notas,
      });
      onUpdate({ studentId: sf.studentId, faseId, estado: 'CONCLUIDO', notas, ...(r.data?.data ?? r.data ?? {}) });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 ${isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {(sf.student.name ?? '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{sf.student.name}</span>
            {isDone && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Concluído</span>
            )}
            {saving && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-green-500' : 'bg-purple-500'}`}
                style={{ width: `${isDone ? 100 : pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 flex-shrink-0 tabular-nums">
              {isDone ? criterios.length : verificados.length}/{criterios.length}
            </span>
          </div>
        </div>
        {!isDone && (
          <button
            onClick={concluir}
            disabled={!allVerified || completing}
            title={!allVerified ? 'Verifica todos os critérios primeiro' : 'Concluir esta fase'}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
              allVerified
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {completing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <CheckCircle2 className="w-3.5 h-3.5" />
            }
            Concluir
          </button>
        )}
      </div>

      {!isDone && criterios.length > 0 && (
        <div className="space-y-1.5 pl-11">
          {criterios.map((c, i) => {
            const checked = verificados.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleCriterio(i)}
                className="w-full flex items-start gap-2 text-left group py-0.5"
              >
                {checked
                  ? <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  : <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5 group-hover:text-purple-300 transition" />
                }
                <span className={`text-xs leading-relaxed ${checked ? 'text-purple-600 line-through decoration-purple-300' : 'text-gray-600'}`}>
                  {c}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Phase card ── */
function FaseCard({ fase, onRefresh }: { fase: Fase; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [localStudentFases, setLocalStudentFases] = useState<StudentFase[]>(fase.studentFases);

  useEffect(() => { setLocalStudentFases(fase.studentFases); }, [fase.studentFases]);

  const criterios = parseJson<string[]>(fase.criterios, []);
  const escala = parseJson<string[]>(fase.escala, []);

  const active = localStudentFases.filter(sf => sf.estado !== 'NAO_INICIADO');
  const concluidos = active.filter(sf => sf.estado === 'CONCLUIDO').length;

  const updateSf = (patch: Partial<StudentFase> & { studentId: string }) => {
    setLocalStudentFases(prev =>
      prev.map(sf => sf.studentId === patch.studentId && sf.faseId === fase.id
        ? { ...sf, ...patch }
        : sf
      )
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {fase.ordem}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 text-base">{fase.nome}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Award className="w-3 h-3" /> PRATA
                </span>
              </div>
              {fase.foco && (
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-lg">{fase.foco}</p>
              )}
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
            {expanded
              ? <ChevronDown className="w-5 h-5 text-gray-400" />
              : <ChevronRight className="w-5 h-5 text-gray-400" />
            }
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
                      i === escala.length - 1
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : i === 0
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {i + 1}. {op}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowAssign(true)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm flex-shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                Adicionar Atleta
              </button>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Critérios ({criterios.length})</p>
              <div className="flex flex-wrap gap-y-1 gap-x-4">
                {criterios.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Atletas ({active.length})
              </p>
              {active.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  Nenhum atleta nesta fase. Clica em "Adicionar Atleta" para começar.
                </div>
              ) : (
                <div className="space-y-2">
                  {active.map(sf => (
                    <EstudanteRow
                      key={`${sf.studentId}-${sf.faseId}`}
                      sf={sf}
                      criterios={criterios}
                      faseId={fase.id}
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
          onClose={() => setShowAssign(false)}
          onAssigned={onRefresh}
        />
      )}
    </>
  );
}

/* ── Main page ── */
export default function IntermediarioModuloPage() {
  const [fases, setFases] = useState<Fase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/fases/nivel/INTERMEDIARIO')
      .then(r => {
        const raw = r.data?.data ?? r.data;
        setFases(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setError('Erro a carregar fases. Verifica a ligação ao servidor.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allSf = fases.flatMap(f => f.studentFases.filter(sf => sf.estado !== 'NAO_INICIADO'));
  const allStudentIds = new Set(allSf.map(sf => sf.studentId));
  const totalAtletas = allStudentIds.size;
  const emProgresso = allSf.filter(sf => sf.estado === 'EM_PROGRESSO').length;
  const totalFasesConcluidas = allSf.filter(sf => sf.estado === 'CONCLUIDO').length;
  const prontosPrata = fases.length === 3
    ? Array.from(allStudentIds).filter(sid =>
        fases.every(f => f.studentFases.some(sf => sf.studentId === sid && sf.estado === 'CONCLUIDO'))
      ).length
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md">
          <Waves className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulo Intermédio</h1>
          <p className="text-sm text-gray-500 mt-0.5">Autonomia Aquática e Eficiência Corporal · Certificação Prata · 3 Fases</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users}        value={totalAtletas}          label="Total Atletas"        colorCls="bg-purple-50 text-purple-600" />
        <StatCard icon={TrendingUp}   value={emProgresso}           label="Em Progresso"         colorCls="bg-amber-50 text-amber-600" />
        <StatCard icon={CheckCircle2} value={totalFasesConcluidas}  label="Fases Concluídas"     colorCls="bg-green-50 text-green-600" />
        <StatCard icon={Trophy}       value={prontosPrata}          label="Prontos p/ Prata"     colorCls="bg-gray-50 text-gray-600" />
      </div>

      {/* Progression path */}
      {!loading && fases.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-5 border border-purple-100">
          <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-widest mb-3">Caminho de Progressão</p>
          <div className="flex items-center gap-2 flex-wrap">
            {fases.map((f, i) => {
              const done = f.studentFases.filter(sf => sf.estado === 'CONCLUIDO').length;
              const total = f.studentFases.filter(sf => sf.estado !== 'NAO_INICIADO').length;
              return (
                <div key={f.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-purple-100">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {f.ordem}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 leading-tight">{f.nome}</div>
                      <div className="text-[10px] text-gray-400">{done}/{total > 0 ? total : '—'} concluídos</div>
                    </div>
                  </div>
                  {i < fases.length - 1 && (
                    <span className="text-purple-300 font-bold">→</span>
                  )}
                  {i === fases.length - 1 && (
                    <>
                      <span className="text-gray-400 font-bold">→</span>
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                        <Award className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-gray-600 leading-tight">Prata</div>
                          <div className="text-[10px] text-gray-400">{prontosPrata} prontos</div>
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

      {/* Phase cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">A carregar fases Intermédio...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500 text-sm">{error}</div>
      ) : fases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Waves className="w-12 h-12 opacity-20" />
          <span className="text-sm">Nenhuma fase Intermédio encontrada.</span>
          <button onClick={fetchData} className="text-xs text-purple-500 hover:underline">Tentar novamente</button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Fases do Módulo</p>
          {fases.map(f => (
            <FaseCard key={f.id} fase={f} onRefresh={fetchData} />
          ))}
        </div>
      )}
    </div>
  );
}
