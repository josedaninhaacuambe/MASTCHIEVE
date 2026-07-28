'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Award, Fish, ChevronDown, ChevronRight } from 'lucide-react';

const NIVEL_ROUTE: Record<string, string> = {
  AMA: '/ama', INTERMEDIARIO: '/intermediario', AVANCADO: '/avancado',
};

const NIVEL_CORES: Record<string, string> = {
  AMA:          'from-blue-400 to-cyan-500',
  INTERMEDIARIO:'from-purple-400 to-violet-500',
  AVANCADO:     'from-amber-400 to-orange-500',
};
const NIVEL_BG: Record<string, string> = {
  AMA:          'bg-blue-50 border-blue-200',
  INTERMEDIARIO:'bg-purple-50 border-purple-200',
  AVANCADO:     'bg-amber-50 border-amber-200',
};
const NIVEL_TEXT: Record<string, string> = {
  AMA:          'text-blue-700',
  INTERMEDIARIO:'text-purple-700',
  AVANCADO:     'text-amber-700',
};
const CERT_CORES: Record<string, string> = {
  BRONZE: 'text-amber-700 bg-amber-100',
  PRATA:  'text-gray-600 bg-gray-100',
  OURO:   'text-yellow-700 bg-yellow-100',
};
const NIVEL_LABELS: Record<string, string> = {
  AMA:          'AMA — Adaptação ao Meio Aquático',
  INTERMEDIARIO:'Intermédio — Autonomia Aquática e Eficiência Corporal',
  AVANCADO:     'Avançado — Eficiência Técnica de Nado',
};

export default function FasesPage() {
  const [fases, setFases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get('/fases').then(r => { setFases(r.data.data || r.data); setLoading(false); });
  }, []);

  const toggle = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const niveis = ['AMA', 'INTERMEDIARIO', 'AVANCADO'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progressão Pedagógica — 9 Módulos</h1>
        <p className="text-gray-500 text-sm mt-1">Metodologia oficial Mastchieve · 3 fases · certificação Bronze, Prata e Ouro</p>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="space-y-8">
          {niveis.map(nivel => {
            const fasesNivel = fases.filter((f: any) => f.nivel === nivel).sort((a: any, b: any) => a.ordem - b.ordem);
            return (
              <div key={nivel}>
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${NIVEL_CORES[nivel]} text-white font-semibold text-sm`}>
                    <Fish className="w-4 h-4" />
                    {NIVEL_LABELS[nivel]}
                  </div>
                  <Link
                    href={NIVEL_ROUTE[nivel]}
                    className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border-2 transition ${
                      nivel === 'AMA' ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                      : nivel === 'INTERMEDIARIO' ? 'border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100'
                      : 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
                    }`}
                  >
                    Gerir Fase <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {fasesNivel.map((fase: any) => {
                    const criterios: { nome: string; obrigatoria: boolean }[] = (() => { try { return JSON.parse(fase.criterios); } catch { return []; } })();
                    const escala: string[] = (() => { try { return JSON.parse(fase.escala || '[]'); } catch { return []; } })();
                    const isOpen = !!expanded[fase.id];

                    return (
                      <div key={fase.id} className={`rounded-2xl border ${NIVEL_BG[nivel]} overflow-hidden`}>
                        {/* Phase header — always visible */}
                        <button
                          onClick={() => toggle(fase.id)}
                          className="w-full flex items-center justify-between p-5 text-left hover:bg-white/40 transition">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${NIVEL_CORES[nivel]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                              {fase.ordem}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`font-bold text-gray-900 text-base`}>{fase.nome}</h3>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${CERT_CORES[fase.certificacao]}`}>
                                  <Award className="w-3 h-3" />{fase.certificacao}
                                </span>
                              </div>
                              {fase.foco && (
                                <p className={`text-xs mt-0.5 ${NIVEL_TEXT[nivel]}`}>{fase.foco}</p>
                              )}
                            </div>
                          </div>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </button>

                        {/* Expanded detail */}
                        {isOpen && (
                          <div className="px-5 pb-5 space-y-4 border-t border-white/60 pt-4">
                            {/* Scale */}
                            {escala.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Escala de Avaliação</p>
                                <div className="flex flex-wrap gap-2">
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
                            )}

                            {/* Criteria */}
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Habilidades Avaliadas</p>
                              <div className="space-y-1.5">
                                {criterios.map((c, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gradient-to-br ${NIVEL_CORES[nivel]}`} />
                                    {c.nome}
                                    {c.obrigatoria && (
                                      <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                                        Obrigatória · mín. 4
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Attendance & total mínimo */}
                            <div className="flex items-center gap-4 pt-1 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Assiduidade mínima para progressão:</span>
                                <span className={`text-xs font-bold ${NIVEL_TEXT[nivel]}`}>{fase.assiduidade}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Total mínimo acumulado:</span>
                                <span className={`text-xs font-bold ${NIVEL_TEXT[nivel]}`}>{fase.totalMinimo} pontos</span>
                              </div>
                            </div>

                            {/* Transition arrow */}
                            {fase.ordem < 9 && (
                              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                                <span>→</span>
                                <span>Transita para: <strong className="text-gray-600">
                                  {fasesNivel.find((f: any) => f.ordem === fase.ordem + 1)?.nome ??
                                    (fase.nivel === 'AMA' ? 'Tartaruga (Intermédio)' :
                                     fase.nivel === 'INTERMEDIARIO' ? 'Tubarão (Avançado)' : '—')}
                                </strong></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
