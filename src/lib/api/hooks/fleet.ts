'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '../client';
import { queryKeys } from '../keys';
import type { FleetUtilization } from '../types';

export function useFleetUtilization(): UseQueryResult<FleetUtilization, Error> {
  return useQuery({
    queryKey: queryKeys.fleetUtilization,
    queryFn: () => apiFetch<FleetUtilization>('/fleet/utilization'),
    refetchInterval: 8000,
  });
}
