'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth.store';
import { CalendarDays, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface Linha { nome: string; trabalhadorBm: string; contacto: string; modulo: string; idade: number | null }
interface Turno { turno: string; atletas: Linha[] }
interface Relatorio { data: string; diaSemana: string; unidade: string | null; titulo: string; total: number; turnos: Turno[] }

const LINHAS_POR_BLOCO = 8;

function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function BlocoTurno({ t }: { t: Turno }) {
  // Como na folha: pelo menos 8 linhas por turno, mais se houver mais presenças.
  const linhas = Math.max(LINHAS_POR_BLOCO, t.atletas.length);
  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-sky-700 text-white text-sm font-semibold px-3 py-1.5 flex justify-between">
        <span>{t.turno}</span>
        <span className="font-normal opacity-80">{t.atletas.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-sky-50 text-sky-900">
            <tr>
              <th className="px-1.5 py-1 text-left w-8">Ord</th>
              <th className="px-1.5 py-1 text-left">Nome e Apelido</th>
              <th className="px-1.5 py-1 text-left">Trab. do BM</th>
              <th className="px-1.5 py-1 text-left">Contacto</th>
              <th className="px-1.5 py-1 text-left">Módulo</th>
              <th className="px-1.5 py-1 text-left w-10">Idade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: linhas }).map((_, i) => {
              const a = t.atletas[i];
              return (
                <tr key={i} className="h-6">
                  <td className="px-1.5 text-gray-400">{i + 1}</td>
                  <td className="px-1.5 text-gray-900 whitespace-nowrap">{a?.nome ?? ''}</td>
                  <td className="px-1.5 text-gray-600 whitespace-nowrap">{a?.trabalhadorBm ?? ''}</td>
                  <td className="px-1.5 text-gray-600 whitespace-nowrap">{a?.contacto ?? ''}</td>
                  <td className="px-1.5 text-gray-600 whitespace-nowrap">{a?.modulo ?? ''}</td>
                  <td className="px-1.5 text-gray-600">{a?.idade ?? ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PresencasDiariasPage() {
  const { user } = useAuthStore();
  const escolheUnidade = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [data, setData] = useState(hojeLocal());
  const [unidadeId, setUnidadeId] = useState('');
  const [aExportar, setAExportar] = useState(false);

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades-select'],
    queryFn: async () => { const { data } = await api.get('/unidades'); return (data.data ?? []) as any[]; },
    enabled: escolheUnidade,
  });

  const params = { data, ...(unidadeId && { unidadeId }) };
  const { data: rel, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['relatorio-diario', data, unidadeId],
    queryFn: async () => { const { data: r } = await api.get('/attendance/relatorio-diario', { params }); return (r.data ?? r) as Relatorio; },
    enabled: !!data,
    // As entradas registadas na recepção entram sozinhas na folha; actualiza a cada minuto.
    refetchInterval: 60_000,
  });

  const exportar = async () => {
    setAExportar(true);
    try {
      const res = await api.get('/attendance/relatorio-diario/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presencas-${data}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível exportar o relatório.');
    } finally {
      setAExportar(false);
    }
  };

  const msgErro = (error as any)?.response?.data?.message;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presenças diárias</h1>
          <p className="text-sm text-gray-500 mt-1">Folha do dia por turno, com o módulo e a idade de cada atleta presente. As entradas registadas em Entrada/Saída entram aqui automaticamente (actualiza a cada minuto).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <input type="date" value={data} max={hojeLocal()} onChange={(e) => setData(e.target.value)} className="outline-none bg-transparent" />
          </label>
          {escolheUnidade && (
            <select value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)} className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm">
              <option value="">Todas as unidades</option>
              {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          )}
          <button onClick={() => refetch()} className="p-2 border border-gray-200 bg-white rounded-lg text-gray-500 hover:text-gray-800" title="Actualizar">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportar} disabled={aExportar || !rel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <FileSpreadsheet className="w-4 h-4" /> {aExportar ? 'A exportar…' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {Array.isArray(msgErro) ? msgErro.join(', ') : msgErro || 'Erro ao carregar o relatório.'}
        </div>
      )}
      {isLoading && <p className="text-sm text-gray-400">A carregar…</p>}

      {rel && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-center font-bold text-gray-900 tracking-wide">{rel.titulo}</h2>
            <div className="mt-3 flex flex-wrap justify-center gap-x-8 gap-y-1 text-sm">
              <span><span className="text-gray-500">Dia da Semana:</span> <strong>{rel.diaSemana}</strong></span>
              <span><span className="text-gray-500">Data:</span> <strong>{rel.data.split('-').reverse().join('/')}</strong></span>
              {rel.unidade && <span><span className="text-gray-500">Unidade:</span> <strong>{rel.unidade}</strong></span>}
              <span><span className="text-gray-500">Total de presenças:</span> <strong>{rel.total}</strong></span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {rel.turnos.map((t) => <BlocoTurno key={t.turno} t={t} />)}
          </div>
        </>
      )}
    </div>
  );
}
