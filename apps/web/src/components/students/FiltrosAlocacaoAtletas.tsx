'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { MapPin, SlidersHorizontal, X } from 'lucide-react';

export interface FiltrosAtletas {
  unidadeId: string;
  classId: string;
  moduleId: string;
  dia: string;
  hora: string;
  etiqueta: string;
  semTurma: boolean;
}

export const FILTROS_VAZIOS: FiltrosAtletas = { unidadeId: '', classId: '', moduleId: '', dia: '', hora: '', etiqueta: '', semTurma: false };

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const selCls = 'border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mastchieve-500 min-w-0';

export function filtrosParaParams(f: FiltrosAtletas): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.unidadeId) p.unidadeId = f.unidadeId;
  if (f.classId) p.classId = f.classId;
  if (f.moduleId) p.moduleId = f.moduleId;
  if (f.dia) p.dia = f.dia;
  if (f.hora) p.hora = f.hora;
  if (f.etiqueta) p.etiqueta = f.etiqueta;
  if (f.semTurma) p.semTurma = 'true';
  return p;
}

function useUnidades() {
  return useQuery({
    queryKey: ['unidades-select'],
    queryFn: async () => { const { data } = await api.get('/unidades'); return (data.data ?? []) as any[]; },
  });
}

function useTurmas(unidadeId: string) {
  return useQuery({
    queryKey: ['turmas-unidade', unidadeId || 'todas'],
    queryFn: async () => {
      const filtro = unidadeId && unidadeId !== 'SEM_UNIDADE' ? `&unidadeId=${unidadeId}` : '';
      const { data } = await api.get(`/classes?limit=100&status=ACTIVE${filtro}`);
      return (data.data?.data ?? data.data ?? []) as any[];
    },
  });
}

/** Horas de início que existem nos horários das turmas carregadas. */
function horasDasTurmas(turmas: any[]) {
  const horas = new Set<string>();
  for (const t of turmas) {
    let hs: any[] = [];
    try { hs = Array.isArray(t.schedules) ? t.schedules : JSON.parse(t.schedules ?? '[]'); } catch { /* ignora */ }
    for (const h of hs) if (typeof h?.startTime === 'string') horas.add(h.startTime.slice(0, 5));
  }
  return Array.from(horas).sort();
}

