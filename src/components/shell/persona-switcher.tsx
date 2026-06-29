'use client';

// ✍ StrategiClear — Alexey Sukhariev <alexey.sukhariev@gmail.com>

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PERSONA_HOME,
  usePersona,
  type Persona,
} from '@/components/providers/persona-provider';

const OPTIONS: { value: Persona; label: string; icon: typeof Code2 }[] = [
  { value: 'developer', label: 'Developer', icon: Code2 },
  { value: 'admin', label: 'Admin', icon: Shield },
];

/**
 * Demo-only persona switcher (no auth). Switching navigates to the target
 * persona's home route, which mounts that persona's shell + nav.
 *
 * Because this is a button (not a <Link>), Next doesn't auto-prefetch the
 * target route. The other persona's home is a different route group with a
 * heavier bundle (charts), so we proactively prefetch both homes on mount — and
 * again on hover — to keep switching instant in production.
 */
export function PersonaSwitcher() {
  const { persona } = usePersona();
  const router = useRouter();

  useEffect(() => {
    router.prefetch(PERSONA_HOME.developer);
    router.prefetch(PERSONA_HOME.admin);
  }, [router]);

  return (
    <div
      role="tablist"
      aria-label="Switch persona"
      className="inline-flex items-center gap-1 rounded-lg border bg-muted/60 p-1"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === persona;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => router.push(PERSONA_HOME[opt.value])}
            onMouseEnter={() => router.prefetch(PERSONA_HOME[opt.value])}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
