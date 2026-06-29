'use client';

import Link from 'next/link';
import { Laptop, LayoutGrid, Server, Layers } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import {
  PERSONA_HOME,
  usePersona,
  type Persona,
} from '@/components/providers/persona-provider';
import { NavLink, type NavItem } from './nav-link';
import { PersonaSwitcher } from './persona-switcher';
import { ThemeToggle } from './theme-toggle';
import { UserChip } from './user-chip';

/** Per-persona navigation + sidebar caption. The shell itself is identical. */
const NAV: Record<Persona, { caption: string; items: NavItem[] }> = {
  developer: {
    caption: 'Workspace',
    items: [{ href: '/my-machines', label: 'My Machines', icon: Laptop }],
  },
  admin: {
    caption: 'Control Plane',
    items: [
      { href: '/fleet', label: 'Fleet Overview', icon: LayoutGrid },
      { href: '/inventory', label: 'VM Inventory', icon: Server },
      { href: '/templates', label: 'Templates', icon: Layers },
    ],
  },
};

/**
 * Unified application shell (macOS Tahoe inset pattern): a floating sidebar that
 * "peers" with the content on the same elevation, and a content area with no
 * background of its own. Both personas share this exact layout — only the
 * navigation items and the caption under the logo change, so switching personas
 * never reshuffles the chrome.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { persona } = usePersona();
  const { caption, items } = NAV[persona];
  const home = PERSONA_HOME[persona];

  return (
    <div
      data-persona={persona}
      className="flex min-h-screen items-stretch gap-3 p-3 max-[880px]:flex-col max-[880px]:gap-2 max-[880px]:p-2"
    >
      <aside
        className={
          'sticky top-3 flex h-[calc(100vh-1.5rem)] w-60 shrink-0 flex-col overflow-hidden rounded-[22px] border bg-card p-3 ' +
          'max-[880px]:static max-[880px]:h-auto max-[880px]:w-full max-[880px]:rounded-2xl'
        }
      >
        {/* Faint persona-tinted wash at the top of the sidebar. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.07] to-transparent"
        />
        <div className="relative px-2 py-2">
          <Link
            href={home}
            className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`StrategiClear — ${items[0].label}`}
          >
            <Logo className="h-6" />
          </Link>
          <p className="mt-1.5 inline-flex items-center gap-1.5 px-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            {caption}
          </p>
        </div>

        <nav
          aria-label={`${caption} navigation`}
          className="relative mt-2 flex flex-col gap-0.5 max-[880px]:flex-row max-[880px]:overflow-x-auto"
        >
          {items.map((item) => (
            <NavLink key={item.href} item={item} variant="sidebar" />
          ))}
        </nav>

        <div className="relative mt-auto flex flex-col gap-3 border-t pt-3 max-[880px]:mt-3">
          <PersonaSwitcher />
          <div className="flex items-center justify-between">
            <UserChip />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-8 max-[880px]:px-1 max-[880px]:py-2">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
