'use client';

import { useMemo } from 'react';
import {
  Activity,
  Cpu,
  DollarSign,
  MemoryStick,
  Power,
  Server,
  TrendingUp,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import {
  MetricCard,
  MetricCardSkeleton,
} from '@/components/domain/metric-card';
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
import { useFleetUtilization } from '@/lib/api/hooks';
import { formatCurrency, formatPercent } from '@/lib/utils/format';

export default function FleetOverviewPage() {
  const fleet = useFleetUtilization();

  const rows: TimeSeriesRow[] = useMemo(
    () =>
      (fleet.data?.series ?? []).map((p) => ({
        timestamp: p.timestamp,
        cpu: p.avgCpuPct,
        mem: p.avgMemPct,
      })),
    [fleet.data],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Fleet Overview"
        description="Fleet-wide health, utilization and cost across all developer workspaces."
      />

      {fleet.isLoading && !fleet.data ? (
        <FleetSkeleton />
      ) : fleet.isError ? (
        <ErrorState
          message={fleet.error.message}
          onRetry={() => fleet.refetch()}
          isRetrying={fleet.isFetching}
        />
      ) : fleet.data ? (
        <div className="space-y-6">
          <section
            aria-label="Fleet metrics"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            <MetricCard
              label="Total VMs"
              value={fleet.data.totals.totalVms}
              hint={`${fleet.data.totals.runningVms} running · ${fleet.data.totals.stoppedVms} stopped`}
              icon={Server}
            />
            <MetricCard
              label="Running"
              value={fleet.data.totals.runningVms}
              hint={`${fleet.data.totals.otherVms} transitioning / error`}
              icon={Power}
            />
            <MetricCard
              label="Stopped"
              value={fleet.data.totals.stoppedVms}
              hint="Not currently billing"
              icon={Activity}
            />
            <MetricCard
              label="Developers"
              value={fleet.data.totals.totalUsers}
              hint="Across the organization"
              icon={Users}
            />
            <MetricCard
              label="Aggregate CPU"
              value={formatPercent(fleet.data.totals.aggregateCpuPct)}
              hint="Mean of running VMs"
              icon={Cpu}
            />
            <MetricCard
              label="Aggregate Memory"
              value={formatPercent(fleet.data.totals.aggregateMemPct)}
              hint="Mean of running VMs"
              icon={MemoryStick}
            />
            <MetricCard
              label="Hourly cost"
              value={formatCurrency(fleet.data.cost.hourlyCost)}
              hint="Running VMs, current run-rate"
              icon={DollarSign}
            />
            <MetricCard
              label="Projected / month"
              value={formatCurrency(fleet.data.cost.projectedMonthlyCost)}
              hint={`${formatCurrency(fleet.data.cost.monthToDateCost)} month-to-date`}
              icon={TrendingUp}
            />
          </section>

          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  Aggregate utilization
                </CardTitle>
                <CardDescription>
                  Mean CPU & memory across running VMs · last 24 hours
                </CardDescription>
              </div>
              <ul className="flex items-center gap-3 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: 'var(--chart-1)' }}
                  />
                  CPU
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: 'var(--chart-2)' }}
                  />
                  Memory
                </li>
              </ul>
            </CardHeader>
            <CardContent>
              <TimeSeriesChart
                data={rows}
                height={300}
                series={[
                  { key: 'cpu', label: 'CPU', color: 'var(--chart-1)' },
                  { key: 'mem', label: 'Memory', color: 'var(--chart-2)' },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function FleetSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-[380px] w-full" />
    </div>
  );
}
