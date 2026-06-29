'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '../client';
import { queryKeys } from '../keys';
import type { Policy, User } from '../types';

export function useUsers(): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => apiFetch<User[]>('/users'),
    staleTime: 60_000,
  });
}

export function usePolicy(): UseQueryResult<Policy, Error> {
  return useQuery({
    queryKey: queryKeys.policy,
    queryFn: () => apiFetch<Policy>('/policy'),
    staleTime: Infinity,
  });
}
