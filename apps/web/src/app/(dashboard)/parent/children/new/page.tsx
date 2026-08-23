'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';

const genderOptions = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500 transition';

export default function NewChildPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE',
    phone: '', medicalNotes: '', emergencyContact: '', emergencyPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Campo obrigatório';
    if (!form.lastName.trim()) e.lastName = 'Campo obrigatório';
    if (!form.dateOfBirth) e.dateOfBirth = 'Campo obrigatório';
    return e;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        ...(form.phone && { phone: form.phone }),
        ...(form.emergencyContact && { emergencyContact: form.emergencyContact }),
        ...(form.emergencyPhone && { emergencyPhone: form.emergencyPhone }),
        ...(form.medicalNotes && { medicalNotes: form.medicalNotes }),
      };
      const res = await api.post('/students/me/children', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success('Atleta inscrito com sucesso', `${form.firstName} ${form.lastName} já está associado à tua conta.`);
      const studentId = data?.student?.id;
      router.push(studentId ? `/parent/children/${studentId}` : '/parent');
    },
    onError: (e: any) => toast.error('Erro ao inscrever atleta', e?.response?.data?.message ?? 'Tenta novamente'),
  });

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inscrever Filho/Educando</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Regista um menor de idade sob a tua responsabilidade — vais poder ver o desempenho, as presenças e os pagamentos dele(a) aqui na tua conta.
          </p>
        </div>
      </div>

      {createMutation.isError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Erro ao inscrever atleta. Tenta novamente.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primeiro nome" required>
            <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputCls} placeholder="Ana" />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
          </Field>
          <Field label="Apelido" required>
            <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputCls} placeholder="Silva" />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data de nascimento" required>
            <input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} className={inputCls} />
            {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
          </Field>
          <Field label="Género">
            <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputCls}>
              {genderOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Telefone (opcional)">
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="+258 8X XXX XXXX" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contacto de emergência (opcional)">
            <input value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} className={inputCls} placeholder="Nome" />
          </Field>
          <Field label="Telemóvel de emergência (opcional)">
            <input value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} className={inputCls} placeholder="+258 8X XXX XXXX" />
          </Field>
        </div>
        <Field label="Notas médicas / observações (opcional)">
          <textarea
            value={form.medicalNotes}
            onChange={(e) => set('medicalNotes', e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Alergias, lesões, limitações físicas..."
          />
        </Field>
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="flex-1 flex items-center justify-center gap-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          <UserPlus className="w-4 h-4" />
          {createMutation.isPending ? 'A inscrever...' : 'Inscrever Atleta'}
        </button>
      </div>
    </div>
  );
}
