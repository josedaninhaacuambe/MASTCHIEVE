'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import { Plus, Users2, Phone, CheckCircle2, AlertTriangle } from 'lucide-react';

const TIPOS_VISITANTE = ['VISITANTE', 'ENCARREGADO', 'FORNECEDOR', 'OUTRO'];
const TIPO_LABEL: Record<string, string> = {
  VISITANTE: 'Visitante', ENCARREGADO: 'Encarregado', FORNECEDOR: 'Fornecedor', OUTRO: 'Outro',
};
const ESTADO_COR: Record<string, string> = {
  ABERTO: 'bg-amber-100 text-amber-700',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
  RESOLVIDO: 'bg-green-100 text-green-700',
};
const ESTADO_LABEL: Record<string, string> = {
  ABERTO: 'Aberto', EM_ANDAMENTO: 'Em andamento', RESOLVIDO: 'Resolvido',
};

export default function AtendimentoPage() {
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ABERTO' | 'RESOLVIDO'>('TODOS');
  const [showForm, setShowForm] = useState(false);
  const [resolverAlvo, setResolverAlvo] = useState<any | null>(null);
  const [desfecho, setDesfecho] = useState('');
  const [saving, setSaving] = useState(false);
  const [resolvendo, setResolvendo] = useState(false);

  const [form, setForm] = useState({ nome: '', contacto: '', tipoVisitante: 'VISITANTE', motivo: '', unidadeId: '', prazo: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filtroEstado !== 'TODOS') params.estado = filtroEstado;
      const r = await api.get('/atendimento', { params });
      setAtendimentos(r.data.data ?? []);
      setLoadError(false);
    } catch (e: any) {
      setLoadError(true);
      toast.error('Erro ao carregar atendimentos', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filtroEstado]);
  useEffect(() => { api.get('/unidades').then((r) => setUnidades(r.data.data ?? r.data ?? [])).catch(() => {}); }, []);

  const salvar = async () => {
    setSaving(true);
    try {
      await api.post('/atendimento', { ...form, unidadeId: form.unidadeId || undefined, prazo: form.prazo || undefined });
      toast.success('Atendimento registado');
      setShowForm(false);
      setForm({ nome: '', contacto: '', tipoVisitante: 'VISITANTE', motivo: '', unidadeId: '', prazo: '' });
      load();
    } catch (e: any) {
      toast.error('Erro ao registar', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const resolver = async () => {
    if (!resolverAlvo) return;
    setResolvendo(true);
    try {
      await api.put(`/atendimento/${resolverAlvo.id}/resolver`, { desfecho });
      toast.success('Atendimento resolvido');
      setResolverAlvo(null);
      setDesfecho('');
      load();
    } catch (e: any) {
      toast.error('Erro ao resolver', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setResolvendo(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atendimento e Receção</h1>
          <p className="text-gray-500 text-sm mt-1">Registo de visitantes, encarregados e fornecedores atendidos na receção</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Registar Atendimento
        </button>
      </div>

      <div className="flex gap-2">
        {(['TODOS', 'ABERTO', 'RESOLVIDO'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltroEstado(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border',
              filtroEstado === f ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
            )}
          >
            {f === 'TODOS' ? 'Todos' : ESTADO_LABEL[f]}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Erro ao carregar atendimentos. Verifica a ligação ao servidor.
          </div>
          <button onClick={() => load()} className="text-xs text-red-600 hover:underline">Tentar novamente</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : atendimentos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <Users2 className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhum atendimento registado
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Motivo</th>
                <th className="text-left px-4 py-3">Encaminhado</th>
                <th className="text-left px-4 py-3">Prazo</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {atendimentos.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {a.nome}
                    {a.contacto && <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {a.contacto}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{TIPO_LABEL[a.tipoVisitante] ?? a.tipoVisitante}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={a.motivo}>{a.motivo}</td>
                  <td className="px-4 py-3 text-gray-500">{a.encaminhadoPara?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.prazo ? formatDate(a.prazo, 'dd/MM/yyyy HH:mm') : '—'}</td>
                  <td className="px-4 py-3"><span className={cn('px-2 py-1 rounded-full text-xs font-medium', ESTADO_COR[a.estado] || 'bg-gray-100 text-gray-600')}>{ESTADO_LABEL[a.estado] ?? a.estado}</span></td>
                  <td className="px-4 py-3">
                    {a.estado !== 'RESOLVIDO' && (
                      <button onClick={() => { setResolverAlvo(a); setDesfecho(''); }} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Registar Atendimento</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
              <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                <input value={form.contacto} onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={form.tipoVisitante} onChange={(e) => setForm((f) => ({ ...f, tipoVisitante: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {TIPOS_VISITANTE.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo*</label>
              <textarea value={form.motivo} onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                <select value={form.unidadeId} onChange={(e) => setForm((f) => ({ ...f, unidadeId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">— Não especificar —</option>
                  {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de resposta</label>
                <input type="datetime-local" value={form.prazo} onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.nome || !form.motivo || saving} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">{saving ? 'A registar...' : 'Registar'}</button>
            </div>
          </div>
        </div>
      )}

      {resolverAlvo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Resolver Atendimento</h2>
            <p className="text-sm text-gray-500">{resolverAlvo.nome} — {resolverAlvo.motivo}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desfecho*</label>
              <textarea value={desfecho} onChange={(e) => setDesfecho(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setResolverAlvo(null)} disabled={resolvendo} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={resolver} disabled={!desfecho.trim() || resolvendo} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">{resolvendo ? 'A confirmar...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
