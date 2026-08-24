import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { SellWizard } from "@/components/sell/SellWizard";
import { MySaleRequests } from "@/components/sell/MySaleRequests";
import { t } from "@/lib/i18n";

export default async function ClientSellPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: properties }, { data: saleRequests }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, property_address")
      .eq("customer_id", profile.customer_id!)
      .order("property_address"),
    supabase.rpc("get_my_sale_requests"),
  ]);

  const addressById = new Map((properties ?? []).map((p) => [p.id, p.property_address]));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">{t.nav.sellProperty}</h2>
      <SellWizard customerId={profile.customer_id!} properties={properties ?? []} />
      <MySaleRequests requests={saleRequests ?? []} addressById={addressById} />
    </div>
  );
}
