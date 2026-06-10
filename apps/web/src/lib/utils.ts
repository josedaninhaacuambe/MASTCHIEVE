import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = 'dd/MM/yyyy') {
  return format(new Date(date), fmt, { locale: ptBR });
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export function formatCurrency(value: number) {
  return `MT ${new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function levelLabel(level: string) {
  const map: Record<string, string> = {
    BEGINNER: 'Iniciante', ELEMENTARY: 'Elementar',
    INTERMEDIATE: 'Intermédio', ADVANCED: 'Avançado', COMPETITIVE: 'Competição',
  };
  return map[level] ?? level;
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'text-green-600 bg-green-50', INACTIVE: 'text-gray-600 bg-gray-50',
    PAID: 'text-green-600 bg-green-50', PENDING: 'text-yellow-600 bg-yellow-50',
    OVERDUE: 'text-red-600 bg-red-50', GENERATED: 'text-blue-600 bg-blue-50',
    REVIEWED: 'text-purple-600 bg-purple-50', SENT: 'text-green-600 bg-green-50',
  };
  return map[status] ?? 'text-gray-600 bg-gray-50';
}
