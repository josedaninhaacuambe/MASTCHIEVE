import { cn } from '@/lib/utils';

const VARIANT_CLASSES = {
  neutral: 'text-gray-600 bg-gray-100',
  success: 'text-green-600 bg-green-50',
  warning: 'text-yellow-700 bg-yellow-50',
  danger: 'text-red-600 bg-red-50',
  info: 'text-blue-600 bg-blue-50',
  violet: 'text-violet-600 bg-violet-50',
} as const;

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof VARIANT_CLASSES;
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', VARIANT_CLASSES[variant], className)}>
      {children}
    </span>
  );
}
