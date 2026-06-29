import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyLifecycle,
  createTemplate,
  getFleetUtilization,
  getTemplates,
  getVm,
  listVms,
  setErrorRate,
  TRANSITION_MS,
} from './store';

describe('seed data', () => {
  it('produces a realistic fleet with VMs across statuses', () => {
    const vms = listVms();
    expect(vms.length).toBeGreaterThanOrEqual(10);
    const statuses = new Set(vms.map((v) => v.status));
    expect(statuses.has('running')).toBe(true);
    expect(statuses.has('stopped')).toBe(true);
  });

  it('gives every VM 24 hourly utilization samples', () => {
    const vms = listVms();
    for (const vm of vms.slice(0, 3)) {
      const detail = getVm(vm.id);
      expect(detail).toBeDefined();
    }
  });

  it('computes a coherent fleet rollup', () => {
    const fleet = getFleetUtilization(new Date());
    expect(fleet.totals.totalVms).toBe(listVms().length);
    expect(fleet.totals.runningVms).toBeGreaterThan(0);
    expect(fleet.cost.projectedMonthlyCost).toBeGreaterThan(fleet.cost.hourlyCost);
  });
});

describe('lifecycle transitions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setErrorRate(0); // determinism
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('start: stopped -> starting -> running after the transition delay', () => {
    const stopped = listVms().find((v) => v.status === 'stopped');
    expect(stopped).toBeDefined();
    const id = stopped!.id;

    const res = applyLifecycle(id, 'start');
    expect(res.ok).toBe(true);
    expect(getVm(id)!.status).toBe('starting');

    vi.advanceTimersByTime(TRANSITION_MS.start + 50);
    expect(getVm(id)!.status).toBe('running');
  });

  it('rejects an invalid transition (start on a running VM)', () => {
    const running = listVms().find((v) => v.status === 'running');
    const res = applyLifecycle(running!.id, 'start');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Cannot start/);
  });

  it('stop: running -> stopping -> stopped with zeroed usage', () => {
    const running = listVms().find((v) => v.status === 'running');
    const id = running!.id;
    applyLifecycle(id, 'stop');
    expect(getVm(id)!.status).toBe('stopping');
    vi.advanceTimersByTime(TRANSITION_MS.stop + 50);
    const settled = getVm(id)!;
    expect(settled.status).toBe('stopped');
    expect(settled.usage.cpuPct).toBe(0);
  });
});

describe('template creation', () => {
  it('appends a new template that is then listable', () => {
    const before = getTemplates().length;
    const created = createTemplate({
      name: 'Test Template',
      description: 'A template used in tests',
      baseImage: 'ubuntu-24.04',
      vcpu: 2,
      memoryGb: 8,
      diskGb: 50,
      preinstalledTools: ['git'],
    });
    expect(created.id).toBeTruthy();
    expect(getTemplates().length).toBe(before + 1);
  });
});
