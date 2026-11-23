'use client';

import { useMemo, useState } from 'react';
import { Loader2, CheckCircle2, UserPlus, CalendarDays } from 'lucide-react';
import api from '@/lib/api';

export interface PacotePublico {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  dias?: number | null;
}

export interface ResultadoPrograma {
  ok: boolean;
  referencia: string;
  submetidoEm: string;
  evento: string;
  pacote: string;
  preco: number;
  dataInicio: string;
  dataFimPrevista: string | null;
  nomeCrianca?: string;
}

const NIVEIS = [
  { v: 'NAO', l: 'Não sabe nadar' }, { v: 'POUCO', l: 'Pouco' }, { v: 'RAZOAVEL', l: 'Razoável' }, { v: 'BEM', l: 'Bem' },
];

const PROVAS = [
  { v: 'CHOURICO', l: 'Chouriço' }, { v: 'PRANCHA', l: 'Prancha' }, { v: 'BRACOS', l: 'Braços' },
  { v: 'CRAWL', l: 'Crawl' }, { v: 'COSTAS', l: 'Costas' }, { v: 'BRUCOS', l: 'Bruços' },
];

const input = 'w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

export const fmtMt = (v: number) => `${v.toLocaleString('pt-PT', { maximumFractionDigits: 2 })} MT`;
export const fmtDia = (dia?: string | null) => (dia ? dia.split('-').reverse().join('/') : '');

function mensagemErro(e: any): string {
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join(' · ');
  if (e?.response?.status === 429) return 'Demasiados pedidos. Aguarde alguns segundos e tente novamente.';
  return m ?? 'Não foi possível submeter. Verifique a ligação e tente novamente.';
}

