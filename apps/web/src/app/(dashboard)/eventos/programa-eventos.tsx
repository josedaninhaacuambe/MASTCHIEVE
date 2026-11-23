'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Plus, Trash2, Pencil, Check, X, Sparkles } from 'lucide-react';

export const fmtMt = (v?: number | null) => (v == null ? '' : `${Number(v).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} MT`);
/** Datas @db.Date chegam como 'YYYY-MM-DDT00:00:00.000Z' — mostra o dia sem conversão de fuso. */
export const fmtDiaIso = (d?: string | null) => (d ? d.slice(0, 10).split('-').reverse().join('/') : '');
/** Dia local (Moçambique) de um instante guardado — evita o salto de um dia de toISOString(). */
export function diaLocalStr(d?: string | Date | null): string {
  if (!d) return '';
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export const erroMsg = (e: any) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(' · ') : m ?? 'Tenta novamente';
};

/** Resultado honesto do aviso ao encarregado — nunca diz "enviado" quando não houve contacto. */
export function resumoAviso(aviso?: { whatsapp: string; email: string } | null): string {
  if (!aviso) return 'Encarregado não avisado.';
  const w = aviso.whatsapp === 'EM_FILA' ? 'WhatsApp na caixa de saída' : 'sem telefone válido — WhatsApp não enviado';
  const e = aviso.email === 'ENVIADO' ? 'email enviado' : aviso.email === 'NAO_ENVIADO' ? 'email falhou' : 'sem email';
  return `${w} · ${e}`;
}

export const PACOTES_FOLHETO = [
  { nome: 'Diário', preco: 750, dias: 1, ordem: 1 },
  { nome: 'Semanal', preco: 1750, dias: 5, ordem: 2 },
  { nome: 'Quinzenal', preco: 3000, dias: 10, ordem: 3 },
  { nome: 'Mensal', preco: 5500, dias: 20, ordem: 4 },
];

export const MODELO_MERGULHA = {
  nome: 'Mergulha nas Férias!',
  tipo: 'OUTRO',
  data: '2026-11-23',
  dataFim: '2027-02-01',
  hora: '08:00',
  local: 'CCBM — Av. União Africana, Matola',
  descricao:
    'Programa de férias para crianças, de segunda a sexta-feira. Organização Mastchieve em parceria com a Líder Sport Academy.\n' +
    'Pacotes: Diário 750 MT · Semanal 1 750 MT · Quinzenal 3 000 MT · Mensal 5 500 MT.',
  programa:
    '08h00 — Rope skipping, ginástica artística, parkour, capoeira\n' +
    '09h00 — Dança/aeróbica, circo, rope skipping, karaté, funcional\n' +
    '10h00 — Ténis, xadrez, jogos cooperativos, jogos de tabuleiro, leitura musical\n' +
    '11h00 — Natação (todos os dias)',
};

const vazio = { nome: '', descricao: '', preco: '', dias: '', ordem: '', ativo: true };
const inputCls = 'w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm';

