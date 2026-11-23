'use client';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, UserPlus, Search, History, Users, RotateCcw, Ban, Pencil, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface Props {
  formacaoId: string;
  podeConcluir: boolean;
  onClose: () => void;
  onChange: () => void;
}

const ESTADO_INSCRICAO: Record<string, { label: string; cls: string }> = {
  INSCRITO: { label: 'Inscrito', cls: 'bg-blue-100 text-blue-700' },
  CONCLUIDO: { label: 'Concluído', cls: 'bg-green-100 text-green-700' },
  DESISTIU: { label: 'Desistiu', cls: 'bg-amber-100 text-amber-700' },
  CANCELADA: { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
};

const ACOES: Record<string, string> = {
  FORMACAO_PROPOSTA: 'Formação proposta',
  FORMACAO_ORCAMENTO_APROVADO: 'Orçamento aprovado',
  FORMACAO_REJEITADA: 'Formação rejeitada',
  FORMACAO_VAGAS_ALTERADAS: 'Vagas alteradas',
  FORMACAO_INSCRICAO: 'Inscrição registada',
  FORMACAO_INSCRICAO_REACTIVADA: 'Inscrição reactivada',
  FORMACAO_INSCRICAO_ACTUALIZADA: 'Inscrição corrigida',
  FORMACAO_INSCRICAO_CANCELADA: 'Inscrição cancelada',
  FORMACAO_CONCLUIDA: 'Formação concluída',
};

const ABERTAS = ['APROVADA_ORCAMENTO', 'EM_CURSO'];
const dataPt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-PT') : '—');
const dataHoraPt = (d: string) => new Date(d).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
const msgErro = (e: any) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(' ') : m ?? 'Tenta novamente';
};

