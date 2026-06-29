import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="type-footnote text-muted-foreground">{label}</p>
        {Icon && (
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </div>
      <p className="type-title-1-emph mt-2 tabular-nums">{value}</p>
      {hint && (
        <p className="type-caption-1 mt-1 text-muted-foreground">{hint}</p>
      )}
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
      <Skeleton className="mt-2 h-3 w-20" />
    </Card>
  );
}
