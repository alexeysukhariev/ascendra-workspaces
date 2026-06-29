'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiFetch } from '../client';
import { queryKeys } from '../keys';
import { isTransitional, type LifecycleAction, type VM, type VMUtilization } from '../types';

/** Poll running/transitioning data often enough to feel live. */
const LIVE_REFETCH_MS = 5000;

export function useVms(ownerId?: string): UseQueryResult<VM[], Error> {
  return useQuery({
    queryKey: queryKeys.vms(ownerId),
    queryFn: () =>
      apiFetch<VM[]>(
        ownerId ? `/vms?ownerId=${encodeURIComponent(ownerId)}` : '/vms',
      ),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useVm(id: string): UseQueryResult<VM, Error> {
  return useQuery({
    queryKey: queryKeys.vm(id),
    queryFn: () => apiFetch<VM>(`/vms/${id}`),
    // Poll faster while a transition is in flight so the UI settles itself.
    refetchInterval: (query) => {
      const vm = query.state.data;
      if (vm && isTransitional(vm.status)) return 1500;
      return LIVE_REFETCH_MS;
    },
  });
}

export function useVmUtilization(
  id: string,
): UseQueryResult<VMUtilization, Error> {
  return useQuery({
    queryKey: queryKeys.vmUtilization(id),
    queryFn: () => apiFetch<VMUtilization>(`/vms/${id}/utilization`),
  });
}

interface LifecycleVars {
  id: string;
  action: LifecycleAction;
}

/**
 * Lifecycle mutation (start/stop/restart).
 *
 * Optimistically flips the VM into its transient state so the controls react
 * instantly, then invalidates so the server-authoritative settle (running /
 * stopped) is picked up by the polling queries.
 */
export function useVmLifecycle() {
  const qc = useQueryClient();
  return useMutation<VM, Error, LifecycleVars, { previous?: VM }>({
    mutationFn: ({ id, action }) =>
      apiFetch<VM>(`/vms/${id}/actions`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }),
    onMutate: async ({ id, action }) => {
      await qc.cancelQueries({ queryKey: queryKeys.vm(id) });
      const previous = qc.getQueryData<VM>(queryKeys.vm(id));
      const transient =
        action === 'start'
          ? 'starting'
          : action === 'stop'
            ? 'stopping'
            : 'restarting';
      if (previous) {
        qc.setQueryData<VM>(queryKeys.vm(id), {
          ...previous,
          status: transient,
        });
      }
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.vm(id), context.previous);
      }
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.vm(id) });
      qc.invalidateQueries({ queryKey: ['vms'] });
      qc.invalidateQueries({ queryKey: queryKeys.fleetUtilization });
    },
  });
}