/** Painel de gestão das inscrições de uma formação (assistentes administrativos, RH e admin). */
export default function InscricoesFormacao({ formacaoId, podeConcluir, onClose, onChange }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'inscritos' | 'historico'>('inscritos');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [pesquisaColab, setPesquisaColab] = useState('');
  const [colaborador, setColaborador] = useState<any>(null);
  const [observacoes, setObservacoes] = useState('');
  const [acao, setAcao] = useState<{ tipo: 'cancelar' | 'editar'; id: string; texto: string } | null>(null);
  const [vagasEdit, setVagasEdit] = useState<string | null>(null);

  const chave = ['formacao-inscricoes', formacaoId];
  const { data, isLoading } = useQuery<any>({
    queryKey: chave,
    queryFn: async () => (await api.get(`/rh/formacao/${formacaoId}/inscricoes`)).data.data,
    refetchOnWindowFocus: false,
  });
  const { data: historico = [], isLoading: carregandoHist } = useQuery<any[]>({
    queryKey: ['formacao-historico', formacaoId],
    queryFn: async () => (await api.get(`/rh/formacao/${formacaoId}/historico`)).data.data ?? [],
    enabled: tab === 'historico',
    refetchOnWindowFocus: false,
  });
  const termoColab = pesquisaColab.trim();
  const { data: colaboradores = [], isFetching: aProcurar } = useQuery<any[]>({
    queryKey: ['formacao-colaboradores', termoColab],
    queryFn: async () => {
      const r = await api.get('/rh/funcionarios', { params: { search: termoColab, limit: 30 } });
      return r.data.data?.data ?? r.data.data ?? [];
    },
    enabled: termoColab.length >= 2,
    refetchOnWindowFocus: false,
  });

  const formacao = data?.formacao;
  const resumo = data?.resumo;
  const inscricoes: any[] = useMemo(() => data?.inscricoes ?? [], [data]);
  const porFuncionario = useMemo(() => new Map(inscricoes.map((i) => [i.funcionarioId, i])), [inscricoes]);
  const aberta = formacao && ABERTAS.includes(formacao.estado);

  const visiveis = useMemo(() => {
    const q = pesquisa.trim().toLowerCase();
    return inscricoes.filter(
      (i) =>
        (!filtroEstado || i.estado === filtroEstado) &&
        (!q || `${i.funcionario.firstName} ${i.funcionario.lastName} ${i.funcionario.numeroFuncionario}`.toLowerCase().includes(q)),
    );
  }, [inscricoes, filtroEstado, pesquisa]);

  const actualizar = () => {
    qc.invalidateQueries({ queryKey: chave });
    qc.invalidateQueries({ queryKey: ['formacao-historico', formacaoId] });
    onChange();
  };

  const inscrever = useMutation({
    mutationFn: () => api.post(`/rh/formacao/${formacaoId}/inscrever`, { funcionarioId: colaborador.id, observacoes: observacoes || undefined }),
    onSuccess: () => {
      toast.success('Colaborador inscrito', `${colaborador.firstName} ${colaborador.lastName}`);
      setColaborador(null);
      setPesquisaColab('');
      setObservacoes('');
      actualizar();
    },
    onError: (e) => toast.error('Não foi possível inscrever', msgErro(e)),
  });

  const operar = useMutation({
    mutationFn: async (p: { url: string; body?: any; ok: string }) => {
      await api.put(p.url, p.body ?? {});
      return p.ok;
    },
    onSuccess: (ok) => {
      toast.success(ok);
      setAcao(null);
      actualizar();
    },
    onError: (e) => toast.error('Operação não concluída', msgErro(e)),
  });

  const guardarVagas = useMutation({
    mutationFn: () => api.put(`/rh/formacao/${formacaoId}/vagas`, { vagas: vagasEdit === '' ? null : Number(vagasEdit) }),
    onSuccess: () => {
      toast.success('Capacidade actualizada');
      setVagasEdit(null);
      actualizar();
    },
    onError: (e) => toast.error('Não foi possível alterar as vagas', msgErro(e)),
  });

  const concluir = (id: string) => {
    const nota = window.prompt('Nota final (opcional):');
    if (nota === null) return;
    const n = nota.trim() ? Number(nota.replace(',', '.')) : undefined;
    if (n !== undefined && Number.isNaN(n)) return toast.error('Nota inválida', 'Indica um número.');
    operar.mutate({ url: `/rh/formacao/participantes/${id}/concluir`, body: { notaFinal: n }, ok: 'Formação dada como concluída' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="p-5 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{formacao?.titulo ?? 'Inscrições'}</h2>
            {formacao && (
              <p className="text-xs text-gray-500 mt-0.5">
                {formacao.estado.replace(/_/g, ' ')} · {dataPt(formacao.dataInicio)} – {dataPt(formacao.dataFim)}
                {formacao.local ? ` · ${formacao.local}` : ''}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {resumo && (
          <div className="px-5 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Indicador label="Inscritos" valor={resumo.porEstado.INSCRITO} />
            <Indicador label="Concluídos" valor={resumo.porEstado.CONCLUIDO} />
            <Indicador label="Desist./cancel." valor={resumo.porEstado.DESISTIU + resumo.porEstado.CANCELADA} />
            <div className={`rounded-lg border p-3 ${resumo.esgotada ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="text-xs text-gray-500">Vagas</div>
              {vagasEdit === null ? (
                <div className="flex items-center justify-between gap-2">
                  <div className={`text-lg font-bold ${resumo.esgotada ? 'text-red-700' : 'text-gray-900'}`}>
                    {resumo.vagas == null ? 'Sem limite' : resumo.esgotada ? 'Esgotada' : `${resumo.disponiveis} livres`}
                  </div>
                  <button onClick={() => setVagasEdit(resumo.vagas == null ? '' : String(resumo.vagas))} className="text-gray-400 hover:text-gray-700" title="Alterar capacidade">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-1">
                  <input type="number" min={1} value={vagasEdit} onChange={(e) => setVagasEdit(e.target.value)} placeholder="sem limite" className="w-20 border rounded px-2 py-1 text-sm" />
                  <button onClick={() => guardarVagas.mutate()} disabled={guardarVagas.isPending} className="text-xs bg-gray-800 text-white px-2 py-1 rounded disabled:opacity-50">OK</button>
                  <button onClick={() => setVagasEdit(null)} className="text-xs px-1 text-gray-500">✕</button>
                </div>
              )}
              {resumo.vagas != null && <div className="text-xs text-gray-500">{resumo.ocupadas} de {resumo.vagas} ocupadas</div>}
            </div>
          </div>
        )}

        <div className="px-5 pt-4 flex gap-2 border-b">
          <TabBtn activo={tab === 'inscritos'} onClick={() => setTab('inscritos')} icon={<Users className="w-4 h-4" />} label="Inscritos" />
          <TabBtn activo={tab === 'historico'} onClick={() => setTab('historico')} icon={<History className="w-4 h-4" />} label="Histórico" />
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {isLoading && <div className="text-center py-8 text-gray-400">A carregar...</div>}

          {tab === 'inscritos' && data && (
            <>
              {aberta && !resumo?.esgotada && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Nova inscrição
                  </div>
                  {colaborador ? (
                    <div className="flex items-center justify-between gap-2 bg-white border rounded-lg px-3 py-2 text-sm">
                      <span>
                        {colaborador.firstName} {colaborador.lastName} <span className="text-gray-400">· {colaborador.numeroFuncionario}</span>
                      </span>
                      <button onClick={() => setColaborador(null)} className="text-xs text-gray-500 hover:underline">trocar</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                      <input value={pesquisaColab} onChange={(e) => setPesquisaColab(e.target.value)} placeholder="Procurar colaborador (nome ou nº)..." className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm" />
                      {termoColab.length >= 2 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                          {aProcurar && <div className="px-3 py-2 text-xs text-gray-400">A procurar...</div>}
                          {!aProcurar && colaboradores.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">Nenhum colaborador encontrado</div>}
                          {colaboradores.map((c: any) => {
                            const ja = porFuncionario.get(c.id);
                            const activa = ja && (ja.estado === 'INSCRITO' || ja.estado === 'CONCLUIDO');
                            const desligado = c.estado === 'DESLIGADO';
                            return (
                              <button
                                key={c.id}
                                disabled={!!activa || desligado}
                                onClick={() => setColaborador(c)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex justify-between gap-2"
                              >
                                <span>{c.firstName} {c.lastName} <span className="text-gray-400">· {c.numeroFuncionario}</span></span>
                                <span className="text-xs text-gray-500">
                                  {activa ? 'já inscrito' : desligado ? 'desligado' : ja ? 'reinscrever' : ''}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  <input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={2000} placeholder="Observações (opcional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={() => inscrever.mutate()} disabled={!colaborador || inscrever.isPending} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                    {inscrever.isPending ? 'A inscrever...' : 'Inscrever'}
                  </button>
                </div>
              )}
              {aberta && resumo?.esgotada && (
                <div className="rounded-lg bg-red-50 border border-red-100 text-sm text-red-700 px-4 py-3">
                  Formação esgotada. Para inscrever mais pessoas, aumente as vagas ou cancele uma inscrição.
                </div>
              )}
              {!aberta && (
                <div className="rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-800 px-4 py-3">
                  Esta formação não aceita novas inscrições (só formações com orçamento aprovado ou em curso).
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Filtrar inscritos..." className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm" />
                </div>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Todos os estados</option>
                  {Object.entries(ESTADO_INSCRICAO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {visiveis.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Sem inscrições{filtroEstado || pesquisa ? ' com este filtro' : ''}.</div>
              ) : (
                <div className="divide-y border rounded-xl">
                  {visiveis.map((i) => {
                    const e = ESTADO_INSCRICAO[i.estado] ?? { label: i.estado, cls: 'bg-gray-100 text-gray-600' };
                    const emAcao = acao?.id === i.id;
                    return (
                      <div key={i.id} className="p-3 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {i.funcionario.firstName} {i.funcionario.lastName}
                              <span className="text-gray-400 font-normal"> · {i.funcionario.numeroFuncionario}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {i.funcionario.cargo?.replace(/_/g, ' ')} · inscrito em {dataPt(i.createdAt)}
                              {i.inscritoPorNome ? ` por ${i.inscritoPorNome}` : ''}
                              {i.notaFinal != null ? ` · nota ${i.notaFinal}` : ''}
                            </div>
                            {i.observacoes && <div className="text-xs text-gray-600 mt-1">Obs.: {i.observacoes}</div>}
                            {i.estado === 'CANCELADA' && (
                              <div className="text-xs text-red-600 mt-1">
                                Cancelada em {dataPt(i.canceladoEm)}{i.canceladoPorNome ? ` por ${i.canceladoPorNome}` : ''}
                                {i.motivoCancelamento ? ` — ${i.motivoCancelamento}` : ''}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.cls}`}>{e.label}</span>
                            {i.estado !== 'CANCELADA' && (
                              <IconBtn title="Corrigir observações" onClick={() => setAcao({ tipo: 'editar', id: i.id, texto: i.observacoes ?? '' })} icon={<Pencil className="w-3.5 h-3.5" />} />
                            )}
                            {i.estado === 'INSCRITO' && (
                              <>
                                <button onClick={() => operar.mutate({ url: `/rh/formacao/inscricoes/${i.id}`, body: { estado: 'DESISTIU' }, ok: 'Marcado como desistência' })} className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50">Desistiu</button>
                                <IconBtn title="Cancelar inscrição" onClick={() => setAcao({ tipo: 'cancelar', id: i.id, texto: '' })} icon={<Ban className="w-3.5 h-3.5 text-red-600" />} />
                                {podeConcluir && <IconBtn title="Dar como concluída" onClick={() => concluir(i.id)} icon={<CheckCircle2 className="w-3.5 h-3.5 text-green-600" />} />}
                              </>
                            )}
                            {(i.estado === 'CANCELADA' || i.estado === 'DESISTIU') && aberta && (
                              <IconBtn title="Reactivar inscrição" onClick={() => operar.mutate({ url: `/rh/formacao/inscricoes/${i.id}/reactivar`, ok: 'Inscrição reactivada' })} icon={<RotateCcw className="w-3.5 h-3.5" />} />
                            )}
                          </div>
                        </div>
                        {emAcao && (
                          <div className="flex flex-wrap gap-2">
                            <input
                              autoFocus
                              value={acao!.texto}
                              onChange={(ev) => setAcao({ ...acao!, texto: ev.target.value })}
                              maxLength={acao!.tipo === 'cancelar' ? 1000 : 2000}
                              placeholder={acao!.tipo === 'cancelar' ? 'Motivo do cancelamento (obrigatório)' : 'Observações'}
                              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                            />
                            <button
                              disabled={operar.isPending || (acao!.tipo === 'cancelar' && acao!.texto.trim().length < 3)}
                              onClick={() =>
                                acao!.tipo === 'cancelar'
                                  ? operar.mutate({ url: `/rh/formacao/inscricoes/${i.id}/cancelar`, body: { motivo: acao!.texto.trim() }, ok: 'Inscrição cancelada' })
                                  : operar.mutate({ url: `/rh/formacao/inscricoes/${i.id}`, body: { observacoes: acao!.texto }, ok: 'Inscrição corrigida' })
                              }
                              className={`text-sm px-3 py-1.5 rounded-lg text-white disabled:opacity-50 ${acao!.tipo === 'cancelar' ? 'bg-red-600' : 'bg-gray-800'}`}
                            >
                              {acao!.tipo === 'cancelar' ? 'Confirmar cancelamento' : 'Guardar'}
                            </button>
                            <button onClick={() => setAcao(null)} className="text-sm px-3 py-1.5 border rounded-lg">Voltar</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'historico' && (
            carregandoHist ? (
              <div className="text-center py-8 text-gray-400">A carregar...</div>
            ) : historico.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Sem registos.</div>
            ) : (
              <ol className="space-y-2">
                {historico.map((h) => (
                  <li key={h.id} className="text-sm border-l-2 border-gray-200 pl-3">
                    <div className="font-medium text-gray-800">
                      {ACOES[h.action] ?? h.action}
                      {h.colaborador ? <span className="font-normal text-gray-600"> — {h.colaborador}</span> : null}
                    </div>
                    <div className="text-xs text-gray-500">
                      {dataHoraPt(h.createdAt)} · {h.autor ?? 'Utilizador'}{h.autorRole ? ` (${h.autorRole.replace(/_/g, ' ').toLowerCase()})` : ''}
                      {h.depois?.motivo ? ` · motivo: ${h.depois.motivo}` : ''}
                      {h.action === 'FORMACAO_VAGAS_ALTERADAS' ? ` · ${h.antes?.vagas ?? 'sem limite'} → ${h.depois?.vagas ?? 'sem limite'}` : ''}
                      {h.action === 'FORMACAO_INSCRICAO_ACTUALIZADA' && h.antes?.estado !== h.depois?.estado ? ` · ${h.antes?.estado} → ${h.depois?.estado}` : ''}
                    </div>
                  </li>
                ))}
              </ol>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Indicador({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-900">{valor}</div>
    </div>
  );
}

function TabBtn({ activo, onClick, icon, label }: { activo: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px ${activo ? 'border-gray-800 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {icon} {label}
    </button>
  );
}

function IconBtn({ title, onClick, icon }: { title: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button title={title} aria-label={title} onClick={onClick} className="p-1.5 border rounded-lg hover:bg-gray-50">
      {icon}
    </button>
  );
}
