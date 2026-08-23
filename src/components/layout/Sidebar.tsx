"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";
import type { UserRole } from "@/lib/types/domain";

const adminLinks = [
  { href: "/admin/dashboard", label: t.nav.dashboard },
  { href: "/admin/clients", label: t.nav.clients },
  { href: "/admin/properties", label: t.nav.properties },
  { href: "/admin/accounting", label: t.nav.accounting },
  { href: "/admin/requirements", label: t.nav.requirements },
  { href: "/admin/users", label: t.nav.users },
];

const clientLinks = [
  { href: "/client/dashboard", label: t.nav.dashboard },
  { href: "/client/properties", label: t.nav.myProperties },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const links = role === "admin" ? adminLinks : clientLinks;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <span className="text-lg font-semibold text-indigo-700">
          {t.app.name}
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
