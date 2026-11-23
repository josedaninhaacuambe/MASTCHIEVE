'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ChevronDown, Clock, Search, User, Users, X } from 'lucide-react';

interface Atleta {
  id: string; nome: string; idade: number | null; genero: string; contacto: string | null;
  isActive: boolean; estadoInscricao?: string; etiqueta: string | null; trabalhadorBm: string | null;
  pacote: string | null; moduloEmCurso: string | null;
}
interface Turma {
  id: string; nome: string; nivel: string; estado: string; capacidade: number; ocupacao: number; pista?: string | null;
  horarios: { day?: string; startTime?: string; endTime?: string }[]; modulos: string[]; instrutor: string | null; atletas: Atleta[];
}
interface Detalhe {
  unidade: { id: string; nome: string; codigo?: string; endereco?: string };
  totais: { turmas: number; atletasEmTurmas: number; semTurma: number; bm: number };
  turmas: Turma[];
  semTurma: Atleta[];
}

function TabelaAtletas({ atletas }: { atletas: Atleta[] }) {
  if (!atletas.length) return <p className="text-sm text-gray-400 px-4 py-3">Sem atletas.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th className="text-left px-3 py-2 w-10">Ord</th>
            <th className="text-left px-3 py-2">Nome e apelido</th>
            <th className="text-left px-3 py-2">Idade</th>
            <th className="text-left px-3 py-2">Módulo</th>
            <th className="text-left px-3 py-2">Contacto</th>
            <th className="text-left px-3 py-2">Pacote / BM</th>
            <th className="text-left px-3 py-2">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {atletas.map((a, i) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-400">{i + 1}</td>
              <td className="px-3 py-2">
                <Link href={`/students/${a.id}`} className="font-medium text-gray-900 hover:text-teal-700">{a.nome}</Link>
              </td>
              <td className="px-3 py-2 text-gray-600">{a.idade ?? '—'}</td>
              <td className="px-3 py-2 text-gray-600">{a.moduloEmCurso ?? '—'}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{a.contacto ?? '—'}</td>
              <td className="px-3 py-2">
                {a.etiqueta === 'BM'
                  ? <span title={a.trabalhadorBm ?? undefined} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">BM{a.trabalhadorBm ? ` · ${a.trabalhadorBm}` : ''}</span>
                  : <span className="text-gray-600">{a.pacote ?? '—'}</span>}
              </td>
              <td className="px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {a.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DetalheUnidade({ unidadeId, onClose }: { unidadeId: string; onClose: () => void }) {
  const [dados, setDados] = useState<Detalhe | null>(null);
  const [erro, setErro] = useState('');
  const [aberta, setAberta] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState('');

  useEffect(() => {
    let vivo = true;
    api.get(`/unidades/${unidadeId}/detalhe`)
      .then(({ data }) => { if (vivo) setDados(data.data ?? data); })
      .catch((e) => { if (vivo) setErro(e?.response?.data?.message ?? 'Não foi possível carregar a unidade.'); });
    return () => { vivo = false; };
  }, [unidadeId]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const termo = pesquisa.trim().toLowerCase();
  const filtrar = (l: Atleta[]) => (termo ? l.filter((a) => a.nome.toLowerCase().includes(termo)) : l);
  const turmas = useMemo(
    () => (dados?.turmas ?? []).map((t) => ({ ...t, visiveis: filtrar(t.atletas) })).filter((t) => !termo || t.visiveis.length || t.nome.toLowerCase().includes(termo)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dados, termo],
  );
  const semTurma = filtrar(dados?.semTurma ?? []);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-5xl h-full bg-gray-50 overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <span className="text-xs text-teal-600 font-bold tracking-wider">{dados?.unidade.codigo}</span>
            <h2 className="text-lg font-bold text-gray-900">{dados?.unidade.nome ?? 'Unidade'}</h2>
            {dados?.unidade.endereco && <p className="text-xs text-gray-500">{dados.unidade.endereco}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Fechar"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{erro}</div>}
          {!dados && !erro && <p className="text-sm text-gray-400">A carregar…</p>}

          {dados && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Turmas', dados.totais.turmas],
                  ['Atletas em turmas', dados.totais.atletasEmTurmas],
                  ['Sem turma', dados.totais.semTurma],
                  ['Atletas BM', dados.totais.bm],
                ].map(([l, v]) => (
                  <div key={l as string} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{v}</div>
                    <div className="text-xs text-gray-500">{l}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Procurar atleta ou turma…" className="flex-1 text-sm outline-none bg-transparent" />
              </div>

              {turmas.map((t) => {
                const aberto = aberta === t.id || !!termo;
                const pct = t.capacidade ? Math.min(100, Math.round((t.ocupacao / t.capacidade) * 100)) : 0;
                return (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button onClick={() => setAberta(aberta === t.id ? null : t.id)} className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 hover:bg-gray-50">
                      <div className="flex-1 min-w-[12rem]">
                        <div className="font-semibold text-gray-900">{t.nome}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          {t.horarios.length > 0 && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                              {t.horarios.map((h) => `${h.day ?? ''} ${h.startTime ?? ''}${h.endTime ? `–${h.endTime}` : ''}`.trim()).join(' · ')}
                            </span>
                          )}
                          {t.instrutor && <span className="flex items-center gap-1"><User className="w-3 h-3" />{t.instrutor}</span>}
                          {t.modulos.length > 0 && <span>Módulos: {t.modulos.join(', ')}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className={t.ocupacao >= t.capacidade ? 'text-red-600 font-semibold' : 'text-gray-700'}>{t.ocupacao}/{t.capacidade}</span>
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-teal-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                    </button>
                    {aberto && (
                      <div className="border-t border-gray-100">
                        <TabelaAtletas atletas={t.visiveis} />
                        <div className="px-4 py-2 border-t border-gray-100 text-right">
                          <Link href={`/classes/${t.id}`} className="text-xs font-medium text-teal-700 hover:underline">Abrir turma →</Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!turmas.length && <p className="text-sm text-gray-400">Nenhuma turma{termo ? ' corresponde à pesquisa' : ' nesta unidade'}.</p>}

              <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <div className="px-4 py-3 bg-amber-50 text-sm font-semibold text-amber-800">Atletas da unidade sem turma ({semTurma.length})</div>
                <TabelaAtletas atletas={semTurma} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
