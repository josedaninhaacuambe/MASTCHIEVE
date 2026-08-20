'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, MonitorSmartphone, Copy, Check, Power, KeyRound } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';

export default function DispositivosQuiosquePage() {
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', unidadeId: '' });
  const [chaveGerada, setChaveGerada] = useState<{ id: string; nome: string; chave: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await api.get('/rh/presenca/dispositivos');
    setDispositivos(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/unidades').then((r) => setUnidades(r.data.data?.data || r.data.data || [])).catch(() => {});
  }, []);

  const criar = async () => {
    setErro('');
    try {
      const r = await api.post('/rh/presenca/dispositivos', form);
      const criado = r.data.data;
      setChaveGerada({ id: criado.id, nome: criado.nome, chave: criado.chave });
      setShowForm(false);
      setForm({ nome: '', unidadeId: '' });
      load();
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Erro ao criar dispositivo');
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await api.put(`/rh/presenca/dispositivos/${id}/${ativo ? 'desativar' : 'ativar'}`);
    load();
  };

  const rotarChave = async (id: string, nome: string) => {
    const r = await api.put(`/rh/presenca/dispositivos/${id}/rotar-chave`);
    setChaveGerada({ id, nome, chave: r.data.data.chave });
  };

  const copiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiosques de Presença</h1>
          <p className="text-gray-500 text-sm mt-1">Computadores fixos de marcação de presença por impressão digital, um por piscina/unidade</p>
        </div>
        <button onClick={() => { setErro(''); setShowForm(true); }} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Quiosque
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : dispositivos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <MonitorSmartphone className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhum quiosque registado
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <ResponsiveTable>
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Unidade</th>
                <th className="text-left px-4 py-3">Último acesso</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dispositivos.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{d.nome}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{d.unidade?.nome || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{d.ultimoAcesso ? new Date(d.ultimoAcesso).toLocaleString('pt-PT') : 'Nunca'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${d.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {d.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggleAtivo(d.id, d.ativo)} title={d.ativo ? 'Desativar' : 'Ativar'}
                        className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 whitespace-nowrap">
                        <Power className="w-3.5 h-3.5" /> {d.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => rotarChave(d.id, d.nome)} title="Rotacionar chave"
                        className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 whitespace-nowrap">
                        <KeyRound className="w-3.5 h-3.5" /> Rotar chave
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Novo Quiosque</h2>
            {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{erro}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
              <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Receção — Piscina Central" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade*</label>
              <select value={form.unidadeId} onChange={(e) => setForm((f) => ({ ...f, unidadeId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Selecionar —</option>
                {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={criar} disabled={!form.nome || !form.unidadeId}
                className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {chaveGerada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Chave do Quiosque «{chaveGerada.nome}»</h2>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Esta chave só é mostrada agora. Copie-a e insira-a na página de configuração (<code>/quiosque/setup</code>) no computador do quiosque.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID do dispositivo</label>
              <div className="flex gap-2">
                <input readOnly value={chaveGerada.id} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chave</label>
              <div className="flex gap-2">
                <input readOnly value={chaveGerada.chave} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50" />
                <button onClick={() => copiar(`${chaveGerada.id}\n${chaveGerada.chave}`)}
                  className="flex items-center gap-1 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-900">
                  {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button onClick={() => setChaveGerada(null)} className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900">
              Concluído
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
