'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth.store';
import { ensurePushSubscribed } from '@/lib/push';
import { AGUA_LIMITES } from '@/lib/constants/rotina-diaria';
import {
  Droplets, ShieldCheck, Backpack, Camera, Loader2, RefreshCw,
  CheckCircle2, PlusCircle, Trash2, Clock, AlertTriangle, Waves,
} from 'lucide-react';

type RotinaStatus = 'AGUARDA_ADMIN' | 'INCOMPLETO' | 'COMPLETO';
type Pendencia = 'agua' | 'equipamentos' | 'materiais';

interface MaterialItem {
  id: string;
  item: string;
  quantidade: number;
  fotoUrl: string | null;
  registadoEm: string;
}

interface RotinaHoje {
  id: string;
  aguaTemperatura: number | null;
  aguaPh: number | null;
  aguaCloro: number | null;
  aguaRegistadoPorId: string | null;
  aguaRegistadoEm: string | null;
  aguaRegistadoPor?: { id: string; email: string } | null;
  equipamentosSeguranca: string | null;
  equipamentosRegistadoPorId: string | null;
  equipamentosRegistadoEm: string | null;
  equipamentosRegistadoPor?: { id: string; email: string } | null;
  materiais: MaterialItem[];
}

interface RotinaHojeResponse {
  status: RotinaStatus;
  pendentes: Pendencia[];
  rotina: RotinaHoje | null;
}

const QUERY_KEY = ['rotina-diaria-hoje'];

function useInstructorRotinaHoje() {
  const user = useAuthStore((s) => s.user);
  return useQuery<RotinaHojeResponse>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/rotina-diaria/hoje');
      return data.data ?? data;
    },
    enabled: user?.role === 'INSTRUCTOR',
    refetchInterval: (query) => (query.state.data?.status === 'COMPLETO' ? false : 45000),
    retry: 1,
  });
}

/** Usado pelo layout do dashboard para aplicar `inert` ao resto da aplicação. */
export function useInstructorGateBlocking() {
  const user = useAuthStore((s) => s.user);
  const isInstructor = user?.role === 'INSTRUCTOR';
  const { data, isLoading, isError } = useInstructorRotinaHoje();
  return isInstructor && !isError && (isLoading || data?.status !== 'COMPLETO');
}

