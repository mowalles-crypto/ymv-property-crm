"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { PropertySaleRequest, SaleRequestStatus } from "@/lib/types/domain";

const statusKeys = Object.keys(t.saleRequestStatusOptions) as SaleRequestStatus[];

export function SaleRequestRow({
  request,
  customerName,
  propertyAddress,
}: {
  request: PropertySaleRequest;
  customerName: string;
  propertyAddress: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<SaleRequestStatus>(request.status);
  const [adminNotes, setAdminNotes] = useState(request.admin_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("property_sale_requests")
      .update({ status, admin_notes: adminNotes || null })
      .eq("id", request.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <tr className="border-b border-slate-100 align-top hover:bg-slate-50">
      <td className="py-2.5 pr-4">{customerName}</td>
      <td className="py-2.5 pr-4">{propertyAddress}</td>
      <td className="py-2.5 pr-4 text-right">{formatCurrency(request.requested_sale_price)}</td>
      <td className="py-2.5 pr-4">
        {editing ? (
          <Select
            id={`status-${request.id}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as SaleRequestStatus)}
          >
            {statusKeys.map((k) => (
              <option key={k} value={k}>
                {t.saleRequestStatusOptions[k]}
              </option>
            ))}
          </Select>
        ) : (
          t.saleRequestStatusOptions[request.status]
        )}
      </td>
      <td className="py-2.5 pr-4 text-slate-500">{formatDate(request.created_at)}</td>
      <td className="min-w-[220px] py-2.5 pr-4">
        {editing ? (
          <Textarea
            id={`notes-${request.id}`}
            rows={2}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder={t.saleRequestsAdmin.adminNotes}
          />
        ) : (
          <span className="text-slate-500">{request.admin_notes || "—"}</span>
        )}
      </td>
      <td className="py-2.5 pr-4">
        {editing ? (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t.common.loading : t.common.save}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              {t.common.cancel}
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            {t.saleRequestsAdmin.changeStatus}
          </Button>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
