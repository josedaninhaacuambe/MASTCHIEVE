'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { ArrowLeft, UserPlus, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface Guardian {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  relationship: string;
  isPrimary: boolean;
}

const emptyGuardian = (): Guardian => ({ firstName: '', lastName: '', phone: '', email: '', relationship: '', isPrimary: false });

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
    autorizacaoImagem: false, autorizacaoImagemDoc: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<any[] | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const { data: classes } = useQuery({
    queryKey: ['classes-select'],
    queryFn: async () => { const { data } = await api.get('/classes?limit=50&status=ACTIVE'); return data.data ?? []; },
  });

  const set = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const addGuardian = () => setGuardians((g) => [...g, emptyGuardian()]);
  const removeGuardian = (index: number) => setGuardians((g) => g.filter((_, i) => i !== index));
  const setGuardian = (index: number, field: keyof Guardian, value: string | boolean) => {
    setGuardians((g) => g.map((gu, i) => (i === index ? { ...gu, [field]: value } : gu)));
  };

  const checkDuplicate = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth) return;
    setCheckingDuplicate(true);
    try {
      const { data } = await api.get('/students/check-duplicate', {
        params: { firstName: form.firstName.trim(), lastName: form.lastName.trim(), dateOfBirth: form.dateOfBirth },
      });
      setDuplicateWarning(data.data?.duplicado ? data.data.matches : null);
    } catch {
      // aviso não-bloqueante — falha silenciosa
    } finally {
      setCheckingDuplicate(false);
    }
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
        autorizacaoImagem: form.autorizacaoImagem,
        ...(form.autorizacaoImagemDoc && { autorizacaoImagemDoc: form.autorizacaoImagemDoc }),
        ...(guardians.length && {
          guardians: guardians
            .filter((g) => g.firstName.trim() && g.lastName.trim() && g.phone.trim())
            .map((g) => ({ ...g, email: g.email.trim() || undefined, relationship: g.relationship || undefined })),
        }),
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
    onError: (e: any) => toast.error('Erro ao criar atleta', e?.response?.data?.message ?? 'Tenta novamente'),
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
          Erro ao criar atleta. Tenta novamente.
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
            <input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} onBlur={checkDuplicate} className={inputCls} />
            {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
          </Field>
          <Field label="Género">
            <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputCls}>
              {genderOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {guardians.length === 0 ? (
            <Field label="Email (acesso à app)">
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="atleta@email.com" />
            </Field>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email (acesso à app)</label>
              <div className={`${inputCls} bg-gray-50 text-gray-400`}>Não aplicável — menor sem conta própria</div>
              <p className="text-xs text-gray-400 mt-1">O acesso é feito pela conta do encarregado, na secção abaixo.</p>
            </div>
          )}
          <Field label="Telefone">
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="+351 9XX XXX XXX" />
          </Field>
        </div>
        {checkingDuplicate && <p className="text-xs text-gray-400">A verificar duplicados...</p>}
        {duplicateWarning && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Possível atleta duplicado</p>
              <p className="text-amber-700 mt-0.5">
                Já existe {duplicateWarning.length === 1 ? 'um atleta' : `${duplicateWarning.length} atletas`} com o mesmo nome e data de nascimento
                {duplicateWarning.some((m: any) => m.isActive) ? ' (ativo).' : '.'} Confirma que não é um registo repetido antes de continuar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Section: Encarregados */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 bg-mastchieve-100 text-mastchieve-700 rounded-full text-xs font-bold flex items-center justify-center">2</span>
            Encarregados (opcional)
          </h2>
          <button type="button" onClick={addGuardian} className="flex items-center gap-1.5 text-xs font-medium text-mastchieve-600 hover:text-mastchieve-700 px-2.5 py-1.5 rounded-lg hover:bg-mastchieve-50 transition">
            <Plus className="w-3.5 h-3.5" /> Adicionar encarregado
          </button>
        </div>
        {guardians.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum encarregado adicionado. Usa o botão acima para registar acesso a um encarregado (cria conta de Parent ligada ao atleta).</p>
        )}
        {guardians.map((g, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 relative">
            <button type="button" onClick={() => removeGuardian(i)} className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-2 gap-4 pr-8">
              <Field label="Primeiro nome" required>
                <input value={g.firstName} onChange={(e) => setGuardian(i, 'firstName', e.target.value)} className={inputCls} placeholder="Maria" />
              </Field>
              <Field label="Apelido" required>
                <input value={g.lastName} onChange={(e) => setGuardian(i, 'lastName', e.target.value)} className={inputCls} placeholder="Silva" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Telemóvel" required>
                <input value={g.phone} onChange={(e) => setGuardian(i, 'phone', e.target.value)} className={inputCls} placeholder="+351 9XX XXX XXX" />
              </Field>
              <Field label="Parentesco">
                <input value={g.relationship} onChange={(e) => setGuardian(i, 'relationship', e.target.value)} className={inputCls} placeholder="Mãe, Pai, Tutor..." />
              </Field>
            </div>
            <Field label="Email (acesso ao painel do encarregado)">
              <input type="email" value={g.email} onChange={(e) => setGuardian(i, 'email', e.target.value)} className={inputCls} placeholder="encarregado@email.com" />
              <p className="text-xs text-gray-400 mt-1">
                Se já existir uma conta com este email (ex.: outro filho, ou o próprio encarregado como atleta), é reutilizada — não cria uma conta duplicada.
              </p>
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={g.isPrimary}
                onChange={(e) => setGuardian(i, 'isPrimary', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-mastchieve-600 focus:ring-mastchieve-500"
              />
              <span className="text-sm text-gray-700">Encarregado principal (recebe alertas de faltas e comunicações)</span>
            </label>
          </div>
        ))}
      </div>

      {/* Section: Contacto de Emergência */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-mastchieve-100 text-mastchieve-700 rounded-full text-xs font-bold flex items-center justify-center">3</span>
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
          <span className="w-6 h-6 bg-mastchieve-100 text-mastchieve-700 rounded-full text-xs font-bold flex items-center justify-center">4</span>
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

      {/* Section: Autorização de Imagem */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-mastchieve-100 text-mastchieve-700 rounded-full text-xs font-bold flex items-center justify-center">5</span>
          Autorização de Uso de Imagem
        </h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.autorizacaoImagem}
            onChange={(e) => set('autorizacaoImagem', e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-mastchieve-600 focus:ring-mastchieve-500"
          />
          <span className="text-sm text-gray-700">
            O encarregado/atleta autoriza a utilização de imagem (fotos/vídeos) em materiais da Mastchieve (redes sociais, newsletter, site).
          </span>
        </label>
        {form.autorizacaoImagem && (
          <Field label="Referência do documento assinado (opcional)">
            <input
              value={form.autorizacaoImagemDoc}
              onChange={(e) => set('autorizacaoImagemDoc', e.target.value)}
              className={inputCls}
              placeholder="Ex: pasta física nº 12, ou link do documento digitalizado"
            />
          </Field>
        )}
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
