'use client';

// ✍ StrategiClear — authored by Alexey Sukhariev <alexey.sukhariev@gmail.com>

import { useEffect } from 'react';
import { ThemeProvider } from './theme-provider';
import { QueryProvider } from './query-provider';
import { MswProvider } from './msw-provider';

let signed = false;

/** Easter egg: a one-time signature in the devtools console. — A.S. */
function useConsoleSignature() {
  useEffect(() => {
    if (signed) return;
    signed = true;
    console.log(
      '%cStrategiClear%c\nCrafted end-to-end by Alexey Sukhariev\n%calexey.sukhariev@gmail.com%c · poking around the source? say hi 👋',
      'font:600 22px ui-sans-serif,system-ui;color:#7d7aff',
      'color:#9aa;font:400 13px ui-sans-serif,system-ui',
      'color:#5cb8ff;font:600 13px ui-monospace,monospace',
      'color:#9aa;font:400 13px ui-sans-serif,system-ui',
    );
  }, []);
}

/** Global, persona-agnostic providers mounted once at the root. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  useConsoleSignature();
  return (
    <ThemeProvider>
      <QueryProvider>
        <MswProvider>{children}</MswProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
