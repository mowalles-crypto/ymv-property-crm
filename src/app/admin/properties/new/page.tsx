import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { t } from "@/lib/i18n";

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ customer_id?: string }>;
}) {
  const { customer_id } = await searchParams;
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, customer_name")
    .order("customer_name");

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t.property.newProperty}</h2>
      <Card>
        <PropertyForm customers={customers ?? []} lockedCustomerId={customer_id} />
      </Card>
    </div>
  );
}
