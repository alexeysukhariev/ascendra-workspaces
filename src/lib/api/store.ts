import { createSeedData, type SeedData } from './seed';
import {
  computeHourlyCost,
  monthToDateCost,
  projectedMonthlyCost,
  sumRunningHourlyCost,
} from '@/lib/utils/cost';
import { evaluateIdle, type IdleResult } from '@/lib/utils/idle';
import {
  type FleetUtilization,
  type LifecycleAction,
  type TemplateInput,
  type VM,
  type VMStatus,
  type VMTemplate,
} from './types';

/**
 * In-memory mock store.
 *
 * @author Alexey Sukhariev <alexey.sukhariev@gmail.com>
 *
 * Lives for the lifetime of the browser tab. Lifecycle mutations mutate this
 * object directly, so a VM you start stays running until you stop it — across
 * navigations, refetches and route changes (but not a hard page reload, which
 * re-seeds). Pinned to globalThis so Next.js HMR doesn't wipe it in dev.
 */

/** How long each transient lifecycle state lasts before settling (ms). */
export const TRANSITION_MS = {
  start: 3000,
  stop: 2000,
  restart: 3500,
} as const;

interface InternalStore extends SeedData {
  /** Probability a read request fails, to exercise error states. */
  errorRate: number;
  /** Pending transition timers keyed by VM id. */
  timers: Map<string, ReturnType<typeof setTimeout>>;
  /** Monotonic counter for generated ids. */
  seq: number;
}

const GLOBAL_KEY = '__strategiclear_store__';

function init(): InternalStore {
  const seed = createSeedData(new Date());
  return {
    ...seed,
    // Off by default for a smooth client-facing demo. The error states are fully
    // implemented and reachable — flip this on (e.g. setErrorRate(0.1)) to
    // exercise them.
    errorRate: 0,
    timers: new Map(),
    seq: 100,
  };
}

function getStore(): InternalStore {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: InternalStore;
  };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = init();
  }
  return g[GLOBAL_KEY];
}

// --- Read helpers --------------------------------------------------------

export function shouldInjectError(): boolean {
  const s = getStore();
  return Math.random() < s.errorRate;
}

export function setErrorRate(rate: number): void {
  getStore().errorRate = Math.max(0, Math.min(1, rate));
}

export function getErrorRate(): number {
  return getStore().errorRate;
}

/** Apply small live jitter to a running VM's usage snapshot on each read. */
function liveUsage(vm: VM): VM {
  if (vm.status !== 'running') return vm;
  const nudge = (v: number, spread: number) =>
    clampPct(v + (Math.random() - 0.5) * spread);
  return {
    ...vm,
    usage: {
      cpuPct: nudge(vm.usage.cpuPct, 8),
      memPct: nudge(vm.usage.memPct, 4),
      diskPct: vm.usage.diskPct,
    },
  };
}

export function listVms(filter?: { ownerId?: string }): VM[] {
  const s = getStore();
  let vms = s.vms;
  if (filter?.ownerId) {
    vms = vms.filter((v) => v.ownerId === filter.ownerId);
  }
  return vms.map(liveUsage);
}

export function getVm(id: string): VM | undefined {
  const vm = getStore().vms.find((v) => v.id === id);
  return vm ? liveUsage(vm) : undefined;
}

export function getUsers() {
  return getStore().users;
}

export function getUtilization(vmId: string) {
  return getStore().utilization[vmId];
}

export function getTemplates(): VMTemplate[] {
  return getStore().templates;
}

export function getPolicy() {
  return getStore().policy;
}

/** A VM enriched with the data the admin inventory table needs. */
export interface InventoryItem extends VM {
  ownerName: string;
  templateName: string;
  idle: IdleResult;
}

/**
 * Full fleet inventory with idle evaluation computed server-side via the shared
 * {@link evaluateIdle} util (the store holds the utilization series, so we avoid
 * fetching it per-VM from the client).
 */
export function getInventory(now: Date = new Date()): InventoryItem[] {
  const s = getStore();
  const usersById = new Map(s.users.map((u) => [u.id, u]));
  const templatesById = new Map(s.templates.map((t) => [t.id, t]));
  return s.vms.map(liveUsage).map((vm) => ({
    ...vm,
    ownerName: usersById.get(vm.ownerId)?.name ?? 'Unknown',
    templateName: templatesById.get(vm.templateId)?.name ?? 'Unknown',
    idle: evaluateIdle(vm, s.utilization[vm.id], now, s.policy),
  }));
}

