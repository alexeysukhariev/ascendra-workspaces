import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { server } from '@/test/server';
import { setErrorRate } from '@/lib/api/store';
import { useVms } from './vms';

/**
 * Integration test for a hook: drives the real client + MSW handlers + store,
 * verifying that useVms resolves owner-scoped data. Error injection is disabled
 * for determinism.
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  setErrorRate(0);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useVms', () => {
  it('loads the full fleet when no owner is given', async () => {
    const { result } = renderHook(() => useVms(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 3000,
    });
    expect(result.current.data?.length).toBeGreaterThanOrEqual(10);
  });

  it('scopes results to a single owner', async () => {
    const { result } = renderHook(() => useVms('u_arjun'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 3000,
    });
    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.data?.every((vm) => vm.ownerId === 'u_arjun')).toBe(
      true,
    );
  });
});
