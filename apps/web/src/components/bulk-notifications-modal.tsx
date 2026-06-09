'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { X, Send, Users, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkNotificationsModalProps {
  onClose: () => void;
}

export function BulkNotificationsModal({ onClose }: BulkNotificationsModalProps) {
  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'INFO',
    target: 'ALL_STUDENTS', // ALL_STUDENTS | ALL_INSTRUCTORS | ALL_USERS | OVERDUE_PAYMENTS
  });

  const mutation = useMutation({
    mutationFn: () => api.post('/notifications/bulk', form),
    onSuccess: (res) => {
      toast.success('Notificações enviadas', `${res.data?.data?.sent ?? 0} destinatários notificados`);
      onClose();
    },
    onError: (e: any) => toast.error('Erro ao enviar notificações', e?.response?.data?.message),
  });

  const typeOptions = [
    { value: 'INFO', label: 'Informação', color: 'text-blue-600' },
    { value: 'WARNING', label: 'Aviso', color: 'text-yellow-600' },
    { value: 'SUCCESS', label: 'Sucesso', color: 'text-green-600' },
    { value: 'SYSTEM', label: 'Sistema', color: 'text-gray-600' },
  ];

  const targetOptions = [
    { value: 'ALL_STUDENTS', label: 'Todos os Atletas', icon: Users },
    { value: 'ALL_INSTRUCTORS', label: 'Todos os Instrutores', icon: Users },
    { value: 'ALL_USERS', label: 'Todos os Utilizadores', icon: Users },
    { value: 'OVERDUE_PAYMENTS', label: 'Atletas com Pagamentos em Atraso', icon: Bell },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mastchieve-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-mastchieve-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Enviar Notificação em Massa</h2>
              <p className="text-xs text-gray-500">Notifica múltiplos utilizadores simultaneamente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Destinatários</label>
            <div className="grid grid-cols-2 gap-2">
              {targetOptions.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => setForm(f => ({ ...f, target: value }))}
                  className={cn('flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition text-left',
                    form.target === value ? 'border-mastchieve-500 bg-mastchieve-50 text-mastchieve-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div className="flex gap-2 flex-wrap">
              {typeOptions.map(({ value, label, color }) => (
                <button key={value} onClick={() => setForm(f => ({ ...f, type: value }))}
                  className={cn('px-3 py-1.5 rounded-full border text-xs font-medium transition',
                    form.type === value ? 'border-mastchieve-500 bg-mastchieve-50 text-mastchieve-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Manutenção agendada para amanhã"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500" />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
            <textarea value={form.body} rows={3} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Escreve a mensagem completa aqui..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mastchieve-500 resize-none" />
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}
            className="flex-1 bg-mastchieve-600 hover:bg-mastchieve-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            {mutation.isPending ? 'A enviar...' : 'Enviar Notificações'}
          </button>
        </div>
      </div>
    </div>
  );
}
