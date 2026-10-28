'use client';
import { Fragment, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  Plus, Calendar, MapPin, Users, Award, ClipboardList, X, Check, Trash2, Search, Link2, Copy, Lock, Unlock,
  Pencil, Download, Send, MessageSquare, ChevronDown, ChevronUp, Clock, RefreshCw, UserCheck,
} from 'lucide-react';

const ESTADOS_CORES: Record<string, string> = { PLANEADO:'bg-blue-100 text-blue-700', REALIZADO:'bg-green-100 text-green-700', CANCELADO:'bg-red-100 text-red-700' };

const ESTADOS_PARTICIPANTE = [
  { v: 'PRE_INSCRITO', l: 'Pré-inscrito', cor: 'bg-amber-100 text-amber-700' },
  { v: 'CONFIRMADO', l: 'Confirmado', cor: 'bg-blue-100 text-blue-700' },
  { v: 'PRESENTE', l: 'Presente', cor: 'bg-green-100 text-green-700' },
  { v: 'AUSENTE', l: 'Ausente', cor: 'bg-gray-200 text-gray-600' },
  { v: 'CANCELADO', l: 'Cancelado', cor: 'bg-red-100 text-red-600' },
];
const ESTADO_INFO = Object.fromEntries(ESTADOS_PARTICIPANTE.map((e) => [e.v, e]));
const ORIGEM_LABEL: Record<string, string> = { MANUAL: 'Manual', PRE_INSCRICAO: 'Formulário', WALK_IN: 'No dia' };

const CAMPOS_INDIVIDUAL = [
  { v: 'nomePreferido', l: 'Nome preferido' }, { v: 'genero', l: 'Género' }, { v: 'dataNascimento', l: 'Data de nascimento' },
  { v: 'email', l: 'Email' }, { v: 'documentoIdentificacao', l: 'Nº documento de identificação' }, { v: 'provas', l: 'Provas' },
  { v: 'experienciaPrevia', l: 'Experiência anterior' }, { v: 'comoConheceu', l: 'Como teve conhecimento' },
  { v: 'nivelNatacao', l: 'Sabe nadar?' }, { v: 'condicaoSaude', l: 'Condição de saúde' },
  { v: 'contactoEmergencia', l: 'Contacto de emergência' }, { v: 'instituicao', l: 'Instituição' },
  { v: 'autorizacaoImagem', l: 'Autorização de imagem' },
];
const CAMPOS_OMISSAO = CAMPOS_INDIVIDUAL.map((c) => c.v).filter((c) => c !== 'documentoIdentificacao');
const HORARIOS_OMISSAO = ['13H30-14H20', '14H30-15H20', '15H30-16H20', '16H30-17H20', '17H30-18H20'];

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm';
const erroMsg = (e: any) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(' · ') : m ?? 'Tenta novamente';
};

function parseChecklist(raw: string | null | undefined): { texto: string; checked: boolean }[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function parseConfig(raw: string | null | undefined) {
  try {
    const c = raw ? JSON.parse(raw) : {};
    return {
      campos: Array.isArray(c.campos) ? c.campos : CAMPOS_OMISSAO,
      horarios: Array.isArray(c.horarios) && c.horarios.length ? c.horarios : HORARIOS_OMISSAO,
    };
  } catch {
    return { campos: CAMPOS_OMISSAO, horarios: HORARIOS_OMISSAO };
  }
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success('Link copiado');
  } catch {
    window.prompt('Copia o link:', texto);
  }
}

// ─── Criar / editar evento ───────────────────────────────────────────────────

