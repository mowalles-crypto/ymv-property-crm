import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { PropertyStatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";

export default async function ClientPropertiesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("customer_id", profile.customer_id!)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t.nav.myProperties}</h2>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">{t.property.address}</th>
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
                      href={`/client/properties/${p.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {p.property_address}
                    </Link>
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
