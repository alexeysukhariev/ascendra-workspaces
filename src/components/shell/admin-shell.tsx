'use client';

import Link from 'next/link';
import { LayoutGrid, Server, Layers } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { NavLink, type NavItem } from './nav-link';
import { PersonaSwitcher } from './persona-switcher';
import { ThemeToggle } from './theme-toggle';
import { UserChip } from './user-chip';

const ADMIN_NAV: NavItem[] = [
  { href: '/fleet', label: 'Fleet Overview', icon: LayoutGrid },
  { href: '/inventory', label: 'VM Inventory', icon: Server },
  { href: '/templates', label: 'Templates', icon: Layers },
];

/**
 * Admin experience: a dense operations console using the macOS Tahoe inset
 * pattern — a floating sidebar that "peers" with the content on the same
 * elevation, content area with no background of its own.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-stretch gap-3 p-3 max-[880px]:flex-col max-[880px]:gap-2 max-[880px]:p-2">
      <aside
        className={
          'sticky top-3 flex h-[calc(100vh-1.5rem)] w-60 shrink-0 flex-col rounded-[22px] border bg-card p-3 ' +
          'max-[880px]:static max-[880px]:h-auto max-[880px]:w-full max-[880px]:rounded-2xl'
        }
      >
        <div className="px-2 py-2">
          <Link
            href="/fleet"
            className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="StrategiClear — Fleet Overview"
          >
            <Logo className="h-6" />
          </Link>
          <p className="mt-1 px-0.5 text-[11px] font-medium tracking-[0.04em] text-muted-foreground">
            CONTROL PLANE
          </p>
        </div>

        <nav
          aria-label="Admin sections"
          className="mt-2 flex flex-col gap-0.5 max-[880px]:flex-row max-[880px]:overflow-x-auto"
        >
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} variant="sidebar" />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t pt-3 max-[880px]:mt-3">
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
