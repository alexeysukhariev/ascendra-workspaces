import { describe, expect, it } from 'vitest';
import { evaluateIdle, isIdle } from './idle';
import { DEFAULT_POLICY, type VMUtilization } from '@/lib/api/types';

const NOW = new Date('2026-06-29T12:00:00.000Z');

function util(cpuValues: number[]): VMUtilization {
  return {
    vmId: 'vm_test',
    points: cpuValues.map((cpu, i) => ({
      timestamp: new Date(NOW.getTime() - (cpuValues.length - i) * 3600_000).toISOString(),
      cpuPct: cpu,
      memPct: 30,
      diskPct: 40,
    })),
  };
}

const RECENTLY = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString(); // 1h ago
const LONG_AGO = new Date(NOW.getTime() - 48 * 60 * 60 * 1000).toISOString(); // 48h ago

describe('evaluateIdle', () => {
  it('never flags a non-running VM', () => {
    const result = evaluateIdle(
      { status: 'stopped', lastActiveAt: LONG_AGO },
      util(Array(8).fill(0)),
      NOW,
    );
    expect(result.idle).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it('flags sustained low CPU on a running VM', () => {
    const result = evaluateIdle(
      { status: 'running', lastActiveAt: RECENTLY },
      util([2, 1, 3, 2, 1, 2, 0, 1]), // last 6 all < 5%
      NOW,
    );
    expect(result.idle).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/CPU below 5%/);
  });

  it('does NOT flag low CPU if not sustained for enough samples', () => {
    const result = evaluateIdle(
      { status: 'running', lastActiveAt: RECENTLY },
      util([40, 50, 60, 2, 1, 2]), // a recent dip but not 6 sustained
      NOW,
    );
    expect(result.idle).toBe(false);
  });

  it('flags a stale lastActiveAt even with busy CPU', () => {
    const result = evaluateIdle(
      { status: 'running', lastActiveAt: LONG_AGO },
      util(Array(8).fill(70)),
      NOW,
    );
    expect(result.idle).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/No activity/);
  });

  it('respects a custom policy threshold', () => {
    const strict = { ...DEFAULT_POLICY, idleCpuThresholdPct: 50 };
    const result = evaluateIdle(
      { status: 'running', lastActiveAt: RECENTLY },
      util([40, 45, 30, 20, 10, 25]),
      NOW,
      strict,
    );
    expect(result.idle).toBe(true);
  });

  it('isIdle convenience wrapper agrees with evaluateIdle', () => {
    const vm = { status: 'running' as const, lastActiveAt: LONG_AGO };
    expect(isIdle(vm, util(Array(8).fill(70)), NOW)).toBe(true);
  });
});
