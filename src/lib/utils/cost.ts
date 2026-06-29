import type { VM, VMSpecs } from '@/lib/api/types';

/**
 * Cost model.
 *
 * A VM's hourly cost is derived purely from its provisioned specs using simple
 * per-resource rates (USD/hour). This keeps cost deterministic and explainable
 * rather than hard-coding a number per VM. Rates are illustrative.
 */
export const COST_RATES = {
  /** USD per vCPU per hour. */
  perVcpuHour: 0.04,
  /** USD per GB of memory per hour. */
  perMemGbHour: 0.005,
  /** USD per GB of disk per hour. */
  perDiskGbHour: 0.0002,
} as const;

/** Average number of hours in a month, used for monthly projections. */
export const HOURS_PER_MONTH = 730;

/** Hourly cost of a VM derived from its specs, rounded to the cent. */
export function computeHourlyCost(specs: VMSpecs): number {
  const raw =
    specs.vcpu * COST_RATES.perVcpuHour +
    specs.memoryGb * COST_RATES.perMemGbHour +
    specs.diskGb * COST_RATES.perDiskGbHour;
  return round2(raw);
}

/** Sum of hourly cost across VMs that are currently running. */
export function sumRunningHourlyCost(vms: Pick<VM, 'status' | 'hourlyCost'>[]): number {
  const total = vms
    .filter((vm) => vm.status === 'running')
    .reduce((acc, vm) => acc + vm.hourlyCost, 0);
  return round2(total);
}

/** Fractional hours elapsed since the start of the current month (UTC). */
export function hoursElapsedInMonth(now: Date): number {
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const ms = now.getTime() - startOfMonth.getTime();
  return ms / (1000 * 60 * 60);
}

/**
 * Month-to-date cost approximation.
 *
 * Approximation: assumes the *current* running set has been running for the
 * whole month so far. This is intentionally simple (the mock has no historical
 * billing ledger) and is documented as such in the README.
 */
export function monthToDateCost(runningHourlyCost: number, now: Date): number {
  return round2(runningHourlyCost * hoursElapsedInMonth(now));
}

/** Projected full-month cost at the current hourly run-rate. */
export function projectedMonthlyCost(runningHourlyCost: number): number {
  return round2(runningHourlyCost * HOURS_PER_MONTH);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
