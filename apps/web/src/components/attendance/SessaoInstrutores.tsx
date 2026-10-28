'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn, getInitials } from '@/lib/utils';
import { GraduationCap, Save, Check } from 'lucide-react';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/api\/v1\/?$/, '');
export const avatarSrc = (url?: string | null) => (!url ? null : /^https?:\/\//i.test(url) ? url : `${API_ORIGIN}${url}`);

/**
 * Instrutores que efectivamente leccionaram a aula. Qualquer instrutor activo
 * de qualquer unidade pode ser escolhido — a ligação habitual do instrutor à
 * unidade não muda.
 */
export default function SessaoInstrutores({ sessionId, sugeridos = [] }: { sessionId: string; sugeridos?: string[] }) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [alterado, setAlterado] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);

  const { data: opcoes = [] } = useQuery<any[]>({
    queryKey: ['instructors-options'],
    queryFn: async () => { const { data } = await api.get('/instructors/options'); return data.data ?? data; },
    staleTime: 5 * 60_000,
  });
  const { data: registados, refetch } = useQuery<any[]>({
    queryKey: ['session-instrutores', sessionId],
    queryFn: async () => { const { data } = await api.get(`/attendance/sessions/${sessionId}/instrutores`); return data.data ?? data; },
  });

  useEffect(() => {
    if (!registados) return;
    setSelecionados(registados.length ? registados.map((r: any) => r.instructorId) : sugeridos);
    setAlterado(!registados.length && sugeridos.length > 0);
  }, [registados, sugeridos.join(',')]);

  const toggle = (id: string) => {
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setAlterado(true);
  };

  const guardar = async () => {
    if (!selecionados.length) { toast.error('Escolha pelo menos um instrutor'); return; }
    setAGuardar(true);
    try {
      await api.put(`/attendance/sessions/${sessionId}/instrutores`, { instructorIds: selecionados });
      toast.success('Instrutores da aula registados');
      setAlterado(false);
      refetch();
    } catch (e: any) {
      toast.error('Erro ao guardar instrutores', e?.response?.data?.message);
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Instrutores que deram a aula</span>
        </div>
        {alterado && (
          <button onClick={guardar} disabled={aGuardar}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {aGuardar ? 'A guardar...' : 'Guardar'}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((i: any) => {
          const sel = selecionados.includes(i.id);
          const img = avatarSrc(i.avatarUrl);
          return (
            <button key={i.id} type="button" onClick={() => toggle(i.id)}
              title={i.unidades?.map((u: any) => u.nome).join(', ')}
              className={cn('flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-xs transition',
                sel ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}>
              {img
                ? <img src={img} alt="" className="w-6 h-6 rounded-full object-cover" />
                : <span className="w-6 h-6 rounded-full bg-gray-200 text-[10px] font-bold flex items-center justify-center text-gray-600">{getInitials(i.firstName, i.lastName)}</span>}
              {i.firstName} {i.lastName}
              {sel && <Check className="w-3.5 h-3.5" />}
            </button>
          );
        })}
        {opcoes.length === 0 && <p className="text-xs text-gray-400">Sem instrutores activos</p>}
      </div>
    </div>
  );
}
