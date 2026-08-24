import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CustomerStatusBadge, PropertyStatusBadge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { RequirementsSummary } from "@/components/forms/RequirementsSummary";
import { DocumentCard } from "@/components/forms/DocumentCard";
import { SpouseSection } from "@/components/forms/SpouseSection";
import { BankAccountSection } from "@/components/forms/BankAccountSection";
import { formatCurrency, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";

const TABS = [
  { key: "overview", label: t.customer.tabOverview },
  { key: "documents", label: t.customer.tabDocuments },
  { key: "spouse", label: t.customer.tabSpouse },
  { key: "bank", label: t.customer.tabBank },
  { key: "requirements", label: t.customer.tabRequirements },
  { key: "properties", label: t.customer.tabProperties },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab: TabKey = TABS.some((tabDef) => tabDef.key === tab) ? (tab as TabKey) : "overview";

  const supabase = await createClient();

  const [
    { data: customer },
    { data: properties },
    { data: requirements },
    { data: documents },
    { data: spouse },
    { data: bankAccounts },
  ] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase
      .from("properties")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("property_requirements").select("*").eq("customer_id", id).maybeSingle(),
    supabase.from("customer_documents").select("*").eq("customer_id", id),
    supabase.from("customer_spouses").select("*").eq("customer_id", id).maybeSingle(),
    supabase
      .from("customer_bank_accounts")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!customer) notFound();

  const passportDoc = documents?.find((d) => d.document_type === "customer_passport") ?? null;
  const poaDoc = documents?.find((d) => d.document_type === "power_of_attorney") ?? null;
  const spouseDoc = documents?.find((d) => d.document_type === "spouse_passport") ?? null;
  const bankAccount = bankAccounts?.[0] ?? null;

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
            confirmMessage={`Delete client "${customer.customer_name}"? This also deletes their properties, accounting records, documents, spouse, and bank account information.`}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tabDef) => (
          <Link
            key={tabDef.key}
            href={`/admin/clients/${id}?tab=${tabDef.key}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === tabDef.key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tabDef.label}
          </Link>
        ))}
      </div>

      {activeTab === "overview" && (
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
              <div className="flex justify-between">
                <dt className="text-slate-500">{t.customer.propertyCount}</dt>
                <dd className="font-medium text-slate-900">{properties?.length ?? 0}</dd>
              </div>
            </dl>
          </Card>
          <p className="text-xs text-slate-400 lg:col-span-2">
            Client since {formatDate(customer.created_at)}
          </p>
        </div>
      )}

      {activeTab === "documents" && (
        <Card title={t.documents.title}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DocumentCard
              key={passportDoc?.id ?? "passport-empty"}
              customerId={id}
              documentType="customer_passport"
              document={passportDoc}
              variant="passport"
              title={t.documents.customerPassport}
              editable
            />
            <DocumentCard
              key={poaDoc?.id ?? "poa-empty"}
              customerId={id}
              documentType="power_of_attorney"
              document={poaDoc}
              variant="power_of_attorney"
              title={t.documents.powerOfAttorney}
              editable
            />
          </div>
        </Card>
      )}

      {activeTab === "spouse" && (
        <SpouseSection
          customerId={id}
          spouse={spouse}
          spouseDocument={spouseDoc}
          editable
        />
      )}

      {activeTab === "bank" && (
        <BankAccountSection customerId={id} account={bankAccount} editable />
      )}

      {activeTab === "requirements" && (
        <Card title={t.nav.requirements}>
          {requirements ? (
            <RequirementsSummary r={requirements} />
          ) : (
            <p className="text-sm text-slate-400">{t.common.noResults}</p>
          )}
        </Card>
      )}

      {activeTab === "properties" && (
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
      )}
    </div>
  );
}
