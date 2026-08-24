import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { OfferStatus } from "@/lib/types/domain";

const statusStyles: Record<OfferStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  active: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-violet-100 text-violet-800",
  archived: "bg-slate-100 text-slate-400",
};

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("investment_offers").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status as OfferStatus);
  const { data: offers } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{t.offersAdmin.title}</h2>
        <Link href="/admin/offers/new">
          <Button>{t.offersAdmin.newOffer}</Button>
        </Link>
      </div>

      <Card>
        <form className="mb-4 flex gap-3" method="get">
          <select name="status" defaultValue={status ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">{t.common.all}</option>
            {Object.entries(t.offerStatusOptions).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            {t.common.filter}
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">{t.offersAdmin.projectName}</th>
                <th className="py-2 pr-4">{t.offersAdmin.city}</th>
                <th className="py-2 pr-4 text-right">{t.offersAdmin.price}</th>
                <th className="py-2 pr-4">{t.offersAdmin.status}</th>
              </tr>
            </thead>
            <tbody>
              {(offers ?? []).map((o) => (
                <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2.5 pr-4">
                    <Link href={`/admin/offers/${o.id}`} className="font-medium text-indigo-700 hover:underline">
                      {o.address_or_project_name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">{o.city}</td>
                  <td className="py-2.5 pr-4 text-right text-slate-600">{formatCurrency(o.property_price)}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[o.status]}`}>
                      {t.offerStatusOptions[o.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {(!offers || offers.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
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
