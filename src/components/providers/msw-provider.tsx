'use client';

import { useEffect, useState } from 'react';

/**
 * Boots the MSW worker on the client before any data fetching happens.
 *
 * MSW *is* the backend for this demo (there is no server), so we must not render
 * data-fetching children until the worker is intercepting. We gate on a ready
 * flag and show a minimal splash meanwhile.
 */
export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function start() {
      const { worker } = await import('@/mocks/browser');
      await worker.start({
        onUnhandledRequest: 'bypass',
        quiet: true,
        serviceWorker: { url: '/mockServiceWorker.js' },
      });
      if (active) setReady(true);
    }
    start();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm">Starting StrategiClear mock environment…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
