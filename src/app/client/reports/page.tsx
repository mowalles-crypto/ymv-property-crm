import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ReportWizard } from "@/components/reports/ReportWizard";
import { t } from "@/lib/i18n";

export default async function ClientReportsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: properties }, { data: customer }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, property_address")
      .eq("customer_id", profile.customer_id!)
      .order("property_address"),
    supabase.from("customers").select("customer_name").eq("id", profile.customer_id!).single(),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">{t.nav.reports}</h2>
      <ReportWizard
        customerId={profile.customer_id!}
        customerName={customer?.customer_name ?? ""}
        properties={properties ?? []}
      />
    </div>
  );
}
