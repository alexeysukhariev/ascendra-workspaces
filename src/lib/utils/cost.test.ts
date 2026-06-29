import { describe, expect, it } from 'vitest';
import {
  COST_RATES,
  HOURS_PER_MONTH,
  computeHourlyCost,
  hoursElapsedInMonth,
  monthToDateCost,
  projectedMonthlyCost,
  sumRunningHourlyCost,
} from './cost';

describe('computeHourlyCost', () => {
  it('derives cost from specs using the published rates', () => {
    const specs = { vcpu: 4, memoryGb: 16, diskGb: 100 };
    const expected =
      4 * COST_RATES.perVcpuHour +
      16 * COST_RATES.perMemGbHour +
      100 * COST_RATES.perDiskGbHour;
    expect(computeHourlyCost(specs)).toBeCloseTo(expected, 2);
  });

  it('rounds to the cent', () => {
    const cost = computeHourlyCost({ vcpu: 1, memoryGb: 1, diskGb: 1 });
    expect(Number.isFinite(cost)).toBe(true);
    expect(Math.round(cost * 100)).toBe(cost * 100);
  });
});

describe('sumRunningHourlyCost', () => {
  it('only counts running VMs', () => {
    const vms = [
      { status: 'running' as const, hourlyCost: 0.26 },
      { status: 'stopped' as const, hourlyCost: 0.26 },
      { status: 'running' as const, hourlyCost: 0.1 },
      { status: 'error' as const, hourlyCost: 5 },
    ];
    expect(sumRunningHourlyCost(vms)).toBeCloseTo(0.36, 2);
  });

  it('is zero when nothing is running', () => {
    expect(sumRunningHourlyCost([{ status: 'stopped', hourlyCost: 1 }])).toBe(0);
  });
});

describe('month-to-date and projection', () => {
  it('hoursElapsedInMonth is 0 at the very start of the month', () => {
    const start = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));
    expect(hoursElapsedInMonth(start)).toBeCloseTo(0, 5);
  });

  it('hoursElapsedInMonth counts whole + fractional hours', () => {
    // 2 days + 6 hours into the month = 54 hours
    const now = new Date(Date.UTC(2026, 5, 3, 6, 0, 0));
    expect(hoursElapsedInMonth(now)).toBeCloseTo(54, 5);
  });

  it('monthToDateCost scales run-rate by elapsed hours', () => {
    const now = new Date(Date.UTC(2026, 5, 3, 6, 0, 0)); // 54h
    expect(monthToDateCost(2, now)).toBeCloseTo(108, 2);
  });

  it('projectedMonthlyCost uses a 730h month', () => {
    expect(projectedMonthlyCost(1)).toBe(HOURS_PER_MONTH);
  });
});
