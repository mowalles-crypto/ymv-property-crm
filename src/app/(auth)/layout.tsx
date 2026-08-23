import type { ReactNode } from "react";
import { t } from "@/lib/i18n";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-xl font-semibold text-indigo-700">
            {t.app.name}
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
