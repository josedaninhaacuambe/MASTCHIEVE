'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { ArrowLeft, Users, Plus, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Row {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  classId: string;
  status: 'pending' | 'saving' | 'success' | 'error';
  error?: string;
}

const emptyRow = (): Row => ({ firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE', classId: '', status: 'pending' });

const genderOptions = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
];

const inputCls = 'w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500 transition';

export default function BulkStudentsPage() {
  const router = useRouter();
  const [sharedGuardianEnabled, setSharedGuardianEnabled] = useState(true);
  const [guardian, setGuardian] = useState({ firstName: '', lastName: '', phone: '', relationship: '' });
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow()]);
  const [submitting, setSubmitting] = useState(false);

  const { data: classes } = useQuery({
    queryKey: ['classes-select'],
    queryFn: async () => { const { data } = await api.get('/classes?limit=50&status=ACTIVE'); return data.data ?? []; },
  });

  const setRow = (index: number, field: keyof Row, value: string) => {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (index: number) => setRows((rs) => rs.filter((_, i) => i !== index));

  const rowValid = (r: Row) => r.firstName.trim() && r.lastName.trim() && r.dateOfBirth;
  const podeSubmeter = rows.length > 0 && rows.every(rowValid) && !submitting;

  const submeter = async () => {
    setSubmitting(true);
    const guardians = sharedGuardianEnabled && guardian.firstName.trim() && guardian.lastName.trim() && guardian.phone.trim()
      ? [{ ...guardian, relationship: guardian.relationship || undefined, isPrimary: true }]
      : [];

    let successCount = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.status === 'success') { successCount++; continue; }
      setRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, status: 'saving', error: undefined } : row)));
      try {
        const payload: any = {
          firstName: r.firstName.trim(),
          lastName: r.lastName.trim(),
          dateOfBirth: r.dateOfBirth,
          gender: r.gender,
          ...(guardians.length && { guardians }),
        };
        const res = await api.post('/students', payload);
        const studentId = res.data.data?.student?.id;
        if (studentId && r.classId) {
          await api.post(`/classes/${r.classId}/enroll`, { studentId });
        }
        successCount++;
        setRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, status: 'success' } : row)));
      } catch (e: any) {
        setRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, status: 'error', error: e?.response?.data?.message ?? 'Erro ao criar' } : row)));
      }
    }
    setSubmitting(false);

    if (successCount === rows.length) {
      toast.success(`${successCount} atletas criados com sucesso`);
      router.push('/students');
    } else {
      toast.error(`${successCount} de ${rows.length} atletas criados`, 'Corrige as linhas com erro e tenta novamente');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registo em Massa</h1>
          <p className="text-gray-500 text-sm mt-0.5">Para atletas que se inscrevem em simultâneo (ex: irmãos)</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={sharedGuardianEnabled} onChange={(e) => setSharedGuardianEnabled(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-mastchieve-600 focus:ring-mastchieve-500" />
          <span className="text-sm font-medium text-gray-900">Estes atletas partilham o mesmo encarregado</span>
        </label>
        {sharedGuardianEnabled && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <input value={guardian.firstName} onChange={(e) => setGuardian((g) => ({ ...g, firstName: e.target.value }))} className={inputCls} placeholder="Nome do encarregado" />
            <input value={guardian.lastName} onChange={(e) => setGuardian((g) => ({ ...g, lastName: e.target.value }))} className={inputCls} placeholder="Apelido do encarregado" />
            <input value={guardian.phone} onChange={(e) => setGuardian((g) => ({ ...g, phone: e.target.value }))} className={inputCls} placeholder="Telemóvel" />
            <input value={guardian.relationship} onChange={(e) => setGuardian((g) => ({ ...g, relationship: e.target.value }))} className={inputCls} placeholder="Parentesco (Mãe, Pai, Tutor...)" />
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4" /> Atletas
          </h2>
          <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-xs font-medium text-mastchieve-600 hover:text-mastchieve-700 px-2.5 py-1.5 rounded-lg hover:bg-mastchieve-50 transition">
            <Plus className="w-3.5 h-3.5" /> Adicionar Atleta
          </button>
        </div>

        {rows.map((r, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Atleta {i + 1}</span>
              <div className="flex items-center gap-2">
                {r.status === 'saving' && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                {r.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {r.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                {rows.length > 1 && r.status !== 'success' && (
                  <button type="button" onClick={() => removeRow(i)} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={r.firstName} onChange={(e) => setRow(i, 'firstName', e.target.value)} className={inputCls} placeholder="Primeiro nome*" disabled={r.status === 'success'} />
              <input value={r.lastName} onChange={(e) => setRow(i, 'lastName', e.target.value)} className={inputCls} placeholder="Apelido*" disabled={r.status === 'success'} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="date" value={r.dateOfBirth} onChange={(e) => setRow(i, 'dateOfBirth', e.target.value)} className={inputCls} disabled={r.status === 'success'} />
              <select value={r.gender} onChange={(e) => setRow(i, 'gender', e.target.value)} className={inputCls} disabled={r.status === 'success'}>
                {genderOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={r.classId} onChange={(e) => setRow(i, 'classId', e.target.value)} className={inputCls} disabled={r.status === 'success'}>
                <option value="">— Turma (opcional) —</option>
                {(classes ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {r.status === 'error' && <p className="text-xs text-red-500">{r.error}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button
          onClick={submeter}
          disabled={!podeSubmeter}
          className="flex-1 flex items-center justify-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          <Users className="w-4 h-4" />
          {submitting ? 'A criar atletas...' : `Criar ${rows.length} Atletas`}
        </button>
      </div>
    </div>
  );
}
