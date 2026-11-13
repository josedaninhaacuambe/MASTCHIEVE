'use client';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/lib/toast';

interface Props {
  studentId: string;
  pacote?: { id: string; nome: string; preco: number; aulasPorSemana?: number | null; ativo: boolean } | null;
  podeAlterar: boolean;
  onChange: () => void;
}

const mt = (v: number) => `${Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

/** Pacote do atleta (define o valor das mensalidades). Só admin/assistente administrativo o alteram. */
export default function PacoteDoAtleta({ studentId, pacote, podeAlterar, onChange }: Props) {
  const [editar, setEditar] = useState(false);
  const [escolha, setEscolha] = useState(pacote?.id ?? '');

  const { data: pacotes = [] } = useQuery<any[]>({
    queryKey: ['pacotes-select'],
    queryFn: async () => (await api.get('/pacotes')).data?.data ?? [],
    enabled: editar,
  });

  const guardar = useMutation({
    mutationFn: () => api.put(`/students/${studentId}`, { pacoteId: escolha || null }),
    onSuccess: () => {
      toast.success('Pacote actualizado', 'As próximas mensalidades usam o preço deste pacote.');
      setEditar(false);
      onChange();
    },
    onError: (e: any) => {
      const m = e?.response?.data?.message;
      toast.error('Não foi possível alterar o pacote', Array.isArray(m) ? m.join(' ') : m);
    },
  });

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-wrap items-center gap-3 justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-gray-500 font-medium">Pacote</div>
          {pacote ? (
            <div className="text-sm font-semibold text-gray-900">
              {pacote.nome} — {mt(pacote.preco)}/mês
              {!pacote.ativo && <span className="ml-2 text-xs text-gray-500">(pacote desactivado)</span>}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Sem pacote atribuído</div>
          )}
        </div>
      </div>
      {podeAlterar && !editar && (
        <button onClick={() => { setEscolha(pacote?.id ?? ''); setEditar(true); }} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50">
          {pacote ? 'Alterar' : 'Atribuir pacote'}
        </button>
      )}
      {podeAlterar && editar && (
        <div className="flex flex-wrap items-center gap-2">
          <select value={escolha} onChange={(e) => setEscolha(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="">— Sem pacote —</option>
            {pacotes.map((p: any) => (
              <option key={p.id} value={p.id}>{p.nome} — {mt(p.preco)}</option>
            ))}
          </select>
          <button onClick={() => guardar.mutate()} disabled={guardar.isPending} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50">
            {guardar.isPending ? 'A guardar...' : 'Guardar'}
          </button>
          <button onClick={() => setEditar(false)} className="text-sm px-3 py-1.5 border rounded-lg">Cancelar</button>
        </div>
      )}
    </div>
  );
}
