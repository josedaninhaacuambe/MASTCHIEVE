'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { Plus, MessageSquareWarning, MessageSquareHeart, Lightbulb, Send } from 'lucide-react';

const TIPOS = ['RECLAMACAO', 'SUGESTAO', 'ELOGIO'] as const;
const TIPO_LABEL: Record<string, string> = { RECLAMACAO: 'Reclamação', SUGESTAO: 'Sugestão', ELOGIO: 'Elogio' };
const TIPO_ICON: Record<string, any> = { RECLAMACAO: MessageSquareWarning, SUGESTAO: Lightbulb, ELOGIO: MessageSquareHeart };
const TIPO_COR: Record<string, string> = {
  RECLAMACAO: 'bg-red-100 text-red-700', SUGESTAO: 'bg-blue-100 text-blue-700', ELOGIO: 'bg-pink-100 text-pink-700',
};
const CATEGORIAS = ['ATENDIMENTO', 'INSTALACOES', 'FINANCEIRO', 'PEDAGOGICO', 'OUTRO'];
const CATEGORIA_LABEL: Record<string, string> = {
  ATENDIMENTO: 'Atendimento', INSTALACOES: 'Instalações', FINANCEIRO: 'Financeiro', PEDAGOGICO: 'Pedagógico', OUTRO: 'Outro',
};
const ESTADO_LABEL: Record<string, string> = {
  ABERTA: 'Aberta', EM_ANALISE: 'Em análise', RESPONDIDA: 'Respondida', FECHADA: 'Fechada',
};
const ESTADO_COR: Record<string, string> = {
  ABERTA: 'bg-amber-100 text-amber-700', EM_ANALISE: 'bg-blue-100 text-blue-700',
  RESPONDIDA: 'bg-green-100 text-green-700', FECHADA: 'bg-gray-100 text-gray-500',
};
const TRANSICOES: Record<string, string[]> = {
  ABERTA: ['EM_ANALISE', 'RESPONDIDA', 'FECHADA'],
  EM_ANALISE: ['RESPONDIDA', 'FECHADA'],
  RESPONDIDA: ['FECHADA'],
  FECHADA: [],
};

