'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Waves, Loader2, AlertCircle, Calendar, Clock, MapPin, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface EventoPublico {
  nome: string;
  tipo: string;
  descricao?: string | null;
  programa?: string | null;
  data: string;
  hora?: string | null;
  local?: string | null;
  unidade?: string | null;
  formularioTipo: 'INDIVIDUAL' | 'ESCOLA';
  formulario: { campos: string[]; horarios: string[] };
  inscricoesAbertas: boolean;
  motivoFechado?: string | null;
}

const PROVAS = [
  { v: 'CHOURICO', l: 'Chouriço' }, { v: 'PRANCHA', l: 'Prancha' }, { v: 'BRACOS', l: 'Braços' },
  { v: 'CRAWL', l: 'Crawl' }, { v: 'COSTAS', l: 'Costas' }, { v: 'BRUCOS', l: 'Bruços' },
];
const NIVEIS = [
  { v: 'NAO', l: 'Não sei nadar' }, { v: 'POUCO', l: 'Pouco' }, { v: 'RAZOAVEL', l: 'Razoável' }, { v: 'BEM', l: 'Bem' },
];
const MAX_ALUNOS = 10;

const input = 'w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

function mensagemErro(e: any): string {
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join(' · ');
  if (e?.response?.status === 429) return 'Demasiados pedidos. Aguarde alguns segundos e tente novamente.';
  return m ?? 'Não foi possível submeter. Verifique a ligação e tente novamente.';
}

function Campo({ label, children, obrigatorio }: { label: string; children: React.ReactNode; obrigatorio?: boolean }) {
  return (
    <div>
      <label className={labelCls}>{label}{obrigatorio && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  );
}

function SimNao({ value, onChange }: { value?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${value === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
          {v ? 'Sim' : 'Não'}
        </button>
      ))}
    </div>
  );
}

