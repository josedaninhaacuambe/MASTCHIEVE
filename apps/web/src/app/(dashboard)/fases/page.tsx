'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Award, Star, Fish } from 'lucide-react';

const NIVEL_CORES: Record<string, string> = { AMA: 'from-blue-400 to-cyan-500', INTERMEDIARIO: 'from-purple-400 to-violet-500', AVANCADO: 'from-amber-400 to-orange-500' };
const CERT_CORES: Record<string, string> = { BRONZE: 'text-amber-700 bg-amber-100', PRATA: 'text-gray-600 bg-gray-100', OURO: 'text-yellow-700 bg-yellow-100' };

export default function FasesPage() {
  const [fases, setFases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/fases').then(r => { setFases(r.data.data || r.data); setLoading(false); });
  }, []);

  const niveis = ['AMA', 'INTERMEDIARIO', 'AVANCADO'];
  const labels: Record<string, string> = { AMA: 'Nível AMA — Iniciação', INTERMEDIARIO: 'Nível Intermédio', AVANCADO: 'Nível Avançado' };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progressão Pedagógica — 9 Fases</h1>
        <p className="text-gray-500 text-sm mt-1">Metodologia oficial Mastchieve com certificação Bronze, Prata e Ouro</p>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="space-y-8">
          {niveis.map(nivel => (
            <div key={nivel}>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${NIVEL_CORES[nivel]} text-white font-semibold text-sm mb-4`}>
                <Fish className="w-4 h-4" />
                {labels[nivel]}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fases.filter((f: any) => f.nivel === nivel).map((fase: any) => {
                  const criterios = (() => { try { return JSON.parse(fase.criterios); } catch { return []; } })();
                  return (
                    <div key={fase.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`h-2 bg-gradient-to-r ${NIVEL_CORES[nivel]}`} />
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-xs text-gray-400 font-medium mb-1">Fase {fase.ordem}</div>
                            <h3 className="font-bold text-gray-900 text-lg">{fase.nome}</h3>
                            <p className="text-gray-500 text-sm">{fase.descricao}</p>
                          </div>
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${CERT_CORES[fase.certificacao]}`}>
                            <Award className="w-3 h-3" />
                            {fase.certificacao}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Critérios</p>
                          {criterios.map((c: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                              {c}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs text-gray-500">Assiduidade mínima: {fase.assiduidade}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
