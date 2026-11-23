'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { Pencil, X, AlertCircle, KeyRound, MapPin } from 'lucide-react';

interface Props {
  student: any;
  onClose: () => void;
  /** Admin / assistente administrativo: pode definir unidade, turma e etiqueta BM. */
  podeGerirAlocacao?: boolean;
}

const genderOptions = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500 transition';

export default function StudentEditModal({ student, onClose, podeGerirAlocacao = false }: Props) {
  const qc = useQueryClient();
  const turmasActuais: { id: string; name: string }[] = (student.enrollments ?? [])
    .filter((en: any) => en.isActive !== false && en.class)
    .map((en: any) => ({ id: en.class.id, name: en.class.name }));
  const [aloc, setAloc] = useState({
    unidadeId: student.unidadeId ?? '',
    classId: '',
    bm: student.etiqueta === 'BM',
    trabalhadorBm: student.trabalhadorBm ?? '',
  });
  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades-select'],
    queryFn: async () => { const { data } = await api.get('/unidades'); return (data.data ?? data ?? []).filter((u: any) => u.ativo !== false); },
    enabled: podeGerirAlocacao,
  });
  const { data: turmas = [] } = useQuery({
    queryKey: ['turmas-unidade', aloc.unidadeId],
    queryFn: async () => {
      const { data } = await api.get(`/classes?limit=100&status=ACTIVE&unidadeId=${aloc.unidadeId}`);
      return data.data?.data ?? data.data ?? [];
    },
    enabled: podeGerirAlocacao && !!aloc.unidadeId,
  });
  const [form, setForm] = useState({
    firstName: student.firstName ?? '',
    lastName: student.lastName ?? '',
    dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : '',
    gender: student.gender ?? 'MALE',
    phone: student.phone ?? '',
    medicalNotes: student.medicalNotes ?? '',
    emergencyContact: student.emergencyContact ?? '',
    emergencyPhone: student.emergencyPhone ?? '',
    autorizacaoImagem: !!student.autorizacaoImagem,
    autorizacaoImagemDoc: student.autorizacaoImagemDoc ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const set = (field: string, value: string | boolean) => {
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

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phone: form.phone || undefined,
        medicalNotes: form.medicalNotes || undefined,
        emergencyContact: form.emergencyContact || undefined,
        emergencyPhone: form.emergencyPhone || undefined,
        autorizacaoImagem: form.autorizacaoImagem,
        autorizacaoImagemDoc: form.autorizacaoImagemDoc || undefined,
      };
      if (podeGerirAlocacao) {
        // Só envia o que mudou: o servidor valida a unidade, a capacidade e a unidade da turma.
        if (aloc.unidadeId && aloc.unidadeId !== (student.unidadeId ?? '')) payload.unidadeId = aloc.unidadeId;
        if (aloc.classId) payload.classId = aloc.classId;
        const etiqueta = aloc.bm ? 'BM' : null;
        if (etiqueta !== (student.etiqueta ?? null)) payload.etiqueta = etiqueta;
        const trab = aloc.bm ? aloc.trabalhadorBm.trim() || null : null;
        if (trab !== (student.trabalhadorBm ?? null)) payload.trabalhadorBm = trab;
      }
      await api.put(`/students/${student.id}`, payload);
    },
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso');
      qc.invalidateQueries({ queryKey: ['student', student.id] });
      qc.invalidateQueries({ queryKey: ['students'] });
      onClose();
    },
    onError: (e: any) => toast.error('Erro ao atualizar perfil', e?.response?.data?.message ?? 'Tenta novamente'),
  });

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateMutation.mutate();
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/students/${student.id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso');
      setNewPassword('');
    },
    onError: (e: any) => toast.error('Erro ao redefinir senha', e?.response?.data?.message ?? 'Tenta novamente'),
  });

  const handleResetPassword = () => {
    if (newPassword.trim().length < 6) { setPasswordError('A senha deve ter pelo menos 6 caracteres'); return; }
    setPasswordError('');
    resetPasswordMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Pencil className="w-4 h-4" /> Editar Perfil — {student.firstName} {student.lastName}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {updateMutation.isError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Erro ao atualizar perfil. Tenta novamente.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Primeiro nome">
              <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputCls} />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </Field>
            <Field label="Apelido">
              <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputCls} />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Data de nascimento">
              <input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} className={inputCls} />
              {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
            </Field>
            <Field label="Género">
              <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputCls}>
                {genderOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          {podeGerirAlocacao && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Unidade e turma
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Unidade">
                  <select value={aloc.unidadeId} onChange={(e) => setAloc((a) => ({ ...a, unidadeId: e.target.value, classId: '' }))} className={inputCls}>
                    <option value="">— Escolher —</option>
                    {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </Field>
                <Field label="Adicionar à turma">
                  <select value={aloc.classId} onChange={(e) => setAloc((a) => ({ ...a, classId: e.target.value }))} className={inputCls} disabled={!aloc.unidadeId}>
                    <option value="">— Nenhuma —</option>
                    {turmas
                      .filter((t: any) => !turmasActuais.some((c) => c.id === t.id))
                      .map((t: any) => {
                        const cheia = (t.enrolledCount ?? 0) >= t.maxStudents;
                        return <option key={t.id} value={t.id} disabled={cheia}>{t.name} ({t.enrolledCount ?? 0}/{t.maxStudents}){cheia ? ' — lotada' : ''}</option>;
                      })}
                  </select>
                </Field>
              </div>
              {turmasActuais.length > 0 && (
                <p className="text-xs text-gray-500">Turmas actuais: {turmasActuais.map((t) => t.name).join(', ')}</p>
              )}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aloc.bm}
                  onChange={(e) => setAloc((a) => ({ ...a, bm: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-mastchieve-600 focus:ring-mastchieve-500"
                />
                <span className="text-sm text-gray-700">
                  Banco de Moçambique (BM)
                  <span className="block text-xs text-gray-500">Sem pacotes de pagamento e fora da geração automática de mensalidades.</span>
                </span>
              </label>
              {aloc.bm && (
                <Field label="Trabalhador do BM">
                  <input value={aloc.trabalhadorBm} onChange={(e) => setAloc((a) => ({ ...a, trabalhadorBm: e.target.value }))} maxLength={120} className={inputCls} placeholder="Nome do trabalhador (o próprio ou o pai/mãe)" />
                </Field>
              )}
            </div>
          )}

          <Field label="Telefone">
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="+258 8X XXX XXXX" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contacto de emergência">
              <input value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} className={inputCls} placeholder="Nome" />
            </Field>
            <Field label="Telemóvel de emergência">
              <input value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} className={inputCls} placeholder="+258 8X XXX XXXX" />
            </Field>
          </div>

          <Field label="Notas médicas / observações">
            <textarea
              value={form.medicalNotes}
              onChange={(e) => set('medicalNotes', e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Alergias, lesões, limitações físicas..."
            />
          </Field>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autorizacaoImagem}
              onChange={(e) => set('autorizacaoImagem', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-mastchieve-600 focus:ring-mastchieve-500"
            />
            <span className="text-sm text-gray-700">Autoriza a utilização de imagem (fotos/vídeos) em materiais da Mastchieve.</span>
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

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-2">
              <KeyRound className="w-3.5 h-3.5" /> Redefinir senha de acesso
            </h4>
            {student.userId ? (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                    className={inputCls}
                    placeholder="Nova senha (mín. 6 caracteres)"
                  />
                  {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                  className="px-3 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 whitespace-nowrap"
                >
                  {resetPasswordMutation.isPending ? 'A definir...' : 'Definir Nova Senha'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Este atleta acede através da conta do encarregado — redefine a senha dele em vez desta.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-mastchieve-600 hover:bg-mastchieve-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
          >
            <Pencil className="w-4 h-4" /> {updateMutation.isPending ? 'A guardar...' : 'Guardar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
