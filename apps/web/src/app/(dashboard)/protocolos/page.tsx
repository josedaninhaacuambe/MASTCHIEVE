'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Shield, ChevronDown, ChevronUp, Zap, AlertTriangle, BookOpen, Activity, Brain, Settings } from 'lucide-react';

const DIM_CORES: Record<string, string> = {
  FISICA: 'bg-red-100 text-red-700 border-red-300',
  OPERACIONAL: 'bg-blue-100 text-blue-700 border-blue-300',
  EMOCIONAL: 'bg-purple-100 text-purple-700 border-purple-300',
  PEDAGOGICA: 'bg-green-100 text-green-700 border-green-300',
  GESTAO: 'bg-gray-100 text-gray-700 border-gray-300',
};
const PRIO_CORES: Record<string, string> = {
  CRITICO: 'bg-red-600 text-white',
  MUITO_ALTO: 'bg-orange-500 text-white',
  ALTO: 'bg-yellow-500 text-white',
  ESTRUTURANTE: 'bg-indigo-500 text-white',
};
const DIM_ICONS: Record<string, any> = {
  FISICA: Activity, OPERACIONAL: Settings, EMOCIONAL: Brain, PEDAGOGICA: BookOpen, GESTAO: Shield,
};

export default function ProtocolosPage() {
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.get('/protocolos').then(r => {
      setProtocolos(r.data.data || r.data);
      setLoading(false);
    });
  }, []);

  const toggle = (id: string) => setExpanded(e => e === id ? null : id);

  const parseList = (json: string): string[] => { try { return JSON.parse(json || '[]'); } catch { return []; } };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Protocolos de Segurança</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de 10 protocolos hierarquizados — Documento Consolidado AMA Jun/2026 (SOP 09)</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {['FISICA','OPERACIONAL','EMOCIONAL','PEDAGOGICA','GESTAO'].map(d => (
            <span key={d} className={`px-2 py-1 rounded-full text-xs font-medium border ${DIM_CORES[d]}`}>{d}</span>
          ))}
        </div>
      </div>

      {/* Aviso Relâmpago Zero */}
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">Protocolo #1 — Relâmpago Zero (Exceção de autoridade)</p>
          <p className="text-xs text-red-600 mt-0.5">O instrutor tem autoridade total para evacuar a piscina perante relâmpago ou trovão, sem aguardar aprovação. A notificação à supervisão ocorre <strong>depois</strong> da ação. Use o botão "RELÂMPAGO" na página de Incidentes.</p>
        </div>
      </div>

      {/* Aviso diagnóstico individual */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-700">Protocolo #4 — Diagnóstico Individual (bloqueio de avaliação em grupo)</p>
          <p className="text-xs text-amber-600 mt-0.5">A atribuição de fase deve ser feita atleta a atleta. A avaliação em bloco para uma turma inteira é um risco de segurança pedagógica identificado neste documento. O sistema exige seleção individual de atleta em cada avaliação.</p>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar protocolos...</div> : (
        <div className="space-y-3">
          {protocolos.map((p: any) => {
            const Icon = DIM_ICONS[p.dimensao] || Shield;
            const isOpen = expanded === p.id;
            const checklist = parseList(p.checklistItems);
            const sinais = parseList(p.sinaisAlerta);

            return (
              <div key={p.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${p.isRelampago ? 'border-red-400 shadow-red-100 shadow-md' : 'border-gray-200'}`}>
                <button onClick={() => toggle(p.id)} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${PRIO_CORES[p.prioridade]}`}>
                    {p.ranking}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{p.nome}</span>
                      {p.isRelampago && <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold"><Zap className="w-3 h-3" />EMERGÊNCIA</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${DIM_CORES[p.dimensao]}`}>{p.dimensao}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIO_CORES[p.prioridade]}`}>{p.prioridade.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-gray-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Objetivo</h4>
                        <p className="text-sm text-gray-700">{p.objetivo}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Momento de Aplicação</h4>
                        <p className="text-sm text-gray-700">{p.momentoAplicacao}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Responsável</h4>
                      <p className="text-sm text-gray-700 font-medium">{p.responsavel}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Procedimento</h4>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{p.procedimento}</div>
                    </div>

                    {checklist.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Checklist</h4>
                        <ul className="space-y-1.5">
                          {checklist.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="w-4 h-4 mt-0.5 rounded border border-gray-300 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {sinais.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-600 uppercase mb-2">⚠ Sinais de Alerta</h4>
                        <ul className="space-y-1.5">
                          {sinais.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-red-600 uppercase mb-1">Ação em Caso de Falha</h4>
                      <p className="text-sm text-gray-700">{p.acaoFalha}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
