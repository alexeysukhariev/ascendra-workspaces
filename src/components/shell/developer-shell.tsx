'use client';

import Link from 'next/link';
import { Boxes, Laptop } from 'lucide-react';
import { NavLink, type NavItem } from './nav-link';
import { PersonaSwitcher } from './persona-switcher';
import { ThemeToggle } from './theme-toggle';
import { UserChip } from './user-chip';

const DEV_NAV: NavItem[] = [
  { href: '/my-machines', label: 'My Machines', icon: Laptop },
];

/**
 * Developer experience: a focused, personal, top-nav layout. Airy and
 * centered — "this is *your* workspace", not an ops console.
 */
export function DeveloperShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link href="/my-machines" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold">Ascendra</span>
              <span className="text-xs text-muted-foreground">Workspaces</span>
            </span>
          </Link>

          <nav
            aria-label="Developer navigation"
            className="ml-2 hidden items-center gap-1 sm:flex"
          >
            {DEV_NAV.map((item) => (
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
