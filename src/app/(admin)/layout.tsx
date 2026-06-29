import { PersonaProvider } from '@/components/providers/persona-provider';
import { AdminShell } from '@/components/shell/admin-shell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PersonaProvider persona="admin">
      <AdminShell>{children}</AdminShell>
    </PersonaProvider>
  );
}
