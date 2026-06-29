import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VM } from '@/lib/api/types';

/**
 * Stub deep-link into a web IDE (vscode-server). Only meaningful while the VM
 * is running, so it's disabled otherwise.
 */
export function OpenInIdeButton({
  vm,
  size = 'sm',
}: {
  vm: VM;
  size?: 'sm' | 'default';
}) {
  const disabled = vm.status !== 'running';
  return (
    <Button
      asChild={!disabled}
      size={size}
      variant="secondary"
      disabled={disabled}
      title={
        disabled ? 'Start the VM to open it in the IDE' : 'Open in web IDE'
      }
    >
      {disabled ? (
        <span>
          <ExternalLink />
          Open in IDE
        </span>
      ) : (
        <a href={vm.ideUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink />
          Open in IDE
        </a>
      )}
    </Button>
  );
}
