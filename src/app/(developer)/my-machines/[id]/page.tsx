'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { StatusBadge } from '@/components/domain/status-badge';
import { UsageBar } from '@/components/domain/usage-bar';
import { LifecycleControls } from '@/components/domain/lifecycle-controls';
import { OpenInIdeButton } from '@/components/domain/open-in-ide-button';
import {
  TimeSeriesChart,
  type TimeSeriesRow,
} from '@/components/domain/time-series-chart';
import { ErrorState } from '@/components/domain/states';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemplates, useVm, useVmUtilization } from '@/lib/api/hooks';
import {
  formatCurrency,
  formatGb,
  formatRelativeTime,
  formatUptime,
} from '@/lib/utils/format';

export default function VmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const vm = useVm(id);
  const utilization = useVmUtilization(id);
  const templates = useTemplates();

  const template = templates.data?.find((t) => t.id === vm.data?.templateId);

  const rows: TimeSeriesRow[] = useMemo(
    () =>
      (utilization.data?.points ?? []).map((p) => ({
        timestamp: p.timestamp,
        cpu: p.cpuPct,
        mem: p.memPct,
        disk: p.diskPct,
      })),
    [utilization.data],
  );

  return (
    <div>
      <Link
        href="/my-machines"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:underline"
      >
        <ArrowLeft className="size-4" /> Back to My Machines
      </Link>

      {vm.isLoading && !vm.data ? (
        <DetailSkeleton />
      ) : vm.isError ? (
        <ErrorState
          title="Couldn't load this machine"
          message={vm.error.message}
          onRetry={() => vm.refetch()}
          isRetrying={vm.isFetching}
        />
      ) : vm.data ? (
        <div className="space-y-6">
          <PageHeader
            title={vm.data.name}
            description={template?.name ?? 'Unknown template'}
            actions={<StatusBadge status={vm.data.status} />}
          />

          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <LifecycleControls vm={vm.data} size="default" />
              <OpenInIdeButton vm={vm.data} size="default" />
            </CardContent>
          </Card>

          {/* Current snapshot */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <UsageBar
                label="CPU"
                value={vm.data.usage.cpuPct}
                inactive={vm.data.status !== 'running'}
              />
            </Card>
            <Card className="p-5">
              <UsageBar
                label="Memory"
                value={vm.data.usage.memPct}
                inactive={vm.data.status !== 'running'}
              />
            </Card>
            <Card className="p-5">
              <UsageBar label="Disk" value={vm.data.usage.diskPct} />
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="CPU & memory"
              description="Last 24 hours, hourly"
              legend={[
                { label: 'CPU', color: 'var(--chart-1)' },
                { label: 'Memory', color: 'var(--chart-2)' },
              ]}
              loading={utilization.isLoading}
              error={utilization.isError ? utilization.error.message : undefined}
              onRetry={() => utilization.refetch()}
            >
              <TimeSeriesChart
                data={rows}
                series={[
                  { key: 'cpu', label: 'CPU', color: 'var(--chart-1)' },
                  { key: 'mem', label: 'Memory', color: 'var(--chart-2)' },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Disk usage"
              description="Last 24 hours, hourly"
              legend={[{ label: 'Disk', color: 'var(--chart-3)' }]}
              loading={utilization.isLoading}
              error={utilization.isError ? utilization.error.message : undefined}
              onRetry={() => utilization.refetch()}
            >
              <TimeSeriesChart
                data={rows}
                series={[
                  { key: 'disk', label: 'Disk', color: 'var(--chart-3)' },
                ]}
              />
            </ChartCard>
          </div>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="type-headline">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
                <Meta label="Template" value={template?.name ?? '—'} />
                <Meta label="Base image" value={template?.baseImage ?? '—'} mono />
                <Meta label="Region" value={vm.data.region} mono />
                <Meta
                  label="Specs"
                  value={`${vm.data.specs.vcpu} vCPU · ${formatGb(
                    vm.data.specs.memoryGb,
                  )} · ${formatGb(vm.data.specs.diskGb)}`}
                />
                <Meta
                  label="Uptime"
                  value={
                    vm.data.status === 'running'
                      ? formatUptime(vm.data.uptimeSeconds)
                      : '—'
                  }
                />
                <Meta
                  label="Hourly cost"
                  value={formatCurrency(vm.data.hourlyCost)}
                />
                <Meta
                  label="Created"
                  value={new Date(vm.data.createdAt).toLocaleDateString()}
                />
                <Meta
                  label="Last active"
                  value={formatRelativeTime(vm.data.lastActiveAt)}
                />
                <Meta label="VM ID" value={vm.data.id} mono />
              </dl>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="type-caption-1 text-muted-foreground">{label}</dt>
      <dd className={mono ? 'mt-0.5 font-mono text-[13px]' : 'mt-0.5 type-subheadline'}>
        {value}
      </dd>
    </div>
  );
}

function ChartCard({
  title,
  description,
  legend,
  loading,
  error,
  onRetry,
  children,
}: {
  title: string;
  description: string;
  legend: { label: string; color: string }[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="type-headline">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <ul className="flex items-center gap-3 text-xs text-muted-foreground">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ background: l.color }}
              />
              {l.label}
            </li>
          ))}
        </ul>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} className="p-6" />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[320px]" />
        <Skeleton className="h-[320px]" />
      </div>
    </div>
  );
}
