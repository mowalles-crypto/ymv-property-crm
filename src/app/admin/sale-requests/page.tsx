import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { SaleRequestRow } from "@/components/forms/SaleRequestRow";
import { t } from "@/lib/i18n";

export default async function AdminSaleRequestsPage() {
  const supabase = await createClient();

  const [{ data: requests }, { data: customers }, { data: properties }] = await Promise.all([
    supabase.from("property_sale_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("customers").select("id, customer_name"),
    supabase.from("properties").select("id, property_address"),
  ]);

  const customerNameById = new Map((customers ?? []).map((c) => [c.id, c.customer_name]));
  const propertyAddressById = new Map((properties ?? []).map((p) => [p.id, p.property_address]));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t.saleRequestsAdmin.title}</h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">{t.saleRequestsAdmin.client}</th>
                <th className="py-2 pr-4">{t.saleRequestsAdmin.property}</th>
                <th className="py-2 pr-4 text-right">{t.saleRequestsAdmin.requestedPrice}</th>
                <th className="py-2 pr-4">{t.saleRequestsAdmin.status}</th>
                <th className="py-2 pr-4">{t.saleRequestsAdmin.requestDate}</th>
                <th className="py-2 pr-4">{t.saleRequestsAdmin.adminNotes}</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {(requests ?? []).map((r) => (
                <SaleRequestRow
                  key={r.id}
                  request={r}
                  customerName={customerNameById.get(r.customer_id) ?? "—"}
                  propertyAddress={propertyAddressById.get(r.property_id) ?? "—"}
                />
              ))}
              {(!requests || requests.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
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
