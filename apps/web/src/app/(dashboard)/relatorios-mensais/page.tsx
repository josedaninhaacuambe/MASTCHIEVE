'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/utils';
import { FileBarChart, FileDown, RefreshCw, Users, TrendingUp, Wallet, AlertTriangle, MessageSquareWarning, CalendarDays, PackageX } from 'lucide-react';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function RelatoriosMensaisPage() {
  const [lista, setLista] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState({ unidadeId: '', mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/relatorios-mensais');
      setLista(r.data.data ?? []);
      setLoadError(false);
    } catch (e: any) {
      setLoadError(true);
      toast.error('Erro ao carregar relatórios', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { api.get('/unidades').then((r) => setUnidades(r.data.data ?? r.data ?? [])).catch(() => {}); }, []);

  const gerar = async () => {
    setGerando(true);
    try {
      await api.post('/relatorios-mensais/gerar', {
        unidadeId: form.unidadeId || undefined,
        mes: form.mes,
        ano: form.ano,
      });
      toast.success('Relatório gerado');
      setShowForm(false);
      load();
    } catch (e: any) {
      toast.error('Erro ao gerar relatório', e?.response?.data?.message);
    } finally {
      setGerando(false);
    }
  };

  const exportar = async (r: any) => {
    try {
      const response = await api.get(`/relatorios-mensais/${r.id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mastchieve-relatorio-${r.ano}-${r.mes}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar PDF');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Mensais</h1>
          <p className="text-gray-500 text-sm mt-1">Snapshot agregado de alunos, presenças, financeiro, incidentes e mais, por mês/unidade</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Gerar Relatório
        </button>
      </div>

      {loadError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Erro ao carregar relatórios. Verifica a ligação ao servidor.
          </div>
          <button onClick={() => load()} className="text-xs text-red-600 hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : lista.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <FileBarChart className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhum relatório gerado ainda
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lista.map((r: any) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{MESES[r.mes - 1]} {r.ano}</h3>
                  <p className="text-xs text-gray-400">{r.unidade?.nome ?? 'Todas as unidades'} · gerado em {formatDate(r.updatedAt ?? r.createdAt)}</p>
                </div>
                <button onClick={() => exportar(r)} className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                  <FileDown className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-gray-500">Alunos ativos</span>
                  <span className="ml-auto font-semibold text-gray-900">{r.totalAlunos}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-gray-500">Novas inscrições</span>
                  <span className="ml-auto font-semibold text-gray-900">{r.novasInscricoes}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-mastchieve-500" />
                  <span className="text-gray-500">Presença média</span>
                  <span className="ml-auto font-semibold text-gray-900">{r.taxaPresencaMedia}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-gray-500">Receita</span>
                  <span className="ml-auto font-semibold text-gray-900">MT {Number(r.receitaTotal).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-gray-500">Incidentes graves</span>
                  <span className="ml-auto font-semibold text-gray-900">{r.incidentesGraves}/{r.totalIncidentes}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquareWarning className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-gray-500">Reclamações</span>
                  <span className="ml-auto font-semibold text-gray-900">{r.totalReclamacoes}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PackageX className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-gray-500">Stock baixo</span>
                  <span className="ml-auto font-semibold text-gray-900">{r.itensStockBaixo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileBarChart className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-gray-500">Pagamentos em atraso</span>
                  <span className="ml-auto font-semibold text-gray-900">{r.pagamentosEmAtraso}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Presenças por faixa etária</p>
                {(r.presencasPorFaixaEtaria ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400">Regenerar relatório para ver dados por faixa etária</p>
                ) : (
                  <div className="space-y-1.5">
                    {r.presencasPorFaixaEtaria.map((f: any) => (
                      <div key={f.faixa} className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-gray-500 flex-shrink-0">{f.label}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-mastchieve-500 rounded-full" style={{ width: `${f.taxa}%` }} />
                        </div>
                        <span className="w-24 text-right text-gray-600">{f.presentes}/{f.total} · {f.taxa}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Gerar Relatório Mensal</h2>
            <p className="text-xs text-gray-500">Se já existir um relatório para o mês/unidade selecionados, este será regenerado com os dados actuais.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                <select value={form.mes} onChange={(e) => setForm((f) => ({ ...f, mes: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                <input type="number" value={form.ano} onChange={(e) => setForm((f) => ({ ...f, ano: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <select value={form.unidadeId} onChange={(e) => setForm((f) => ({ ...f, unidadeId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Todas as unidades —</option>
                {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={gerar} disabled={gerando} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                {gerando ? 'A gerar...' : 'Gerar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
