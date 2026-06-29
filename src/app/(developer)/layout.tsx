import { PersonaProvider } from '@/components/providers/persona-provider';
import { DeveloperShell } from '@/components/shell/developer-shell';

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PersonaProvider persona="developer">
      <DeveloperShell>{children}</DeveloperShell>
    </PersonaProvider>
  );
}
