'use client';

import { Play, RotateCw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVmLifecycle } from '@/lib/api/hooks';
import { isTransitional, type LifecycleAction, type VM } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface ControlSpec {
  action: LifecycleAction;
  label: string;
  icon: typeof Play;
  enabledWhen: (status: VM['status']) => boolean;
  variant: 'default' | 'outline' | 'secondary';
}

const CONTROLS: ControlSpec[] = [
  {
    action: 'start',
    label: 'Start',
    icon: Play,
    enabledWhen: (s) => s === 'stopped' || s === 'error',
    variant: 'default',
  },
  {
    action: 'stop',
    label: 'Stop',
    icon: Square,
    enabledWhen: (s) => s === 'running',
    variant: 'outline',
  },
  {
    action: 'restart',
    label: 'Restart',
    icon: RotateCw,
    enabledWhen: (s) => s === 'running',
    variant: 'outline',
  },
];

/**
 * Lifecycle controls with correct disabled/loading states. While a transition
 * is in flight (optimistic or server-confirmed) every control is disabled, so
 * the user can't queue conflicting actions.
 */
export function LifecycleControls({
  vm,
  size = 'sm',
  className,
}: {
  vm: VM;
  size?: 'sm' | 'default';
  className?: string;
}) {
  const lifecycle = useVmLifecycle();
  const transitioning = isTransitional(vm.status);
  const busy = transitioning || lifecycle.isPending;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {CONTROLS.map((ctrl) => {
          const Icon = ctrl.icon;
          const isThisAction =
            lifecycle.isPending &&
            lifecycle.variables?.id === vm.id &&
            lifecycle.variables?.action === ctrl.action;
          const enabled = ctrl.enabledWhen(vm.status) && !busy;
          return (
            <Button
              key={ctrl.action}
              size={size}
              variant={ctrl.variant}
              disabled={!enabled}
              aria-label={`${ctrl.label} ${vm.name}`}
              onClick={() =>
                lifecycle.mutate({ id: vm.id, action: ctrl.action })
              }
            >
              <Icon
                className={cn(
                  ctrl.action === 'restart' && isThisAction && 'animate-spin',
                )}
              />
              {ctrl.label}
            </Button>
          );
        })}
      </div>
      {lifecycle.isError && lifecycle.variables?.id === vm.id && (
        <p className="text-xs text-destructive" role="alert">
          {lifecycle.error.message}
        </p>
      )}
    </div>
  );
}
