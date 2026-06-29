import { PersonaProvider } from '@/components/providers/persona-provider';
import { AppShell } from '@/components/shell/app-shell';

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PersonaProvider persona="developer">
      <AppShell>{children}</AppShell>
    </PersonaProvider>
  );
}
