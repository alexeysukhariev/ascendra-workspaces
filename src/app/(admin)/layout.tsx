import { PersonaProvider } from '@/components/providers/persona-provider';
import { AppShell } from '@/components/shell/app-shell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PersonaProvider persona="admin">
      <AppShell>{children}</AppShell>
    </PersonaProvider>
  );
}
