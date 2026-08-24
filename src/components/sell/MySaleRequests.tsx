import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { PropertySaleRequest } from "@/lib/types/domain";

export function MySaleRequests({
  requests,
  addressById,
}: {
  requests: PropertySaleRequest[];
  addressById: Map<string, string>;
}) {
  if (requests.length === 0) return null;

  return (
    <Card title={t.sellFlow.myRequests}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="py-2 pr-4">{t.property.address}</th>
              <th className="py-2 pr-4 text-right">{t.sellFlow.requestedPrice}</th>
              <th className="py-2 pr-4">{t.sellFlow.statusLabel}</th>
              <th className="py-2 pr-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-4">{addressById.get(r.property_id) ?? "—"}</td>
                <td className="py-2.5 pr-4 text-right">{formatCurrency(r.requested_sale_price)}</td>
                <td className="py-2.5 pr-4">
                  {t.saleRequestStatusOptions[r.status as keyof typeof t.saleRequestStatusOptions]}
                </td>
                <td className="py-2.5 pr-4 text-slate-500">{formatDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
