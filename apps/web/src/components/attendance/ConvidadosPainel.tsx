'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { getInitials } from '@/lib/utils';
import { Search, UserPlus, Trash2, Users } from 'lucide-react';

const horaLocal = (iso?: string | null) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '');

/** Converte "HH:MM" para ISO no dia da sessão. */
function horaParaIso(dataSessao: string | undefined, hhmm: string) {
  if (!hhmm) return null;
  const base = dataSessao ? new Date(dataSessao) : new Date();
  const [h, m] = hhmm.split(':').map(Number);
  base.setHours(h, m, 0, 0);
  return base.toISOString();
}

/**
 * Atletas de outras turmas que frequentaram esta aula. O registo fica marcado
 * como convidado, com a turma de origem, e não altera a inscrição do atleta.
 */
export default function ConvidadosPainel({
  sessionId, dataSessao, registos, onChange,
}: { sessionId: string; dataSessao?: string; registos: any[]; onChange: () => void }) {
  const [search, setSearch] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const convidados = registos.filter((r) => r.isConvidado);

  useEffect(() => {
    if (search.trim().length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/attendance/sessions/${sessionId}/convidados/candidatos`, { params: { search: search.trim() } });
        setResultados(data.data ?? data);
      } catch { setResultados([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, sessionId]);

  const acao = async (fn: () => Promise<any>, ok?: string) => {
    try { await fn(); if (ok) toast.success(ok); onChange(); }
    catch (e: any) { toast.error('Erro', e?.response?.data?.message ?? 'Tenta novamente'); }
  };

  const adicionar = (s: any) => acao(async () => {
    await api.post(`/attendance/sessions/${sessionId}/convidados`, { studentId: s.id, status: 'PRESENT' });
    setSearch(''); setResultados([]);
  }, `${s.firstName} registado como convidado`);

  const horario = (r: any, campo: 'horaEntrada' | 'horaSaida', valor: string) => acao(() =>
    api.patch(`/attendance/${r.id}/horario`, { [campo]: horaParaIso(dataSessao, valor) }));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-900">Convidados de outras turmas ({convidados.length})</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="relative">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar atleta de qualquer turma ou unidade..."
              className="flex-1 text-sm outline-none" />
          </div>
          {resultados.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg divide-y divide-gray-100 max-h-60 overflow-y-auto z-20">
              {resultados.map((s: any) => {
                const bloqueado = s.inscritoNaTurma || s.jaRegistado;
                return (
                  <button key={s.id} type="button" disabled={bloqueado} onClick={() => adicionar(s)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {s.turmas?.map((t: any) => t.name).join(', ') || 'Sem turma activa'}{s.unidade ? ` · ${s.unidade.nome}` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-500 flex-shrink-0">
                      {s.inscritoNaTurma ? 'é desta turma' : s.jaRegistado ? 'já registado' : <UserPlus className="w-4 h-4 text-indigo-600" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {convidados.length === 0 ? (
          <p className="text-xs text-gray-400">Nenhum convidado nesta aula</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {convidados.map((r: any) => (
              <div key={r.id} className="py-2.5 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {getInitials(r.student?.firstName ?? '', r.student?.lastName ?? '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                    {r.student?.firstName} {r.student?.lastName}
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Convidado</span>
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    Turma de origem: {r.turmaOrigem?.name ?? '—'}{r.unidade ? ` · ${r.unidade.nome}` : ''}
                  </p>
                </div>
                <label className="text-[11px] text-gray-500 flex items-center gap-1">
                  Entrada
                  <input type="time" defaultValue={horaLocal(r.horaEntrada)} onBlur={(e) => e.target.value !== horaLocal(r.horaEntrada) && horario(r, 'horaEntrada', e.target.value)}
                    className="border border-gray-200 rounded-lg px-1.5 py-0.5 text-xs" />
                </label>
                <label className="text-[11px] text-gray-500 flex items-center gap-1">
                  Saída
                  <input type="time" defaultValue={horaLocal(r.horaSaida)} onBlur={(e) => e.target.value !== horaLocal(r.horaSaida) && horario(r, 'horaSaida', e.target.value)}
                    className="border border-gray-200 rounded-lg px-1.5 py-0.5 text-xs" />
                </label>
                <button onClick={() => { if (confirm('Remover este registo de convidado?')) acao(() => api.delete(`/attendance/convidados/${r.id}`)); }}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
