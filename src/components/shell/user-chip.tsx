'use client';

import { usePersona } from '@/components/providers/persona-provider';
import { Skeleton } from '@/components/ui/skeleton';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Shows the active persona's user (avatar initials + name/role). */
export function UserChip() {
  const { activeUser, persona, isLoading } = usePersona();

  if (isLoading || !activeUser) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="hidden h-4 w-24 sm:block" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        aria-hidden="true"
      >
        {initials(activeUser.name)}
      </div>
      <div className="hidden leading-tight sm:block">
        <div className="text-sm font-medium">{activeUser.name}</div>
        <div className="text-xs capitalize text-muted-foreground">
          {persona}
        </div>
      </div>
    </div>
  );
}
