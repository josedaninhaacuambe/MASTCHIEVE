'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Plus, TrendingUp, Users, CheckCircle, XCircle, Phone, Mail, Building2, Megaphone, AlertTriangle } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/responsive-table';

const ESTADOS = ['NOVO','CONTACTADO','AGENDADO','CONVERTIDO','PERDIDO'];
const ORIGENS = ['REFERIDO','REDES_SOCIAIS','OPEN_DAY','WALK_IN','WEBSITE','CAMPANHA','OUTRO'];
const CORES: Record<string, string> = { NOVO:'bg-blue-100 text-blue-700', CONTACTADO:'bg-yellow-100 text-yellow-700', AGENDADO:'bg-purple-100 text-purple-700', CONVERTIDO:'bg-green-100 text-green-700', PERDIDO:'bg-red-100 text-red-700' };

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [form, setForm] = useState({ nome:'', email:'', telefone:'', origem:'WALK_IN', campanha:'', notas:'' });

  const [unidades, setUnidades] = useState<any[]>([]);
  const [showCampanha, setShowCampanha] = useState(false);
  const [campanhaFiltro, setCampanhaFiltro] = useState({ origem: '', estado: '', unidadeId: '' });
  const [campanhaMensagem, setCampanhaMensagem] = useState('');
  const [campanhaEnviada, setCampanhaEnviada] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([
        api.get('/leads', { params: { estado: filtroEstado || undefined } }),
        api.get('/leads/pipeline'),
      ]);
      setLeads(l.data.data || l.data);
      setPipeline(p.data.data || p.data);
      setLoadError(false);
    } catch (e: any) {
      setLoadError(true);
      toast.error('Erro ao carregar leads', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filtroEstado]);
  useEffect(() => { api.get('/unidades').then((r) => setUnidades(r.data.data ?? r.data ?? [])).catch(() => {}); }, []);

  const abrirCampanha = () => {
    setCampanhaFiltro({ origem: '', estado: '', unidadeId: '' });
    setCampanhaMensagem('');
    setCampanhaEnviada(null);
    setShowCampanha(true);
  };

  const enviarCampanha = async () => {
    setEnviando(true);
    try {
      const r = await api.post('/leads/campanha', {
        origem: campanhaFiltro.origem || undefined,
        estado: campanhaFiltro.estado || undefined,
        unidadeId: campanhaFiltro.unidadeId || undefined,
        mensagem: campanhaMensagem,
      });
      setCampanhaEnviada(r.data.data?.enfileirados ?? r.data.enfileirados ?? 0);
    } catch (e: any) {
      toast.error('Erro ao enviar campanha', e?.response?.data?.message);
    } finally {
      setEnviando(false);
    }
  };

  const salvar = async () => {
    setSaving(true);
    try {
      await api.post('/leads', form);
      toast.success('Lead criado');
      setShowForm(false);
      setForm({ nome:'', email:'', telefone:'', origem:'WALK_IN', campanha:'', notas:'' });
      load();
    } catch (e: any) {
      toast.error('Erro ao criar lead', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const avancar = async (id: string, estadoAtual: string) => {
    const idx = ESTADOS.indexOf(estadoAtual);
    if (idx >= 3) return;
    try {
      await api.put(`/leads/${id}`, { estado: ESTADOS[idx + 1] });
      load();
    } catch (e: any) {
      toast.error('Erro ao avançar lead', e?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  const p = pipeline.pipeline || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM — Captação de Leads</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie o pipeline de potenciais alunos (SOP 01)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={abrirCampanha} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium">
            <Megaphone className="w-4 h-4" /> Enviar Campanha
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Novo Lead
          </button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ESTADOS.map(e => (
          <div key={e} onClick={() => setFiltroEstado(filtroEstado === e ? '' : e)} className={`rounded-xl p-4 cursor-pointer border-2 transition-all ${filtroEstado === e ? 'border-blue-500 shadow-md' : 'border-transparent'} ${e==='NOVO'?'bg-blue-50':e==='CONTACTADO'?'bg-yellow-50':e==='AGENDADO'?'bg-purple-50':e==='CONVERTIDO'?'bg-green-50':'bg-red-50'}`}>
            <div className="text-2xl font-bold text-gray-800">{p[e] || 0}</div>
            <div className="text-xs text-gray-500 mt-1">{e}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <span className="text-sm text-blue-800 font-medium">Taxa de conversão: <strong>{pipeline.conversao || 0}%</strong> (meta: ≥30%)</span>
        <span className="text-sm text-gray-500 ml-auto">Total: {pipeline.total || 0} leads</span>
      </div>

      {loadError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Erro ao carregar leads. Verifica a ligação ao servidor.
          </div>
          <button onClick={() => load()} className="text-xs text-red-600 hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Lista */}
      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <ResponsiveTable>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nome','Contacto','Origem','Unidade','Estado','Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum lead encontrado</td></tr>}
              {leads.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{l.nome}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      {l.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{l.email}</span>}
                      {l.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{l.telefone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{l.origem}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{l.unidade?.codigo || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${CORES[l.estado]}`}>{l.estado}</span>
                  </td>
                  <td className="px-4 py-3">
                    {l.estado !== 'CONVERTIDO' && l.estado !== 'PERDIDO' && (
                      <button onClick={() => avancar(l.id, l.estado)} className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">Avançar →</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Novo Lead</h2>
            {[
              { label:'Nome*', key:'nome', type:'text' },
              { label:'Email', key:'email', type:'email' },
              { label:'Telefone', key:'telefone', type:'tel' },
              { label:'Campanha', key:'campanha', type:'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
              <select value={form.origem} onChange={e => setForm(f => ({ ...f, origem: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.nome || saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Campanha */}
      {showCampanha && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-600" /> Enviar Campanha
            </h2>

            {campanhaEnviada === null ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                  <select value={campanhaFiltro.origem} onChange={e => setCampanhaFiltro(f => ({ ...f, origem: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Todas</option>
                    {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select value={campanhaFiltro.estado} onChange={e => setCampanhaFiltro(f => ({ ...f, estado: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Todos</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select value={campanhaFiltro.unidadeId} onChange={e => setCampanhaFiltro(f => ({ ...f, unidadeId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Todas</option>
                    {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                  <textarea value={campanhaMensagem} onChange={e => setCampanhaMensagem(e.target.value)} rows={4}
                    placeholder="Escreva a mensagem da campanha..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCampanha(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                  <button onClick={enviarCampanha} disabled={!campanhaMensagem.trim() || enviando}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                    {enviando ? 'A enviar...' : 'Enviar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                  {campanhaEnviada} mensagem{campanhaEnviada === 1 ? '' : 's'} enfileirada{campanhaEnviada === 1 ? '' : 's'} com sucesso. Confirme o envio manual na página de WhatsApp.
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCampanha(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Fechar</button>
                  <Link href="/assistente/whatsapp" className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 text-center">
                    Ir para WhatsApp
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
