'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, Printer, Save, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

/** Dias aceites pela API (/planos-aula). */
const DIAS = [
  { k: 'SEG', label: 'Segunda' },
  { k: 'TER', label: 'Terça' },
  { k: 'QUA', label: 'Quarta' },
  { k: 'QUI', label: 'Quinta' },
  { k: 'SEX', label: 'Sexta' },
  { k: 'SAB', label: 'Sábado' },
] as const;

const PARTES_BASE = [
  { nome: 'Aquecimento em Seco', tempo: '5 min' },
  { nome: 'Aquecimento H₂O', tempo: '5 min' },
  { nome: 'Parte Principal', tempo: '25 min' },
  { nome: 'Habilidades / Segurança', tempo: '10 min' },
  { nome: 'Relaxamento', tempo: '5 min' },
];

const OBJECTIVO_POR_NIVEL: Record<string, string> = {
  AMA: 'Desenvolver conforto no meio aquático, controlo respiratório, flutuação e primeiros deslizes',
  INTERMEDIARIO: 'Desenvolver consciência espacial, deslocamento hidrodinâmico, sculling e pernadas simétricas',
  AVANCADO: 'Desenvolver fundamentos das técnicas de nado: posição do corpo, respiração, propulsão e coordenação motora',
};

interface Parte { nome: string; tempo: string; dias: Record<string, string> }

function mensagemErro(e: any) {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(' ') : m || 'Erro inesperado';
}

