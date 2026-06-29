'use client';

// ✍ StrategiClear — Alexey Sukhariev <alexey.sukhariev@gmail.com>

import Link from 'next/link';
import { ArrowRight, Cpu, HardDrive, MapPin, MemoryStick } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './status-badge';
import { UsageBar } from './usage-bar';
import { LifecycleControls } from './lifecycle-controls';
import { OpenInIdeButton } from './open-in-ide-button';
import type { VM, VMTemplate } from '@/lib/api/types';
import { formatGb } from '@/lib/utils/format';

export function VmCard({
  vm,
  template,
}: {
  vm: VM;
  template?: VMTemplate;
}) {
  const inactive = vm.status !== 'running';
  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/my-machines/${vm.id}`}
              className="group inline-flex items-center gap-1 font-medium hover:text-primary focus-visible:outline-none focus-visible:underline"
            >
              <span className="truncate font-mono text-sm">{vm.name}</span>
              <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {template?.name ?? 'Unknown template'}
            </p>
          </div>
          <StatusBadge status={vm.status} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Cpu className="size-3.5" /> {vm.specs.vcpu} vCPU
          </span>
          <span className="inline-flex items-center gap-1">
            <MemoryStick className="size-3.5" /> {formatGb(vm.specs.memoryGb)}
          </span>
          <span className="inline-flex items-center gap-1">
            <HardDrive className="size-3.5" /> {formatGb(vm.specs.diskGb)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {vm.region}
          </span>
        </div>

        <div className="grid gap-2.5">
          <UsageBar label="CPU" value={vm.usage.cpuPct} inactive={inactive} />
          <UsageBar label="Memory" value={vm.usage.memPct} inactive={inactive} />
          <UsageBar label="Disk" value={vm.usage.diskPct} />
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 p-4">
        <LifecycleControls vm={vm} />
        <OpenInIdeButton vm={vm} />
      </CardFooter>
    </Card>
  );
}
