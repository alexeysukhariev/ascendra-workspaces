import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Empty state with optional action. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: typeof Inbox;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center gap-3 border-dashed p-10 text-center',
        className,
      )}
    >
      <div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </Card>
  );
}

/** Error state with a retry affordance. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  isRetrying,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}) {
  return (
    <Card
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 border-destructive/30 bg-destructive/5 p-10 text-center',
        className,
      )}
    >
      <div className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {message && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
          <RefreshCw className={cn('size-4', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying…' : 'Try again'}
        </Button>
      )}
    </Card>
  );
}
