'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, AlertCircle, Calendar, Clock, MapPin, CheckCircle2, Plus, Trash2, Zap, ArrowDown, ChevronDown, Expand, X } from 'lucide-react';
import api from '@/lib/api';
import { FormPrograma, ResultadoProgramaCard, fmtDia, type PacotePublico } from './form-programa';
import { srcImagemEvento } from '@/lib/imagem-evento';

import { Logo } from '@/components/brand/Logo';
interface EventoPublico {
  nome: string;
  tipo: string;
  descricao?: string | null;
  programa?: string | null;
  data: string;
  hora?: string | null;
  local?: string | null;
  unidade?: string | null;
  formularioTipo: 'INDIVIDUAL' | 'ESCOLA' | 'PROGRAMA';
  dataFim?: string | null;
  periodo?: { inicio: string; fim: string | null };
  hoje?: string;
  pacotes?: PacotePublico[];
  formulario: { campos: string[]; horarios: string[] };
  imagens?: { url: string; legenda?: string | null; cartaz: boolean }[];
  inscricoesAbertas: boolean;
  motivoFechado?: string | null;
}

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
  const [f, setF] = useState<any>({ declaracao: false, website: '' });
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
  const [encarregado, setEncarregado] = useState<Record<string, any> | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);
  const { data, isLoading, isError } = useQuery<EventoPublico>({
    queryKey: ['evento-publico', token],
    queryFn: async () => {
      const { data } = await api.get(`/eventos-publicos/${token}`);
      return data.data ?? data;
    },
    retry: false,
  });
  const cartaz = data?.imagens?.find((i) => i.cartaz) ?? null;
  const galeria = (data?.imagens ?? []).filter((i) => i !== cartaz);
  const [ampliada, setAmpliada] = useState<{ src: string; alt: string } | null>(null);
  const [verDetalhes, setVerDetalhes] = useState(false);

  useEffect(() => {
    if (!ampliada) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAmpliada(null); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [ampliada]);

  const ePrograma = data?.formularioTipo === 'PROGRAMA';
  const rotulo = ePrograma ? 'Programa exclusivo' : data?.tipo === 'OPEN_DAY' ? 'Open Day' : 'Evento exclusivo';
  const dataTexto = data
    ? ePrograma && data.periodo
      ? `${fmtDia(data.periodo.inicio)}${data.periodo.fim ? ` a ${fmtDia(data.periodo.fim)}` : ''}`
      : new Date(data.data).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const temDetalhes = !!(data?.descricao?.trim() || data?.programa?.trim());
  const podeInscrever = !!data && data.inscricoesAbertas && !resultado;
  const srcCartaz = cartaz ? srcImagemEvento(cartaz.url) : '';

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05070d] text-white overflow-x-hidden">
      {/* Fundo: o próprio cartaz desfocado, com halos de luz */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[115vh] overflow-hidden">
        {srcCartaz && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={srcCartaz} alt="" className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-30" />
        )}
        <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-blue-600/30 blur-[120px]" />
        <div className="absolute top-20 -right-40 w-[32rem] h-[32rem] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070d]/40 via-[#05070d]/70 to-[#05070d]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <nav className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
          <Logo fundo="escuro" className="h-9 sm:h-10" />
          {data && (
            <span className="hidden sm:inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/90 border border-amber-200/25 bg-amber-200/5 rounded-full px-3.5 py-1.5">
              <Zap className="w-3.5 h-3.5" /> Convite
            </span>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-1 w-full">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-40 text-white/50">
            <Loader2 className="w-8 h-8 animate-spin mb-3" /> A carregar…
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-40 px-4 text-center">
            <AlertCircle className="w-10 h-10 text-white/30 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Evento não encontrado</h1>
            <p className="text-white/60 text-sm max-w-sm">O link pode estar incorrecto ou já não estar disponível.</p>
            <Link href="/" className="mt-6 text-cyan-300 text-sm font-semibold hover:underline">Voltar à página inicial</Link>
          </div>
        )}

        {data && (
          <>
            {/* Hero */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-16 lg:pt-10 lg:pb-24">
              <div className={`grid gap-10 lg:gap-16 items-center ${cartaz ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]' : ''}`}>
                {cartaz && (
                  <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                    <div aria-hidden className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-cyan-400/25 via-blue-600/10 to-amber-300/20 blur-2xl" />
                    <button type="button" onClick={() => setAmpliada({ src: srcCartaz, alt: cartaz.legenda || `Cartaz — ${data.nome}` })}
                      className="group relative block w-full rounded-[1.75rem] p-px bg-gradient-to-br from-amber-200/70 via-white/15 to-cyan-300/60 shadow-2xl shadow-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      aria-label="Ampliar cartaz">
                      <span className="block overflow-hidden rounded-[calc(1.75rem-1px)] bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={srcCartaz} alt={cartaz.legenda || `Cartaz — ${data.nome}`}
                          className="w-full max-h-[78vh] object-contain transition-transform duration-700 group-hover:scale-[1.02]" />
                      </span>
                      <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 text-xs font-medium bg-black/60 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Expand className="w-3.5 h-3.5" /> Ampliar
                      </span>
                    </button>
                  </div>
                )}

                <div className={cartaz ? '' : 'max-w-3xl mx-auto text-center'}>
                  <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200">
                    <span className="w-8 h-px bg-gradient-to-r from-transparent to-amber-200" />
                    {rotulo}
                  </span>
                  <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] bg-gradient-to-br from-white via-white to-cyan-100/70 bg-clip-text text-transparent break-words">
                    {data.nome}
                  </h1>

                  <dl className={`mt-8 grid gap-3 ${cartaz ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                    <InfoChip icon={<Calendar className="w-4 h-4" />} label={ePrograma ? 'Período' : 'Data'}
                      valor={ePrograma ? `${dataTexto} · segunda a sexta` : dataTexto} />
                    {data.hora && <InfoChip icon={<Clock className="w-4 h-4" />} label="Hora" valor={data.hora} />}
                    {(data.local || data.unidade) && (
                      <InfoChip icon={<MapPin className="w-4 h-4" />} label="Local" valor={[data.local, data.unidade].filter(Boolean).join(' — ')} />
                    )}
                  </dl>

                  <div className={`mt-10 flex flex-wrap items-center gap-4 ${cartaz ? '' : 'justify-center'}`}>
                    {podeInscrever ? (
                      <a href="#inscricao"
                        className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 text-[#1a1203] font-bold px-7 py-3.5 shadow-lg shadow-amber-500/20 hover:shadow-amber-400/40 hover:-translate-y-0.5 transition-all">
                        {ePrograma ? 'Inscrever agora' : 'Reservar o meu lugar'}
                        <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                      </a>
                    ) : !data.inscricoesAbertas ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/70">
                        <AlertCircle className="w-4 h-4" /> {data.motivoFechado ?? 'Inscrições encerradas'}
                      </span>
                    ) : null}
                    {temDetalhes && (
                      <button type="button" aria-expanded={verDetalhes} aria-controls="detalhes-evento"
                        onClick={() => {
                          const abrir = !verDetalhes;
                          setVerDetalhes(abrir);
                          if (abrir) setTimeout(() => document.getElementById('detalhes-evento')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition-colors">
                        {verDetalhes ? 'Esconder detalhes' : 'Mais detalhes do evento'}
                        <ChevronDown className={`w-4 h-4 transition-transform ${verDetalhes ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                    {ePrograma ? null : <span className="text-xs text-white/40">Vagas limitadas · confirmação pela nossa equipa</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* Programa e galeria */}
            {((temDetalhes && verDetalhes) || galeria.length > 0) && (
              <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-10">
                {temDetalhes && verDetalhes && (
                  <div id="detalhes-evento" className="scroll-mt-6 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 sm:p-10">
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Detalhes do evento</span>
                      <button type="button" onClick={() => setVerDetalhes(false)} className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10" aria-label="Esconder detalhes">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-w-3xl space-y-4">
                      {data.descricao && <TextoFormatado texto={data.descricao} />}
                      {data.programa && <TextoFormatado texto={data.programa} />}
                    </div>
                  </div>
                )}

                {galeria.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200 mb-5">Galeria</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {galeria.map((img, i) => {
                        const src = srcImagemEvento(img.url);
                        return (
                          <button key={img.url} type="button" onClick={() => setAmpliada({ src, alt: img.legenda || 'Imagem do evento' })}
                            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left ${i === 0 && galeria.length > 2 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={img.legenda || 'Imagem do evento'} loading="lazy"
                              className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${i === 0 && galeria.length > 2 ? 'h-44 md:h-full' : 'h-44'}`} />
                            {img.legenda && (
                              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2.5 text-xs text-white/90 truncate">{img.legenda}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Inscrição */}
            <section id="inscricao" className="scroll-mt-6 max-w-3xl mx-auto px-4 sm:px-6 pb-20">
              <div className="rounded-[2rem] p-px bg-gradient-to-b from-white/25 via-white/5 to-transparent shadow-2xl shadow-black/50">
                <div className={`rounded-[calc(2rem-1px)] ${ePrograma ? 'bg-gray-50' : 'bg-white'} text-gray-900 p-5 sm:p-10`}>
                  {!resultado && data.inscricoesAbertas && (
                    <div className="mb-8 text-center">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-600">{ePrograma ? 'Inscrição' : 'Pré-inscrição'}</span>
                      <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">Garanta a sua participação</h2>
                      <p className="mt-2 text-sm text-gray-500">Preencha os dados abaixo. Leva menos de dois minutos.</p>
                    </div>
                  )}

                  {resultado && ePrograma ? (
                    <ResultadoProgramaCard r={resultado} onOutra={() => { setResultado(null); setFormKey((k) => k + 1); }} />
                  ) : resultado ? (
                    <div className="text-center py-10 px-2">
                      <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-black mb-2">Pré-inscrição recebida!</h2>
                      <p className="text-gray-600 text-sm max-w-md mx-auto">
                        {resultado.alunos ? `${resultado.alunos} aluno(s) pré-inscrito(s). ` : ''}
                        Entraremos em contacto para confirmar a participação. A pré-inscrição não garante lugar até à confirmação.
                      </p>
                      <p className="text-xs text-gray-400 mt-5">
                        Referência <span className="font-mono font-semibold text-gray-600">{resultado.referencia}</span> ·{' '}
                        {new Date(resultado.submetidoEm).toLocaleString('pt-PT')}
                      </p>
                    </div>
                  ) : !data.inscricoesAbertas ? (
                    <div className="text-center py-10">
                      <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium">{data.motivoFechado ?? 'As pré-inscrições estão encerradas.'}</p>
                    </div>
                  ) : ePrograma ? (
                    <FormPrograma key={formKey} token={token} pacotes={data.pacotes ?? []} hoje={data.hoje ?? new Date().toISOString().slice(0, 10)}
                      periodo={data.periodo ?? { inicio: data.hoje ?? new Date().toISOString().slice(0, 10), fim: null }} inicial={encarregado}
                      onDone={(r, enc) => { setResultado(r); setEncarregado(enc); }} />
                  ) : data.formularioTipo === 'ESCOLA' ? (
                    <FormEscola token={token} horarios={data.formulario.horarios} onDone={setResultado} />
                  ) : (
                    <FormIndividual token={token} campos={data.formulario.campos} onDone={setResultado} />
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/10 py-8">
        <p className="text-center text-white/40 text-xs px-4">© 2026 Mastchieve. Os seus dados são usados apenas para gerir esta inscrição.</p>
      </footer>

      {ampliada && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAmpliada(null)} role="dialog" aria-modal="true">
          <button type="button" onClick={() => setAmpliada(null)} className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ampliada.src} alt={ampliada.alt} className="max-w-full max-h-[92vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

/** Mostra o texto do evento por parágrafos; linhas todas em maiúsculas ficam como títulos de secção. */
function TextoFormatado({ texto }: { texto: string }) {
  const blocos = texto.replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const eTitulo = (l: string) => l.length <= 80 && /[A-ZÀ-Ý]/.test(l) && l === l.toLocaleUpperCase('pt-PT') && !/^\S+:\s/.test(l);
  return (
    <>
      {blocos.map((b, i) => {
        const [primeira, ...resto] = b.split('\n');
        if (eTitulo(primeira)) {
          return (
            <div key={i} className={i > 0 ? 'pt-4' : ''}>
              <h3 className={i === 0 ? 'text-xl sm:text-2xl font-black tracking-tight text-white' : 'text-xs font-bold uppercase tracking-[0.25em] text-amber-200'}>{primeira}</h3>
              {resto.length > 0 && <p className="mt-2 text-white/75 leading-relaxed whitespace-pre-wrap">{resto.join('\n')}</p>}
            </div>
          );
        }
        return <p key={i} className="text-white/75 leading-relaxed whitespace-pre-wrap">{b}</p>;
      })}
    </>
  );
}

function InfoChip({ icon, label, valor }: { icon: React.ReactNode; label: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl px-4 py-3.5 text-left">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">{icon}{label}</dt>
      <dd className="mt-1 text-sm sm:text-[15px] font-medium text-white first-letter:uppercase">{valor}</dd>
    </div>
  );
}
