'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate, getInitials, cn } from '@/lib/utils';
import {
  User, Mail, Phone, Lock, Save, Eye, EyeOff,
  Shield, Edit2, CheckCircle, AlertCircle, Waves,
} from 'lucide-react';

function Field({ label, value, onChange, type = 'text', placeholder = '', rows = 0 }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; rows?: number;
}) {
  const base = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {rows > 0
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
            className={cn(base, 'resize-none')} placeholder={placeholder} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)}
            className={base} placeholder={placeholder} />}
    </div>
  );
}

function PasswordSection({ userId }: { userId: string }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.patch('/users/me/password', {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    }),
    onSuccess: () => {
      toast.success('Palavra-passe alterada', 'Use a nova palavra-passe no próximo login');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (e: any) => toast.error('Erro', e?.response?.data?.message),
  });

  const mismatch = form.newPassword !== form.confirm && form.confirm.length > 0;
  const weak     = form.newPassword.length > 0 && form.newPassword.length < 6;
  const canSave  = form.currentPassword.length > 0 && form.newPassword.length >= 6 && form.newPassword === form.confirm;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Lock className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900">Alterar palavra-passe</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Palavra-passe actual</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={form.currentPassword}
              onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••" />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Nova palavra-passe</label>
          <input type={show ? 'text' : 'password'} value={form.newPassword}
            onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            className={cn('w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition',
              weak ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500')}
            placeholder="Mínimo 6 caracteres" />
          {weak && <p className="text-xs text-red-500 mt-1">Mínimo 6 caracteres</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Confirmar nova</label>
          <input type={show ? 'text' : 'password'} value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            className={cn('w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition',
              mismatch ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500')}
            placeholder="Repita a nova palavra-passe" />
          {mismatch && <p className="text-xs text-red-500 mt-1">As palavras-passe não coincidem</p>}
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSave || mutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-40">
          <Lock className="w-4 h-4" />
          {mutation.isPending ? 'A alterar...' : 'Alterar Palavra-passe'}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => { const { data } = await api.get('/users/me'); return data; },
    staleTime: 60_000,
  });

  const roleProfile = profile?.instructor ?? profile?.student ?? profile?.parent ?? profile?.admin ?? null;

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', bio: '' });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (roleProfile) {
      setForm({
        firstName: roleProfile.firstName ?? '',
        lastName:  roleProfile.lastName ?? '',
        phone:     roleProfile.phone ?? '',
        bio:       roleProfile.bio ?? '',
      });
    }
  }, [roleProfile]);

  function change(key: keyof typeof form) {
    return (v: string) => { setForm(f => ({ ...f, [key]: v })); setDirty(true); };
  }

  const saveMutation = useMutation({
    mutationFn: () => api.patch('/users/me', form),
    onSuccess: () => {
      toast.success('Perfil actualizado', 'As suas informações foram guardadas');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    },
    onError: (e: any) => toast.error('Erro ao guardar', e?.response?.data?.message),
  });

  const roleBadge: Record<string, { label: string; color: string }> = {
    ADMIN:      { label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
    INSTRUCTOR: { label: 'Instrutor',     color: 'bg-blue-100 text-blue-700' },
    STUDENT:    { label: 'Atleta',        color: 'bg-green-100 text-green-700' },
    PARENT:     { label: 'Encarregado',   color: 'bg-orange-100 text-orange-700' },
    VISITOR:    { label: 'Visitante',     color: 'bg-gray-100 text-gray-600' },
  };
  const badge = roleBadge[user?.role ?? ''] ?? { label: user?.role ?? '', color: 'bg-gray-100 text-gray-500' };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl">
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">O meu perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerir as suas informações pessoais e segurança</p>
      </div>

      {/* Avatar + role card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex items-center gap-5">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-black border border-white/30 flex-shrink-0">
          {getInitials(form.firstName || 'U', form.lastName || 'U')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold truncate">
            {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : user?.email}
          </div>
          <div className="text-blue-100 text-sm mt-0.5 truncate">{profile?.email}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-semibold', badge.color)}>{badge.label}</span>
            <span className="text-xs text-blue-200">Desde {formatDate(profile?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Informações pessoais</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primeiro nome" value={form.firstName} onChange={change('firstName')} placeholder="Ex: João" />
            <Field label="Apelido" value={form.lastName} onChange={change('lastName')} placeholder="Ex: Silva" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">{profile?.email}</span>
              <span className="ml-auto text-xs text-gray-400">Não editável</span>
            </div>
          </div>
          <Field label="Telefone" value={form.phone} onChange={change('phone')} placeholder="+258 84 000 0000" />
          {user?.role === 'INSTRUCTOR' && (
            <Field label="Biografia / Apresentação" value={form.bio} onChange={change('bio')}
              placeholder="Descreva a sua experiência e especialidades..." rows={3} />
          )}
        </div>
        {dirty && (
          <div className="mt-5 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <AlertCircle className="w-4 h-4" /> Tem alterações não guardadas
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setDirty(false); if (roleProfile) setForm({ firstName: roleProfile.firstName ?? '', lastName: roleProfile.lastName ?? '', phone: roleProfile.phone ?? '', bio: roleProfile.bio ?? '' }); }}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white transition">
                Descartar
              </button>
              <button onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition disabled:opacity-50">
                <Save className="w-3.5 h-3.5" />
                {saveMutation.isPending ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security */}
      <PasswordSection userId={user?.id ?? ''} />

      {/* Account info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Informações da conta</h2>
        </div>
        <dl className="space-y-3">
          {[
            { label: 'ID da conta', value: profile?.id ?? '—' },
            { label: 'Papel / Perfil', value: badge.label },
            { label: 'Estado', value: profile?.isActive ? 'Activa' : 'Inactiva' },
            { label: 'Membro desde', value: formatDate(profile?.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className={cn('text-xs font-medium',
                label === 'Estado' ? (profile?.isActive ? 'text-green-600' : 'text-red-500') : 'text-gray-900')}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
