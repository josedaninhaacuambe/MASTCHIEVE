'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Sunrise, Sunset, CheckSquare, Square, Plus, X, Save } from 'lucide-react';

type ChecklistItem = { item: string; concluido?: boolean };

const DEFAULT_CHECKLIST: Record<'ABERTURA' | 'FECHO', string[]> = {
  ABERTURA: [
    'Verificar temperatura da piscina',
    'Verificar qualidade da água (cloro/pH)',
    'Verificar equipamentos de segurança',
    'Abrir balneários e áreas comuns',
    'Confirmar presença dos instrutores escalados',
    'Preparar materiais de aula',
  ],
  FECHO: [
    'Fechar torneiras e equipamentos',
    'Verificar e trancar balneários',
    'Recolher materiais utilizados',
    'Conferir caixa/registos do dia',
    'Desligar luzes e equipamentos não essenciais',
    'Trancar portas e ativar alarme',
  ],
};

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function ChecklistCard({ tipo, unidadeId, data, rotina, onChange }: {
  tipo: 'ABERTURA' | 'FECHO'; unidadeId: string; data: string; rotina: any | undefined; onChange: () => void;
}) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
    rotina ? (() => { try { return JSON.parse(rotina.checklist); } catch { return []; } })() : DEFAULT_CHECKLIST[tipo].map((item) => ({ item, concluido: false })),
  );
  const [observacoes, setObservacoes] = useState(rotina?.observacoes ?? '');
  const [novoItem, setNovoItem] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setChecklist(rotina ? (() => { try { return JSON.parse(rotina.checklist); } catch { return []; } })() : DEFAULT_CHECKLIST[tipo].map((item) => ({ item, concluido: false })));
    setObservacoes(rotina?.observacoes ?? '');
  }, [rotina, tipo]);

  const toggle = (i: number) => setChecklist((l) => l.map((it, idx) => (idx === i ? { ...it, concluido: !it.concluido } : it)));
  const remover = (i: number) => setChecklist((l) => l.filter((_, idx) => idx !== i));
  const adicionar = () => {
    if (!novoItem.trim()) return;
    setChecklist((l) => [...l, { item: novoItem.trim(), concluido: false }]);
    setNovoItem('');
  };

  const iniciar = async () => {
    setSaving(true);
    try {
      await api.post('/rotina-diaria', { unidadeId, data, tipo, checklist });
      toast.success(`Checklist de ${tipo === 'ABERTURA' ? 'abertura' : 'fecho'} iniciado`);
      onChange();
    } catch (e: any) {
      toast.error('Erro ao iniciar checklist', e?.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  const guardar = async () => {
    if (!rotina) return;
    setSaving(true);
    try {
      await api.put(`/rotina-diaria/${rotina.id}`, { checklist, observacoes: observacoes || undefined });
      toast.success('Checklist guardado');
      onChange();
    } catch (e: any) {
      toast.error('Erro ao guardar', e?.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  const concluidos = checklist.filter((i) => i.concluido).length;
  const Icon = tipo === 'ABERTURA' ? Sunrise : Sunset;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Icon className={cn('w-4 h-4', tipo === 'ABERTURA' ? 'text-amber-500' : 'text-indigo-500')} />
          {tipo === 'ABERTURA' ? 'Abertura' : 'Fecho'}
        </h3>
        {rotina && (
          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', rotina.concluido ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
            {rotina.concluido ? 'Concluído' : `${concluidos}/${checklist.length}`}
          </span>
        )}
      </div>

      <div className="space-y-1.5 mb-3">
        {checklist.map((it, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <button onClick={() => toggle(i)} className="flex-shrink-0 text-gray-400 hover:text-mastchieve-600">
              {it.concluido ? <CheckSquare className="w-4 h-4 text-green-600" /> : <Square className="w-4 h-4" />}
            </button>
            <span className={cn('text-sm flex-1', it.concluido ? 'text-gray-400 line-through' : 'text-gray-700')}>{it.item}</span>
            <button onClick={() => remover(i)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={novoItem}
          onChange={(e) => setNovoItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          placeholder="Adicionar item..."
          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
        />
        <button onClick={adicionar} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {rotina && (
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações (opcional)"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm mb-3"
        />
      )}

      {rotina ? (
        <button onClick={guardar} disabled={saving} className="w-full flex items-center justify-center gap-1.5 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> {saving ? 'A guardar...' : 'Guardar'}
        </button>
      ) : (
        <button onClick={iniciar} disabled={saving || checklist.length === 0} className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
          {saving ? 'A iniciar...' : 'Iniciar Checklist'}
        </button>
      )}
    </div>
  );
}

export default function RotinaDiariaPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeId, setUnidadeId] = useState('');
  const [data, setData] = useState(hojeISO());
  const [rotinas, setRotinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [unidadesError, setUnidadesError] = useState(false);

  const loadUnidades = () => {
    setUnidadesError(false);
    api.get('/unidades').then((r) => {
      const lista = r.data.data ?? r.data ?? [];
      setUnidades(lista);
      if (lista.length > 0) setUnidadeId((prev) => prev || lista[0].id);
    }).catch((e: any) => {
      setUnidadesError(true);
      toast.error('Erro ao carregar unidades', e?.response?.data?.message ?? 'Tenta novamente');
    });
  };

  useEffect(() => { loadUnidades(); }, []);

  const load = async () => {
    if (!unidadeId) return;
    setLoading(true);
    try {
      const r = await api.get('/rotina-diaria', { params: { unidadeId, data } });
      setRotinas(r.data.data ?? []);
      setLoadError(false);
    } catch (e: any) {
      setLoadError(true);
      toast.error('Erro ao carregar rotina diária', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [unidadeId, data]);

  const rotinaAbertura = rotinas.find((r: any) => r.tipo === 'ABERTURA');
  const rotinaFecho = rotinas.find((r: any) => r.tipo === 'FECHO');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rotina Diária</h1>
        <p className="text-gray-500 text-sm mt-1">Checklist de abertura e fecho por unidade</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>

      {unidadesError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-sm text-red-700">Erro ao carregar unidades. Verifica a ligação ao servidor.</span>
          <button onClick={loadUnidades} className="text-xs text-red-600 hover:underline">Tentar novamente</button>
        </div>
      )}

      {loadError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-sm text-red-700">Erro ao carregar rotina diária. Verifica a ligação ao servidor.</span>
          <button onClick={() => load()} className="text-xs text-red-600 hover:underline">Tentar novamente</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : !unidadeId ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">Nenhuma unidade disponível</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChecklistCard tipo="ABERTURA" unidadeId={unidadeId} data={data} rotina={rotinaAbertura} onChange={load} />
          <ChecklistCard tipo="FECHO" unidadeId={unidadeId} data={data} rotina={rotinaFecho} onChange={load} />
        </div>
      )}
    </div>
  );
}
