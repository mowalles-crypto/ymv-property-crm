"use client";

import Link from "next/link";
import Image from "next/image";
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
  { href: "/client/profile", label: t.nav.myProfile },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const links = role === "admin" ? adminLinks : clientLinks;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/bizrael-logo.png"
            alt={t.app.fullName}
            width={218}
            height={80}
            className="h-auto w-28"
            priority
          />
        </Link>
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
                  ? "bg-gold/10 text-gold-dark border-l-2 border-gold -ml-px pl-[10px]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-[11px] tracking-wide text-slate-400">{t.app.tagline}</p>
      </div>
    </aside>
  );
}
