import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { StatCard } from "@/components/ui/StatCard";
import { PropertyStatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";
import Link from "next/link";

export default async function ClientDashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const [{ data: properties }, { data: accountingRows }] = await Promise.all([
    supabase
      .from("properties")
      .select("*")
      .eq("customer_id", profile.customer_id!)
      .order("created_at", { ascending: false }),
    supabase
      .from("property_accounting")
      .select("rent_received, total_expenses, profit, properties!inner(customer_id)")
      .eq("year", currentYear)
      .eq("properties.customer_id", profile.customer_id!),
  ]);

  const rentCollected = (accountingRows ?? []).reduce(
    (sum, r) => sum + Number(r.rent_received ?? 0),
    0
  );
  const expenses = (accountingRows ?? []).reduce(
    (sum, r) => sum + Number(r.total_expenses ?? 0),
    0
  );
  const profit = (accountingRows ?? []).reduce((sum, r) => sum + Number(r.profit ?? 0), 0);

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-slate-900">{t.dashboard.client.title}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label={t.dashboard.client.myProperties} value={properties?.length ?? 0} />
        <StatCard label={t.dashboard.client.rentCollected} value={formatCurrency(rentCollected)} />
        <StatCard label={t.dashboard.client.expenses} value={formatCurrency(expenses)} />
        <StatCard label={t.dashboard.client.profit} value={formatCurrency(profit)} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">{t.nav.myProperties}</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">{t.property.address}</th>
                <th className="py-2 pr-4">{t.property.status}</th>
                <th className="py-2 pr-4">{t.property.monthlyRent}</th>
              </tr>
            </thead>
            <tbody>
              {(properties ?? []).map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/client/properties/${p.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {p.property_address}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4">
                    <PropertyStatusBadge status={p.property_status} />
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {p.property_status === "rented" ? formatCurrency(p.monthly_rent) : "—"}
                  </td>
                </tr>
              ))}
              {(!properties || properties.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">
                    {t.common.noResults}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
