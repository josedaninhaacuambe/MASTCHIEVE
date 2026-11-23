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

const DADOS_CRIANCA = ['nomeCrianca', 'dataNascimento', 'genero', 'escola', 'nivelNatacao', 'condicaoSaude', 'condicaoSaudeDetalhe', 'autorizacaoImagem'];

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
    <form onSubmit={submeter} className="space-y-7">
      <input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)}
        className="hidden" aria-hidden="true" />

      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">1. Escolha o pacote</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pacotes.map((p) => {
            const sel = f.pacoteId === p.id;
            return (
              <button key={p.id} type="button" onClick={() => set('pacoteId', p.id)}
                className={`text-left rounded-2xl border-2 px-4 py-3 transition ${sel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900">{p.nome}</span>
                  {sel && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                </div>
                <p className="text-2xl font-black text-blue-700 mt-1">{fmtMt(p.preco)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {p.dias ? `${p.dias} dia${p.dias > 1 ? 's' : ''} úte${p.dias > 1 ? 'is' : 'il'}` : ''}
                  {p.dias && p.descricao ? ' · ' : ''}{p.descricao ?? ''}
                </p>
              </button>
            );
          })}
        </div>
        <Campo label="A partir de que dia?" obrigatorio
          ajuda={`De segunda a sexta, entre ${fmtDia(periodo.inicio)}${periodo.fim ? ` e ${fmtDia(periodo.fim)}` : ''}.`}>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-gray-400" />
            <input type="date" className={input} required min={minimo} max={periodo.fim ?? undefined}
              value={f.dataInicio ?? ''} onChange={(e) => set('dataInicio', e.target.value)} />
          </div>
          {(diaSemana === 0 || diaSemana === 6) && <p className="text-xs text-amber-600 mt-1">Esse dia é fim-de-semana — escolha um dia útil.</p>}
        </Campo>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-gray-900">2. Dados da criança</h2>
        <Campo label="Nome completo da criança" obrigatorio>
          <input className={input} required minLength={3} maxLength={120} value={f.nomeCrianca ?? ''} onChange={(e) => set('nomeCrianca', e.target.value)} />
        </Campo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Data de nascimento" obrigatorio>
            <input type="date" className={input} required max={hoje} value={f.dataNascimento ?? ''} onChange={(e) => set('dataNascimento', e.target.value)} />
          </Campo>
          <Campo label="Género">
            <select className={input} value={f.genero ?? ''} onChange={(e) => set('genero', e.target.value)}>
              <option value="">—</option><option value="F">Feminino</option><option value="M">Masculino</option>
            </select>
          </Campo>
        </div>
        <Campo label="Escola que frequenta">
          <input className={input} maxLength={150} value={f.escola ?? ''} onChange={(e) => set('escola', e.target.value)} />
        </Campo>
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
        <Campo label="Tem alguma condição de saúde ou alergia que devamos conhecer?">
          <SimNao value={f.condicaoSaude} onChange={(v) => set('condicaoSaude', v)} />
          {f.condicaoSaude && (
            <textarea className={`${input} mt-2`} rows={2} maxLength={500} placeholder="Qual?" value={f.condicaoSaudeDetalhe ?? ''}
              onChange={(e) => set('condicaoSaudeDetalhe', e.target.value)} />
          )}
        </Campo>
        <Campo label="Autoriza fotografias/vídeos da criança durante as actividades?">
          <SimNao value={f.autorizacaoImagem} onChange={(v) => set('autorizacaoImagem', v)} />
        </Campo>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-gray-900">3. Encarregado de educação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome completo" obrigatorio>
            <input className={input} required minLength={3} maxLength={120} value={f.nomeEncarregado ?? ''} onChange={(e) => set('nomeEncarregado', e.target.value)} />
          </Campo>
          <Campo label="Parentesco">
            <input className={input} maxLength={40} placeholder="Mãe, pai, tio..." value={f.parentesco ?? ''} onChange={(e) => set('parentesco', e.target.value)} />
          </Campo>
          <Campo label="Contacto (telefone / WhatsApp)" obrigatorio>
            <input type="tel" className={input} required placeholder="+258 84 123 4567" value={f.contacto ?? ''} onChange={(e) => set('contacto', e.target.value)} />
          </Campo>
          <Campo label="Contacto alternativo">
            <input type="tel" className={input} value={f.contactoAlternativo ?? ''} onChange={(e) => set('contactoAlternativo', e.target.value)} />
          </Campo>
          <Campo label="Email (opcional, para a confirmação)">
            <input type="email" className={input} value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </Campo>
          <Campo label="Quem pode ir buscar a criança">
            <input className={input} maxLength={200} placeholder="Nome(s)" value={f.pessoaAutorizadaRecolha ?? ''} onChange={(e) => set('pessoaAutorizadaRecolha', e.target.value)} />
          </Campo>
        </div>
        <Campo label="Observações">
          <textarea className={input} rows={2} maxLength={1000} value={f.observacoes ?? ''} onChange={(e) => set('observacoes', e.target.value)} />
        </Campo>
      </section>

      {pacote && (
        <div className="rounded-2xl bg-gray-900 text-white px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-300">Resumo</p>
            <p className="font-semibold">{pacote.nome}{f.dataInicio ? ` · a partir de ${fmtDia(f.dataInicio)}` : ''}</p>
          </div>
          <p className="text-xl font-black">{fmtMt(pacote.preco)}</p>
        </div>
      )}

      <label className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 cursor-pointer">
        <input type="checkbox" checked={f.declaracao} onChange={(e) => set('declaracao', e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
        <span className="text-sm text-gray-700">
          Declaro que sou o encarregado de educação (ou estou autorizado por ele), que as informações são verdadeiras e autorizo a
          Mastchieve a utilizá-las apenas para gerir esta inscrição e para me contactar sobre o programa.<span className="text-red-500"> *</span>
        </span>
      </label>
      {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{erro}</p>}
      <button type="submit" disabled={enviando}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 transition disabled:opacity-60">
        {enviando && <Loader2 className="w-4 h-4 animate-spin" />} {enviando ? 'A submeter...' : 'Submeter inscrição'}
      </button>
    </form>
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
