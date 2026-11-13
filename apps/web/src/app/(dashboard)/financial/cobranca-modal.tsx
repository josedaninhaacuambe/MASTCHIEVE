'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mastchieve-500';

interface CobrancaModalProps {
  onClose: () => void;
  onSaved: () => void;
}

/** Cobrança de um só atleta, com valor e data de vencimento próprios. */
export function CobrancaModal({ onClose, onSaved }: CobrancaModalProps) {
  const hoje = new Date();
  const [pesquisa, setPesquisa] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [atleta, setAtleta] = useState<any | null>(null);
  const [tipo, setTipo] = useState<'MENSALIDADE' | 'OUTRA'>('MENSALIDADE');
  const [month, setMonth] = useState(hoje.getMonth() + 1);
  const [year, setYear] = useState(hoje.getFullYear());
  const [amount, setAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState(hoje.toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (atleta || pesquisa.trim().length < 2) { setResultados([]); return; }
    const t = setTimeout(() => {
      api.get(`/students?search=${encodeURIComponent(pesquisa.trim())}&limit=8`)
        .then((r) => setResultados(r.data.data ?? []))
        .catch(() => setResultados([]));
    }, 300);
    return () => clearTimeout(t);
  }, [pesquisa, atleta]);

  const valido = !!atleta && Number(amount) > 0 && !!dueDate && (tipo === 'MENSALIDADE' || descricao.trim().length > 0);

  const salvar = async () => {
    if (!valido) return;
    setSaving(true);
    try {
      await api.post('/financial/payments', {
        studentId: atleta.id,
        tipo,
        amount: Number(amount),
        dueDate,
        ...(tipo === 'MENSALIDADE' && { month, year }),
        descricao: descricao.trim() || undefined,
      });
      toast.success('Cobrança criada', `${atleta.firstName} ${atleta.lastName}`);
      onSaved();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error('Erro ao criar cobrança', Array.isArray(msg) ? msg.join(' · ') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Nova cobrança individual</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Atleta*</label>
            {atleta ? (
              <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">{atleta.firstName} {atleta.lastName}</span>
                <button onClick={() => { setAtleta(null); setPesquisa(''); }} className="text-xs text-blue-600 hover:underline">Alterar</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar pelo nome..." className={cn(inputCls, 'pl-9')} autoFocus />
                {resultados.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {resultados.map((s) => (
                      <button key={s.id} onClick={() => { setAtleta(s); setResultados([]); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                        {s.firstName} {s.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {([['MENSALIDADE', 'Mensalidade'], ['OUTRA', 'Outra cobrança']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setTipo(v)}
                className={cn('flex-1 py-2 rounded-lg text-sm font-medium border',
                  tipo === v ? 'bg-mastchieve-600 text-white border-mastchieve-600' : 'bg-white text-gray-600 border-gray-200')}>
                {l}
              </button>
            ))}
          </div>

          {tipo === 'MENSALIDADE' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Mês de referência</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputCls}>
                  {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Ano</label>
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Valor (MT)*</label>
              <input type="number" value={amount} min={0} step={0.5} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Vencimento*</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Descrição{tipo === 'OUTRA' ? '*' : <span className="text-gray-400 font-normal"> (opcional)</span>}
            </label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={500} className={inputCls}
              placeholder={tipo === 'OUTRA' ? 'Ex: Inscrição, equipamento, prova' : 'Ex: Entrou a meio do mês'} />
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
          <button onClick={salvar} disabled={!valido || saving}
            className="px-4 py-2 text-sm font-medium bg-mastchieve-600 hover:bg-mastchieve-700 text-white rounded-lg transition disabled:opacity-60">
            {saving ? 'A criar...' : 'Criar cobrança'}
          </button>
        </div>
      </div>
    </div>
  );
}