function formatHora(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

/* ── Secção Água ─────────────────────────────────────────────────────────── */
function AguaSection({ rotina, pendente, onSaved }: { rotina: RotinaHoje; pendente: boolean; onSaved: () => void }) {
  const [temperatura, setTemperatura] = useState('');
  const [ph, setPh] = useState('');
  const [cloro, setCloro] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (!pendente) {
    return (
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800">Água da piscina já registada</p>
          <p className="text-emerald-700 mt-0.5">
            {rotina.aguaTemperatura}°C · pH {rotina.aguaPh} · Cloro {rotina.aguaCloro} ppm
          </p>
          <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {rotina.aguaRegistadoPor?.email} às {formatHora(rotina.aguaRegistadoEm)}
          </p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!foto) { toast.error('Foto obrigatória', 'Tira uma foto do testador/medidor de água.'); return; }
    if (!temperatura || !ph || !cloro) { toast.error('Preenche todos os valores medidos'); return; }
    setSaving(true);
    try {
      const form = new FormData();
      form.append('temperatura', temperatura);
      form.append('ph', ph);
      form.append('cloro', cloro);
      form.append('foto', foto);
      const { data: resp } = await api.post(`/rotina-diaria/${rotina.id}/agua`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const payload = resp.data ?? resp;
      toast[payload?.jaRegistadoPorOutro ? 'info' : 'success'](
        payload?.jaRegistadoPorOutro ? 'Já tinha sido registado por um colega' : 'Água registada',
      );
      onSaved();
    } catch (e: any) {
      toast.error('Erro ao registar água', e?.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Temperatura (°C)</label>
          <input type="number" step="0.1" value={temperatura} onChange={(e) => setTemperatura(e.target.value)}
            min={AGUA_LIMITES.temperatura.min} max={AGUA_LIMITES.temperatura.max}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">pH</label>
          <input type="number" step="0.1" value={ph} onChange={(e) => setPh(e.target.value)}
            min={AGUA_LIMITES.ph.min} max={AGUA_LIMITES.ph.max}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Cloro (ppm)</label>
          <input type="number" step="0.1" value={cloro} onChange={(e) => setCloro(e.target.value)}
            min={AGUA_LIMITES.cloro.min} max={AGUA_LIMITES.cloro.max}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
        <Camera className="w-4 h-4 flex-shrink-0" />
        {foto ? foto.name : 'Foto do testador/medidor (obrigatória)'}
        <input type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
      </label>
      <button onClick={submit} disabled={saving}
        className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} {saving ? 'A registar...' : 'Registar água'}
      </button>
    </div>
  );
}

/* ── Secção Equipamentos ─────────────────────────────────────────────────── */
function EquipamentosSection({ rotina, pendente, onSaved }: { rotina: RotinaHoje; pendente: boolean; onSaved: () => void }) {
  const [itens, setItens] = useState<{ item: string; quantidade: string }[]>([{ item: '', quantidade: '1' }]);
  const [foto, setFoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (!pendente) {
    let lista: { item: string; quantidade: number }[] = [];
    try { lista = JSON.parse(rotina.equipamentosSeguranca ?? '[]'); } catch { /* ignore */ }
    return (
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm flex-1">
          <p className="font-semibold text-emerald-800">Equipamentos de segurança já registados</p>
          <ul className="text-emerald-700 mt-1 space-y-0.5">
            {lista.map((it, i) => <li key={i}>• {it.item} — {it.quantidade}</li>)}
          </ul>
          <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {rotina.equipamentosRegistadoPor?.email} às {formatHora(rotina.equipamentosRegistadoEm)}
          </p>
        </div>
      </div>
    );
  }

  const updateItem = (i: number, field: 'item' | 'quantidade', value: string) =>
    setItens((l) => l.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  const addRow = () => setItens((l) => [...l, { item: '', quantidade: '1' }]);
  const removeRow = (i: number) => setItens((l) => l.filter((_, idx) => idx !== i));

  const submit = async () => {
    const validos = itens.filter((it) => it.item.trim() && Number(it.quantidade) > 0);
    if (validos.length === 0) { toast.error('Adiciona pelo menos um equipamento'); return; }
    if (!foto) { toast.error('Foto obrigatória', 'Tira uma foto dos equipamentos de segurança.'); return; }
    setSaving(true);
    try {
      const form = new FormData();
      form.append('itens', JSON.stringify(validos.map((it) => ({ item: it.item.trim(), quantidade: Number(it.quantidade) }))));
      form.append('foto', foto);
      const { data: resp } = await api.post(`/rotina-diaria/${rotina.id}/equipamentos`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const payload = resp.data ?? resp;
      toast[payload?.jaRegistadoPorOutro ? 'info' : 'success'](
        payload?.jaRegistadoPorOutro ? 'Já tinha sido registado por um colega' : 'Equipamentos registados',
      );
      onSaved();
    } catch (e: any) {
      toast.error('Erro ao registar equipamentos', e?.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="space-y-2">
        {itens.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={it.item} onChange={(e) => updateItem(i, 'item', e.target.value)}
              placeholder="Ex: Boias salva-vidas" className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm" />
            <input type="number" min={1} value={it.quantidade} onChange={(e) => updateItem(i, 'quantidade', e.target.value)}
              className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm" />
            <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={addRow} className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:underline">
        <PlusCircle className="w-4 h-4" /> Adicionar equipamento
      </button>
      <label className="flex items-center gap-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
        <Camera className="w-4 h-4 flex-shrink-0" />
        {foto ? foto.name : 'Foto dos equipamentos (obrigatória)'}
        <input type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
      </label>
      <button onClick={submit} disabled={saving}
        className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} {saving ? 'A registar...' : 'Registar equipamentos'}
      </button>
    </div>
  );
}

/* ── Secção Materiais ────────────────────────────────────────────────────── */
function MateriaisSection({ rotina, pendente, onSaved }: { rotina: RotinaHoje; pendente: boolean; onSaved: () => void }) {
  const [item, setItem] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [foto, setFoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!item.trim() || Number(quantidade) < 1) { toast.error('Indica o item e a quantidade'); return; }
    setSaving(true);
    try {
      const form = new FormData();
      form.append('item', item.trim());
      form.append('quantidade', quantidade);
      if (foto) form.append('foto', foto);
      await api.post(`/rotina-diaria/${rotina.id}/materiais`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Material adicionado');
      setItem(''); setQuantidade('1'); setFoto(null);
      onSaved();
    } catch (e: any) {
      toast.error('Erro ao adicionar material', e?.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      {!pendente && (
        <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Materiais registados
        </div>
      )}
      {rotina.materiais.length > 0 && (
        <ul className="space-y-1 text-sm text-gray-700">
          {rotina.materiais.map((m) => (
            <li key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5">
              <span>{m.item} — {m.quantidade}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatHora(m.registadoEm)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Ex: Pranchas de natação"
          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm" />
        <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)}
          className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm" />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
        <Camera className="w-4 h-4 flex-shrink-0" />
        {foto ? foto.name : 'Foto (opcional)'}
        <input type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
      </label>
      <button onClick={submit} disabled={saving}
        className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />} {saving ? 'A adicionar...' : 'Adicionar material'}
      </button>
    </div>
  );
}

/* ── Gate principal ──────────────────────────────────────────────────────── */
export function InstructorChecklistGate() {
  const user = useAuthStore((s) => s.user);
  const isInstructor = user?.role === 'INSTRUCTOR';
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useInstructorRotinaHoje();

  useEffect(() => {
    if (isInstructor) void ensurePushSubscribed();
  }, [isInstructor]);

  if (!isInstructor) return null;

  if (isError) {
    return (
      <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white text-sm px-4 py-2 flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        Não foi possível confirmar a rotina diária. A tentar novamente...
        <button onClick={() => refetch()} className="underline font-semibold ml-2">Tentar agora</button>
      </div>
    );
  }

  if (isLoading || !data || data.status === 'COMPLETO') return null;

  const onSaved = () => qc.invalidateQueries({ queryKey: QUERY_KEY });

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
        <div className="bg-gradient-to-br from-[#1A3A9C] to-[#1A56DB] rounded-t-2xl px-6 py-5 text-white">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5" />
            <h2 className="font-black text-lg">Rotina diária obrigatória</h2>
          </div>
          <p className="text-white/70 text-sm mt-1">
            {data.status === 'AGUARDA_ADMIN'
              ? 'A aguardar que o administrador abra a rotina diária de hoje.'
              : 'Confirma os pontos abaixo antes de continuares para o resto do sistema.'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {data.status === 'AGUARDA_ADMIN' || !data.rotina ? (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Assim que a rotina de abertura for criada, o formulário aparece aqui automaticamente.</p>
              <button onClick={() => refetch()} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
                <RefreshCw className="w-4 h-4" /> Recarregar
              </button>
            </div>
          ) : (
            <>
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                  <Droplets className="w-4 h-4 text-blue-500" /> Água da piscina
                </h3>
                <AguaSection rotina={data.rotina} pendente={data.pendentes.includes('agua')} onSaved={onSaved} />
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Equipamentos de segurança
                </h3>
                <EquipamentosSection rotina={data.rotina} pendente={data.pendentes.includes('equipamentos')} onSaved={onSaved} />
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                  <Backpack className="w-4 h-4 text-violet-500" /> Materiais de aula
                </h3>
                <MateriaisSection rotina={data.rotina} pendente={data.pendentes.includes('materiais')} onSaved={onSaved} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
