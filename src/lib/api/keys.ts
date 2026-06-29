/** Centralised TanStack Query key factory — avoids stringly-typed keys. */
export const queryKeys = {
  identity: ['identity'] as const,
  users: ['users'] as const,
  policy: ['policy'] as const,

  vms: (ownerId?: string) =>
    ownerId ? (['vms', { ownerId }] as const) : (['vms'] as const),
  vm: (id: string) => ['vms', id] as const,
  vmUtilization: (id: string) => ['vms', id, 'utilization'] as const,

  fleetUtilization: ['fleet', 'utilization'] as const,
  fleetInventory: ['fleet', 'inventory'] as const,

  templates: ['templates'] as const,
} as const;
