'use client';

import Link from 'next/link';
import { LayoutGrid, Server, Boxes, Layers } from 'lucide-react';
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
 * Admin experience: a dense, full-width operations console with a persistent
 * left sidebar. Deliberately different from the developer's personal view.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <Link href="/fleet" className="flex min-w-0 items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-foreground text-background">
              <Boxes className="size-4" />
            </span>
            <span className="truncate text-sm font-semibold">
              Ascendra
              <span className="hidden font-normal text-muted-foreground sm:inline">
                {' '}
                · Control Plane
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <PersonaSwitcher />
            <ThemeToggle />
            <UserChip />
          </div>
        </div>

        {/* Compact horizontal nav for small screens (sidebar is hidden there). */}
        <nav
          aria-label="Admin navigation"
          className="flex items-center gap-1 overflow-x-auto border-t px-4 py-1.5 md:hidden"
        >
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} variant="top" />
          ))}
        </nav>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r bg-muted/30 p-3 md:block">
          <nav aria-label="Admin sections" className="flex flex-col gap-1">
            <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Operations
            </p>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} variant="sidebar" />
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
