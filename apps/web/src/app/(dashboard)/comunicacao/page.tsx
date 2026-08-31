'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle, Image, Video, FileText, Megaphone, PhoneCall, Search } from 'lucide-react';

const TIPOS = ['POST_REDES_SOCIAIS','CAMPANHA_EMAIL','VIDEO','FOTOGRAFIAS','EVENTO_MARKETING','INFORME','PROMOCAO','OUTRO'];
const CANAIS_ENVIO: Record<string, string> = { WHATSAPP: 'WhatsApp', EMAIL: 'Email', AMBOS: 'WhatsApp + Email' };
const ESTADOS_CORES: Record<string, string> = { RASCUNHO:'bg-gray-100 text-gray-600', EM_APROVACAO:'bg-yellow-100 text-yellow-700', APROVADO:'bg-green-100 text-green-700', PUBLICADO:'bg-purple-100 text-purple-700', CANCELADO:'bg-red-100 text-red-700' };
const TIPO_ICONS: Record<string, any> = { POST_REDES_SOCIAIS: Megaphone, CAMPANHA_EMAIL: MessageSquare, VIDEO: Video, FOTOGRAFIAS: Image, EVENTO_MARKETING: MessageSquare, INFORME: FileText, PROMOCAO: Megaphone, OUTRO: FileText };

const CANAL_ATENDIMENTO_LABEL: Record<string, string> = { TELEFONE: 'Telefone', WHATSAPP: 'WhatsApp', EMAIL: 'Email', PRESENCIAL: 'Presencial' };
const ESTADO_ATENDIMENTO_CORES: Record<string, string> = { ABERTO: 'bg-red-100 text-red-700', EM_ANDAMENTO: 'bg-yellow-100 text-yellow-700', RESOLVIDO: 'bg-green-100 text-green-700' };

