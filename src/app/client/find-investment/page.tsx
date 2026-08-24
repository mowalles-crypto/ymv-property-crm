import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { FindInvestmentWizard } from "@/components/investments/FindInvestmentWizard";
import { t } from "@/lib/i18n";
import type { MatchProfile } from "@/lib/matching";

export default async function FindInvestmentPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: requirements }, { data: offers }] = await Promise.all([
    supabase
      .from("property_requirements")
      .select("*")
      .eq("customer_id", profile.customer_id!)
      .maybeSingle(),
    supabase.from("investment_offers").select("*").eq("status", "active").order("featured", { ascending: false }),
  ]);

  const savedProfile: MatchProfile | null = requirements
    ? {
        purchase_purpose: requirements.purchase_purpose,
        property_types: requirements.property_types,
        preferred_locations: requirements.preferred_locations,
        budget_min: requirements.budget_min,
        budget_max: requirements.budget_max,
        financing_required: requirements.financing_required,
        rooms_min: requirements.rooms_min,
        rooms_max: requirements.rooms_max,
        size_min: requirements.size_min,
        size_max: requirements.size_max,
        desired_yield: requirements.desired_yield,
      }
    : null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">{t.nav.findInvestment}</h2>
      <FindInvestmentWizard
        customerId={profile.customer_id!}
        savedProfile={savedProfile}
        offers={offers ?? []}
      />
    </div>
  );
}