/** Segunda-feira da semana (data local) em AAAA-MM-DD. */
function segunda(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function fmtSemana(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const ini = new Date(y, m - 1, d);
  const fim = new Date(y, m - 1, d + 5);
  const f = (x: Date) => x.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  return `${f(ini)} – ${f(fim)} ${fim.getFullYear()}`;
}

const partesVazias = (): Parte[] => PARTES_BASE.map((p) => ({ ...p, dias: {} }));

function imprimir(turma: string, semana: string, nivel: string, objetivo: string, partes: Parte[], dias: typeof DIAS[number][], obs: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!)).replace(/\n/g, '<br>');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Plano de Aula — ${esc(turma)}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:18px;margin:0}p{margin:4px 0;font-size:13px}
table{border-collapse:collapse;width:100%;margin-top:12px;font-size:12px}th,td{border:1px solid #999;padding:6px;vertical-align:top}th{background:#e8f0fe}</style></head><body>
<h1>Plano de Aula — ${esc(turma)}</h1><p><b>Semana:</b> ${esc(fmtSemana(semana))}${nivel ? ` · <b>Nível:</b> ${esc(nivel)}` : ''}</p>
${objetivo ? `<p><b>Objectivo da semana:</b> ${esc(objetivo)}</p>` : ''}
<table><thead><tr><th>Parte da aula</th>${dias.map((d) => `<th>${d.label}</th>`).join('')}</tr></thead><tbody>
${partes.map((p) => `<tr><td><b>${esc(p.nome)}</b>${p.tempo ? `<br>${esc(p.tempo)}` : ''}</td>${dias.map((d) => `<td>${esc(p.dias[d.k] ?? '')}</td>`).join('')}</tr>`).join('')}
</tbody></table>${obs ? `<p style="margin-top:12px"><b>Observações:</b> ${esc(obs)}</p>` : ''}
<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

export function PlanosAula() {
  const qc = useQueryClient();
  const [classId, setClassId] = useState('');
  const [semana, setSemana] = useState(segunda(new Date()));
  const [nivel, setNivel] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [partes, setPartes] = useState<Parte[]>(partesVazias());
  const [observacoes, setObservacoes] = useState('');
  const [comSabado, setComSabado] = useState(false);
  const [planoId, setPlanoId] = useState<string | null>(null);

  const { data: turmas = [], isLoading: aCarregarTurmas } = useQuery<any[]>({
    queryKey: ['planos-aula-turmas'],
    queryFn: async () => (await api.get('/planos-aula/turmas')).data?.data ?? [],
  });
  const turma = turmas.find((t) => t.id === classId);

  const { data: listaDados } = useQuery<any[]>({
    queryKey: ['planos-aula', classId],
    queryFn: async () => (await api.get('/planos-aula', { params: { classId } })).data?.data ?? [],
    enabled: !!classId,
    refetchOnWindowFocus: false, // não apagar o que o instrutor está a escrever
  });
  const lista = useMemo(() => listaDados ?? [], [listaDados]);

  // Carrega o plano existente da turma/semana, ou prepara um novo a partir do modelo.
  useEffect(() => {
    if (!classId) return;
    const existente = lista.find((p) => p.semanaInicio === semana);
    if (existente) {
      setPlanoId(existente.id);
      setNivel(existente.nivel ?? '');
      setObjetivo(existente.objetivoSemana ?? '');
      setObservacoes(existente.observacoes ?? '');
      const ps: Parte[] = (existente.partes ?? []).map((p: any) => ({ nome: p.nome, tempo: p.tempo ?? '', dias: p.dias ?? {} }));
      setPartes(ps.length ? ps : partesVazias());
      setComSabado(ps.some((p) => p.dias?.SAB));
    } else {
      setPlanoId(null);
      const nv = turma?.level ?? '';
      setNivel(nv);
      setObjetivo(OBJECTIVO_POR_NIVEL[nv] ?? '');
      setObservacoes('');
      setPartes(partesVazias());
      setComSabado(false);
    }
  }, [classId, semana, lista, turma?.level]);

  const dias = useMemo(() => DIAS.filter((d) => comSabado || d.k !== 'SAB'), [comSabado]);

  const guardar = useMutation({
    mutationFn: () =>
      api.put('/planos-aula', {
        classId,
        semana,
        nivel: nivel || undefined,
        objetivoSemana: objetivo || undefined,
        observacoes: observacoes || undefined,
        partes: partes
          .filter((p) => p.nome.trim())
          .map((p) => ({
            nome: p.nome.trim(),
            tempo: p.tempo.trim() || undefined,
            dias: Object.fromEntries(Object.entries(p.dias).filter(([k, v]) => v?.trim() && (comSabado || k !== 'SAB'))),
          })),
      }),
    onSuccess: (r: any) => {
      setPlanoId(r?.data?.data?.id ?? null);
      toast.success('Plano de aula guardado', `${turma?.name ?? ''} · ${fmtSemana(semana)}`);
      qc.invalidateQueries({ queryKey: ['planos-aula', classId] });
    },
    onError: (e) => toast.error('Não foi possível guardar', mensagemErro(e)),
  });

  const remover = useMutation({
    mutationFn: (id: string) => api.delete(`/planos-aula/${id}`),
    onSuccess: () => {
      toast.success('Plano de aula removido');
      qc.invalidateQueries({ queryKey: ['planos-aula', classId] });
    },
    onError: (e) => toast.error('Não foi possível remover', mensagemErro(e)),
  });

  const mudarCelula = (i: number, dia: string, v: string) =>
    setPartes((ps) => ps.map((p, j) => (j === i ? { ...p, dias: { ...p.dias, [dia]: v } } : p)));
  const mudarParte = (i: number, campo: 'nome' | 'tempo', v: string) =>
    setPartes((ps) => ps.map((p, j) => (j === i ? { ...p, [campo]: v } : p)));

  const moverSemana = (delta: number) => {
    const [y, m, d] = semana.split('-').map(Number);
    setSemana(segunda(new Date(y, m - 1, d + delta * 7)));
  };

  if (aCarregarTurmas) return <div className="text-sm text-gray-500">A carregar turmas...</div>;
  if (!turmas.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500">
        Não tem turmas activas atribuídas. O plano de aula é feito por turma.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Turma</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">— Escolha a turma —</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.level ? ` (${t.level})` : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Semana</label>
          <div className="flex items-center gap-1">
            <button onClick={() => moverSemana(-1)} className="px-2 py-2 border rounded-lg text-sm" aria-label="Semana anterior">‹</button>
            <input type="date" value={semana} onChange={(e) => e.target.value && setSemana(segunda(new Date(e.target.value + 'T12:00:00')))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={() => moverSemana(1)} className="px-2 py-2 border rounded-lg text-sm" aria-label="Semana seguinte">›</button>
          </div>
          <div className="text-xs text-gray-500 mt-1">{fmtSemana(semana)}</div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
          <input type="checkbox" checked={comSabado} onChange={(e) => setComSabado(e.target.checked)} /> Incluir sábado
        </label>
      </div>

      {classId && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> {planoId ? 'Editar plano de aula' : 'Novo plano de aula'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => imprimir(turma?.name ?? '', semana, nivel, objetivo, partes, dias, observacoes)}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
                <button
                  onClick={() => guardar.mutate()}
                  disabled={guardar.isPending}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {guardar.isPending ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[160px_1fr]">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nível</label>
                <input value={nivel} maxLength={40} onChange={(e) => setNivel(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Objectivo da semana</label>
                <textarea rows={2} maxLength={2000} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-600 p-2 border w-48">Parte da aula</th>
                    {dias.map((d) => <th key={d.k} className="text-left text-xs font-semibold text-gray-600 p-2 border">{d.label}</th>)}
                    <th className="border w-8" />
                  </tr>
                </thead>
                <tbody>
                  {partes.map((p, i) => (
                    <tr key={i}>
                      <td className="border p-1 align-top">
                        <input value={p.nome} maxLength={80} onChange={(e) => mudarParte(i, 'nome', e.target.value)} className="w-full text-sm font-medium px-2 py-1 rounded border border-transparent focus:border-gray-300" />
                        <input value={p.tempo} maxLength={20} placeholder="Tempo" onChange={(e) => mudarParte(i, 'tempo', e.target.value)} className="w-full text-xs text-gray-500 px-2 py-1 rounded border border-transparent focus:border-gray-300" />
                      </td>
                      {dias.map((d) => (
                        <td key={d.k} className="border p-1 align-top">
                          <textarea
                            rows={3}
                            maxLength={1000}
                            value={p.dias[d.k] ?? ''}
                            onChange={(e) => mudarCelula(i, d.k, e.target.value)}
                            className="w-full text-xs px-2 py-1 rounded border border-transparent focus:border-gray-300 resize-y"
                            placeholder="Exercícios..."
                          />
                        </td>
                      ))}
                      <td className="border p-1 align-top">
                        <button onClick={() => setPartes((ps) => ps.filter((_, j) => j !== i))} className="p-1 text-gray-400 hover:text-red-600" aria-label="Remover parte">
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {partes.length < 12 && (
              <button onClick={() => setPartes((ps) => [...ps, { nome: 'Nova parte', tempo: '', dias: {} }])} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <Plus className="w-4 h-4" /> Adicionar parte da aula
              </button>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
              <textarea rows={2} maxLength={4000} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Planos desta turma</h3>
            {lista.length === 0 ? (
              <p className="text-sm text-gray-500">Ainda não há planos guardados para esta turma.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {lista.map((p) => (
                  <li key={p.id} className={cn('flex items-center justify-between py-2 text-sm', p.semanaInicio === semana && 'font-semibold')}>
                    <button onClick={() => setSemana(p.semanaInicio)} className="text-left hover:underline">
                      {fmtSemana(p.semanaInicio)}
                      {p.instructor && <span className="ml-2 text-xs font-normal text-gray-500">{p.instructor.firstName} {p.instructor.lastName}</span>}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remover o plano da semana ${fmtSemana(p.semanaInicio)}?`)) remover.mutate(p.id); }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      aria-label="Remover plano"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
