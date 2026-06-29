import { Loader2 } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { isTransitional, type VMStatus } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const STATUS_META: Record<
  VMStatus,
  { label: string; variant: NonNullable<BadgeProps['variant']>; dot: string }
> = {
  running: { label: 'Running', variant: 'success', dot: 'bg-[var(--success)]' },
  stopped: { label: 'Stopped', variant: 'muted', dot: 'bg-muted-foreground' },
  starting: { label: 'Starting', variant: 'warning', dot: 'bg-[var(--warning)]' },
  stopping: { label: 'Stopping', variant: 'warning', dot: 'bg-[var(--warning)]' },
  restarting: {
    label: 'Restarting',
    variant: 'warning',
    dot: 'bg-[var(--warning)]',
  },
  error: { label: 'Error', variant: 'destructive', dot: 'bg-destructive' },
};

export function StatusBadge({
  status,
  className,
}: {
  status: VMStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  const transitioning = isTransitional(status);

  return (
    <Badge variant={meta.variant} className={cn('gap-1.5', className)}>
      {transitioning ? (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      ) : (
        <span
          className={cn('size-1.5 rounded-full', meta.dot)}
          aria-hidden="true"
        />
      )}
      {meta.label}
    </Badge>
  );
}
