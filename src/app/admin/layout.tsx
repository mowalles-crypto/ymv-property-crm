import type { ReactNode } from "react";
import { requireAdmin, getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { t } from "@/lib/i18n";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const user = await getCurrentUser();

  return (
    <AppShell role="admin" userEmail={user?.email} title={t.app.name}>
      {children}
    </AppShell>
  );
}
