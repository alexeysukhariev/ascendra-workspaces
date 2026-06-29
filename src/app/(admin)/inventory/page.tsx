'use client';

import { useMemo, useState } from 'react';
import { Moon, Search } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { DataTable, type Column } from '@/components/domain/data-table';
import { StatusBadge } from '@/components/domain/status-badge';
import { ErrorState } from '@/components/domain/states';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFleetInventory } from '@/lib/api/hooks';
import type { InventoryItem } from '@/lib/api/store';
import type { VMStatus } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formatPercent } from '@/lib/utils/format';

const STATUS_OPTIONS: { value: VMStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'running', label: 'Running' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'starting', label: 'Starting' },
  { value: 'stopping', label: 'Stopping' },
  { value: 'restarting', label: 'Restarting' },
  { value: 'error', label: 'Error' },
];

function UsageCell({ value, inactive }: { value: number; inactive?: boolean }) {
  if (inactive) return <span className="text-muted-foreground">—</span>;
  const tone =
    value >= 85
      ? 'bg-destructive'
      : value >= 60
        ? 'bg-[var(--warning)]'
        : 'bg-primary';
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-right tabular-nums">{formatPercent(value)}</span>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <span
          className={cn('block h-full rounded-full', tone)}
          style={{ width: `${value}%` }}
        />
      </span>
    </div>
  );
}

export default function InventoryPage() {
  const inventory = useFleetInventory();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<VMStatus | 'all'>('all');
  const [owner, setOwner] = useState<string>('all');
  const [idleOnly, setIdleOnly] = useState(false);

  const owners = useMemo(() => {
    const set = new Map<string, string>();
    inventory.data?.forEach((vm) => set.set(vm.ownerId, vm.ownerName));
    return Array.from(set, ([id, name]) => ({ id, name }));
  }, [inventory.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (inventory.data ?? []).filter((vm) => {
      if (status !== 'all' && vm.status !== status) return false;
      if (owner !== 'all' && vm.ownerId !== owner) return false;
      if (idleOnly && !vm.idle.idle) return false;
      if (q) {
        const haystack =
          `${vm.name} ${vm.ownerName} ${vm.templateName} ${vm.region}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [inventory.data, query, status, owner, idleOnly]);

  const idleCount = inventory.data?.filter((vm) => vm.idle.idle).length ?? 0;

  const columns: Column<InventoryItem>[] = [
    {
      id: 'name',
      header: 'VM',
      sortValue: (vm) => vm.name,
      cell: (vm) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px]">{vm.name}</span>
          {vm.idle.idle && (
            <Badge
              variant="warning"
              title={vm.idle.reasons.join(' · ')}
              className="gap-1"
            >
              <Moon className="size-3" />
              Idle
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'owner',
      header: 'Owner',
      sortValue: (vm) => vm.ownerName,
      cell: (vm) => vm.ownerName,
    },
    {
      id: 'template',
      header: 'Template',
      sortValue: (vm) => vm.templateName,
      cell: (vm) => (
        <span className="text-muted-foreground">{vm.templateName}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (vm) => vm.status,
      cell: (vm) => <StatusBadge status={vm.status} />,
    },
    {
      id: 'cpu',
      header: 'CPU',
      sortValue: (vm) => (vm.status === 'running' ? vm.usage.cpuPct : -1),
      cell: (vm) => (
        <UsageCell value={vm.usage.cpuPct} inactive={vm.status !== 'running'} />
      ),
    },
    {
      id: 'mem',
      header: 'Memory',
      sortValue: (vm) => (vm.status === 'running' ? vm.usage.memPct : -1),
      cell: (vm) => (
        <UsageCell value={vm.usage.memPct} inactive={vm.status !== 'running'} />
      ),
    },
    {
      id: 'disk',
      header: 'Disk',
      sortValue: (vm) => vm.usage.diskPct,
      cell: (vm) => <UsageCell value={vm.usage.diskPct} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="VM Inventory"
        description="Every VM across the fleet. Idle / underused machines are flagged for reclamation."
      />

      {inventory.isLoading && !inventory.data ? (
        <InventorySkeleton />
      ) : inventory.isError ? (
        <ErrorState
          message={inventory.error.message}
          onRetry={() => inventory.refetch()}
          isRetrying={inventory.isFetching}
        />
      ) : (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, owner, template, region…"
                className="pl-8"
                aria-label="Search inventory"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as VMStatus | 'all')}
              >
                <SelectTrigger className="w-[150px]" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger className="w-[160px]" aria-label="Filter by owner">
                  <SelectValue placeholder="All owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="idle-only"
                  checked={idleOnly}
                  onCheckedChange={setIdleOnly}
                />
                <Label htmlFor="idle-only" className="cursor-pointer">
                  Idle only{idleCount > 0 && ` (${idleCount})`}
                </Label>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {filtered.length} of {inventory.data?.length ?? 0} VMs
          </p>

          <DataTable
            columns={columns}
            data={filtered}
            getRowKey={(vm) => vm.id}
            initialSort={{ columnId: 'name', dir: 'asc' }}
            rowClassName={(vm) =>
              vm.idle.idle
                ? 'bg-[color-mix(in_oklch,var(--warning)_8%,transparent)]'
                : undefined
            }
            emptyState="No VMs match your filters."
          />
        </div>
      )}
    </div>
  );
}

function InventorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-9 w-[160px]" />
      </div>
      <Skeleton className="h-[420px] w-full" />
    </div>
  );
}
