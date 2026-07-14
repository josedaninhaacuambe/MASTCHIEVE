'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, ClipboardList, User, AlertTriangle, ChevronDown, ChevronRight, CheckSquare, Square, Award } from 'lucide-react';

// ─── Dados reais da Ficha Diagnóstica Mastchieve ─────────────────────────────

const NIVEL_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  AMA:           { label: 'AMA — Adaptação ao Meio Aquático', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  INTERMEDIARIO: { label: 'Intermédio — Autonomia Aquática',  bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  AVANCADO:      { label: 'Avançado — Eficiência Técnica',    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
};

const CERT_CONFIG: Record<string, string> = {
  BRONZE: 'text-amber-700 bg-amber-100',
  PRATA:  'text-gray-600 bg-gray-100',
  OURO:   'text-yellow-700 bg-yellow-100',
};

const FASES_DIAGNOSTICO = [
  {
    nivel: 'AMA', ordem: 1, nome: 'Estrela-do-Mar', cert: 'BRONZE',
    foco: 'Conforto no meio aquático, respiração ventral e primeiros alinhamentos',
    escala: ['Não realiza', 'Com apoio', 'Autónomo'],
    criterios: [
      'Demonstra conforto na água',
      'Respiração ventral (exala dentro de água)',
      'Flutuação ventral com apoio',
      'Flutuação dorsal com apoio',
      'Deslize ventral curto alinhado',
    ],
  },
  {
    nivel: 'AMA', ordem: 2, nome: 'Cavalo-Marinho', cert: 'BRONZE',
    foco: 'Flutuação autónoma e alinhamento dorsal/ventral',
    escala: ['Não realiza', 'Parcial', 'Autónomo'],
    criterios: [
      'Flutuação ventral autónoma por 10 segundos',
      'Flutuação dorsal autónoma por 10 segundos',
      'Flutuação vertical por 30 segundos',
      'Deslize ventral alinhado',
      'Deslize dorsal alinhado',
      'Transição ventral ↔ dorsal',
    ],
  },
  {
    nivel: 'AMA', ordem: 3, nome: 'Polvo', cert: 'BRONZE',
    foco: 'Controlo respiratório, autonomia e transições sem apoio',
    escala: ['Não realiza', 'Parcial', 'Autónomo'],
    criterios: [
      'Respiração ventral controlada',
      'Flutuação ventral e dorsal independente (20s cada)',
      'Flutuação vertical independente (60s)',
      'Deslize com mudança ventral ↔ dorsal',
      'Mantém alinhamento corporal básico',
      'Conhece regras básicas de segurança',
    ],
  },
  {
    nivel: 'INTERMEDIARIO', ordem: 4, nome: 'Tartaruga', cert: 'PRATA',
    foco: 'Consciência corporal e deslocamento alinhado',
    escala: ['Insuficiente', 'Satisfatório', 'Bom'],
    criterios: [
      'Respiração ventral eficaz',
      'Introdução à respiração lateral',
      'Deslocamento ventral alinhado',
      'Deslocamento dorsal alinhado',
      'Pernada alternada contínua',
    ],
  },
  {
    nivel: 'INTERMEDIARIO', ordem: 5, nome: 'Dugongo', cert: 'PRATA',
    foco: 'Sustentação, propulsão e direção',
    escala: ['Insuficiente', 'Satisfatório', 'Bom'],
    criterios: [
      'Respiração lateral coordenada',
      'Sculling – sustentação',
      'Sculling – propulsão',
      'Deslocamento lateral',
      'Pernada simétrica (bruços)',
      'Introdução à pernada mariposa',
    ],
  },
  {
    nivel: 'INTERMEDIARIO', ordem: 6, nome: 'Crocodilo', cert: 'PRATA',
    foco: 'Controlo direcional e eficiência corporal',
    escala: ['Insuficiente', 'Satisfatório', 'Bom', 'Muito Bom'],
    criterios: [
      'Controla eixo corporal',
      'Desloca-se em qualquer direção',
      'Alterna posições com controlo',
      'Pernada alternada e simétrica eficiente',
      'Conhece regras de segurança intermédia',
    ],
  },
  {
    nivel: 'AVANCADO', ordem: 7, nome: 'Tubarão', cert: 'OURO',
    foco: 'Fundamentos técnicos de nado',
    escala: ['Insuficiente', 'Satisfatório', 'Bom'],
    criterios: [
      'Posição corporal hidrodinâmica',
      'Propulsão de pernas eficiente',
      'Introdução à propulsão de braços',
      'Coordenação básica braços/pernas',
    ],
  },
  {
    nivel: 'AVANCADO', ordem: 8, nome: 'Marlim', cert: 'OURO',
    foco: 'Coordenação técnica consolidada',
    escala: ['Insuficiente', 'Satisfatório', 'Bom', 'Excelente'],
    criterios: [
      'Propulsão eficiente braços e pernas',
      'Coordenação completa dos estilos',
      'Respiração integrada ao movimento',
      'Mantém alinhamento sob esforço',
    ],
  },
  {
    nivel: 'AVANCADO', ordem: 9, nome: 'Golfinho', cert: 'OURO',
    foco: 'Eficiência máxima e resistência',
    escala: ['Insuficiente', 'Satisfatório', 'Bom', 'Excelente'],
    criterios: [
      'Coordenação avançada',
      'Eficiência técnica em todos os estilos',
      'Mantém alinhamento em fadiga',
      'Resistência e continuidade de nado',
    ],
  },
];

const ESCALA_CORES: Record<string, string> = {
  'Autónomo':     'bg-green-100 text-green-700',
  'Bom':          'bg-green-100 text-green-700',
  'Excelente':    'bg-emerald-100 text-emerald-700',
  'Muito Bom':    'bg-teal-100 text-teal-700',
  'Com apoio':    'bg-amber-100 text-amber-700',
  'Parcial':      'bg-amber-100 text-amber-700',
  'Satisfatório': 'bg-blue-100 text-blue-700',
  'Não realiza':  'bg-red-100 text-red-600',
  'Insuficiente': 'bg-red-100 text-red-600',
};

function criterioKey(faseNome: string, criterio: string) {
  return `${faseNome}::${criterio}`;
}

function calcRecomendadaOrdem(transicoes: Record<number, boolean>): number {
  const transitadas = Object.entries(transicoes).filter(([, v]) => v).map(([k]) => parseInt(k));
  if (transitadas.length === 0) return 1;
  const last = Math.max(...transitadas);
  return last < 9 ? last + 1 : 9;
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function DiagnosticModal({ students, fases, onClose, onSaved }: {
  students: any[]; fases: any[]; onClose: () => void; onSaved: () => void;
}) {
  const [studentId, setStudentId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [criterios, setCriterios] = useState<Record<string, string>>({});
  const [transicoes, setTransicoes] = useState<Record<number, boolean>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true });
  const [saving, setSaving] = useState(false);

  const recomOrdem = calcRecomendadaOrdem(transicoes);
  const faseRecomendadaDb = fases.find((f: any) => f.ordem === recomOrdem);

  const salvar = async () => {
    if (!studentId) return;
    setSaving(true);
    try {
      const criteriosAvaliados = FASES_DIAGNOSTICO.flatMap(fase =>
        fase.criterios
          .filter(c => criterios[criterioKey(fase.nome, c)])
          .map(c => ({ fase: fase.nome, criterio: c, valor: criterios[criterioKey(fase.nome, c)] }))
      );
      await api.post('/avaliacoes-iniciais', {
        studentId,
        data: new Date().toISOString(),
        criteriosAvaliados: JSON.stringify(criteriosAvaliados),
        faseRecomendadaId: faseRecomendadaDb?.id || undefined,
        observacoes: observacoes || undefined,
        experienciaAquatica: 3, segurancaAdaptacao: 3, confortoAgua: 3, resistenciaBasica: 3,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Ficha Diagnóstica do Nadador</h2>
          <p className="text-sm text-gray-500 mt-0.5">Avaliação de colocação — realizada na inscrição, após alocação de turma</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span><strong>Protocolo #4:</strong> avaliação individual, atleta a atleta. Não classifiques vários atletas com o mesmo registo.</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atleta *</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecionar atleta...</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-400">Data: {new Date().toLocaleDateString('pt-PT')} (capturada automaticamente)</p>

          {/* Per-phase criteria */}
          {(['AMA', 'INTERMEDIARIO', 'AVANCADO'] as const).map(nivel => {
            const cfg = NIVEL_CONFIG[nivel];
            return (
              <div key={nivel} className={`rounded-xl border ${cfg.border} overflow-hidden`}>
                <div className={`px-4 py-2.5 ${cfg.bg}`}>
                  <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {FASES_DIAGNOSTICO.filter(f => f.nivel === nivel).map(fase => {
                    const isOpen = !!expanded[fase.ordem];
                    const transitou = !!transicoes[fase.ordem];
                    const filled = fase.criterios.filter(c => criterios[criterioKey(fase.nome, c)]).length;
                    return (
                      <div key={fase.ordem}>
                        <button
                          onClick={() => setExpanded(e => ({ ...e, [fase.ordem]: !e[fase.ordem] }))}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CERT_CONFIG[fase.cert]}`}>{fase.cert}</span>
                            <span className="text-sm font-semibold text-gray-900">{fase.nome}</span>
                            <span className="text-xs text-gray-400">Fase {fase.ordem}</span>
                            {filled > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{filled}/{fase.criterios.length}</span>}
                            {transitou && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">✓ Transitou</span>}
                          </div>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 bg-gray-50/40 space-y-3">
                            <p className="text-xs text-gray-400 italic pt-2">{fase.foco}</p>
                            <div className="space-y-2">
                              {fase.criterios.map(criterio => {
                                const key = criterioKey(fase.nome, criterio);
                                const val = criterios[key] ?? '';
                                return (
                                  <div key={criterio} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-700 flex-1">{criterio}</span>
                                    <select value={val} onChange={e => setCriterios(c => ({ ...c, [key]: e.target.value }))}
                                      className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white min-w-[128px]">
                                      <option value="">—</option>
                                      {fase.escala.map(op => <option key={op} value={op}>{op}</option>)}
                                    </select>
                                    {val && (
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${ESCALA_CORES[val] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {val}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              onClick={() => setTransicoes(t => ({ ...t, [fase.ordem]: !t[fase.ordem] }))}
                              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                                transitou
                                  ? 'bg-green-50 border-green-300 text-green-700'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}>
                              {transitou ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                              Atleta transita para a próxima fase
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Classification finale */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-700 mb-1.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Classificação Final (automática)
            </p>
            <p className="text-sm font-bold text-indigo-900">
              {faseRecomendadaDb
                ? `${NIVEL_CONFIG[faseRecomendadaDb.nivel]?.label?.split(' — ')[0] ?? ''} — Fase ${faseRecomendadaDb.ordem}: ${faseRecomendadaDb.nome}`
                : 'Fase 1 — Estrela-do-Mar (início padrão)'}
            </p>
            <p className="text-xs text-indigo-400 mt-1">Baseado nas transições marcadas. O instrutor valida no Open Day.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
              placeholder="Notas adicionais, limitações físicas, necessidades especiais..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={salvar} disabled={!studentId || saving}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'A guardar...' : 'Guardar Diagnóstico'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Evaluation Card ──────────────────────────────────────────────────────────

function AvaliacaoCard({ a }: { a: any }) {
  const criteriosAvaliados: Array<{ fase: string; criterio: string; valor: string }> = (() => {
    try { return JSON.parse(a.criteriosAvaliados || '[]'); } catch { return []; }
  })();
  const fasesPorNivel = criteriosAvaliados.reduce<Record<string, typeof criteriosAvaliados>>((acc, item) => {
    (acc[item.fase] = acc[item.fase] || []).push(item);
    return acc;
  }, {});
  const [expanded, setExpanded] = useState(false);
  const nivelCfg = a.faseRecomendada ? NIVEL_CONFIG[a.faseRecomendada.nivel] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h3 className="font-semibold text-gray-900">
              {a.student ? `${a.student.firstName} ${a.student.lastName}` : '—'}
            </h3>
            <span className="text-xs text-gray-400">{a.data ? new Date(a.data).toLocaleDateString('pt-PT') : '—'}</span>
            {a.instrutor && (
              <span className="text-xs text-gray-400">por {a.instrutor.firstName} {a.instrutor.lastName}</span>
            )}
          </div>

          {a.faseRecomendada && (
            <div className="mb-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${nivelCfg ? `${nivelCfg.bg} ${nivelCfg.text}` : 'bg-gray-100 text-gray-600'}`}>
                Entrada: Fase {a.faseRecomendada.ordem} — {a.faseRecomendada.nome}
              </span>
            </div>
          )}

          {criteriosAvaliados.length > 0 ? (
            <>
              <button onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-1">
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {criteriosAvaliados.length} critérios avaliados
              </button>
              {expanded && (
                <div className="mt-3 space-y-3">
                  {Object.entries(fasesPorNivel).map(([fase, items]) => (
                    <div key={fase}>
                      <p className="text-xs font-semibold text-gray-500 mb-1">{fase}</p>
                      <div className="space-y-1">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-gray-600">{item.criterio}</span>
                            <span className={`px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${ESCALA_CORES[item.valor] ?? 'bg-gray-100 text-gray-600'}`}>
                              {item.valor}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 mt-1">
              {[['Exp. Aquática', a.experienciaAquatica], ['Segurança', a.segurancaAdaptacao], ['Conforto', a.confortoAgua], ['Resistência', a.resistenciaBasica]].map(([l, v]) => (
                <div key={l as string} className="text-center">
                  <div className="text-gray-400">{l}</div>
                  <div className="text-indigo-600 font-bold">{v}/5</div>
                </div>
              ))}
            </div>
          )}

          {a.observacoes && <p className="text-xs text-gray-400 mt-2 italic">{a.observacoes}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AvaliacoesIniciaisPage() {
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [fases, setFases] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const r = await api.get('/avaliacoes-iniciais');
    setAvaliacoes(r.data.data || r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = async () => {
    const [s, f] = await Promise.all([api.get('/students'), api.get('/fases')]);
    setStudents(s.data.data || s.data);
    setFases(f.data.data || f.data);
    setShowForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações Iniciais</h1>
          <p className="text-gray-500 text-sm mt-1">Ficha diagnóstica de colocação — realizada na primeira sessão (SOP 02)</p>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nova Avaliação
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <strong>Protocolo #4 — Diagnóstico Individual:</strong> cada avaliação deve ser criada separadamente, atleta a atleta.
          A ficha diagnóstica é realizada após a inscrição e alocação de turma, para identificar o módulo/fase de entrada.
          A validação final da progressão permanece com o instrutor, preferencialmente no Open Day.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : (
        <div className="space-y-3">
          {avaliacoes.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhuma avaliação inicial registada</p>
            </div>
          )}
          {avaliacoes.map((a: any) => <AvaliacaoCard key={a.id} a={a} />)}
        </div>
      )}

      {showForm && (
        <DiagnosticModal students={students} fases={fases} onClose={() => setShowForm(false)} onSaved={load} />
      )}
    </div>
  );
}
