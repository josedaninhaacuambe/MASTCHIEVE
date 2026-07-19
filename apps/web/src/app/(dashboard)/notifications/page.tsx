'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import {
  Bell, BellOff, CheckCheck, Check, AlertTriangle, Info, Trophy,
  CreditCard, MessageSquare, Users, Loader2, RefreshCw, Filter,
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  data?: any;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  FEEDBACK:     { icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-100' },
  PAYMENT:      { icon: CreditCard,    color: 'text-emerald-600', bg: 'bg-emerald-100' },
  CERTIFICATE:  { icon: Trophy,        color: 'text-amber-600',   bg: 'bg-amber-100' },
  ALERT:        { icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-100' },
  ENROLLMENT:   { icon: Users,         color: 'text-blue-600',    bg: 'bg-blue-100' },
  INFO:         { icon: Info,          color: 'text-gray-600',    bg: 'bg-gray-100' },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG['INFO'];
}

function NotificationRow({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const cfg = getTypeConfig(n.type);
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl border transition cursor-pointer hover:shadow-sm',
        n.isRead ? 'bg-white border-gray-100' : 'bg-blue-50/40 border-blue-200'
      )}
      onClick={() => !n.isRead && onRead(n.id)}
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
        <Icon className={cn('w-4 h-4', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-semibold', n.isRead ? 'text-gray-700' : 'text-gray-900')}>
            {n.title}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!n.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
            <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(n.createdAt)}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
        {n.isRead && n.readAt && (
          <p className="text-xs text-gray-300 mt-1 flex items-center gap-1">
            <Check className="w-3 h-3" /> Lida em {formatDate(n.readAt)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const { data } = await api.get(`/notifications?page=${page}&limit=30`);
      return data;
    },
    staleTime: 30_000,
  });

  const notifications: Notification[] = data?.data ?? data ?? [];
  const total: number = data?.meta?.total ?? notifications.length;
  const totalPages: number = data?.meta?.totalPages ?? 1;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      toast.success('Todas as notificações marcadas como lidas');
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : filter === 'read'
      ? notifications.filter(n => n.isRead)
      : notifications;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo em dia'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {markAllRead.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCheck className="w-4 h-4" />}
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3">
        {(['all', 'unread', 'read'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition border',
              filter === f
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            {f === 'all' && <Filter className="w-3.5 h-3.5" />}
            {f === 'unread' && <Bell className="w-3.5 h-3.5" />}
            {f === 'read' && <BellOff className="w-3.5 h-3.5" />}
            {f === 'all' ? `Todas (${total})` : f === 'unread' ? `Não lidas (${notifications.filter(n => !n.isRead).length})` : 'Lidas'}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bell className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">
            {filter === 'unread' ? 'Sem notificações por ler' : 'Sem notificações'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <NotificationRow
              key={n.id}
              n={n}
              onRead={(id) => markRead.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
