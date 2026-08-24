import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SignOutButton } from "./SignOutButton";
import type { UserRole } from "@/lib/types/domain";

export function AppShell({
  role,
  userEmail,
  title,
  children,
}: {
  role: UserRole;
  userEmail?: string | null;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 print:block print:bg-white">
      <div className="print:hidden">
        <Sidebar role={role} />
      </div>
      <div className="flex min-h-screen flex-1 flex-col print:block print:min-h-0">
        <header className="relative flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 print:hidden">
          <h1 className="text-sm font-medium tracking-wide text-slate-500">{title}</h1>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-slate-500">{userEmail}</span>
            )}
            <SignOutButton />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-gold-light via-gold to-gold-dark opacity-40" />
        </header>
        <main className="flex-1 p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