function FormIndividual({ token, campos, onDone }: { token: string; campos: string[]; onDone: (r: any) => void }) {
  const on = (c: string) => campos.includes(c);
  const [f, setF] = useState<any>({ provas: [] as string[], declaracao: false, website: '' });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!f.declaracao) { setErro('Confirme a declaração no final do formulário.'); return; }
    if (f.condicaoSaude === true && !f.condicaoSaudeDetalhe?.trim()) { setErro('Indique qual a condição de saúde.'); return; }
    setEnviando(true);
    try {
      const body: any = {};
      for (const [k, v] of Object.entries(f)) if (v !== '' && v !== undefined) body[k] = v;
      if (!body.provas?.length) delete body.provas;
      body.website = f.website;
      const { data } = await api.post(`/eventos-publicos/${token}/individual`, body);
      onDone(data.data ?? data);
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={submeter} className="space-y-5">
      {/* honeypot */}
      <input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)}
        className="hidden" aria-hidden="true" />

      <Campo label="Nome completo" obrigatorio>
        <input className={input} required minLength={3} maxLength={120} value={f.nomeCompleto ?? ''} onChange={(e) => set('nomeCompleto', e.target.value)} />
      </Campo>
      {on('nomePreferido') && (
        <Campo label="Como prefere ser chamado(a)">
          <input className={input} maxLength={60} value={f.nomePreferido ?? ''} onChange={(e) => set('nomePreferido', e.target.value)} />
        </Campo>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {on('genero') && (
          <Campo label="Género">
            <select className={input} value={f.genero ?? ''} onChange={(e) => set('genero', e.target.value)}>
              <option value="">—</option><option value="F">Feminino</option><option value="M">Masculino</option>
            </select>
          </Campo>
        )}
        {on('dataNascimento') && (
          <Campo label="Data de nascimento">
            <input type="date" className={input} max={new Date().toISOString().slice(0, 10)} value={f.dataNascimento ?? ''} onChange={(e) => set('dataNascimento', e.target.value)} />
          </Campo>
        )}
        <Campo label="Contacto (telefone)" obrigatorio>
          <input type="tel" className={input} required placeholder="+258 84 123 4567" value={f.contacto ?? ''} onChange={(e) => set('contacto', e.target.value)} />
        </Campo>
        {on('email') && (
          <Campo label="Email">
            <input type="email" className={input} value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </Campo>
        )}
        {on('documentoIdentificacao') && (
          <Campo label="Nº do documento de identificação">
            <input className={input} maxLength={40} value={f.documentoIdentificacao ?? ''} onChange={(e) => set('documentoIdentificacao', e.target.value)} />
          </Campo>
        )}
      </div>

      {on('provas') && (
        <Campo label="Provas em que quer participar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PROVAS.map((p) => {
              const sel = f.provas.includes(p.v);
              return (
                <button key={p.v} type="button"
                  onClick={() => set('provas', sel ? f.provas.filter((x: string) => x !== p.v) : [...f.provas, p.v])}
                  className={`py-2 rounded-xl text-sm border transition ${sel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                  {p.l}
                </button>
              );
            })}
          </div>
        </Campo>
      )}
      {on('experienciaPrevia') && (
        <Campo label="Já participou anteriormente em aulas de natação?">
          <SimNao value={f.experienciaPrevia} onChange={(v) => set('experienciaPrevia', v)} />
        </Campo>
      )}
      {on('nivelNatacao') && (
        <Campo label="Sabe nadar?">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {NIVEIS.map((n) => (
              <button key={n.v} type="button" onClick={() => set('nivelNatacao', n.v)}
                className={`py-2 rounded-xl text-sm border transition ${f.nivelNatacao === n.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                {n.l}
              </button>
            ))}
          </div>
        </Campo>
      )}
      {on('comoConheceu') && (
        <Campo label="Como teve conhecimento do evento?">
          <input className={input} maxLength={200} value={f.comoConheceu ?? ''} onChange={(e) => set('comoConheceu', e.target.value)} />
        </Campo>
      )}
      {on('condicaoSaude') && (
        <Campo label="Tem alguma condição de saúde que devamos conhecer?">
          <SimNao value={f.condicaoSaude} onChange={(v) => set('condicaoSaude', v)} />
          {f.condicaoSaude && (
            <textarea className={`${input} mt-2`} rows={2} maxLength={500} placeholder="Qual?" value={f.condicaoSaudeDetalhe ?? ''}
              onChange={(e) => set('condicaoSaudeDetalhe', e.target.value)} />
          )}
        </Campo>
      )}
      {on('contactoEmergencia') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Contacto de emergência">
            <input type="tel" className={input} value={f.contactoEmergencia ?? ''} onChange={(e) => set('contactoEmergencia', e.target.value)} />
          </Campo>
          <Campo label="Relação / parentesco">
            <input className={input} maxLength={60} value={f.parentescoEmergencia ?? ''} onChange={(e) => set('parentescoEmergencia', e.target.value)} />
          </Campo>
        </div>
      )}
      {on('instituicao') && (
        <Campo label="Instituição / escola / empresa">
          <input className={input} maxLength={120} value={f.instituicao ?? ''} onChange={(e) => set('instituicao', e.target.value)} />
        </Campo>
      )}
      {on('autorizacaoImagem') && (
        <Campo label="Autoriza a captação e divulgação de imagens (fotografia/vídeo) durante o evento?">
          <SimNao value={f.autorizacaoImagem} onChange={(v) => set('autorizacaoImagem', v)} />
        </Campo>
      )}

      <Declaracao checked={f.declaracao} onChange={(v) => set('declaracao', v)} />
      {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{erro}</p>}
      <BotaoSubmeter enviando={enviando} />
    </form>
  );
}

function Declaracao({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
      <span className="text-sm text-gray-700">
        Declaro que as informações prestadas são verdadeiras e autorizo a Mastchieve a utilizá-las apenas para a gestão
        desta pré-inscrição e para me contactar sobre o evento.<span className="text-red-500"> *</span>
      </span>
    </label>
  );
}

