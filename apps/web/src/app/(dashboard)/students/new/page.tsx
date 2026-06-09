'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
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

export default function NewStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE',
    email: '', phone: '', emergencyContact: '', emergencyPhone: '', medicalNotes: '', classId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: classes } = useQuery({
    queryKey: ['classes-select'],
    queryFn: async () => { const { data } = await api.get('/classes?limit=50&status=ACTIVE'); return data.data ?? []; },
  });

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
        ...(form.email && { email: form.email }),
        ...(form.emergencyContact && { emergencyContact: form.emergencyContact }),
        ...(form.emergencyPhone && { emergencyPhone: form.emergencyPhone }),
        ...(form.medicalNotes && { medicalNotes: form.medicalNotes }),
      };
      const res = await api.post('/students', payload);
      const studentId = res.data.data?.student?.id;

      // Enroll in class if selected
      if (studentId && form.classId) {
        await api.post(`/classes/${form.classId}/enroll`, { studentId });
      }

      return res.data.data;
    },
    onSuccess: (data) => {
      const studentId = data?.student?.id;
      toast.success('Atleta criado com sucesso', `${form.firstName} ${form.lastName}`);
      router.push(studentId ? `/students/${studentId}` : '/students');
    },
    onError: (e: any) => toast.error('Erro ao criar atleta', e?.response?.data?.message ?? 'Verifica se o email já está em uso'),
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
          <h1 className="text-2xl font-bold text-gray-900">Novo Atleta</h1>
          <p className="text-gray-500 text-sm mt-0.5">Preenche os dados para inscrever um novo atleta</p>
        </div>
      </div>

      {createMutation.isError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Erro ao criar atleta. Verifica se o email já está em uso.
        </div>
      )}

      {/* Section: Dados Pessoais */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-mastchieve-100 text-mastchieve-700 rounded-full text-xs font-bold flex items-center justify-center">1</span>
          Dados Pessoais
        </h2>
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email (acesso à app)">
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="atleta@email.com" />
          </Field>
          <Field label="Telefone">
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="+351 9XX XXX XXX" />
          </Field>
        </div>
      </div>

      {/* Section: Contacto de Emergência */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-mastchieve-100 text-mastchieve-700 rounded-full text-xs font-bold flex items-center justify-center">2</span>
          Encarregado / Contacto de Emergência
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome do encarregado">
            <input value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} className={inputCls} placeholder="João Silva" />
          </Field>
          <Field label="Telemóvel de emergência">
            <input value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} className={inputCls} placeholder="+351 9XX XXX XXX" />
          </Field>
        </div>
      </div>

      {/* Section: Turma & Notas */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-mastchieve-100 text-mastchieve-700 rounded-full text-xs font-bold flex items-center justify-center">3</span>
          Turma & Notas Médicas
        </h2>
        <Field label="Inscrever em turma (opcional)">
          <select value={form.classId} onChange={(e) => set('classId', e.target.value)} className={inputCls}>
            <option value="">— Nenhuma turma por agora —</option>
            {(classes ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name} ({c.enrolledCount}/{c.maxStudents})</option>
            ))}
          </select>
        </Field>
        <Field label="Notas médicas / observações">
          <textarea
            value={form.medicalNotes}
            onChange={(e) => set('medicalNotes', e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Alergias, lesões, limitações físicas..."
          />
        </Field>
      </div>

      {/* Actions */}
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
          {createMutation.isPending ? 'A criar atleta...' : 'Criar Atleta'}
        </button>
      </div>
    </div>
  );
}