export function PainelFiltrosAtletas({ value, onChange }: { value: FiltrosAtletas; onChange: (f: FiltrosAtletas) => void }) {
  const { data: unidades = [] } = useUnidades();
  const { data: turmas = [] } = useTurmas(value.unidadeId);
  const { data: fases = [] } = useQuery({
    queryKey: ['fases-select'],
    queryFn: async () => { const { data } = await api.get('/fases'); return (data.data ?? []) as any[]; },
  });
  const set = (patch: Partial<FiltrosAtletas>) => onChange({ ...value, ...patch });
  const activos = Object.values(filtrosParaParams(value)).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4" /> Filtros por unidade, turma e horário
        </span>
        {activos > 0 && (
          <button onClick={() => onChange(FILTROS_VAZIOS)} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
            <X className="w-3 h-3" /> Limpar ({activos})
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
        <select value={value.unidadeId} onChange={(e) => set({ unidadeId: e.target.value, classId: '' })} className={selCls} aria-label="Unidade">
          <option value="">Todas as unidades</option>
          {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          <option value="SEM_UNIDADE">Sem unidade</option>
        </select>
        <select value={value.classId} onChange={(e) => set({ classId: e.target.value, semTurma: false })} className={selCls} aria-label="Turma">
          <option value="">Todas as turmas</option>
          {turmas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={value.moduleId} onChange={(e) => set({ moduleId: e.target.value, semTurma: false })} className={selCls} aria-label="Módulo">
          <option value="">Todos os módulos</option>
          {fases.map((f) => <option key={f.id} value={f.id}>{f.nome ?? f.name ?? f.titulo}</option>)}
        </select>
        <select value={value.dia} onChange={(e) => set({ dia: e.target.value, semTurma: false })} className={selCls} aria-label="Dia">
          <option value="">Qualquer dia</option>
          {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={value.hora} onChange={(e) => set({ hora: e.target.value, semTurma: false })} className={selCls} aria-label="Horário">
          <option value="">Qualquer horário</option>
          {horasDasTurmas(turmas).map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <select value={value.etiqueta} onChange={(e) => set({ etiqueta: e.target.value })} className={selCls} aria-label="Etiqueta">
          <option value="">BM e restantes</option>
          <option value="BM">Só BM</option>
          <option value="SEM_ETIQUETA">Sem BM</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 px-1">
          <input type="checkbox" checked={value.semTurma}
            onChange={(e) => set({ semTurma: e.target.checked, ...(e.target.checked && { classId: '', moduleId: '', dia: '', hora: '' }) })}
            className="w-4 h-4 rounded border-gray-300 text-mastchieve-600" />
          Sem turma
        </label>
      </div>
    </div>
  );
}

/** Barra para mover os atletas seleccionados para uma unidade e/ou turma. O servidor valida cada atleta. */
export function BarraAlocacao({ ids, onLimpar }: { ids: string[]; onLimpar: () => void }) {
  const qc = useQueryClient();
  const [unidadeId, setUnidadeId] = useState('');
  const [classId, setClassId] = useState('');
  const [falhas, setFalhas] = useState<{ nome?: string; studentId?: string; motivo: string }[]>([]);
  const { data: unidades = [] } = useUnidades();
  const { data: turmas = [] } = useTurmas(unidadeId);

  const alocar = useMutation({
    mutationFn: async () => {
      const body: Record<string, any> = { studentIds: ids };
      if (unidadeId) body.unidadeId = unidadeId;
      if (classId) body.classId = classId;
      const { data } = await api.post('/students/alocar', body);
      return data.data as { alocados: number; falhas: { nome?: string; studentId?: string; motivo: string }[] };
    },
    onSuccess: (r) => {
      setFalhas(r.falhas ?? []);
      if (r.alocados) toast.success(`${r.alocados} atleta(s) alocado(s).`);
      if (r.falhas?.length) toast.warning(`${r.falhas.length} atleta(s) não foram alocados — veja os motivos.`);
      else onLimpar();
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['turmas-unidade'] });
    },
    onError: (e: any) => {
      const m = e?.response?.data?.message;
      toast.error(Array.isArray(m) ? m.join(', ') : m || 'Não foi possível alocar os atletas.');
    },
  });

  if (!ids.length) return null;
  return (
    <div className="sticky bottom-4 z-20 bg-white border border-mastchieve-200 shadow-lg rounded-xl p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-mastchieve-600" /> {ids.length} seleccionado(s)
        </span>
        <select value={unidadeId} onChange={(e) => { setUnidadeId(e.target.value); setClassId(''); }} className={selCls} aria-label="Unidade de destino">
          <option value="">Manter unidade</option>
          {unidades.filter((u) => u.ativo !== false).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className={selCls} aria-label="Turma de destino">
          <option value="">Sem turma</option>
          {turmas.map((t) => {
            const livres = t.maxStudents - (t.enrolledCount ?? 0);
            return <option key={t.id} value={t.id} disabled={livres <= 0}>{t.name} ({livres > 0 ? `${livres} vagas` : 'lotada'})</option>;
          })}
        </select>
        <button onClick={() => alocar.mutate()} disabled={alocar.isPending || (!unidadeId && !classId)}
          className="bg-mastchieve-600 hover:bg-mastchieve-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
          {alocar.isPending ? 'A alocar…' : 'Alocar'}
        </button>
        <button onClick={() => { setFalhas([]); onLimpar(); }} className="text-sm text-gray-500 hover:text-gray-800 px-2">Cancelar</button>
      </div>
      {falhas.length > 0 && (
        <ul className="text-xs text-red-700 bg-red-50 rounded-lg p-2 max-h-32 overflow-y-auto space-y-0.5">
          {falhas.map((f, i) => <li key={i}><strong>{f.nome ?? f.studentId}</strong>: {f.motivo}</li>)}
        </ul>
      )}
    </div>
  );
}
