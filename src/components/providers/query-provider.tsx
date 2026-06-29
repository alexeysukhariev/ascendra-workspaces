'use client';

import { useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from '@tanstack/react-query';

const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Reads occasionally fail (~10%) by design; retry a couple of times so a
      // single hiccup self-heals but a persistent failure still reaches the
      // error state.
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      staleTime: 2000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient(config));
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