function Campo({ label, children, obrigatorio, ajuda }: { label: string; children: React.ReactNode; obrigatorio?: boolean; ajuda?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}{obrigatorio && <span className="text-red-500"> *</span>}</label>
      {children}
      {ajuda && <p className="text-xs text-gray-400 mt-1">{ajuda}</p>}
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

/** Dia útil seguinte (ou o próprio) dentro do período, a partir de max(hoje, início). */
function primeiroDiaUtil(periodo: { inicio: string; fim: string | null }, hoje: string): string {
  const base = hoje > periodo.inicio ? hoje : periodo.inicio;
  const d = new Date(`${base}T00:00:00Z`);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  const dia = d.toISOString().slice(0, 10);
  return periodo.fim && dia > periodo.fim ? base : dia;
}

const DADOS_CRIANCA = ['nomeCrianca', 'dataNascimento', 'genero', 'escola', 'nivelNatacao', 'provas', 'condicaoSaude', 'condicaoSaudeDetalhe', 'autorizacaoImagem'];

export function FormPrograma({ token, pacotes, periodo, hoje, onDone, inicial }: {
  token: string;
  pacotes: PacotePublico[];
  periodo: { inicio: string; fim: string | null };
  hoje: string;
  onDone: (r: ResultadoPrograma, dadosEncarregado: Record<string, any>) => void;
  inicial?: Record<string, any>;
}) {
  const [f, setF] = useState<any>(() => ({
    declaracao: false, website: '', pacoteId: pacotes.length === 1 ? pacotes[0].id : '',
    dataInicio: primeiroDiaUtil(periodo, hoje), ...(inicial ?? {}),
  }));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const pacote = useMemo(() => pacotes.find((p) => p.id === f.pacoteId), [pacotes, f.pacoteId]);
  const minimo = hoje > periodo.inicio ? hoje : periodo.inicio;
  const diaSemana = f.dataInicio ? new Date(`${f.dataInicio}T00:00:00Z`).getUTCDay() : null;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!f.pacoteId) { setErro('Escolha um pacote.'); return; }
    if (diaSemana === 0 || diaSemana === 6) { setErro('O programa decorre de segunda a sexta-feira. Escolha um dia útil para começar.'); return; }
    if (f.condicaoSaude === true && !f.condicaoSaudeDetalhe?.trim()) { setErro('Indique qual a condição de saúde.'); return; }
    if (!f.declaracao) { setErro('Confirme a declaração no final do formulário.'); return; }
    setEnviando(true);
    try {
      const body: any = {};
      for (const [k, v] of Object.entries(f)) if (v !== '' && v !== undefined && v !== null) body[k] = v;
      body.website = f.website;
      const { data } = await api.post(`/eventos-publicos/${token}/programa`, body);
      const r = (data.data ?? data) as ResultadoPrograma;
      const encarregado: Record<string, any> = {};
      for (const [k, v] of Object.entries(f)) if (!DADOS_CRIANCA.includes(k) && k !== 'declaracao' && k !== 'website') encarregado[k] = v;
      onDone({ ...r, nomeCrianca: f.nomeCrianca }, encarregado);
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

      <Seccao n={1} titulo="Pacote e início">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pacotes.map((p) => {
            const sel = f.pacoteId === p.id;
            return (
              <button key={p.id} type="button" onClick={() => set('pacoteId', p.id)} aria-pressed={sel}
                className={`relative text-left rounded-xl border px-4 py-3 transition ${sel ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                {sel && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-blue-600" />}
                <span className="block text-sm font-semibold text-gray-900 pr-6">{p.nome}</span>
                <span className="block text-xl font-black text-gray-900 mt-1">{fmtMt(p.preco)}</span>
                {p.dias ? <span className="block text-xs text-gray-500">{p.dias} dia{p.dias > 1 ? 's' : ''}</span> : null}
              </button>
            );
          })}
        </div>
        <Campo label="Começa em" obrigatorio ajuda={`Dias úteis · ${fmtDia(periodo.inicio)}${periodo.fim ? ` a ${fmtDia(periodo.fim)}` : ''}`}>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="date" className={`${input} pl-9`} required min={minimo} max={periodo.fim ?? undefined}
              value={f.dataInicio ?? ''} onChange={(e) => set('dataInicio', e.target.value)} />
          </div>
          {(diaSemana === 0 || diaSemana === 6) && <p className="text-xs text-amber-600 mt-1">Escolha um dia útil.</p>}
        </Campo>
      </Seccao>

      <Seccao n={2} titulo="Criança">
        <Campo label="Nome completo" obrigatorio>
          <input className={input} required minLength={3} maxLength={120} value={f.nomeCrianca ?? ''} onChange={(e) => set('nomeCrianca', e.target.value)} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Nascimento" obrigatorio>
            <input type="date" className={input} required max={hoje} value={f.dataNascimento ?? ''} onChange={(e) => set('dataNascimento', e.target.value)} />
          </Campo>
          <Campo label="Género">
            <select className={input} value={f.genero ?? ''} onChange={(e) => set('genero', e.target.value)}>
              <option value="">—</option><option value="F">Feminino</option><option value="M">Masculino</option>
            </select>
          </Campo>
        </div>
        <Campo label="Escola">
          <input className={input} maxLength={150} value={f.escola ?? ''} onChange={(e) => set('escola', e.target.value)} />
        </Campo>
        <Campo label="Sabe nadar?">
          <Chips opcoes={NIVEIS} valor={f.nivelNatacao ? [f.nivelNatacao] : []} onToggle={(v) => set('nivelNatacao', f.nivelNatacao === v ? undefined : v)} cols="grid-cols-2 sm:grid-cols-4" />
        </Campo>
        <Campo label="Provas em que quer participar">
          <Chips opcoes={PROVAS} valor={f.provas ?? []} cols="grid-cols-3"
            onToggle={(v) => set('provas', (f.provas ?? []).includes(v) ? f.provas.filter((x: string) => x !== v) : [...(f.provas ?? []), v])} />
        </Campo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Condição de saúde / alergia?">
            <SimNao value={f.condicaoSaude} onChange={(v) => set('condicaoSaude', v)} />
          </Campo>
          <Campo label="Autoriza fotos/vídeos?">
            <SimNao value={f.autorizacaoImagem} onChange={(v) => set('autorizacaoImagem', v)} />
          </Campo>
        </div>
        {f.condicaoSaude && (
          <textarea className={input} rows={2} maxLength={500} placeholder="Qual condição ou alergia?" value={f.condicaoSaudeDetalhe ?? ''}
            onChange={(e) => set('condicaoSaudeDetalhe', e.target.value)} />
        )}
      </Seccao>

      <Seccao n={3} titulo="Encarregado">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Nome completo" obrigatorio>
            <input className={input} required minLength={3} maxLength={120} value={f.nomeEncarregado ?? ''} onChange={(e) => set('nomeEncarregado', e.target.value)} />
          </Campo>
          <Campo label="Parentesco">
            <input className={input} maxLength={40} placeholder="Mãe, pai…" value={f.parentesco ?? ''} onChange={(e) => set('parentesco', e.target.value)} />
          </Campo>
          <Campo label="Telefone / WhatsApp" obrigatorio>
            <input type="tel" className={input} required placeholder="+258 84 123 4567" value={f.contacto ?? ''} onChange={(e) => set('contacto', e.target.value)} />
          </Campo>
          <Campo label="Email">
            <input type="email" className={input} value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </Campo>
        </div>
        <details className="group">
          <summary className="text-sm text-blue-700 font-medium cursor-pointer select-none list-none">+ Mais dados (opcional)</summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Campo label="Contacto alternativo">
              <input type="tel" className={input} value={f.contactoAlternativo ?? ''} onChange={(e) => set('contactoAlternativo', e.target.value)} />
            </Campo>
            <Campo label="Quem pode ir buscar">
              <input className={input} maxLength={200} placeholder="Nome(s)" value={f.pessoaAutorizadaRecolha ?? ''} onChange={(e) => set('pessoaAutorizadaRecolha', e.target.value)} />
            </Campo>
            <div className="sm:col-span-2">
              <Campo label="Observações">
                <textarea className={input} rows={2} maxLength={1000} value={f.observacoes ?? ''} onChange={(e) => set('observacoes', e.target.value)} />
              </Campo>
            </div>
          </div>
        </details>
      </Seccao>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-4 shadow-sm">
        {pacote && (
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{pacote.nome}</p>
              {f.dataInicio && <p className="text-xs text-gray-500">Início {fmtDia(f.dataInicio)}</p>}
            </div>
            <p className="text-2xl font-black text-gray-900">{fmtMt(pacote.preco)}</p>
          </div>
        )}
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={f.declaracao} onChange={(e) => set('declaracao', e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
          <span className="text-xs text-gray-600">
            Sou o encarregado (ou autorizado), os dados são verdadeiros e a Mastchieve só os usa para esta inscrição.<span className="text-red-500"> *</span>
          </span>
        </label>
        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{erro}</p>}
        <button type="submit" disabled={enviando}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl transition disabled:opacity-60">
          {enviando && <Loader2 className="w-4 h-4 animate-spin" />} {enviando ? 'A submeter…' : 'Submeter inscrição'}
        </button>
      </div>
    </form>
  );
}

function Seccao({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-4 shadow-sm">
      <h2 className="flex items-center gap-2.5 text-sm font-bold text-gray-900 uppercase tracking-wide">
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">{n}</span>{titulo}
      </h2>
      {children}
    </section>
  );
}

function Chips({ opcoes, valor, onToggle, cols }: { opcoes: { v: string; l: string }[]; valor: string[]; onToggle: (v: string) => void; cols: string }) {
  return (
    <div className={`grid ${cols} gap-2`}>
      {opcoes.map((o) => {
        const sel = valor.includes(o.v);
        return (
          <button key={o.v} type="button" onClick={() => onToggle(o.v)} aria-pressed={sel}
            className={`py-2 rounded-xl text-sm border transition ${sel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

export function ResultadoProgramaCard({ r, onOutra }: { r: ResultadoPrograma; onOutra: () => void }) {
  return (
    <div className="text-center py-10 border border-green-100 bg-green-50/50 rounded-2xl px-6">
      <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Inscrição recebida!</h2>
      <p className="text-gray-600 text-sm max-w-md mx-auto">
        {r.nomeCrianca ? <><strong>{r.nomeCrianca}</strong> — </> : null}
        {r.pacote} · {fmtMt(r.preco)} · a partir de {fmtDia(r.dataInicio)}
        {r.dataFimPrevista && r.dataFimPrevista !== r.dataInicio ? ` até ${fmtDia(r.dataFimPrevista)}` : ''}.
      </p>
      <p className="text-gray-600 text-sm max-w-md mx-auto mt-2">
        A secretaria vai validar a inscrição e entrar em contacto. A vaga só fica garantida após a validação.
      </p>
      <p className="text-xs text-gray-400 mt-4">
        Referência <span className="font-mono font-semibold text-gray-600">{r.referencia}</span> · {new Date(r.submetidoEm).toLocaleString('pt-PT')}
      </p>
      <button onClick={onOutra} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 bg-white border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50">
        <UserPlus className="w-4 h-4" /> Inscrever outra criança
      </button>
    </div>
  );
}