function EventoFormModal({ evento, onClose, onSaved }: { evento?: any; onClose: () => void; onSaved: () => void }) {
  const cfg = parseConfig(evento?.formularioCampos);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [form, setForm] = useState({
    nome: evento?.nome ?? '',
    tipo: evento?.tipo ?? 'OPEN_DAY',
    data: evento?.data ? new Date(evento.data).toISOString().slice(0, 10) : '',
    hora: evento?.hora ?? '',
    unidadeId: evento?.unidadeId ?? '',
    local: evento?.local ?? '',
    capacidade: evento?.capacidade?.toString() ?? '',
    descricao: evento?.descricao ?? '',
    programa: evento?.programa ?? '',
    formularioTipo: evento?.formularioTipo ?? 'INDIVIDUAL',
    linkInscricaoAtleta: evento?.linkInscricaoAtleta ?? '',
    inscricoesAbertas: evento?.inscricoesAbertas ?? false,
  });
  const [campos, setCampos] = useState<string[]>(cfg.campos);
  const [horarios, setHorarios] = useState<string>(cfg.horarios.join('\n'));
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => { api.get('/unidades').then((r) => setUnidades(r.data.data ?? r.data ?? [])).catch(() => {}); }, []);

  const salvar = async () => {
    if (!form.nome.trim() || !form.data) { toast.error('Campos obrigatórios', 'Preenche o nome e a data do evento'); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        nome: form.nome.trim(),
        data: new Date(`${form.data}T${form.hora || '00:00'}`).toISOString(),
        capacidade: form.capacidade ? Number(form.capacidade) : null,
        unidadeId: form.unidadeId || null,
        formularioCampos: JSON.stringify(form.formularioTipo === 'ESCOLA'
          ? { horarios: horarios.split('\n').map((h) => h.trim()).filter(Boolean) }
          : { campos }),
      };
      if (evento) await api.put(`/eventos/${evento.id}`, body);
      else await api.post('/eventos', body);
      toast.success(evento ? 'Evento actualizado' : 'Evento criado');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error('Erro ao guardar evento', erroMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">{evento ? 'Editar evento' : 'Novo evento'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
              <input value={form.nome} onChange={(e) => set('nome', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className={inputCls}>
                <option value="OPEN_DAY">Open Day</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <select value={form.unidadeId} onChange={(e) => set('unidadeId', e.target.value)} className={inputCls}>
                <option value="">—</option>
                {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data*</label>
              <input type="date" value={form.data} onChange={(e) => set('data', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input type="time" value={form.hora} onChange={(e) => set('hora', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
              <input value={form.local} onChange={(e) => set('local', e.target.value)} placeholder="Ex.: Piscina Olímpica" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade</label>
              <input type="number" min={0} value={form.capacidade} onChange={(e) => set('capacidade', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (pública)</label>
            <textarea value={form.descricao} onChange={(e) => set('descricao', e.target.value)} rows={3} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
            <textarea value={form.programa} onChange={(e) => set('programa', e.target.value)} rows={3} className={inputCls} />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Formulário de pré-inscrição</h3>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: 'INDIVIDUAL', l: 'Individual', d: 'Modelo Open Day (externos)' }, { v: 'ESCOLA', l: 'Escola', d: 'Modelo Voucher — até 10 alunos' }].map((t) => (
                <button key={t.v} type="button" onClick={() => set('formularioTipo', t.v)}
                  className={`text-left border rounded-xl px-3 py-2 ${form.formularioTipo === t.v ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <p className="text-sm font-medium text-gray-900">{t.l}</p>
                  <p className="text-xs text-gray-500">{t.d}</p>
                </button>
              ))}
            </div>
            {form.formularioTipo === 'INDIVIDUAL' ? (
              <div>
                <p className="text-xs text-gray-500 mb-2">Nome completo, contacto e declaração são sempre pedidos. Escolhe os campos adicionais:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {CAMPOS_INDIVIDUAL.map((c) => (
                    <label key={c.v} className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" className="accent-blue-600" checked={campos.includes(c.v)}
                        onChange={(e) => setCampos((x) => (e.target.checked ? [...x, c.v] : x.filter((y) => y !== c.v)))} />
                      {c.l}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Horários disponíveis (um por linha)</label>
                <textarea value={horarios} onChange={(e) => setHorarios(e.target.value)} rows={5} className={`${inputCls} font-mono`} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link de inscrição como atleta (opcional)</label>
              <input value={form.linkInscricaoAtleta} onChange={(e) => set('linkInscricaoAtleta', e.target.value)}
                placeholder="Por omissão: página de registo da app" className={inputCls} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="accent-blue-600" checked={form.inscricoesAbertas} onChange={(e) => set('inscricoesAbertas', e.target.checked)} />
              Formulário aberto (gera o link público)
            </label>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} disabled={saving} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'A guardar...' : evento ? 'Guardar' : 'Criar evento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Participantes ───────────────────────────────────────────────────────────

const ROTULOS_DADOS: Record<string, string> = {
  nomePreferido: 'Nome preferido', genero: 'Género', documentoIdentificacao: 'Documento', provas: 'Provas',
  experienciaPrevia: 'Experiência anterior', comoConheceu: 'Como conheceu', nivelNatacao: 'Sabe nadar',
  condicaoSaude: 'Condição de saúde', condicaoSaudeDetalhe: 'Detalhe saúde', contactoEmergencia: 'Contacto emergência',
  parentescoEmergencia: 'Parentesco', instituicao: 'Instituição', idade: 'Idade', classe: 'Classe', horario: 'Horário',
  escola: 'Escola', notas: 'Notas',
};
const fmtValor = (v: any) => (v === true ? 'Sim' : v === false ? 'Não' : Array.isArray(v) ? v.join(', ') : String(v));

function ParticipantesTab({ evento }: { evento: any }) {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [search, setSearch] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [modo, setModo] = useState<'MANUAL' | 'WALK_IN'>('MANUAL');
  const [novo, setNovo] = useState({ nome: '', contacto: '', email: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.set('estado', filtroEstado);
      if (search.trim()) params.set('search', search.trim());
      const r = await api.get(`/eventos/${evento.id}/participantes?${params}`);
      setParticipantes(r.data.data || r.data);
    } catch (e: any) {
      toast.error('Erro ao carregar participantes', erroMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [filtroEstado, search]);

  useEffect(() => {
    if (!studentSearch) { setStudentResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/students?search=${encodeURIComponent(studentSearch)}&limit=6`);
        setStudentResults(r.data.data ?? []);
      } catch { setStudentResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  const acao = async (fn: () => Promise<any>, ok?: string) => {
    try { await fn(); if (ok) toast.success(ok); load(); } catch (e: any) { toast.error('Erro', erroMsg(e)); }
  };

  const adicionarAtleta = (studentId: string) => acao(async () => {
    if (modo === 'WALK_IN') {
      const s = studentResults.find((x) => x.id === studentId);
      await api.post(`/eventos/${evento.id}/walk-in`, { studentId, nome: `${s.firstName} ${s.lastName}` });
    } else {
      await api.post(`/eventos/${evento.id}/participantes`, { studentId });
    }
    setStudentSearch(''); setStudentResults([]);
  });

  const adicionarManual = () => {
    if (!novo.nome.trim()) { toast.error('Campo obrigatório', 'Indica o nome do participante'); return; }
    acao(async () => {
      const body = { nome: novo.nome.trim(), contacto: novo.contacto.trim() || undefined, email: novo.email.trim() || undefined };
      await api.post(`/eventos/${evento.id}/${modo === 'WALK_IN' ? 'walk-in' : 'participantes'}`, body);
      setNovo({ nome: '', contacto: '', email: '' });
    }, modo === 'WALK_IN' ? 'Participante registado como presente' : undefined);
  };

  const exportar = async () => {
    try {
      const r = await api.get(`/eventos/${evento.id}/participantes/exportar`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participantes-${evento.nome.replace(/[^\w-]+/g, '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error('Erro ao exportar', erroMsg(e));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, contacto, email..." className="flex-1 text-sm outline-none" />
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">Todos os estados</option>
          {ESTADOS_PARTICIPANTE.map((e) => <option key={e.v} value={e.v}>{e.l}</option>)}
        </select>
        <button onClick={exportar} className="inline-flex items-center justify-center gap-1.5 text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      </div>

      {loading ? <p className="text-xs text-gray-400">A carregar...</p> : (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500">{participantes.length} participante(s)</p>
          {participantes.length === 0 && <p className="text-xs text-gray-400">Nenhum participante encontrado</p>}
          {participantes.map((p: any) => {
            const dados: Record<string, any> = p.dadosFormulario ?? {};
            const expandido = aberto === p.id;
            return (
              <div key={p.id} className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => setAberto(expandido ? null : p.id)} className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-gray-900 truncate flex items-center gap-1.5">
                      {p.nomeExibicao}
                      {p.studentId && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded">atleta</span>}
                      {p.lead && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded">pedido criado</span>}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {ORIGEM_LABEL[p.origem] ?? p.origem}
                      {p.contacto ? ` · ${p.contacto}` : ''}{p.email ? ` · ${p.email}` : ''}
                      {!p.contacto && !p.email && !p.studentId ? ' · sem contacto' : ''}
                    </p>
                  </button>
                  <select value={p.estado} onChange={(e) => acao(() => api.patch(`/eventos/participantes/${p.id}/estado`, { estado: e.target.value }))}
                    className={`text-xs rounded-full px-2 py-1 font-medium border-0 ${ESTADO_INFO[p.estado]?.cor ?? ''}`}>
                    {ESTADOS_PARTICIPANTE.map((e) => <option key={e.v} value={e.v}>{e.l}</option>)}
                  </select>
                  <button onClick={() => setAberto(expandido ? null : p.id)} className="p-1 text-gray-400">
                    {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {expandido && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {p.submetidoEm && <><dt className="text-gray-400">Submetido em</dt><dd className="text-gray-700">{new Date(p.submetidoEm).toLocaleString('pt-PT')}</dd></>}
                      {p.dataNascimento && <><dt className="text-gray-400">Data de nascimento</dt><dd className="text-gray-700">{new Date(p.dataNascimento).toLocaleDateString('pt-PT')}</dd></>}
                      {p.autorizacaoImagem != null && <><dt className="text-gray-400">Autoriza imagem</dt><dd className="text-gray-700">{p.autorizacaoImagem ? 'Sim' : 'Não'}</dd></>}
                      {p.inscricao?.tipo === 'ESCOLA' && <><dt className="text-gray-400">Responsável</dt><dd className="text-gray-700">{p.inscricao.responsavelNome} · {p.inscricao.contacto}</dd></>}
                      {Object.entries(dados).map(([k, v]) => (
                        <Fragment key={k}><dt className="text-gray-400">{ROTULOS_DADOS[k] ?? k}</dt><dd className="text-gray-700">{fmtValor(v)}</dd></Fragment>
                      ))}
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      {!p.studentId && !p.lead && p.estado !== 'CANCELADO' && (
                        <button onClick={() => acao(() => api.post(`/eventos/participantes/${p.id}/pedido-inscricao`), 'Pedido de inscrição criado no CRM (Leads)')}
                          className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg hover:bg-purple-100">
                          <UserCheck className="w-3.5 h-3.5" /> Criar pedido de inscrição
                        </button>
                      )}
                      <button onClick={() => { if (confirm('Remover este participante da lista?')) acao(() => api.delete(`/eventos/participantes/${p.id}`)); }}
                        className="inline-flex items-center gap-1 text-xs text-red-500 px-2.5 py-1 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2 border-t border-gray-100 pt-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(['MANUAL', 'WALK_IN'] as const).map((m) => (
            <button key={m} onClick={() => setModo(m)}
              className={`text-xs px-3 py-1 rounded-md ${modo === m ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500'}`}>
              {m === 'MANUAL' ? 'Adicionar à lista' : 'Apareceu no dia (presente)'}
            </button>
          ))}
        </div>
        <div>
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Pesquisar atleta..." className="flex-1 text-sm outline-none" />
          </div>
          {studentResults.length > 0 && (
            <div className="mt-1 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-32 overflow-y-auto">
              {studentResults.map((s: any) => (
                <button key={s.id} type="button" onClick={() => adicionarAtleta(s.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                  {s.firstName} {s.lastName}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_10rem_auto] gap-2">
          <input value={novo.nome} onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))} placeholder="Ou nome (visitante)..." className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          <input value={novo.contacto} onChange={(e) => setNovo((n) => ({ ...n, contacto: e.target.value }))} placeholder="Contacto" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          <input value={novo.email} onChange={(e) => setNovo((n) => ({ ...n, email: e.target.value }))} placeholder="Email" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          <button onClick={adicionarManual} disabled={!novo.nome.trim()} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">Adicionar</button>
        </div>
        {modo === 'WALK_IN' && <p className="text-[11px] text-gray-400">Sem contacto, o participante fica registado mas não receberá comunicações.</p>}
      </div>
    </div>
  );
}

// ─── Comunicação ─────────────────────────────────────────────────────────────

const ESTADO_ENVIO: Record<string, string> = {
  EM_FILA: 'bg-amber-100 text-amber-700', ENVIADO: 'bg-green-100 text-green-700', FALHOU: 'bg-red-100 text-red-600',
  SEM_CONTACTO: 'bg-gray-200 text-gray-600', CANCELADO: 'bg-gray-200 text-gray-500',
};

function ComunicacaoTab({ evento }: { evento: any }) {
  const [form, setForm] = useState({
    titulo: `Obrigado por participar no ${evento.nome}!`,
    mensagem: 'Foi um prazer receber-te. Partilhamos contigo os vídeos e as fotografias do evento.',
    videoUrl: '', galeriaUrl: '', proximasActividades: '', incluirLinkInscricao: true,
    canais: ['WHATSAPP'] as string[], estados: ['PRESENTE'] as string[],
  });
  const [preview, setPreview] = useState<any | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [historico, setHistorico] = useState<any[]>([]);
  const [abertoHist, setAbertoHist] = useState<string | null>(null);
  const [leads, setLeads] = useState<any | null>(null);
  const [leadFiltro, setLeadFiltro] = useState({ estado: '', origem: '' });
  const set = (k: string, v: any) => { setForm((f) => ({ ...f, [k]: v })); setPreview(null); };
  const toggle = (k: 'canais' | 'estados', v: string) =>
    set(k, form[k].includes(v) ? form[k].filter((x) => x !== v) : [...form[k], v]);

  const loadHist = () => api.get(`/eventos/${evento.id}/comunicacoes`).then((r) => setHistorico(r.data.data ?? r.data)).catch(() => {});
  useEffect(() => { loadHist(); }, []);

  const corpo = (confirmar: boolean) => {
    const b: any = { ...form, confirmar };
    for (const k of ['videoUrl', 'galeriaUrl', 'proximasActividades']) if (!b[k]?.trim()) delete b[k];
    return b;
  };

  const preVisualizar = async () => {
    try {
      const r = await api.post(`/eventos/${evento.id}/comunicacoes`, corpo(false));
      setPreview(r.data.data ?? r.data);
    } catch (e: any) { toast.error('Erro', erroMsg(e)); }
  };

  const enviar = async () => {
    setEnviando(true);
    try {
      const r = await api.post(`/eventos/${evento.id}/comunicacoes`, corpo(true));
      const d = r.data.data ?? r.data;
      toast.success('Comunicação registada', `${d.whatsappEmFila} WhatsApp na caixa de saída · ${d.emailsEnviados} email(s) enviados${d.emailsFalhados ? ` · ${d.emailsFalhados} falharam` : ''}`);
      setPreview(null);
      loadHist();
    } catch (e: any) { toast.error('Erro ao enviar', erroMsg(e)); }
    finally { setEnviando(false); }
  };

  const partilharLeads = async (confirmar: boolean) => {
    try {
      const body: any = { confirmar };
      if (leadFiltro.estado) body.estado = leadFiltro.estado;
      if (leadFiltro.origem) body.origem = leadFiltro.origem;
      const r = await api.post(`/eventos/${evento.id}/partilhar-leads`, body);
      const d = r.data.data ?? r.data;
      if (confirmar) { toast.success('Convites na caixa de saída do WhatsApp', `${d.enfileirados} lead(s)`); setLeads(null); }
      else setLeads(d);
    } catch (e: any) { toast.error('Erro', erroMsg(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Mensagem pós-evento aos participantes</h3>
        <input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Título" className={inputCls} />
        <textarea value={form.mensagem} onChange={(e) => set('mensagem', e.target.value)} rows={3} placeholder="Agradecimento e resumo" className={inputCls} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} placeholder="Link do vídeo (YouTube, Drive...)" className={inputCls} />
          <input value={form.galeriaUrl} onChange={(e) => set('galeriaUrl', e.target.value)} placeholder="Link da galeria de fotos" className={inputCls} />
        </div>
        <textarea value={form.proximasActividades} onChange={(e) => set('proximasActividades', e.target.value)} rows={2} placeholder="Próximas actividades (opcional)" className={inputCls} />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="accent-blue-600" checked={form.incluirLinkInscricao} onChange={(e) => set('incluirLinkInscricao', e.target.checked)} />
          Incluir link para inscrição como atleta
        </label>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Canais</p>
            {['WHATSAPP', 'EMAIL'].map((c) => (
              <label key={c} className="inline-flex items-center gap-1.5 mr-3">
                <input type="checkbox" className="accent-blue-600" checked={form.canais.includes(c)} onChange={() => toggle('canais', c)} />
                {c === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Destinatários (estado)</p>
            {ESTADOS_PARTICIPANTE.map((e) => (
              <label key={e.v} className="inline-flex items-center gap-1.5 mr-3">
                <input type="checkbox" className="accent-blue-600" checked={form.estados.includes(e.v)} onChange={() => toggle('estados', e.v)} />
                {e.l}
              </label>
            ))}
          </div>
        </div>
        <button onClick={preVisualizar} disabled={!form.canais.length || !form.estados.length}
          className="text-sm border border-blue-600 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50">
          Pré-visualizar destinatários
        </button>

        {preview && (
          <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[['Participantes', preview.totalDestinatarios], ['WhatsApp', preview.totalWhatsapp], ['Email', preview.totalEmail], ['Sem contacto', preview.semContacto.length]].map(([l, v]) => (
                <div key={l as string} className="bg-white rounded-lg py-2"><p className="text-lg font-bold text-gray-900">{v}</p><p className="text-[11px] text-gray-500">{l}</p></div>
              ))}
            </div>
            {preview.semContacto.length > 0 && (
              <p className="text-xs text-gray-600">
                Sem contacto (não recebem): {preview.semContacto.slice(0, 8).map((s: any) => s.nome).join(', ')}{preview.semContacto.length > 8 ? '…' : ''}
              </p>
            )}
            <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap font-sans text-gray-700 max-h-48 overflow-y-auto">{preview.exemplo}</pre>
            <p className="text-[11px] text-gray-500">
              WhatsApp: as mensagens ficam na caixa de saída (Comunicação → WhatsApp) para envio manual uma a uma. Email: enviado agora pelo servidor.
            </p>
            <button onClick={enviar} disabled={enviando || preview.totalDestinatarios === 0}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              <Send className="w-4 h-4" /> {enviando ? 'A processar...' : `Confirmar envio a ${preview.totalDestinatarios - preview.semContacto.length} participante(s)`}
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Histórico</h3>
        {historico.length === 0 && <p className="text-xs text-gray-400">Nenhuma comunicação enviada</p>}
        {historico.map((c: any) => {
          const contagem = c.envios.reduce((acc: any, e: any) => ({ ...acc, [e.estado]: (acc[e.estado] ?? 0) + 1 }), {});
          return (
            <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2">
              <button onClick={() => setAbertoHist(abertoHist === c.id ? null : c.id)} className="w-full text-left">
                <p className="text-sm text-gray-900">{c.titulo}</p>
                <p className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleString('pt-PT')} · {Object.entries(contagem).map(([k, v]) => `${v} ${k.replace('_', ' ').toLowerCase()}`).join(' · ')}
                </p>
              </button>
              {abertoHist === c.id && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {c.envios.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate">{e.nome} <span className="text-gray-400">{e.canal !== 'NENHUM' ? `· ${e.canal.toLowerCase()} ${e.destino}` : ''}</span></span>
                      <span className={`px-2 py-0.5 rounded-full ${ESTADO_ENVIO[e.estado] ?? ''}`}>{e.estado.replace('_', ' ').toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Convidar leads para a pré-inscrição</h3>
        {!evento.inscricoesAbertas ? (
          <p className="text-xs text-gray-400">Abre o formulário de pré-inscrição deste evento para poder convidar leads.</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={leadFiltro.estado} onChange={(e) => { setLeadFiltro((f) => ({ ...f, estado: e.target.value })); setLeads(null); }} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="">Leads em aberto</option>
                {['NOVO', 'CONTACTADO', 'AGENDADO'].map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <select value={leadFiltro.origem} onChange={(e) => { setLeadFiltro((f) => ({ ...f, origem: e.target.value })); setLeads(null); }} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="">Todas as origens</option>
                {['REFERIDO', 'REDES_SOCIAIS', 'OPEN_DAY', 'WALK_IN', 'WEBSITE', 'CAMPANHA', 'OUTRO'].map((o) => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
              </select>
              <button onClick={() => partilharLeads(false)} className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50">Pré-visualizar</button>
            </div>
            {leads && (
              <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                <p className="text-sm text-gray-700"><strong>{leads.total}</strong> lead(s) com telefone</p>
                <pre className="text-xs bg-gray-50 rounded-lg p-2 whitespace-pre-wrap font-sans text-gray-700">{leads.exemplo}</pre>
                <button onClick={() => partilharLeads(true)} disabled={!leads.total}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  <MessageSquare className="w-4 h-4" /> Colocar {leads.total} convite(s) na caixa de saída
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Checklist ───────────────────────────────────────────────────────────────

function ChecklistTab({ evento, onSaved }: { evento: any; onSaved: () => void }) {
  const [checklist, setChecklist] = useState<{ texto: string; checked: boolean }[]>(parseChecklist(evento.checklistMateriais));
  const [novoItem, setNovoItem] = useState('');
  const [saving, setSaving] = useState(false);

  const salvar = async (next: { texto: string; checked: boolean }[]) => {
    const previous = checklist;
    setChecklist(next);
    setSaving(true);
    try {
      await api.put(`/eventos/${evento.id}`, { checklistMateriais: JSON.stringify(next) });
      onSaved();
    } catch (e: any) {
      setChecklist(previous);
      toast.error('Erro ao guardar checklist', erroMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const adicionar = () => {
    if (!novoItem.trim()) return;
    salvar([...checklist, { texto: novoItem.trim(), checked: false }]);
    setNovoItem('');
  };

  return (
    <div>
      <div className="space-y-1.5">
        {checklist.length === 0 && <p className="text-xs text-gray-400">Nenhum item na checklist</p>}
        {checklist.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <button onClick={() => salvar(checklist.map((it, idx) => idx === i ? { ...it, checked: !it.checked } : it))}
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${item.checked ? 'bg-green-600 border-green-600' : 'border-gray-300 bg-white'}`}>
              {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
            <span className={`flex-1 text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.texto}</span>
            <button onClick={() => salvar(checklist.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input value={novoItem} onChange={(e) => setNovoItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') adicionar(); }}
          placeholder="Novo item... (ex: Fitas de largada)" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        <button onClick={adicionar} disabled={!novoItem.trim() || saving} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">Adicionar</button>
      </div>
    </div>
  );
}

function EventoManageModal({ evento, onClose, onSaved }: { evento: any; onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<'participantes' | 'comunicacao' | 'checklist'>('participantes');
  const tabs = [
    { k: 'participantes', l: 'Participantes', i: Users },
    { k: 'comunicacao', l: 'Comunicação', i: Send },
    { k: 'checklist', l: 'Materiais', i: ClipboardList },
  ] as const;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{evento.nome}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{new Date(evento.data).toLocaleDateString('pt-PT')}{evento.hora ? ` · ${evento.hora}` : ''}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-1 mt-3">
            {tabs.map(({ k, l, i: Icon }) => (
              <button key={k} onClick={() => setTab(k)}
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg ${tab === k ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Icon className="w-4 h-4" /> {l}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          {tab === 'participantes' && <ParticipantesTab evento={evento} />}
          {tab === 'comunicacao' && <ComunicacaoTab evento={evento} />}
          {tab === 'checklist' && <ChecklistTab evento={evento} onSaved={onSaved} />}
        </div>
      </div>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function EventosPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formEvento, setFormEvento] = useState<any | null | undefined>(undefined);
  const [manageEvento, setManageEvento] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/eventos');
      setEventos(r.data.data || r.data);
    } catch (e: any) {
      toast.error('Erro ao carregar eventos', erroMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const atualizar = async (id: string, data: any, ok?: string) => {
    try {
      await api.put(`/eventos/${id}`, data);
      if (ok) toast.success(ok);
      load();
    } catch (e: any) {
      toast.error('Erro ao atualizar evento', erroMsg(e));
    }
  };

  const regenerar = async (id: string) => {
    if (!confirm('O link actual deixará de funcionar. Gerar um novo link?')) return;
    try {
      const r = await api.post(`/eventos/${id}/regenerar-link`);
      const d = r.data.data ?? r.data;
      copiar(d.urlPublica);
      load();
    } catch (e: any) { toast.error('Erro', erroMsg(e)); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos e Open Days</h1>
          <p className="text-gray-500 text-sm mt-1">Pré-inscrições, participantes e comunicação pós-evento (SOP 07)</p>
        </div>
        <button onClick={() => setFormEvento(null)} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Evento
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">A carregar...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhum evento registado</p>
            </div>
          )}
          {eventos.map((e: any) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="px-5 pt-5 pb-4 flex-1">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <span className="text-xs text-gray-400 font-medium">{e.tipo.replace('_', ' ')} · formulário {e.formularioTipo === 'ESCOLA' ? 'escola' : 'individual'}</span>
                    <h3 className="font-bold text-gray-900 text-lg mt-0.5">{e.nome}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${ESTADOS_CORES[e.estado]}`}>{e.estado}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{new Date(e.data).toLocaleDateString('pt-PT', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
                  {e.hora && <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{e.hora}</div>}
                  {(e.local || e.unidade) && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{[e.local, e.unidade?.nome].filter(Boolean).join(' — ')}</div>}
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />
                    {e.preInscricoes ?? 0} pré-inscrições · {e._count?.participantes ?? 0} na lista{e.capacidade ? ` / ${e.capacidade}` : ''}
                  </div>
                  {e._count?.certificados > 0 && <div className="flex items-center gap-2"><Award className="w-4 h-4 text-gray-400" />{e._count.certificados} certificados</div>}
                </div>
                {e.urlPublica && (
                  <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${e.inscricoesAbertas ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500'}`}>
                    <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate flex-1">{e.inscricoesAbertas ? 'Formulário aberto' : 'Formulário fechado'}</span>
                    <button onClick={() => copiar(e.urlPublica)} title="Copiar link" className="p-1 hover:bg-white rounded"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => regenerar(e.id)} title="Gerar novo link" className="p-1 hover:bg-white rounded"><RefreshCw className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              <div className="px-5 pb-4 flex flex-wrap gap-2">
                <button onClick={() => setManageEvento(e)} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 py-1.5 px-3 rounded-lg hover:bg-blue-100 font-medium">
                  <ClipboardList className="w-3.5 h-3.5" /> Gerir
                </button>
                <button onClick={() => setFormEvento(e)} className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 py-1.5 px-3 rounded-lg hover:bg-gray-200">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                {e.estado === 'PLANEADO' && (
                  <button onClick={() => atualizar(e.id, { inscricoesAbertas: !e.inscricoesAbertas }, e.inscricoesAbertas ? 'Formulário fechado (os dados mantêm-se)' : 'Formulário aberto')}
                    className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 py-1.5 px-3 rounded-lg hover:bg-gray-200">
                    {e.inscricoesAbertas ? <><Lock className="w-3.5 h-3.5" /> Fechar inscrições</> : <><Unlock className="w-3.5 h-3.5" /> Abrir inscrições</>}
                  </button>
                )}
                {e.estado === 'PLANEADO' && <button onClick={() => atualizar(e.id, { estado: 'REALIZADO', inscricoesAbertas: false })} className="text-xs bg-green-100 text-green-700 py-1.5 px-3 rounded-lg hover:bg-green-200 font-medium">Marcar Realizado</button>}
                {e.estado === 'PLANEADO' && <button onClick={() => { if (confirm('Cancelar este evento?')) atualizar(e.id, { estado: 'CANCELADO', inscricoesAbertas: false }); }} className="text-xs bg-red-100 text-red-600 py-1.5 px-3 rounded-lg hover:bg-red-200">Cancelar</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {formEvento !== undefined && <EventoFormModal evento={formEvento ?? undefined} onClose={() => setFormEvento(undefined)} onSaved={load} />}
      {manageEvento && <EventoManageModal evento={manageEvento} onClose={() => { setManageEvento(null); load(); }} onSaved={load} />}
    </div>
  );
}
