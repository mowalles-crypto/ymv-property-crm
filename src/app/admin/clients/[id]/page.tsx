import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CustomerStatusBadge, PropertyStatusBadge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { RequirementsSummary } from "@/components/forms/RequirementsSummary";
import { formatCurrency, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: properties }, { data: requirements }] =
    await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase
        .from("properties")
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("property_requirements")
        .select("*")
        .eq("customer_id", id)
        .maybeSingle(),
    ]);

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {customer.customer_name}
          </h2>
          <div className="mt-1">
            <CustomerStatusBadge status={customer.customer_status} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/clients/${id}/edit`}>
            <Button variant="secondary">{t.common.edit}</Button>
          </Link>
          <DeleteButton
            table="customers"
            id={id}
            redirectTo="/admin/clients"
            confirmMessage={`Delete client "${customer.customer_name}"? This also deletes their properties and accounting records.`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title={t.customer.contactInformation}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">{t.customer.phone1}</dt>
              <dd className="font-medium text-slate-900">{customer.phone_1}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t.customer.phone2}</dt>
              <dd className="font-medium text-slate-900">{customer.phone_2 ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t.customer.email}</dt>
              <dd className="font-medium text-slate-900">{customer.email}</dd>
            </div>
          </dl>
        </Card>

        <Card title={t.nav.requirements}>
          {requirements ? (
            <RequirementsSummary r={requirements} />
          ) : (
            <p className="text-sm text-slate-400">{t.common.noResults}</p>
          )}
        </Card>
      </div>

      <Card
        title={`${t.nav.properties} (${properties?.length ?? 0})`}
        action={
          <Link href={`/admin/properties/new?customer_id=${id}`}>
            <Button variant="secondary">{t.property.newProperty}</Button>
          </Link>
        }
      >
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
                      href={`/admin/properties/${p.id}`}
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

      <p className="text-xs text-slate-400">
        Client since {formatDate(customer.created_at)}
      </p>
    </div>
  );
}