export function PacotesTab({ evento, podeEditar }: { evento: any; podeEditar: boolean }) {
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editar, setEditar] = useState<string | null>(null); // id ou 'novo'
  const [form, setForm] = useState<any>(vazio);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/eventos/${evento.id}/pacotes`);
      setPacotes(r.data.data ?? r.data ?? []);
    } catch (e: any) { toast.error('Erro ao carregar pacotes', erroMsg(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [evento.id]);

  const corpo = (f: any) => ({
    nome: f.nome.trim(), descricao: f.descricao?.trim() || undefined, preco: Number(f.preco),
    dias: f.dias === '' || f.dias == null ? undefined : Number(f.dias),
    ordem: f.ordem === '' || f.ordem == null ? undefined : Number(f.ordem), ativo: !!f.ativo,
  });

  const guardar = async () => {
    if (!form.nome.trim() || form.preco === '' || Number.isNaN(Number(form.preco))) { toast.error('Campos obrigatórios', 'Nome e preço'); return; }
    setBusy(true);
    try {
      if (editar === 'novo') await api.post(`/eventos/${evento.id}/pacotes`, corpo(form));
      else await api.put(`/eventos/pacotes/${editar}`, corpo(form));
      toast.success('Pacote guardado');
      setEditar(null); setForm(vazio); load();
    } catch (e: any) { toast.error('Erro ao guardar pacote', erroMsg(e)); }
    finally { setBusy(false); }
  };

  const remover = async (p: any) => {
    const msg = p.inscricoes > 0
      ? `"${p.nome}" já tem ${p.inscricoes} inscrição(ões). Será apenas desactivado (deixa de aparecer no formulário). Continuar?`
      : `Remover o pacote "${p.nome}"?`;
    if (!confirm(msg)) return;
    try {
      await api.delete(`/eventos/pacotes/${p.id}`);
      toast.success(p.inscricoes > 0 ? 'Pacote desactivado' : 'Pacote removido');
      load();
    } catch (e: any) { toast.error('Erro', erroMsg(e)); }
  };

  const criarFolheto = async () => {
    const existentes = new Set(pacotes.map((p) => p.nome.toLowerCase()));
    const novos = PACOTES_FOLHETO.filter((p) => !existentes.has(p.nome.toLowerCase()));
    if (!novos.length) { toast.success('Os pacotes do folheto já existem'); return; }
    if (!confirm(`Criar ${novos.length} pacote(s): ${novos.map((p) => `${p.nome} ${fmtMt(p.preco)}`).join(', ')}?`)) return;
    setBusy(true);
    try {
      for (const p of novos) await api.post(`/eventos/${evento.id}/pacotes`, { ...p, ativo: true });
      toast.success('Pacotes criados');
      load();
    } catch (e: any) { toast.error('Erro ao criar pacotes', erroMsg(e)); load(); }
    finally { setBusy(false); }
  };

  const linhaForm = (
    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input className={`${inputCls} col-span-2`} placeholder="Nome (ex.: Semanal)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <input className={inputCls} type="number" min={0} step="0.01" placeholder="Preço (MT)" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
        <input className={inputCls} type="number" min={1} max={200} placeholder="Dias úteis" value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} />
        <input className={`${inputCls} col-span-2 sm:col-span-3`} placeholder="Descrição (opcional)" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        <input className={inputCls} type="number" min={0} placeholder="Ordem" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: e.target.value })} />
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-gray-700">
          <input type="checkbox" className="accent-blue-600" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Activo no formulário
        </label>
        <div className="flex-1" />
        <button onClick={() => { setEditar(null); setForm(vazio); }} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300"><X className="w-3.5 h-3.5 inline" /> Cancelar</button>
        <button onClick={guardar} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-50"><Check className="w-3.5 h-3.5 inline" /> Guardar</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Pacotes que o encarregado escolhe no link de inscrição. O preço e o nome ficam gravados em cada inscrição — alterar um pacote não muda inscrições já feitas.
        {!podeEditar && ' Só o administrador pode alterar pacotes.'}
      </p>
      {loading ? <p className="text-xs text-gray-400">A carregar...</p> : (
        <div className="space-y-1.5">
          {pacotes.length === 0 && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">Sem pacotes — o formulário público fica fechado até existir pelo menos um pacote activo.</p>}
          {pacotes.map((p) => editar === p.id ? <div key={p.id}>{linhaForm}</div> : (
            <div key={p.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${p.ativo ? 'bg-gray-50' : 'bg-gray-50 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{p.nome} {!p.ativo && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded">inactivo</span>}</p>
                <p className="text-xs text-gray-500">{p.dias ? `${p.dias} dia(s) úteis · ` : ''}{p.inscricoes ?? 0} inscrição(ões){p.descricao ? ` · ${p.descricao}` : ''}</p>
              </div>
              <span className="text-sm font-bold text-gray-900">{fmtMt(p.preco)}</span>
              {podeEditar && <>
                <button onClick={() => { setEditar(p.id); setForm({ nome: p.nome, descricao: p.descricao ?? '', preco: String(p.preco), dias: p.dias ?? '', ordem: p.ordem ?? '', ativo: p.ativo }); }}
                  className="p-1 text-gray-400 hover:text-gray-700" title="Editar"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remover(p)} className="p-1 text-gray-400 hover:text-red-600" title="Remover"><Trash2 className="w-4 h-4" /></button>
              </>}
            </div>
          ))}
          {editar === 'novo' && linhaForm}
        </div>
      )}
      {podeEditar && editar === null && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setEditar('novo'); setForm(vazio); }} className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Novo pacote
          </button>
          <button onClick={criarFolheto} disabled={busy} className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            <Sparkles className="w-3.5 h-3.5" /> Criar pacotes do folheto (750 / 1 750 / 3 000 / 5 500 MT)
          </button>
        </div>
      )}
    </div>
  );
}

/** Painel de validação de uma inscrição do programa (secretaria). */
export function ValidacaoPrograma({ p, evento, podeValidar, onChanged }: { p: any; evento: any; podeValidar: boolean; onChanged: () => void }) {
  const [avisar, setAvisar] = useState(true);
  const [rejeitar, setRejeitar] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [mudarPacote, setMudarPacote] = useState(false);
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [novoPacote, setNovoPacote] = useState(p.eventoPacoteId ?? '');
  const [novaData, setNovaData] = useState(p.dataInicioPretendida ? String(p.dataInicioPretendida).slice(0, 10) : '');
  const [busy, setBusy] = useState(false);
  const temContacto = !!(p.contacto || p.email);

  useEffect(() => {
    if (!mudarPacote) return;
    api.get(`/eventos/${evento.id}/pacotes`).then((r) => setPacotes((r.data.data ?? r.data ?? []).filter((x: any) => x.ativo || x.id === p.eventoPacoteId))).catch(() => {});
  }, [mudarPacote]);

  const correr = async (fn: () => Promise<any>, titulo: string) => {
    setBusy(true);
    try {
      const r = await fn();
      const d = r?.data?.data ?? r?.data;
      toast.success(titulo, d && 'aviso' in d ? resumoAviso(d.aviso) : undefined);
      onChanged();
    } catch (e: any) { toast.error('Erro', erroMsg(e)); }
    finally { setBusy(false); }
  };

  const dados = p.inscricao?.dados ?? {};
  return (
    <div className="space-y-2">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs bg-white rounded-lg p-2 border border-gray-200">
        <dt className="text-gray-400">Pacote</dt><dd className="text-gray-900 font-medium">{p.pacoteNome} · {fmtMt(p.pacotePreco)}</dd>
        <dt className="text-gray-400">Período</dt><dd className="text-gray-700">{fmtDiaIso(p.dataInicioPretendida)}{p.dataFimPrevista && p.dataFimPrevista !== p.dataInicioPretendida ? ` a ${fmtDiaIso(p.dataFimPrevista)}` : ''}</dd>
        {p.inscricao?.responsavelNome && <><dt className="text-gray-400">Encarregado</dt><dd className="text-gray-700">{p.inscricao.responsavelNome}{dados.parentesco ? ` (${dados.parentesco})` : ''}</dd></>}
        {dados.contactoAlternativo && <><dt className="text-gray-400">Contacto alternativo</dt><dd className="text-gray-700">{dados.contactoAlternativo}</dd></>}
        {dados.pessoaAutorizadaRecolha && <><dt className="text-gray-400">Pode recolher</dt><dd className="text-gray-700">{dados.pessoaAutorizadaRecolha}</dd></>}
        {dados.observacoes && <><dt className="text-gray-400">Observações</dt><dd className="text-gray-700 whitespace-pre-wrap">{dados.observacoes}</dd></>}
        {p.validadoEm && <><dt className="text-gray-400">{p.estado === 'CANCELADO' ? 'Rejeitado em' : 'Validado em'}</dt><dd className="text-gray-700">{new Date(p.validadoEm).toLocaleString('pt-PT')}{p.validadoPorNome ? ` · ${p.validadoPorNome}` : ''}</dd></>}
        {p.motivoRejeicao && <><dt className="text-gray-400">Motivo</dt><dd className="text-red-600">{p.motivoRejeicao}</dd></>}
      </dl>

      {podeValidar && (
        <div className="space-y-2">
          {p.estado === 'PRE_INSCRITO' && !rejeitar && (
            <div className="flex flex-wrap items-center gap-2">
              <button disabled={busy} onClick={() => correr(() => api.put(`/eventos/participantes/${p.id}/validar`, { avisar }), 'Inscrição validada')}
                className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">
                <Check className="w-3.5 h-3.5" /> Validar inscrição
              </button>
              <button disabled={busy} onClick={() => setRejeitar(true)} className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100">
                <X className="w-3.5 h-3.5" /> Rejeitar
              </button>
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input type="checkbox" className="accent-blue-600" checked={avisar && temContacto} disabled={!temContacto} onChange={(e) => setAvisar(e.target.checked)} />
                {temContacto ? 'Avisar o encarregado' : 'Sem contacto — não é possível avisar'}
              </label>
            </div>
          )}
          {rejeitar && (
            <div className="space-y-2 bg-red-50/60 border border-red-100 rounded-lg p-2">
              <textarea rows={2} maxLength={1000} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da rejeição (obrigatório)"
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm" />
              <div className="flex flex-wrap items-center gap-2">
                <button disabled={busy || motivo.trim().length < 3}
                  onClick={() => correr(() => api.put(`/eventos/participantes/${p.id}/rejeitar`, { motivo: motivo.trim(), avisar: avisar && temContacto }), 'Inscrição rejeitada')}
                  className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">Confirmar rejeição</button>
                <button onClick={() => setRejeitar(false)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300">Voltar</button>
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input type="checkbox" className="accent-blue-600" checked={avisar && temContacto} disabled={!temContacto} onChange={(e) => setAvisar(e.target.checked)} />
                  {temContacto ? 'Avisar o encarregado' : 'Sem contacto'}
                </label>
              </div>
            </div>
          )}
          {['PRE_INSCRITO', 'CONFIRMADO'].includes(p.estado) && !rejeitar && (
            mudarPacote ? (
              <div className="flex flex-wrap items-center gap-2 bg-gray-100 rounded-lg p-2">
                <select value={novoPacote} onChange={(e) => setNovoPacote(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
                  {pacotes.map((x) => <option key={x.id} value={x.id}>{x.nome} · {fmtMt(x.preco)}</option>)}
                </select>
                <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs" />
                <button disabled={busy || !novoPacote}
                  onClick={() => correr(() => api.put(`/eventos/participantes/${p.id}/pacote`, { pacoteId: novoPacote, dataInicio: novaData || undefined }), 'Pacote alterado')}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg disabled:opacity-50">Guardar</button>
                <button onClick={() => setMudarPacote(false)} className="text-xs px-2 py-1">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setMudarPacote(true)} className="text-xs text-blue-700 hover:underline">Alterar pacote / data de início</button>
            )
          )}
        </div>
      )}
    </div>
  );
}
