'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import { Plus, Package, ArrowDownCircle, ArrowUpCircle, Settings2, AlertTriangle } from 'lucide-react';

const CATEGORIAS = ['EQUIPAMENTO', 'MATERIAL_LIMPEZA', 'MATERIAL_ESCRITORIO', 'EPI', 'OUTRO'];
const CATEGORIA_LABEL: Record<string, string> = {
  EQUIPAMENTO: 'Equipamento', MATERIAL_LIMPEZA: 'Material de Limpeza', MATERIAL_ESCRITORIO: 'Material de Escritório', EPI: 'EPI', OUTRO: 'Outro',
};
const TIPO_MOVIMENTO_LABEL: Record<string, string> = { ENTRADA: 'Entrada', SAIDA: 'Saída', AJUSTE: 'Ajuste' };
const TIPO_MOVIMENTO_COR: Record<string, string> = {
  ENTRADA: 'bg-green-100 text-green-700', SAIDA: 'bg-red-100 text-red-700', AJUSTE: 'bg-blue-100 text-blue-700',
};

const tabs = ['Itens', 'Movimentos', 'Alertas'] as const;
type Tab = typeof tabs[number];

export default function InventarioPage() {
  const [tab, setTab] = useState<Tab>('Itens');
  const [itens, setItens] = useState<any[]>([]);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [form, setForm] = useState({ nome: '', categoria: 'OUTRO', unidadeId: '', quantidade: '0', quantidadeMin: '0', unidadeMedida: 'UN', localizacao: '' });

  const [movAlvo, setMovAlvo] = useState<any | null>(null);
  const [movForm, setMovForm] = useState({ tipo: 'ENTRADA', quantidade: '1', motivo: '' });

  const loadItens = async () => { const r = await api.get('/inventario/itens'); setItens(r.data.data ?? []); };
  const loadMovimentos = async () => { const r = await api.get('/inventario/movimentos'); setMovimentos(r.data.data ?? []); };
  const loadAlertas = async () => { const r = await api.get('/inventario/alertas'); setAlertas(r.data.data ?? []); };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadItens(), loadMovimentos(), loadAlertas()]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { api.get('/unidades').then((r) => setUnidades(r.data.data ?? r.data ?? [])).catch(() => {}); }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ nome: '', categoria: 'OUTRO', unidadeId: '', quantidade: '0', quantidadeMin: '0', unidadeMedida: 'UN', localizacao: '' });
    setShowForm(true);
  };

  const abrirEditar = (item: any) => {
    setEditando(item);
    setForm({
      nome: item.nome, categoria: item.categoria, unidadeId: item.unidadeId ?? '',
      quantidade: String(item.quantidade), quantidadeMin: String(item.quantidadeMin),
      unidadeMedida: item.unidadeMedida, localizacao: item.localizacao ?? '',
    });
    setShowForm(true);
  };

  const salvar = async () => {
    const payload = {
      nome: form.nome, categoria: form.categoria, unidadeId: form.unidadeId || undefined,
      quantidade: Number(form.quantidade), quantidadeMin: Number(form.quantidadeMin),
      unidadeMedida: form.unidadeMedida, localizacao: form.localizacao || undefined,
    };
    try {
      if (editando) await api.put(`/inventario/itens/${editando.id}`, payload);
      else await api.post('/inventario/itens', payload);
      toast.success(editando ? 'Item atualizado' : 'Item criado');
      setShowForm(false);
      loadAll();
    } catch (e: any) {
      toast.error('Erro ao guardar', e?.response?.data?.message);
    }
  };

  const registarMovimento = async () => {
    if (!movAlvo) return;
    try {
      await api.post(`/inventario/itens/${movAlvo.id}/movimento`, { ...movForm, quantidade: Number(movForm.quantidade) });
      toast.success('Movimento registado');
      setMovAlvo(null);
      setMovForm({ tipo: 'ENTRADA', quantidade: '1', motivo: '' });
      loadAll();
    } catch (e: any) {
      toast.error('Erro ao registar movimento', e?.response?.data?.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventário</h1>
          <p className="text-gray-500 text-sm mt-1">Equipamento, materiais e EPI — entradas, saídas e stock mínimo</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Item
        </button>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1.5',
              tab === t ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
            )}
          >
            {t}
            {t === 'Alertas' && alertas.length > 0 && (
              <span className={cn('text-[10px] font-bold px-1.5 rounded-full', tab === t ? 'bg-white/20' : 'bg-red-100 text-red-700')}>{alertas.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : tab === 'Itens' ? (
        itens.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhum item registado
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3">Categoria</th>
                  <th className="text-left px-4 py-3">Unidade</th>
                  <th className="text-left px-4 py-3">Stock</th>
                  <th className="text-left px-4 py-3">Localização</th>
                  <th className="text-left px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itens.map((item: any) => {
                  const baixo = item.quantidade <= item.quantidadeMin;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
                      <td className="px-4 py-3 text-gray-600">{CATEGORIA_LABEL[item.categoria] ?? item.categoria}</td>
                      <td className="px-4 py-3 text-gray-500">{item.unidade?.nome ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('font-medium', baixo ? 'text-red-600' : 'text-gray-700')}>
                          {item.quantidade} / {item.quantidadeMin} {item.unidadeMedida}
                        </span>
                        {baixo && <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline ml-1.5" />}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.localizacao ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setMovAlvo(item); setMovForm({ tipo: 'ENTRADA', quantidade: '1', motivo: '' }); }} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-200">Movimento</button>
                          <button onClick={() => abrirEditar(item)} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-200">Editar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'Movimentos' ? (
        movimentos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">Nenhum movimento registado</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Quantidade</th>
                  <th className="text-left px-4 py-3">Motivo</th>
                  <th className="text-left px-4 py-3">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movimentos.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{formatDate(m.createdAt, 'dd/MM/yyyy HH:mm')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.item?.nome ?? '—'}</td>
                    <td className="px-4 py-3"><span className={cn('px-2 py-1 rounded-full text-xs font-medium', TIPO_MOVIMENTO_COR[m.tipo])}>{TIPO_MOVIMENTO_LABEL[m.tipo] ?? m.tipo}</span></td>
                    <td className="px-4 py-3 text-gray-700">{m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}</td>
                    <td className="px-4 py-3 text-gray-500">{m.motivo ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{m.responsavel?.email ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : alertas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Sem itens em stock baixo
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertas.map((item: any) => (
            <div key={item.id} className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-gray-900">{item.nome}</span>
              </div>
              <p className="text-sm text-red-700">{item.quantidade} / {item.quantidadeMin} {item.unidadeMedida} — stock mínimo atingido</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">{editando ? 'Editar Item' : 'Novo Item de Inventário'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
              <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                <select value={form.unidadeId} onChange={(e) => setForm((f) => ({ ...f, unidadeId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">— Todas —</option>
                  {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input type="number" value={form.quantidade} onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                <input type="number" value={form.quantidadeMin} onChange={(e) => setForm((f) => ({ ...f, quantidadeMin: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade Medida</label>
                <input value={form.unidadeMedida} onChange={(e) => setForm((f) => ({ ...f, unidadeMedida: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
              <input value={form.localizacao} onChange={(e) => setForm((f) => ({ ...f, localizacao: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.nome} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {movAlvo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-gray-400" /> Movimento — {movAlvo.nome}
            </h2>
            <p className="text-xs text-gray-500">Stock atual: {movAlvo.quantidade} {movAlvo.unidadeMedida}</p>
            <div className="flex gap-2">
              {(['ENTRADA', 'SAIDA', 'AJUSTE'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMovForm((f) => ({ ...f, tipo: t }))}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border flex items-center justify-center gap-1.5',
                    movForm.tipo === t ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200',
                  )}
                >
                  {t === 'ENTRADA' && <ArrowDownCircle className="w-4 h-4" />}
                  {t === 'SAIDA' && <ArrowUpCircle className="w-4 h-4" />}
                  {TIPO_MOVIMENTO_LABEL[t]}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {movForm.tipo === 'AJUSTE' ? 'Delta (pode ser negativo)' : 'Quantidade'}*
              </label>
              <input type="number" value={movForm.quantidade} onChange={(e) => setMovForm((f) => ({ ...f, quantidade: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <input value={movForm.motivo} onChange={(e) => setMovForm((f) => ({ ...f, motivo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setMovAlvo(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={registarMovimento} disabled={!movForm.quantidade} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">Registar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
