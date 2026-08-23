import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { CustomerStatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";

export default async function AdminRequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: requirements } = await supabase
    .from("property_requirements")
    .select("*, customers(id, customer_name, customer_status)")
    .order("created_at", { ascending: false });

  const filtered = q
    ? (requirements ?? []).filter((r) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r.customers as any)?.customer_name
          ?.toLowerCase()
          .includes(q.toLowerCase())
      )
    : requirements ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t.nav.requirements}</h2>

      <Card>
        <form className="mb-4 flex gap-3" method="get">
          <input
            type="text"
            name="q"
            placeholder={t.common.search}
            defaultValue={q}
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">{t.customer.name}</th>
                <th className="py-2 pr-4">{t.customer.status}</th>
                <th className="py-2 pr-4">{t.requirements.purchasePurpose}</th>
                <th className="py-2 pr-4">{t.requirements.propertyTypes}</th>
                <th className="py-2 pr-4">{t.requirements.preferredLocations}</th>
                <th className="py-2 pr-4">Budget</th>
                <th className="py-2 pr-4">{t.requirements.financingRequired}</th>
                <th className="py-2 pr-4">{t.requirements.purchaseTimeline}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const customer = r.customers as any;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/admin/clients/${customer?.id}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {customer?.customer_name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">
                      <CustomerStatusBadge status={customer?.customer_status} />
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {t.requirements.purchasePurposeOptions[r.purchase_purpose]}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {r.property_types.map((pt) => t.requirements.propertyTypeOptions[pt]).join(", ") || "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {r.preferred_locations.join(", ") || "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {formatCurrency(r.budget_min)} – {formatCurrency(r.budget_max)}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {t.requirements.financingOptions[r.financing_required]}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {t.requirements.timelineOptions[r.purchase_timeline]}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    {t.common.noResults}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
