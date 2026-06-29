import { cn } from '@/lib/utils';
import { formatPercent } from '@/lib/utils/format';

/** Color thresholds: calm under 60%, warm 60–85%, hot above 85%. */
function toneFor(value: number): string {
  if (value >= 85) return 'bg-destructive';
  if (value >= 60) return 'bg-[var(--warning)]';
  return 'bg-primary';
}

export interface UsageBarProps {
  label: string;
  /** 0–100. */
  value: number;
  /** Render muted (e.g. for a stopped VM). */
  inactive?: boolean;
  className?: string;
}

/**
 * Labeled horizontal usage meter. Uses role=meter for assistive tech so the
 * value is announced, not just the visual bar.
 */
export function UsageBar({
  label,
  value,
  inactive = false,
  className,
}: UsageBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            'font-medium tabular-nums',
            inactive && 'text-muted-foreground',
          )}
        >
          {inactive ? '—' : formatPercent(clamped)}
        </span>
      </div>
      <div
        role="meter"
        aria-label={`${label} usage`}
        aria-valuenow={inactive ? 0 : Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500',
            inactive ? 'bg-muted-foreground/30' : toneFor(clamped),
          )}
          style={{ width: `${inactive ? 0 : clamped}%` }}
        />
      </div>
    </div>
  );
}
