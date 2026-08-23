import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PropertyStatusBadge } from "@/components/ui/Badge";
import { t } from "@/lib/i18n";

export default async function AdminAccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("*, customers(customer_name)")
    .order("property_address");

  if (q) query = query.ilike("property_address", `%${q}%`);

  const { data: properties } = await query;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t.nav.accounting}</h2>
      <p className="text-sm text-slate-500">
        Select a property to view or edit its monthly accounting.
      </p>

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
                <th className="py-2 pr-4">{t.property.address}</th>
                <th className="py-2 pr-4">{t.property.client}</th>
                <th className="py-2 pr-4">{t.property.status}</th>
              </tr>
            </thead>
            <tbody>
              {(properties ?? []).map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/admin/properties/${p.id}?tab=accounting`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {p.property_address}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(p.customers as any)?.customer_name ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <PropertyStatusBadge status={p.property_status} />
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
      </Card>
    </div>
  );
}
