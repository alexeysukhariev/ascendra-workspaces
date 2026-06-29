import type {
  Policy,
  UtilizationPoint,
  VM,
  VMUtilization,
} from '@/lib/api/types';
import { DEFAULT_POLICY } from '@/lib/api/types';

export interface IdleResult {
  idle: boolean;
  reasons: string[];
}

/**
 * Idle / underused heuristic.
 *
 * @author Alexey Sukhariev <alexey.sukhariev@gmail.com>
 *
 * A VM is flagged idle when it is *running* (only running VMs cost money and
 * can be reclaimed) AND at least one of:
 *
 *  1. Sustained low CPU: the last `idleSustainedSamples` hourly samples are all
 *     below `idleCpuThresholdPct`. Sustained (not instantaneous) avoids
 *     flagging a VM that briefly dipped.
 *  2. Stale activity: `lastActiveAt` is older than `staleActiveHours`.
 *
 * Returns the boolean plus human-readable reasons so the UI can explain *why*
 * a VM was flagged.
 */
export function evaluateIdle(
  vm: Pick<VM, 'status' | 'lastActiveAt'>,
  utilization: VMUtilization | undefined,
  now: Date,
  policy: Policy = DEFAULT_POLICY,
): IdleResult {
  if (vm.status !== 'running') {
    return { idle: false, reasons: [] };
  }

  const reasons: string[] = [];

  const recent = lastSamples(
    utilization?.points ?? [],
    policy.idleSustainedSamples,
  );
  if (
    recent.length >= policy.idleSustainedSamples &&
    recent.every((p) => p.cpuPct < policy.idleCpuThresholdPct)
  ) {
    reasons.push(
      `CPU below ${policy.idleCpuThresholdPct}% for ${policy.idleSustainedSamples}h`,
    );
  }

  const lastActiveMs = new Date(vm.lastActiveAt).getTime();
  const ageHours = (now.getTime() - lastActiveMs) / (1000 * 60 * 60);
  if (ageHours > policy.staleActiveHours) {
    reasons.push(`No activity for ${Math.floor(ageHours)}h`);
  }

  return { idle: reasons.length > 0, reasons };
}

/** Convenience boolean wrapper around {@link evaluateIdle}. */
export function isIdle(
  vm: Pick<VM, 'status' | 'lastActiveAt'>,
  utilization: VMUtilization | undefined,
  now: Date,
  policy: Policy = DEFAULT_POLICY,
): boolean {
  return evaluateIdle(vm, utilization, now, policy).idle;
}

function lastSamples(
  points: UtilizationPoint[],
  count: number,
): UtilizationPoint[] {
  if (count <= 0) return [];
  return points.slice(-count);
}
