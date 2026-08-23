import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PropertyStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { PropertyStatus } from "@/lib/types/domain";

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; customer_id?: string }>;
}) {
  const { q, status, customer_id } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("*, customers(id, customer_name)")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("property_address", `%${q}%`);
  if (status) query = query.eq("property_status", status as PropertyStatus);
  if (customer_id) query = query.eq("customer_id", customer_id);

  const [{ data: properties }, { data: customers }] = await Promise.all([
    query,
    supabase.from("customers").select("id, customer_name").order("customer_name"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{t.nav.properties}</h2>
        <Link href="/admin/properties/new">
          <Button>{t.property.newProperty}</Button>
        </Link>
      </div>

      <Card>
        <form className="mb-4 flex flex-wrap gap-3" method="get">
          <input
            type="text"
            name="q"
            placeholder={t.common.search}
            defaultValue={q}
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <select
            name="customer_id"
            defaultValue={customer_id ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">{t.common.all} clients</option>
            {(customers ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer_name}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">{t.common.all}</option>
            <option value="vacant">{t.property.statusVacant}</option>
            <option value="rented">{t.property.statusRented}</option>
            <option value="under_construction">{t.property.statusUnderConstruction}</option>
            <option value="sold">{t.property.statusSold}</option>
          </select>
          <Button type="submit" variant="secondary">
            {t.common.filter}
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">{t.property.address}</th>
                <th className="py-2 pr-4">{t.property.client}</th>
                <th className="py-2 pr-4">{t.property.status}</th>
                <th className="py-2 pr-4">{t.property.purchasePrice}</th>
                <th className="py-2 pr-4">{t.property.monthlyRent}</th>
              </tr>
            </thead>
            <tbody>
              {(properties ?? []).map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/admin/properties/${p.id}`}
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
                  <td className="py-2.5 pr-4 text-slate-600">{formatCurrency(p.purchase_price)}</td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {p.property_status === "rented" ? formatCurrency(p.monthly_rent) : "—"}
                  </td>
                </tr>
              ))}
              {(!properties || properties.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
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
