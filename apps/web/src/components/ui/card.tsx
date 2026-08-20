import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-2xl overflow-hidden', className)}>
      {children}
    </div>
  );
}

interface SectionCardProps extends CardProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  bodyClassName?: string;
}

export function SectionCard({ title, icon, action, children, className, bodyClassName }: SectionCardProps) {
  return (
    <Card className={className}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="text-sm font-semibold text-gray-900 truncate">{title}</span>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </Card>
  );
}
