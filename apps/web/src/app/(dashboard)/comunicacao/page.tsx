'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle, Image, Video, FileText, Megaphone } from 'lucide-react';

const TIPOS = ['POST_REDES_SOCIAIS','CAMPANHA_EMAIL','VIDEO','FOTOGRAFIAS','EVENTO_MARKETING','OUTRO'];
const ESTADOS_CORES: Record<string, string> = { PENDENTE:'bg-yellow-100 text-yellow-700', EM_PRODUCAO:'bg-blue-100 text-blue-700', APROVADO:'bg-green-100 text-green-700', PUBLICADO:'bg-purple-100 text-purple-700', REJEITADO:'bg-red-100 text-red-700' };
const TIPO_ICONS: Record<string, any> = { POST_REDES_SOCIAIS: Megaphone, CAMPANHA_EMAIL: MessageSquare, VIDEO: Video, FOTOGRAFIAS: Image, EVENTO_MARKETING: MessageSquare, OUTRO: FileText };

export default function ComunicacaoPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo:'', tipo:'POST_REDES_SOCIAIS', descricao:'', prazo:'', prioridade:'MEDIA' });

  const load = async () => {
    setLoading(true);
    const r = await api.get('/comunicacao');
    setPedidos(r.data.data || r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const salvar = async () => {
    await api.post('/comunicacao', { ...form, prazo: form.prazo ? new Date(form.prazo).toISOString() : undefined });
    setShowForm(false);
    setForm({ titulo:'', tipo:'POST_REDES_SOCIAIS', descricao:'', prazo:'', prioridade:'MEDIA' });
    load();
  };

  const atualizar = async (id: string, estado: string) => {
    await api.put(`/comunicacao/${id}`, { estado });
    load();
  };

  const stats = {
    pendentes: pedidos.filter(p => p.estado === 'PENDENTE').length,
    producao: pedidos.filter(p => p.estado === 'EM_PRODUCAO').length,
    publicados: pedidos.filter(p => p.estado === 'PUBLICADO').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicação e Marketing</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de pedidos de conteúdo e campanhas (SOP 14)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Pedido
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-yellow-600" /><span className="text-sm text-gray-600">Pendentes</span></div>
          <div className="text-3xl font-bold text-yellow-700">{stats.pendentes}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-2 mb-1"><MessageSquare className="w-4 h-4 text-blue-600" /><span className="text-sm text-gray-600">Em produção</span></div>
          <div className="text-3xl font-bold text-blue-700">{stats.producao}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-purple-600" /><span className="text-sm text-gray-600">Publicados</span></div>
          <div className="text-3xl font-bold text-purple-700">{stats.publicados}</div>
        </div>
      </div>

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
                    {p.estado === 'PENDENTE' && <button onClick={() => atualizar(p.id, 'EM_PRODUCAO')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">Produzir</button>}
                    {p.estado === 'EM_PRODUCAO' && <button onClick={() => atualizar(p.id, 'APROVADO')} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Aprovar</button>}
                    {p.estado === 'APROVADO' && <button onClick={() => atualizar(p.id, 'PUBLICADO')} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200">Publicar</button>}
                    {(p.estado === 'PENDENTE' || p.estado === 'EM_PRODUCAO') && <button onClick={() => atualizar(p.id, 'REJEITADO')} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100">Rejeitar</button>}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
              <input type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Briefing</label>
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.titulo} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">Submeter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
