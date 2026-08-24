import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { RequirementsSummary } from "@/components/forms/RequirementsSummary";
import { DocumentCard } from "@/components/forms/DocumentCard";
import { SpouseSection } from "@/components/forms/SpouseSection";
import { BankAccountSection } from "@/components/forms/BankAccountSection";
import { t } from "@/lib/i18n";

export default async function ClientProfilePage() {
  const profile = await requireProfile();
  const customerId = profile.customer_id!;
  const supabase = await createClient();

  const [
    { data: customer },
    { data: requirements },
    { data: documents },
    { data: spouse },
    { data: bankAccounts },
  ] = await Promise.all([
    supabase.from("customers").select("*").eq("id", customerId).single(),
    supabase.from("property_requirements").select("*").eq("customer_id", customerId).maybeSingle(),
    supabase.from("customer_documents").select("*").eq("customer_id", customerId),
    supabase.from("customer_spouses").select("*").eq("customer_id", customerId).maybeSingle(),
    supabase
      .from("customer_bank_accounts")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: true }),
  ]);

  const passportDoc = documents?.find((d) => d.document_type === "customer_passport") ?? null;
  const poaDoc = documents?.find((d) => d.document_type === "power_of_attorney") ?? null;
  const spouseDoc = documents?.find((d) => d.document_type === "spouse_passport") ?? null;
  const bankAccount = bankAccounts?.[0] ?? null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">{t.nav.myProfile}</h2>

      <Card title={t.customer.contactInformation}>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">{t.customer.name}</dt>
            <dd className="font-medium text-slate-900">{customer?.customer_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t.customer.phone1}</dt>
            <dd className="font-medium text-slate-900">{customer?.phone_1}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t.customer.phone2}</dt>
            <dd className="font-medium text-slate-900">{customer?.phone_2 ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t.customer.email}</dt>
            <dd className="font-medium text-slate-900">{customer?.email}</dd>
          </div>
        </dl>
      </Card>

      <Card title={t.documents.title}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DocumentCard
            key={passportDoc?.id ?? "passport-empty"}
            customerId={customerId}
            documentType="customer_passport"
            document={passportDoc}
            variant="passport"
            title={t.documents.customerPassport}
            editable={false}
          />
          <DocumentCard
            key={poaDoc?.id ?? "poa-empty"}
            customerId={customerId}
            documentType="power_of_attorney"
            document={poaDoc}
            variant="power_of_attorney"
            title={t.documents.powerOfAttorney}
            editable={false}
          />
        </div>
      </Card>

      <SpouseSection
        customerId={customerId}
        spouse={spouse}
        spouseDocument={spouseDoc}
        editable={false}
      />

      <BankAccountSection customerId={customerId} account={bankAccount ?? null} editable={false} />

      <Card title={t.nav.requirements}>
        {requirements ? (
          <RequirementsSummary r={requirements} />
        ) : (
          <p className="text-sm text-slate-400">{t.common.noResults}</p>
        )}
      </Card>
    </div>
  );
}
