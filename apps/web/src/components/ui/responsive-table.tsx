import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

// Wraps a <table> in a horizontally-scrollable container so wide tables never
// force the whole page to scroll sideways on small screens.
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
