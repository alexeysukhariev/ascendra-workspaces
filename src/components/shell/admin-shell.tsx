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
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Link href="/fleet" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-foreground text-background">
              <Boxes className="size-4" />
            </span>
            <span className="text-sm font-semibold">
              Ascendra{' '}
              <span className="font-normal text-muted-foreground">
                · Control Plane
              </span>
            </span>
          </Link>

          {/* Compact top nav for small screens (sidebar is hidden there). */}
          <nav
            aria-label="Admin navigation"
            className="ml-2 flex items-center gap-1 overflow-x-auto md:hidden"
          >
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} variant="top" />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <PersonaSwitcher />
            <ThemeToggle />
            <UserChip />
          </div>
        </div>
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
