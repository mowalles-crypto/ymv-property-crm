import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireProfile, getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { t } from "@/lib/i18n";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile();
  if (profile.role !== "client") redirect("/admin/dashboard");
  if (!profile.customer_id) redirect("/register/complete-requirements");

  const user = await getCurrentUser();

  return (
    <AppShell role="client" userEmail={user?.email} title={t.app.fullName}>
      {children}
    </AppShell>
  );
}
