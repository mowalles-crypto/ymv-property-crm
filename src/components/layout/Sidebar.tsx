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
  { href: "/admin/offers", label: t.nav.investmentOffers },
  { href: "/admin/sale-requests", label: t.nav.saleRequests },
  { href: "/admin/requirements", label: t.nav.requirements },
  { href: "/admin/users", label: t.nav.users },
];

const clientLinks = [
  { href: "/client/home", label: t.nav.home },
  { href: "/client/properties", label: t.nav.myInvestments },
  { href: "/client/find-investment", label: t.nav.findInvestment },
  { href: "/client/sell", label: t.nav.sellProperty },
  { href: "/client/reports", label: t.nav.reports },
  { href: "/client/profile", label: t.nav.documentsAndProfile },
];

// BIZRAEL Israel Real Estate Analytics - a separate, existing Streamlit
// application on the same Supabase project. Linked here, never embedded
// or duplicated. Admin-only: the `role` prop this component receives is
// resolved server-side, before render, in app/admin/layout.tsx via
// requireAdmin() -> lib/auth.ts's getCurrentProfile() (a fresh
// `profiles.role` read for the authenticated user, via
// supabase.auth.getUser() first) - never a URL param or client-side-only
// value. A client can never reach this component with role="admin".
const BIZRAEL_ANALYTICS_URL =
  "https://bizrael-israel-realestate-analytics-y9uapdhr3k6ndyfvuovnvm.streamlit.app/";

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
      {role === "admin" && (
        <div className="border-t border-slate-100 px-3 py-3">
          <a
            href={BIZRAEL_ANALYTICS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">📊</span>
              {t.nav.bizraelAnalytics}
              <span aria-hidden="true" className="ml-auto text-slate-300">
                ↗
              </span>
            </span>
            <span className="mt-0.5 block pl-6 text-[11px] font-normal text-slate-400">
              {t.nav.bizraelAnalyticsDescription}
            </span>
          </a>
        </div>
      )}
      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-[11px] tracking-wide text-slate-400">{t.app.tagline}</p>
      </div>
    </aside>
  );
}
