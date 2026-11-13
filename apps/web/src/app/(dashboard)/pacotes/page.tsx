'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Pencil, Ban, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth.store';

interface Pacote {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  aulasPorSemana?: number | null;
  ativo: boolean;
  _count?: { students: number };
}

const vazio = { nome: '', descricao: '', preco: '', aulasPorSemana: '' };

function mensagemErro(e: any) {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(' ') : m || 'Erro inesperado';
}

const mt = (v: number) => `${Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

export default function PacotesPage() {
  const role = useAuthStore((s: any) => s.user?.role);
  const podeGerir = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const qc = useQueryClient();
  const [editar, setEditar] = useState<Pacote | null>(null);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<any>(vazio);

  const { data: pacotes = [], isLoading } = useQuery<Pacote[]>({
    queryKey: ['pacotes', 'todos'],
    queryFn: () => api.get('/pacotes', { params: { todos: true } }).then((r) => r.data?.data ?? []),
  });

  const abrir = (p?: Pacote) => {
    setEditar(p ?? null);
    setForm(p
      ? { nome: p.nome, descricao: p.descricao ?? '', preco: String(p.preco), aulasPorSemana: p.aulasPorSemana ? String(p.aulasPorSemana) : '' }
      : vazio);
    setAberto(true);
  };

  const guardar = useMutation({
    mutationFn: () => {
      const body: any = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || undefined,
        preco: Number(String(form.preco).replace(',', '.')),
        aulasPorSemana: form.aulasPorSemana ? Number(form.aulasPorSemana) : undefined,
      };
      return editar ? api.patch(`/pacotes/${editar.id}`, body) : api.post('/pacotes', body);
    },
    onSuccess: () => {
      toast.success(editar ? 'Pacote actualizado' : 'Pacote criado', 'O preço aplica-se às novas inscrições e mensalidades.');
      qc.invalidateQueries({ queryKey: ['pacotes'] });
      setAberto(false);
    },
    onError: (e) => toast.error('Não foi possível guardar', mensagemErro(e)),
  });

  const alternar = useMutation({
    mutationFn: (p: Pacote) => (p.ativo ? api.delete(`/pacotes/${p.id}`) : api.patch(`/pacotes/${p.id}`, { ativo: true })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacotes'] }),
    onError: (e) => toast.error('Erro', mensagemErro(e)),
  });

  if (!podeGerir) {
    return <div className="p-6 text-sm text-gray-600">Apenas o administrador pode gerir pacotes e preços.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Package className="w-6 h-6" /> Pacotes e Preços</h1>
          <p className="text-sm text-gray-500">O pacote escolhido na inscrição define o valor da mensalidade do atleta.</p>
        </div>
        <button onClick={() => abrir()} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Novo pacote
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">A carregar...</div>
      ) : pacotes.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-sm text-gray-500">Ainda não há pacotes. Crie o primeiro.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pacotes.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl border p-5 space-y-2 ${p.ativo ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {p.ativo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{mt(p.preco)}<span className="text-sm font-normal text-gray-500"> / mês</span></div>
              {p.aulasPorSemana ? <div className="text-sm text-gray-600">{p.aulasPorSemana} aula(s) por semana</div> : null}
              {p.descricao ? <p className="text-sm text-gray-600 whitespace-pre-line">{p.descricao}</p> : null}
              <div className="text-xs text-gray-500">{p._count?.students ?? 0} atleta(s) neste pacote</div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => abrir(p)} className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50">
                  <Pencil className="w-4 h-4" /> Editar
                </button>
                <button
                  onClick={() => { if (!p.ativo || confirm(`Desactivar o pacote "${p.nome}"? Deixa de aparecer nas inscrições; os atletas actuais mantêm-no.`)) alternar.mutate(p); }}
                  disabled={alternar.isPending}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                >
                  {p.ativo ? <><Ban className="w-4 h-4" /> Desactivar</> : <><CheckCircle2 className="w-4 h-4" /> Reactivar</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {aberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">{editar ? 'Editar pacote' : 'Novo pacote'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={120} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ex.: Mensal 2x por semana" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço mensal (MT)*</label>
              <input type="number" min={0} step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aulas por semana</label>
              <input type="number" min={1} max={14} value={form.aulasPorSemana} onChange={(e) => setForm({ ...form, aulasPorSemana: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {editar && (editar._count?.students ?? 0) > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                Mudar o preço não altera mensalidades já geradas; aplica-se às próximas.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setAberto(false)} className="px-4 py-2 text-sm border rounded-lg">Cancelar</button>
              <button
                onClick={() => guardar.mutate()}
                disabled={guardar.isPending || form.nome.trim().length < 2 || form.preco === '' || Number(form.preco) < 0}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {guardar.isPending ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
