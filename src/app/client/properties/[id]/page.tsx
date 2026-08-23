import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PropertyStatusBadge } from "@/components/ui/Badge";
import { AccountingTable } from "@/components/forms/AccountingTable";
import { YearSelector } from "@/components/forms/YearSelector";
import { formatCurrency, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { PropertyAccounting } from "@/lib/types/domain";

export default async function ClientPropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; year?: string }>;
}) {
  const { id } = await params;
  const { tab, year: yearParam } = await searchParams;
  const activeTab = tab === "accounting" ? "accounting" : "details";
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const supabase = await createClient();
  // RLS scopes this to the caller's own properties — a mismatched id
  // simply returns no row rather than another client's data.
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (!property) notFound();

  let accountingRows: PropertyAccounting[] = [];
  if (activeTab === "accounting") {
    const { data } = await supabase
      .from("property_accounting")
      .select("*")
      .eq("property_id", id)
      .eq("year", year)
      .order("month");
    accountingRows = data ?? [];
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);
  if (!years.includes(year)) years.push(year);
  years.sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{property.property_address}</h2>
        <div className="mt-2">
          <PropertyStatusBadge status={property.property_status} />
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <a
          href={`/client/properties/${id}?tab=details`}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === "details"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.property.detailsTab}
        </a>
        <a
          href={`/client/properties/${id}?tab=accounting`}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === "accounting"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.property.accountingTab}
        </a>
      </div>

      {activeTab === "details" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title={t.property.propertyDetails}>
            <dl className="space-y-2 text-sm">
              <Row label={t.property.purchaseDate} value={formatDate(property.purchase_date)} />
              <Row label={t.property.purchasePrice} value={formatCurrency(property.purchase_price)} />
              <Row label={t.property.keyReceivedDate} value={formatDate(property.key_received_date)} />
            </dl>
          </Card>

          <Card title={t.property.financingSection}>
            <dl className="space-y-2 text-sm">
              <Row label={t.property.equityPaid} value={formatCurrency(property.equity_paid)} />
              <Row label={t.property.bankFinancing} value={formatCurrency(property.bank_financing)} />
              {property.bank_financing > 0 && (
                <Row
                  label={t.property.bankFinancingEndDate}
                  value={formatDate(property.bank_financing_end_date)}
                />
              )}
            </dl>
          </Card>

          {property.property_status === "rented" && (
            <Card title={t.property.rentalSection}>
              <dl className="space-y-2 text-sm">
                <Row label={t.property.monthlyRent} value={formatCurrency(property.monthly_rent)} />
                <Row label={t.property.rentalEndDate} value={formatDate(property.rental_end_date)} />
              </dl>
            </Card>
          )}

          {property.property_status === "sold" && (
            <Card title={t.property.saleSection}>
              <dl className="space-y-2 text-sm">
                <Row label={t.property.salePrice} value={formatCurrency(property.sale_price)} />
                <Row label={t.property.saleDate} value={formatDate(property.sale_date)} />
              </dl>
            </Card>
          )}
        </div>
      ) : (
        <Card
          title={t.property.accountingTab}
          action={<YearSelector year={year} basePath={`/client/properties/${id}`} years={years} />}
        >
          <AccountingTable
            propertyId={id}
            year={year}
            initialRows={accountingRows}
            editable={false}
          />
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