export default function ReclamacoesPage() {
  const { user } = useAuthStore();
  const isParent = user?.role === 'PARENT';

  const [lista, setLista] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [meusFilhos, setMeusFilhos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ABERTA' | 'EM_ANALISE' | 'RESPONDIDA' | 'FECHADA'>('TODOS');
  const [showForm, setShowForm] = useState(false);
  const [responderAlvo, setResponderAlvo] = useState<any | null>(null);
  const [resposta, setResposta] = useState('');

  const [form, setForm] = useState({
    tipo: 'RECLAMACAO', categoria: 'OUTRO', studentId: '', nome: '', contacto: '', unidadeId: '', descricao: '', prazoResposta: '',
  });

  const load = async () => {
    setLoading(true);
    const params: any = {};
    if (filtroEstado !== 'TODOS') params.estado = filtroEstado;
    const r = await api.get('/reclamacoes', { params });
    setLista(r.data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filtroEstado]);
  useEffect(() => {
    if (isParent) {
      api.get('/parents/me').then((r) => setMeusFilhos(r.data.children ?? [])).catch(() => {});
      return;
    }
    api.get('/unidades').then((r) => setUnidades(r.data.data ?? r.data ?? [])).catch(() => {});
    api.get('/students?limit=200').then((r) => setStudents(r.data.data ?? [])).catch(() => {});
  }, [isParent]);

  const abrirNovo = () => {
    setForm({ tipo: 'RECLAMACAO', categoria: 'OUTRO', studentId: '', nome: '', contacto: '', unidadeId: '', descricao: '', prazoResposta: '' });
    setShowForm(true);
  };

  const salvar = async () => {
    try {
      await api.post('/reclamacoes', {
        tipo: form.tipo,
        categoria: form.categoria,
        studentId: form.studentId || undefined,
        nome: form.nome || undefined,
        contacto: form.contacto || undefined,
        unidadeId: form.unidadeId || undefined,
        descricao: form.descricao,
        prazoResposta: form.prazoResposta || undefined,
      });
      toast.success('Registo criado');
      setShowForm(false);
      load();
    } catch (e: any) {
      toast.error('Erro ao registar', e?.response?.data?.message);
    }
  };

  const responder = async () => {
    if (!responderAlvo) return;
    try {
      await api.put(`/reclamacoes/${responderAlvo.id}/responder`, { resposta });
      toast.success('Resposta registada');
      setResponderAlvo(null);
      setResposta('');
      load();
    } catch (e: any) {
      toast.error('Erro ao responder', e?.response?.data?.message);
    }
  };

  const mudarEstado = async (id: string, estado: string) => {
    try {
      await api.put(`/reclamacoes/${id}/estado`, { estado });
      toast.success('Estado atualizado');
      load();
    } catch (e: any) {
      toast.error('Erro ao alterar estado', e?.response?.data?.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reclamações e Sugestões</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isParent ? 'Registe e acompanhe as suas reclamações, sugestões e elogios' : 'Registo e acompanhamento de reclamações, sugestões e elogios'}
          </p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium">
          <Plus className="w-4 h-4" /> Registar
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['TODOS', 'ABERTA', 'EM_ANALISE', 'RESPONDIDA', 'FECHADA'] as const).map((f) => (
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

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : lista.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
          <MessageSquareWarning className="w-10 h-10 mx-auto mb-2 text-gray-300" /> Nenhum registo encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((r: any) => {
            const Icon = TIPO_ICON[r.tipo] ?? MessageSquareWarning;
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg', TIPO_COR[r.tipo])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{TIPO_LABEL[r.tipo] ?? r.tipo}</span>
                        <span className="text-xs text-gray-400">· {CATEGORIA_LABEL[r.categoria] ?? r.categoria}</span>
                        {r.student && <span className="text-xs text-gray-400">· {r.student.firstName} {r.student.lastName}</span>}
                        {r.nome && <span className="text-xs text-gray-400">· {r.nome}</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{r.descricao}</p>
                      {r.resposta && <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 rounded-lg p-2">Resposta: "{r.resposta}"</p>}
                      <div className="text-xs text-gray-400 mt-2">
                        {formatDate(r.createdAt)}
                        {r.prazoResposta && ` · Prazo: ${formatDate(r.prazoResposta)}`}
                        {r.unidade && ` · ${r.unidade.nome}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', ESTADO_COR[r.estado] || 'bg-gray-100 text-gray-600')}>
                      {ESTADO_LABEL[r.estado] ?? r.estado}
                    </span>
                    {!isParent && (
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {r.estado !== 'FECHADA' && r.estado !== 'RESPONDIDA' && (
                          <button onClick={() => { setResponderAlvo(r); setResposta(''); }} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-200">
                            Responder
                          </button>
                        )}
                        {TRANSICOES[r.estado]?.filter((e) => e !== 'RESPONDIDA').map((e) => (
                          <button key={e} onClick={() => mudarEstado(r.id, e)} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg hover:bg-gray-200">
                            {ESTADO_LABEL[e]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Registar</h2>
            <div className="flex gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border',
                    form.tipo === t ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200',
                  )}
                >
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
            {isParent ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Educando (opcional)</label>
                <select value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">— Sobre a minha conta —</option>
                  {meusFilhos.map((f: any) => <option key={f.student.id} value={f.student.id}>{f.student.firstName} {f.student.lastName}</option>)}
                </select>
              </div>
            ) : (
              <>
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
                      <option value="">— Não especificar —</option>
                      {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aluno relacionado (opcional)</label>
                  <select value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">— Nenhum —</option>
                    {students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome (se não for aluno)</label>
                    <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                    <input value={form.contacto} onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição*</label>
              <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {!isParent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de resposta</label>
                <input type="datetime-local" value={form.prazoResposta} onChange={(e) => setForm((f) => ({ ...f, prazoResposta: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={salvar} disabled={!form.descricao.trim()} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">Registar</button>
            </div>
          </div>
        </div>
      )}

      {responderAlvo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Responder</h2>
            <p className="text-sm text-gray-500">{responderAlvo.descricao}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resposta*</label>
              <textarea value={resposta} onChange={(e) => setResposta(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setResponderAlvo(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={responder} disabled={!resposta.trim()} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
