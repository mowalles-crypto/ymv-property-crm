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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-slate-500">{userEmail}</span>
            )}
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
