'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PERSONA_HOME,
  PERSONA_STORAGE_KEY,
  type Persona,
} from '@/components/providers/persona-provider';

/**
 * Root entry. There is no auth, so we route to the last-used persona's home
 * (defaulting to Developer). Kept as a client redirect so we can honour the
 * persisted preference.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    let persona: Persona = 'developer';
    try {
      const stored = localStorage.getItem(PERSONA_STORAGE_KEY);
      if (stored === 'admin' || stored === 'developer') persona = stored;
    } catch {
      // ignore storage errors
    }
    router.replace(PERSONA_HOME[persona]);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      <p className="text-sm">Loading StrategiClear…</p>
    </div>
  );
}
