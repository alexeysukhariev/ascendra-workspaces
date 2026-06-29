'use client';

import { Moon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/domain/states';
import { useFleetInventory } from '@/lib/api/hooks';
import type { InventoryItem } from '@/lib/api/store';

interface Bucket {
  key: string;
  label: string;
  color: string;
  /** Inclusive lower / exclusive upper CPU% bound. */
  test: (cpu: number) => boolean;
}

const BUCKETS: Bucket[] = [
  { key: 'idle', label: 'Idle (<5%)', color: 'var(--warning)', test: (c) => c < 5 },
  { key: 'low', label: 'Low (5–40%)', color: 'var(--chart-1)', test: (c) => c >= 5 && c < 40 },
  { key: 'moderate', label: 'Moderate (40–85%)', color: 'var(--chart-2)', test: (c) => c >= 40 && c < 85 },
  { key: 'hot', label: 'Hot (≥85%)', color: 'var(--destructive)', test: (c) => c >= 85 },
];

/**
 * Distribution of *running* VMs by current CPU load, so an admin can see at a
 * glance which machines are hot vs idle. Idle (heuristic) VMs are also surfaced
 * separately as reclamation candidates.
 */
export function UtilizationDistribution() {
  const inventory = useFleetInventory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-headline">Utilization distribution</CardTitle>
        <CardDescription>
          Running VMs by current CPU load — spot hot and idle machines.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inventory.isLoading && !inventory.data ? (
          <Skeleton className="h-28 w-full" />
        ) : inventory.isError ? (
          <ErrorState
            message={inventory.error.message}
            onRetry={() => inventory.refetch()}
            className="p-6"
          />
        ) : (
          <Distribution items={inventory.data ?? []} />
        )}
      </CardContent>
    </Card>
  );
}

function Distribution({ items }: { items: InventoryItem[] }) {
  const running = items.filter((vm) => vm.status === 'running');
  const total = running.length;
  const counts = BUCKETS.map(
    (b) => running.filter((vm) => b.test(vm.usage.cpuPct)).length,
  );
  const idleFlagged = items.filter((vm) => vm.idle.idle).length;

  if (total === 0) {
    return (
      <p className="type-subheadline text-muted-foreground">
        No running VMs right now.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stacked proportion bar */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-full"
        role="img"
        aria-label="Distribution of running VMs by CPU load"
      >
        {BUCKETS.map((b, i) =>
          counts[i] > 0 ? (
            <div
              key={b.key}
              style={{
                width: `${(counts[i] / total) * 100}%`,
                background: b.color,
              }}
            />
          ) : null,
        )}
      </div>

      {/* Legend with counts */}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        {BUCKETS.map((b, i) => (
          <li key={b.key} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: b.color }}
              aria-hidden
            />
            <span className="type-footnote text-muted-foreground">
              {b.label}
            </span>
            <span className="type-footnote-emph ml-auto tabular-nums">
              {counts[i]}
            </span>
          </li>
        ))}
      </ul>

      {idleFlagged > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-[color-mix(in_oklch,var(--warning)_30%,transparent)] bg-[color-mix(in_oklch,var(--warning)_10%,transparent)] px-3 py-2">
          <Moon className="size-4 text-[var(--warning)]" aria-hidden />
          <p className="type-footnote text-foreground">
            <span className="font-semibold">{idleFlagged}</span> VM
            {idleFlagged === 1 ? '' : 's'} flagged idle — candidates for
            reclamation. See VM Inventory.
          </p>
        </div>
      )}
    </div>
  );
}