/** Aggregate the fleet's utilization series + current rollups and cost. */
export function getFleetUtilization(now: Date = new Date()): FleetUtilization {
  const s = getStore();
  const vms = s.vms.map(liveUsage);
  const running = vms.filter((v) => v.status === 'running');
  const stopped = vms.filter((v) => v.status === 'stopped');

  // Average the per-VM hourly series across running VMs, hour-by-hour.
  const sampleVm = vms[0];
  const length = s.utilization[sampleVm?.id]?.points.length ?? 24;
  const series: FleetUtilization['series'] = [];
  for (let i = 0; i < length; i++) {
    let cpuSum = 0;
    let memSum = 0;
    let count = 0;
    let timestamp = '';
    for (const vm of running) {
      const pt = s.utilization[vm.id]?.points[i];
      if (!pt) continue;
      cpuSum += pt.cpuPct;
      memSum += pt.memPct;
      timestamp = pt.timestamp;
      count++;
    }
    if (!timestamp) {
      // No running VMs — still emit a flat zeroed series with real timestamps.
      timestamp =
        s.utilization[sampleVm?.id]?.points[i]?.timestamp ??
        new Date(now.getTime() - (length - 1 - i) * 3600_000).toISOString();
    }
    series.push({
      timestamp,
      avgCpuPct: count ? round1(cpuSum / count) : 0,
      avgMemPct: count ? round1(memSum / count) : 0,
    });
  }

  const aggregateCpuPct = running.length
    ? round1(running.reduce((a, v) => a + v.usage.cpuPct, 0) / running.length)
    : 0;
  const aggregateMemPct = running.length
    ? round1(running.reduce((a, v) => a + v.usage.memPct, 0) / running.length)
    : 0;

  const hourlyCost = sumRunningHourlyCost(vms);

  return {
    series,
    totals: {
      totalVms: vms.length,
      runningVms: running.length,
      stoppedVms: stopped.length,
      otherVms: vms.length - running.length - stopped.length,
      totalUsers: s.users.length,
      aggregateCpuPct,
      aggregateMemPct,
    },
    cost: {
      hourlyCost,
      monthToDateCost: monthToDateCost(hourlyCost, now),
      projectedMonthlyCost: projectedMonthlyCost(hourlyCost),
    },
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function getIdentity() {
  const s = getStore();
  return {
    currentDeveloperId: s.currentDeveloperId,
    currentAdminId: s.currentAdminId,
  };
}

// --- Lifecycle mutations -------------------------------------------------

export interface LifecycleResult {
  ok: boolean;
  vm?: VM;
  error?: string;
}

const VALID_TRANSITIONS: Record<LifecycleAction, VMStatus[]> = {
  start: ['stopped', 'error'],
  stop: ['running'],
  restart: ['running'],
};

export function applyLifecycle(
  vmId: string,
  action: LifecycleAction,
): LifecycleResult {
  const s = getStore();
  const vm = s.vms.find((v) => v.id === vmId);
  if (!vm) return { ok: false, error: 'VM not found' };

  if (!VALID_TRANSITIONS[action].includes(vm.status)) {
    return {
      ok: false,
      error: `Cannot ${action} a VM that is "${vm.status}".`,
    };
  }

  // Set the transient state immediately.
  const transient: Record<LifecycleAction, VMStatus> = {
    start: 'starting',
    stop: 'stopping',
    restart: 'restarting',
  };
  vm.status = transient[action];
  vm.lastActiveAt = new Date().toISOString();

  // Clear any in-flight timer for this VM, then schedule the settle.
  const existing = s.timers.get(vmId);
  if (existing) clearTimeout(existing);

  const delay = TRANSITION_MS[action];
  const timer = setTimeout(() => {
    settle(vmId, action);
    s.timers.delete(vmId);
  }, delay);
  s.timers.set(vmId, timer);

  return { ok: true, vm: { ...vm } };
}

function settle(vmId: string, action: LifecycleAction): void {
  const s = getStore();
  const vm = s.vms.find((v) => v.id === vmId);
  if (!vm) return;

  if (action === 'stop') {
    vm.status = 'stopped';
    vm.usage = { cpuPct: 0, memPct: 0, diskPct: vm.usage.diskPct };
    vm.uptimeSeconds = 0;
  } else {
    // start or restart -> running
    vm.status = 'running';
    vm.uptimeSeconds = action === 'restart' ? 0 : vm.uptimeSeconds;
    const util = s.utilization[vmId];
    const last = util?.points[util.points.length - 1];
    vm.usage = {
      cpuPct: clampPct(last ? last.cpuPct : 15),
      memPct: clampPct(last ? last.memPct : 30),
      diskPct: vm.usage.diskPct,
    };
    vm.lastActiveAt = new Date().toISOString();
  }
}

// --- Template mutations --------------------------------------------------

export function createTemplate(input: TemplateInput): VMTemplate {
  const s = getStore();
  const nowIso = new Date().toISOString();
  const template: VMTemplate = {
    id: `t_${(s.seq++).toString(36)}`,
    name: input.name,
    description: input.description,
    baseImage: input.baseImage,
    vcpu: input.vcpu,
    memoryGb: input.memoryGb,
    diskGb: input.diskGb,
    preinstalledTools: input.preinstalledTools,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  s.templates = [...s.templates, template];
  return template;
}

export function updateTemplate(
  id: string,
  input: TemplateInput,
): VMTemplate | undefined {
  const s = getStore();
  const idx = s.templates.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  const updated: VMTemplate = {
    ...s.templates[idx],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  s.templates = s.templates.map((t) => (t.id === id ? updated : t));

  // Keep existing VMs' costs coherent if their template specs changed.
  s.vms = s.vms.map((vm) =>
    vm.templateId === id
      ? {
          ...vm,
          specs: { vcpu: input.vcpu, memoryGb: input.memoryGb, diskGb: input.diskGb },
          hourlyCost: computeHourlyCost({
            vcpu: input.vcpu,
            memoryGb: input.memoryGb,
            diskGb: input.diskGb,
          }),
        }
      : vm,
  );
  return updated;
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}
