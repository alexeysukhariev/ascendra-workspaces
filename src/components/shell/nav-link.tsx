'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** A nav link that highlights when the current path matches (prefix-aware). */
export function NavLink({
  item,
  variant = 'sidebar',
}: {
  item: NavItem;
  variant?: 'sidebar' | 'top';
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex items-center gap-2.5 rounded-lg text-[13.5px] font-medium tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        variant === 'sidebar' ? 'px-2.5 py-[7px]' : 'px-3 py-1.5',
        active
          ? 'bg-foreground/[0.08] text-foreground'
          : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground',
      )}
    >
      <Icon
        className={cn('size-[17px]', active && 'text-primary')}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      {item.label}
    </Link>
  );
}