function BotaoSubmeter({ enviando }: { enviando: boolean }) {
  return (
    <button type="submit" disabled={enviando}
      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 transition disabled:opacity-60">
      {enviando && <Loader2 className="w-4 h-4 animate-spin" />} {enviando ? 'A submeter...' : 'Submeter pré-inscrição'}
    </button>
  );
}

const alunoVazio = () => ({ nome: '', idade: '', classe: '', contactoEncarregado: '', horario: '' });

function FormEscola({ token, horarios, onDone }: { token: string; horarios: string[]; onDone: (r: any) => void }) {
  const [f, setF] = useState<any>({ declaracao: false, website: '' });
  const [alunos, setAlunos] = useState<any[]>([alunoVazio()]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const setAluno = (i: number, k: string, v: any) => setAlunos((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!f.declaracao) { setErro('Confirme a declaração no final do formulário.'); return; }
    const lista = alunos.filter((a) => a.nome.trim());
    if (!lista.length) { setErro('Indique pelo menos um aluno.'); return; }
    setEnviando(true);
    try {
      const body: any = {};
      for (const [k, v] of Object.entries(f)) if (v !== '' && v !== undefined) body[k] = v;
      body.website = f.website;
      body.alunos = lista.map((a) => {
        const o: any = { nome: a.nome };
        if (a.idade !== '') o.idade = Number(a.idade);
        if (a.classe) o.classe = a.classe;
        if (a.contactoEncarregado) o.contactoEncarregado = a.contactoEncarregado;
        if (a.horario) o.horario = a.horario;
        return o;
      });
      const { data } = await api.post(`/eventos-publicos/${token}/escola`, body);
      onDone(data.data ?? data);
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={submeter} className="space-y-5">
      <input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)}
        className="hidden" aria-hidden="true" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo label="Escola" obrigatorio>
          <input className={input} required maxLength={150} value={f.escola ?? ''} onChange={(e) => set('escola', e.target.value)} />
        </Campo>
        <Campo label="Responsável da escola" obrigatorio>
          <input className={input} required minLength={3} maxLength={120} value={f.responsavel ?? ''} onChange={(e) => set('responsavel', e.target.value)} />
        </Campo>
        <Campo label="Contacto da escola" obrigatorio>
          <input type="tel" className={input} required value={f.contactoEscola ?? ''} onChange={(e) => set('contactoEscola', e.target.value)} />
        </Campo>
        <Campo label="Email (opcional, para confirmação)">
          <input type="email" className={input} value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        </Campo>
        <Campo label="Local das aulas">
          <input className={input} maxLength={150} value={f.localAulas ?? ''} onChange={(e) => set('localAulas', e.target.value)} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Semana — início">
            <input type="date" className={input} value={f.semanaInicio ?? ''} onChange={(e) => set('semanaInicio', e.target.value)} />
          </Campo>
          <Campo label="Semana — fim">
            <input type="date" className={input} min={f.semanaInicio} value={f.semanaFim ?? ''} onChange={(e) => set('semanaFim', e.target.value)} />
          </Campo>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Alunos ({alunos.length}/{MAX_ALUNOS})</h3>
          <button type="button" disabled={alunos.length >= MAX_ALUNOS} onClick={() => setAlunos((a) => [...a, alunoVazio()])}
            className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium disabled:opacity-40">
            <Plus className="w-4 h-4" /> Adicionar aluno
          </button>
        </div>
        <div className="space-y-3">
          {alunos.map((a, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 w-6">{String(i + 1).padStart(2, '0')}</span>
                <input className={input} placeholder="Nome do aluno" maxLength={120} value={a.nome} onChange={(e) => setAluno(i, 'nome', e.target.value)} />
                {alunos.length > 1 && (
                  <button type="button" onClick={() => setAlunos((x) => x.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:pl-8">
                <input type="number" min={2} max={25} className={input} placeholder="Idade" value={a.idade} onChange={(e) => setAluno(i, 'idade', e.target.value)} />
                <input className={input} placeholder="Classe" maxLength={30} value={a.classe} onChange={(e) => setAluno(i, 'classe', e.target.value)} />
                <input type="tel" className={input} placeholder="Contacto encarregado" value={a.contactoEncarregado} onChange={(e) => setAluno(i, 'contactoEncarregado', e.target.value)} />
                <select className={input} value={a.horario} onChange={(e) => setAluno(i, 'horario', e.target.value)}>
                  <option value="">Horário</option>
                  {horarios.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Campo label="Observações">
        <textarea className={input} rows={3} maxLength={1000} value={f.observacoes ?? ''} onChange={(e) => set('observacoes', e.target.value)} />
      </Campo>
      <Declaracao checked={f.declaracao} onChange={(v) => set('declaracao', v)} />
      {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{erro}</p>}
      <BotaoSubmeter enviando={enviando} />
    </form>
  );
}

export default function EventoPublicoPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [resultado, setResultado] = useState<any | null>(null);
  const { data, isLoading, isError } = useQuery<EventoPublico>({
    queryKey: ['evento-publico', token],
    queryFn: async () => {
      const { data } = await api.get(`/eventos-publicos/${token}`);
      return data.data ?? data;
    },
    retry: false,
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">Mastchieve</span>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" /> A carregar...
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Evento não encontrado</h1>
            <p className="text-gray-500 text-sm max-w-sm">O link pode estar incorrecto ou já não estar disponível.</p>
            <Link href="/" className="mt-6 text-blue-600 text-sm font-semibold hover:underline">Voltar à página inicial</Link>
          </div>
        )}

        {data && (
          <>
            <header className="mb-8">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                {data.tipo === 'OPEN_DAY' ? 'Open Day' : 'Evento'} · Pré-inscrição
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mt-1 mb-4">{data.nome}</h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(data.data).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {data.hora && <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" />{data.hora}</span>}
                {(data.local || data.unidade) && (
                  <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" />
                    {[data.local, data.unidade].filter(Boolean).join(' — ')}
                  </span>
                )}
              </div>
              {data.descricao && <p className="text-gray-700 mt-5 whitespace-pre-wrap leading-relaxed">{data.descricao}</p>}
              {data.programa && (
                <div className="mt-5 bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
                  <h2 className="text-sm font-semibold text-gray-900 mb-1">Programa</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.programa}</p>
                </div>
              )}
            </header>

            {resultado ? (
              <div className="text-center py-12 border border-green-100 bg-green-50/50 rounded-2xl px-6">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Pré-inscrição recebida!</h2>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  {resultado.alunos ? `${resultado.alunos} aluno(s) pré-inscrito(s). ` : ''}
                  Entraremos em contacto para confirmar a participação. A pré-inscrição não garante lugar até à confirmação.
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Referência <span className="font-mono font-semibold text-gray-600">{resultado.referencia}</span> ·{' '}
                  {new Date(resultado.submetidoEm).toLocaleString('pt-PT')}
                </p>
              </div>
            ) : !data.inscricoesAbertas ? (
              <div className="text-center py-12 border border-gray-200 bg-gray-50 rounded-2xl px-6">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">{data.motivoFechado ?? 'As pré-inscrições estão encerradas.'}</p>
              </div>
            ) : data.formularioTipo === 'ESCOLA' ? (
              <FormEscola token={token} horarios={data.formulario.horarios} onDone={setResultado} />
            ) : (
              <FormIndividual token={token} campos={data.formulario.campos} onDone={setResultado} />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-gray-100 py-8">
        <p className="text-center text-gray-400 text-xs">© 2026 Mastchieve. Os seus dados são usados apenas para gerir esta pré-inscrição.</p>
      </footer>
    </div>
  );
}
