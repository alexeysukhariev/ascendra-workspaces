import { computeHourlyCost } from '@/lib/utils/cost';
import {
  DEFAULT_POLICY,
  type Policy,
  type Region,
  type User,
  type UtilizationPoint,
  type VM,
  type VMStatus,
  type VMTemplate,
  type VMUtilization,
} from './types';

/**
 * Seed data generator.
 *
 * Produces a realistic, *deterministic* dataset (seeded PRNG) so the demo looks
 * the same on each cold load while still feeling organic. The MSW store holds
 * the result in memory; lifecycle mutations then diverge from the seed for the
 * rest of the session.
 */

export interface SeedData {
  users: User[];
  templates: VMTemplate[];
  vms: VM[];
  utilization: Record<string, VMUtilization>;
  policy: Policy;
  /** The developer whose machines the Developer persona sees. */
  currentDeveloperId: string;
  /** The admin used by the Admin persona. */
  currentAdminId: string;
}

/** mulberry32 — tiny deterministic PRNG. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REGIONS: Region[] = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-south-1',
];

const HOURS = 1000 * 60 * 60;

export function createSeedData(now: Date = new Date()): SeedData {
  const rng = makeRng(0x5eed1234);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  // --- Users -------------------------------------------------------------
  const users: User[] = [
    { id: 'u_maya', name: 'Maya Chen', email: 'maya@ascendra.dev', role: 'admin' },
    { id: 'u_arjun', name: 'Arjun Patel', email: 'arjun@ascendra.dev', role: 'developer' },
    { id: 'u_lena', name: 'Lena Vogel', email: 'lena@ascendra.dev', role: 'developer' },
    { id: 'u_dmitri', name: 'Dmitri Sokolov', email: 'dmitri@ascendra.dev', role: 'developer' },
    { id: 'u_sofia', name: 'Sofia Rossi', email: 'sofia@ascendra.dev', role: 'developer' },
  ];
  const currentDeveloperId = 'u_arjun';
  const currentAdminId = 'u_maya';

  // --- Templates ---------------------------------------------------------
  const templates: VMTemplate[] = [
    mkTemplate('t_backend', 'Backend Service', 'ubuntu-22.04', 4, 16, 100, [
      'node@20', 'pnpm', 'docker', 'postgresql-client',
    ], now),
    mkTemplate('t_frontend', 'Frontend Web', 'ubuntu-22.04', 2, 8, 60, [
      'node@20', 'pnpm', 'chromium', 'playwright',
    ], now),
    mkTemplate('t_datasci', 'Data Science', 'ubuntu-22.04-cuda', 8, 32, 250, [
      'python@3.11', 'jupyter', 'pytorch', 'cuda-12',
    ], now),
    mkTemplate('t_go', 'Go Microservice', 'debian-bookworm', 2, 4, 40, [
      'go@1.22', 'docker', 'grpcurl',
    ], now),
  ];
  const templateById = new Map(templates.map((t) => [t.id, t]));

  // --- VMs ---------------------------------------------------------------
  // Profiles drive utilization shape so some VMs are clearly idle/underused.
  type Profile = 'busy' | 'normal' | 'idle' | 'bursty';
  interface VmSpec {
    id: string;
    name: string;
    ownerId: string;
    templateId: string;
    status: VMStatus;
    profile: Profile;
    /** Hours since last activity (drives lastActiveAt + stale heuristic). */
    lastActiveHoursAgo: number;
    createdDaysAgo: number;
  }

  const vmSpecs: VmSpec[] = [
    // current developer (Arjun) — variety so My Machines is interesting
    v('vm_01', 'arjun-api', 'u_arjun', 't_backend', 'running', 'busy', 0.2, 21),
    v('vm_02', 'arjun-web', 'u_arjun', 't_frontend', 'running', 'idle', 30, 14),
    v('vm_03', 'arjun-scratch', 'u_arjun', 't_go', 'stopped', 'idle', 72, 40),
    v('vm_04', 'arjun-ml-spike', 'u_arjun', 't_datasci', 'error', 'normal', 6, 9),
    // Lena
    v('vm_05', 'lena-api', 'u_lena', 't_backend', 'running', 'normal', 0.5, 30),
    v('vm_06', 'lena-web', 'u_lena', 't_frontend', 'running', 'bursty', 1, 18),
    v('vm_07', 'lena-notebook', 'u_lena', 't_datasci', 'running', 'idle', 2, 25),
    // Dmitri
    v('vm_08', 'dmitri-svc', 'u_dmitri', 't_go', 'running', 'busy', 0.1, 60),
    v('vm_09', 'dmitri-web', 'u_dmitri', 't_frontend', 'stopped', 'normal', 50, 33),
    v('vm_10', 'dmitri-api', 'u_dmitri', 't_backend', 'running', 'idle', 40, 12),
    // Sofia
    v('vm_11', 'sofia-train', 'u_sofia', 't_datasci', 'running', 'busy', 0.3, 7),
    v('vm_12', 'sofia-api', 'u_sofia', 't_backend', 'stopped', 'normal', 120, 70),
    v('vm_13', 'sofia-web', 'u_sofia', 't_frontend', 'running', 'normal', 0.8, 16),
    v('vm_14', 'sofia-go', 'u_sofia', 't_go', 'stopped', 'idle', 200, 95),
  ];

  const utilization: Record<string, VMUtilization> = {};
  const vms: VM[] = vmSpecs.map((s) => {
    const template = templateById.get(s.templateId)!;
    const specs = {
      vcpu: template.vcpu,
      memoryGb: template.memoryGb,
      diskGb: template.diskGb,
    };
    const points = buildSeries(s.profile, now, rng);
    utilization[s.id] = { vmId: s.id, points };

    const running = s.status === 'running';
    const last = points[points.length - 1];
    const usage = running
      ? { cpuPct: last.cpuPct, memPct: last.memPct, diskPct: last.diskPct }
      : { cpuPct: 0, memPct: 0, diskPct: last.diskPct };

    return {
      id: s.id,
      name: s.name,
      ownerId: s.ownerId,
      templateId: s.templateId,
      status: s.status,
      region: pick(REGIONS),
      specs,
      usage,
      hourlyCost: computeHourlyCost(specs),
      createdAt: new Date(now.getTime() - s.createdDaysAgo * 24 * HOURS).toISOString(),
      lastActiveAt: new Date(now.getTime() - s.lastActiveHoursAgo * HOURS).toISOString(),
      uptimeSeconds: running ? Math.floor((s.lastActiveHoursAgo + 4) * 3600) : 0,
      ideUrl: `https://ide.ascendra.dev/${s.id}/?folder=/home/dev/workspace`,
    } satisfies VM;
  });

  return {
    users,
    templates,
    vms,
    utilization,
    policy: DEFAULT_POLICY,
    currentDeveloperId,
    currentAdminId,
  };

  // helper to keep VM spec rows compact
  function v(
    id: string,
    name: string,
    ownerId: string,
    templateId: string,
    status: VMStatus,
    profile: Profile,
    lastActiveHoursAgo: number,
    createdDaysAgo: number,
  ): VmSpec {
    return { id, name, ownerId, templateId, status, profile, lastActiveHoursAgo, createdDaysAgo };
  }

  /** Build a 24-point hourly series shaped by the VM's profile. */
  function buildSeries(
    profile: Profile,
    end: Date,
    rand: () => number,
  ): UtilizationPoint[] {
    const baseCpu = { busy: 65, normal: 35, idle: 2, bursty: 20 }[profile];
    const cpuSwing = { busy: 20, normal: 25, idle: 2, bursty: 55 }[profile];
    const baseMem = { busy: 70, normal: 50, idle: 18, bursty: 45 }[profile];
    let disk = { busy: 62, normal: 44, idle: 30, bursty: 38 }[profile];

    const points: UtilizationPoint[] = [];
    const endHour = new Date(end);
    endHour.setMinutes(0, 0, 0);
    for (let i = 23; i >= 0; i--) {
      const ts = new Date(endHour.getTime() - i * HOURS);
      const phase = ((23 - i) / 24) * Math.PI * 2;
      const wave = Math.sin(phase) * (cpuSwing / 2);
      const noise = (rand() - 0.5) * (profile === 'idle' ? 2 : 12);
      const cpuPct = clampPct(baseCpu + wave + noise);
      const memPct = clampPct(baseMem + wave * 0.4 + (rand() - 0.5) * 6);
      disk = clampPct(disk + rand() * 0.4); // disk creeps up slowly
      points.push({ timestamp: ts.toISOString(), cpuPct, memPct, diskPct: disk });
    }
    return points;
  }
}

function mkTemplate(
  id: string,
  name: string,
  baseImage: string,
  vcpu: number,
  memoryGb: number,
  diskGb: number,
  preinstalledTools: string[],
  now: Date,
): VMTemplate {
  const created = new Date(now.getTime() - 45 * 24 * HOURS).toISOString();
  return {
    id,
    name,
    baseImage,
    vcpu,
    memoryGb,
    diskGb,
    preinstalledTools,
    createdAt: created,
    updatedAt: created,
  };
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}
