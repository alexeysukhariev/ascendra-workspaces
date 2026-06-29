'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiFetch } from '../client';
import { queryKeys } from '../keys';
import type { TemplateInput, VMTemplate } from '../types';

export function useTemplates(): UseQueryResult<VMTemplate[], Error> {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: () => apiFetch<VMTemplate[]>('/templates'),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation<VMTemplate, Error, TemplateInput>({
    mutationFn: (input) =>
      apiFetch<VMTemplate>('/templates', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation<VMTemplate, Error, { id: string; input: TemplateInput }>({
    mutationFn: ({ id, input }) =>
      apiFetch<VMTemplate>(`/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.templates });
      // Template spec changes can affect VM cost/specs.
      qc.invalidateQueries({ queryKey: ['vms'] });
      qc.invalidateQueries({ queryKey: queryKeys.fleetUtilization });
    },
  });
}
