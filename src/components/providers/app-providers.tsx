'use client';

import { ThemeProvider } from './theme-provider';
import { QueryProvider } from './query-provider';
import { MswProvider } from './msw-provider';

/** Global, persona-agnostic providers mounted once at the root. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <MswProvider>{children}</MswProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
