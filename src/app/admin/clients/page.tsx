import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CustomerStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import type { CustomerStatus } from "@/lib/types/domain";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("*, properties(count)")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `customer_name.ilike.%${q}%,email.ilike.%${q}%,phone_1.ilike.%${q}%`
    );
  }
  if (status) {
    query = query.eq("customer_status", status as CustomerStatus);
  }

  const { data: customers } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{t.nav.clients}</h2>
        <Link href="/admin/clients/new">
          <Button>{t.customer.newClient}</Button>
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
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">{t.common.all}</option>
            <option value="lead">{t.customer.statusLead}</option>
            <option value="active">{t.customer.statusActive}</option>
            <option value="inactive">{t.customer.statusInactive}</option>
          </select>
          <Button type="submit" variant="secondary">
            {t.common.filter}
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">{t.customer.name}</th>
                <th className="py-2 pr-4">{t.customer.phone1}</th>
                <th className="py-2 pr-4">{t.customer.phone2}</th>
                <th className="py-2 pr-4">{t.customer.email}</th>
                <th className="py-2 pr-4">{t.customer.status}</th>
                <th className="py-2 pr-4">{t.customer.propertyCount}</th>
              </tr>
            </thead>
            <tbody>
              {(customers ?? []).map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {c.customer_name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">{c.phone_1}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{c.phone_2 ?? "—"}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{c.email}</td>
                  <td className="py-2.5 pr-4">
                    <CustomerStatusBadge status={c.customer_status} />
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(c.properties as any)?.[0]?.count ?? 0}
                  </td>
                </tr>
              ))}
              {(!customers || customers.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
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
