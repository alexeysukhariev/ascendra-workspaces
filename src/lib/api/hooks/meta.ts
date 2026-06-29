'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '../client';
import { queryKeys } from '../keys';
import type { Policy, User } from '../types';

export interface Identity {
  currentDeveloperId: string;
  currentAdminId: string;
}

export function useIdentity(): UseQueryResult<Identity, Error> {
  return useQuery({
    queryKey: queryKeys.identity,
    queryFn: () => apiFetch<Identity>('/identity'),
    staleTime: Infinity,
  });
}

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
