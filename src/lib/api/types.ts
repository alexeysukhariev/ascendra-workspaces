/**
 * Domain models for Ascendra Workspaces.
 *
 * NOTE: The take-home brief says to use the interfaces "verbatim" as a starting
 * point, but the literal interface bodies were not included in the prompt. These
 * are a faithful, well-reasoned reconstruction. Decisions are documented in the
 * README (see "Domain model").
 */

/** Lifecycle status of a VM, including transient in-progress states. */
export type VMStatus =
  | 'running'
  | 'stopped'
  | 'starting'
  | 'stopping'
  | 'restarting'
  | 'error';

/** Statuses that represent an in-flight lifecycle transition. */
export const TRANSITIONAL_STATUSES: readonly VMStatus[] = [
  'starting',
  'stopping',
  'restarting',
] as const;

export function isTransitional(status: VMStatus): boolean {
  return TRANSITIONAL_STATUSES.includes(status);
}

/** Cloud region a VM can be provisioned in. */
export type Region =
  | 'us-east-1'
  | 'us-west-2'
  | 'eu-west-1'
  | 'eu-central-1'
  | 'ap-south-1';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'admin';
  /** Optional avatar; UI falls back to initials. */
  avatarUrl?: string;
}

/** Hardware/software profile a VM is provisioned from. */
export interface VMTemplate {
  id: string;
  name: string;
  /** e.g. "ubuntu-22.04", "node-20-bookworm". */
  baseImage: string;
  vcpu: number;
  memoryGb: number;
  diskGb: number;
  /** Tools baked into the image, e.g. ["docker", "node@20", "pnpm"]. */
  preinstalledTools: string[];
  createdAt: string;
  updatedAt: string;
}

/** A point-in-time resource usage snapshot (percentages 0–100). */
export interface ResourceUsage {
  cpuPct: number;
  memPct: number;
  diskPct: number;
}

/** Concrete hardware allocation for a VM (denormalised from its template). */
export interface VMSpecs {
  vcpu: number;
  memoryGb: number;
  diskGb: number;
}

export interface VM {
  id: string;
  name: string;
  ownerId: string;
  templateId: string;
  status: VMStatus;
  region: Region;
  specs: VMSpecs;
  /** Latest live usage snapshot. */
  usage: ResourceUsage;
  /** Cost per hour while running, in USD (derived from specs). */
  hourlyCost: number;
  createdAt: string;
  /** Last time the developer interacted with the VM (drives idle heuristic). */
  lastActiveAt: string;
  /** Seconds the VM has been continuously running (0 when stopped). */
  uptimeSeconds: number;
  /** Stub deep-link into a vscode-server / web IDE. */
  ideUrl: string;
}

/** A single hourly sample in a utilization time-series. */
export interface UtilizationPoint {
  /** ISO timestamp for the top of the hour. */
  timestamp: string;
  cpuPct: number;
  memPct: number;
  diskPct: number;
}

/** Per-VM utilization history (last 24h, hourly). */
export interface VMUtilization {
  vmId: string;
  points: UtilizationPoint[];
}

/** Fleet-wide governance policy. Drives the idle/underused heuristic. */
export interface Policy {
  /** A running VM below this sustained CPU% is considered idle. */
  idleCpuThresholdPct: number;
  /** Number of recent hourly samples that must all be below threshold. */
  idleSustainedSamples: number;
  /** A VM whose lastActiveAt is older than this is considered stale/idle. */
  staleActiveHours: number;
}

export const DEFAULT_POLICY: Policy = {
  idleCpuThresholdPct: 5,
  idleSustainedSamples: 6,
  staleActiveHours: 24,
};

/** Aggregate fleet utilization over time + current rollups. */
export interface FleetUtilization {
  /** Aggregate hourly series across all running VMs (last 24h). */
  series: { timestamp: string; avgCpuPct: number; avgMemPct: number }[];
  totals: {
    totalVms: number;
    runningVms: number;
    stoppedVms: number;
    /** VMs in a transient/error state. */
    otherVms: number;
    totalUsers: number;
    /** Mean CPU% across running VMs right now. */
    aggregateCpuPct: number;
    /** Mean memory% across running VMs right now. */
    aggregateMemPct: number;
  };
  cost: {
    /** Sum of hourlyCost across running VMs (USD/hour). */
    hourlyCost: number;
    /** Month-to-date spend approximation (USD). */
    monthToDateCost: number;
    /** Projected spend for the full month at current run-rate (USD). */
    projectedMonthlyCost: number;
  };
}

/** Standard error envelope returned by the mock API. */
export interface ApiError {
  error: string;
  message: string;
}

/** Payload for creating/editing a template. */
export interface TemplateInput {
  name: string;
  baseImage: string;
  vcpu: number;
  memoryGb: number;
  diskGb: number;
  preinstalledTools: string[];
}

export type LifecycleAction = 'start' | 'stop' | 'restart';
