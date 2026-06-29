'use client';

import { useMemo } from 'react';
import { Laptop } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { VmCard } from '@/components/domain/vm-card';
import { EmptyState, ErrorState } from '@/components/domain/states';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePersona } from '@/components/providers/persona-provider';
import { useTemplates, useVms } from '@/lib/api/hooks';
import type { VMTemplate } from '@/lib/api/types';

export default function MyMachinesPage() {
  const { activeUser, isLoading: personaLoading } = usePersona();
  const ownerId = activeUser?.id;

  const vms = useVms(ownerId);
  const templates = useTemplates();

  const templatesById = useMemo(() => {
    const map = new Map<string, VMTemplate>();
    templates.data?.forEach((t) => map.set(t.id, t));
    return map;
  }, [templates.data]);

  const runningCount =
    vms.data?.filter((v) => v.status === 'running').length ?? 0;

  const loading = personaLoading || (vms.isLoading && !vms.data);

  return (
    <div>
      <PageHeader
        title="My Machines"
        description={
          loading
            ? 'Loading your workspaces…'
            : `${vms.data?.length ?? 0} workspace${
                (vms.data?.length ?? 0) === 1 ? '' : 's'
              } · ${runningCount} running`
        }
      />

      {loading ? (
        <MachinesSkeleton />
      ) : vms.isError ? (
        <ErrorState
          message={vms.error.message}
          onRetry={() => vms.refetch()}
          isRetrying={vms.isFetching}
        />
      ) : !vms.data || vms.data.length === 0 ? (
        <EmptyState
          icon={Laptop}
          title="No machines yet"
          description="You don't have any workspaces provisioned. Ask an admin to create one from a template."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vms.data.map((vm) => (
            <VmCard
              key={vm.id}
              vm={vm}
              template={templatesById.get(vm.templateId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MachinesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="flex flex-col">
          <CardContent className="flex-1 space-y-4 p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-3/4" />
            <div className="space-y-2.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </CardContent>
          <CardFooter className="gap-2 p-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