function AtendimentoCard({ a, onUpdate }: { a: any; onUpdate: () => void }) {
  const [resposta, setResposta] = useState(a.resposta ?? '');
  const [saving, setSaving] = useState(false);

  const atualizar = async (estado: string) => {
    setSaving(true);
    try {
      await api.put(`/comunicacao/atendimentos/${a.id}`, { estado, resposta: resposta || undefined });
      onUpdate();
    } catch (e: any) {
      toast.error('Erro ao atualizar atendimento', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const atrasado = a.prazoResposta && a.estado !== 'RESOLVIDO' && new Date(a.prazoResposta) < new Date();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <PhoneCall className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 className="font-semibold text-gray-900">{a.assunto}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_ATENDIMENTO_CORES[a.estado]}`}>{a.estado.replace('_', ' ')}</span>
            {atrasado && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">PRAZO EXCEDIDO</span>}
          </div>
          <p className="text-sm text-gray-500 mb-2">
            {CANAL_ATENDIMENTO_LABEL[a.canal] ?? a.canal}
            {a.student && ` • ${a.student.firstName} ${a.student.lastName}`}
            {a.parent && ` • Enc. ${a.parent.firstName} ${a.parent.lastName}`}
            {a.prazoResposta && ` • Prazo: ${new Date(a.prazoResposta).toLocaleDateString('pt-PT')}`}
          </p>
          <p className="text-sm text-gray-600 mb-2">{a.descricao}</p>
          {a.estado !== 'RESOLVIDO' ? (
            <div className="space-y-2 mt-2">
              <textarea value={resposta} onChange={e => setResposta(e.target.value)} rows={2} placeholder="Resposta ao encarregado..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <div className="flex gap-2">
                {a.estado === 'ABERTO' && (
                  <button onClick={() => atualizar('EM_ANDAMENTO')} disabled={saving}
                    className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 disabled:opacity-50">Em Andamento</button>
                )}
                <button onClick={() => atualizar('RESOLVIDO')} disabled={saving || !resposta}
                  className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 disabled:opacity-50">Marcar Resolvido</button>
              </div>
            </div>
          ) : (
            a.resposta && <p className="text-xs text-gray-400 mt-1 italic">Resposta: {a.resposta}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AtendimentosTab() {
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [form, setForm] = useState({ studentId: '', studentLabel: '', assunto: '', canal: 'TELEFONE', descricao: '', prazoResposta: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/comunicacao/atendimentos', { params: estadoFilter ? { estado: estadoFilter } : {} });
      setAtendimentos(r.data.data || r.data);
      setLoadError(false);
    } catch (e: any) {
      setLoadError(true);
      toast.error('Erro ao carregar atendimentos', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [estadoFilter]);

  useEffect(() => {
    if (!studentSearch) { setStudentResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/students?search=${encodeURIComponent(studentSearch)}&limit=6`);
        setStudentResults(r.data.data ?? []);
      } catch {
        setStudentResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  const salvar = async () => {
    setSaving(true);
    try {
      await api.post('/comunicacao/atendimentos', {
        studentId: form.studentId || undefined,
        assunto: form.assunto,
        canal: form.canal,
        descricao: form.descricao,
        prazoResposta: form.prazoResposta ? new Date(form.prazoResposta).toISOString() : undefined,
      });
      toast.success('Atendimento registado');
      setShowForm(false);
      setForm({ studentId: '', studentLabel: '', assunto: '', canal: 'TELEFONE', descricao: '', prazoResposta: '' });
      setStudentSearch('');
      load();
    } catch (e: any) {
      toast.error('Erro ao registar atendimento', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    abertos: atendimentos.filter(a => a.estado === 'ABERTO').length,
    andamento: atendimentos.filter(a => a.estado === 'EM_ANDAMENTO').length,
    resolvidos: atendimentos.filter(a => a.estado === 'RESOLVIDO').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[['', 'Todos'], ['ABERTO', 'Abertos'], ['EM_ANDAMENTO', 'Em Andamento'], ['RESOLVIDO', 'Resolvidos']].map(([v, l]) => (
            <button key={v} onClick={() => setEstadoFilter(v)}
              className={cn('text-xs px-3 py-1.5 rounded-full font-medium transition',
                estadoFilter === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Atendimento
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl p-5 border border-red-200">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-red-600" /><span className="text-sm text-gray-600">Abertos</span></div>
          <div className="text-3xl font-bold text-red-700">{stats.abertos}</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-yellow-600" /><span className="text-sm text-gray-600">Em Andamento</span></div>
          <div className="text-3xl font-bold text-yellow-700">{stats.andamento}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm text-gray-600">Resolvidos</span></div>
          <div className="text-3xl font-bold text-green-700">{stats.resolvidos}</div>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            Erro ao carregar atendimentos. Verifica a ligação ao servidor.
          </div>
          <button onClick={() => load()} className="text-xs text-red-600 hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="space-y-3">
          {atendimentos.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <PhoneCall className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhum atendimento registado</p>
            </div>
          )}
          {atendimentos.map((a: any) => <AtendimentoCard key={a.id} a={a} onUpdate={load} />)}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Novo Atendimento a Encarregado</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Atleta (opcional)</label>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input value={form.studentId ? form.studentLabel : studentSearch}
                  onChange={e => { setStudentSearch(e.target.value); setForm(f => ({ ...f, studentId: '', studentLabel: '' })); }}
                  placeholder="Pesquisar atleta..." className="flex-1 text-sm outline-none" />
              </div>
              {studentResults.length > 0 && !form.studentId && (
                <div className="mt-1 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {studentResults.map((s: any) => (
                    <button key={s.id} type="button"
                      onClick={() => { setForm(f => ({ ...f, studentId: s.id, studentLabel: `${s.firstName} ${s.lastName}` })); setStudentResults([]); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                      {s.firstName} {s.lastName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assunto*</label>
              <input type="text" value={form.assunto} onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
              <select value={form.canal} onChange={e => setForm(f => ({ ...f, canal: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(CANAL_ATENDIMENTO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de resposta</label>
              <input type="date" value={form.prazoResposta} onChange={e => setForm(f => ({ ...f, prazoResposta: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição*</label>
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.assunto || !form.descricao || saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'A registar...' : 'Registar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComunicacaoPage() {
  const [tab, setTab] = useState<'pedidos' | 'atendimentos'>('pedidos');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo:'', tipo:'POST_REDES_SOCIAIS', descricao:'', prazo:'', prioridade:'MEDIA', canal:'WHATSAPP', publicoTipo:'TODOS', publicoId:'' });
  const [turmas, setTurmas] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/comunicacao');
      setPedidos(r.data.data || r.data);
      setLoadError(false);
    } catch (e: any) {
      setLoadError(true);
      toast.error('Erro ao carregar pedidos', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    api.get('/classes').then((r) => setTurmas(r.data.data ?? r.data ?? [])).catch(() => {});
    api.get('/unidades').then((r) => setUnidades(r.data.data ?? r.data ?? [])).catch(() => {});
  }, []);

  const salvar = async () => {
    setSaving(true);
    try {
      const publicoAlvo = form.publicoTipo === 'TODOS' ? 'TODOS' : `${form.publicoTipo}:${form.publicoId}`;
      await api.post('/comunicacao', {
        titulo: form.titulo, tipo: form.tipo, descricao: form.descricao, prioridade: form.prioridade,
        canal: form.canal, publicoAlvo,
        prazo: form.prazo ? new Date(form.prazo).toISOString() : undefined,
      });
      toast.success('Pedido criado');
      setShowForm(false);
      setForm({ titulo:'', tipo:'POST_REDES_SOCIAIS', descricao:'', prazo:'', prioridade:'MEDIA', canal:'WHATSAPP', publicoTipo:'TODOS', publicoId:'' });
      load();
    } catch (e: any) {
      toast.error('Erro ao criar pedido', e?.response?.data?.message ?? 'Tenta novamente');
    } finally {
      setSaving(false);
    }
  };

  const atualizar = async (id: string, estado: string) => {
    try {
      if (estado === 'PUBLICADO') {
        const r = await api.put(`/comunicacao/${id}/publicar`, {});
        const enviados = r.data.data?.enviados || r.data.enviados;
        if (enviados) alert(`Pedido publicado. Enfileirado para ${enviados.whatsapp} contacto(s) via WhatsApp e ${enviados.email} via Email.`);
        load();
        return;
      }
      await api.put(`/comunicacao/${id}`, { estado });
      load();
    } catch (e: any) {
      toast.error('Erro ao atualizar pedido', e?.response?.data?.message ?? 'Tenta novamente');
    }
  };

  const stats = {
    pendentes: pedidos.filter(p => p.estado === 'RASCUNHO' || p.estado === 'EM_APROVACAO').length,
    aprovados: pedidos.filter(p => p.estado === 'APROVADO').length,
    publicados: pedidos.filter(p => p.estado === 'PUBLICADO').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicação e Marketing</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de pedidos de conteúdo, campanhas e atendimento a encarregados (SOP 14)</p>
        </div>
        {tab === 'pedidos' && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Novo Pedido
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([['pedidos', 'Pedidos de Comunicação'], ['atendimentos', 'Atendimentos a Encarregados']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition',
              tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'atendimentos' && <AtendimentosTab />}

      {tab === 'pedidos' && (
      <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-yellow-600" /><span className="text-sm text-gray-600">Pendentes</span></div>
          <div className="text-3xl font-bold text-yellow-700">{stats.pendentes}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm text-gray-600">Aprovados</span></div>
          <div className="text-3xl font-bold text-green-700">{stats.aprovados}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-purple-600" /><span className="text-sm text-gray-600">Publicados</span></div>
          <div className="text-3xl font-bold text-purple-700">{stats.publicados}</div>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            Erro ao carregar pedidos. Verifica a ligação ao servidor.
          </div>
          <button onClick={() => load()} className="text-xs text-red-600 hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="space-y-3">
          {pedidos.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhum pedido de comunicação</p>
            </div>
          )}
          {pedidos.map((p: any) => {
            const Icon = TIPO_ICONS[p.tipo] || FileText;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{p.titulo}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADOS_CORES[p.estado]}`}>{p.estado.replace('_', ' ')}</span>
                      {p.prioridade === 'ALTA' && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">URGENTE</span>}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{p.tipo.replace(/_/g,' ')} {p.prazo && `• Prazo: ${new Date(p.prazo).toLocaleDateString('pt-PT')}`}</p>
                    <p className="text-sm text-gray-600">{p.descricao}</p>
                    {p.solicitante && <p className="text-xs text-gray-400 mt-1">Solicitado por {p.solicitante.name}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {p.estado === 'RASCUNHO' && <button onClick={() => atualizar(p.id, 'EM_APROVACAO')} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200">Submeter</button>}
                    {p.estado === 'EM_APROVACAO' && <button onClick={() => atualizar(p.id, 'APROVADO')} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Aprovar</button>}
                    {p.estado === 'APROVADO' && <button onClick={() => atualizar(p.id, 'PUBLICADO')} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200">Publicar</button>}
                    {(p.estado === 'RASCUNHO' || p.estado === 'EM_APROVACAO') && <button onClick={() => atualizar(p.id, 'CANCELADO')} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100">Cancelar</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Novo Pedido de Comunicação</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título*</label>
              <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TIPOS.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta (Urgente)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo*</label>
              <input type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Briefing</label>
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canal de envio</label>
              <select value={form.canal} onChange={e => setForm(f => ({ ...f, canal: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Object.entries(CANAIS_ENVIO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Público-alvo</label>
              <select value={form.publicoTipo} onChange={e => setForm(f => ({ ...f, publicoTipo: e.target.value, publicoId: '' }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="TODOS">Todos os atletas</option>
                <option value="TURMA">Uma turma específica</option>
                <option value="UNIDADE">Uma unidade específica</option>
              </select>
              {form.publicoTipo === 'TURMA' && (
                <select value={form.publicoId} onChange={e => setForm(f => ({ ...f, publicoId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2">
                  <option value="">Selecionar turma...</option>
                  {turmas.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
              {form.publicoTipo === 'UNIDADE' && (
                <select value={form.publicoId} onChange={e => setForm(f => ({ ...f, publicoId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2">
                  <option value="">Selecionar unidade...</option>
                  {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.titulo || !form.prazo || (form.publicoTipo !== 'TODOS' && !form.publicoId) || saving} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'A submeter...' : 'Submeter'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
