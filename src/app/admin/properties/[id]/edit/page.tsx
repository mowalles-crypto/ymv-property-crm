import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { t } from "@/lib/i18n";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: property }, { data: customers }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).single(),
    supabase.from("customers").select("id, customer_name").order("customer_name"),
  ]);

  if (!property) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t.property.editProperty}</h2>
      <Card>
        <PropertyForm property={property} customers={customers ?? []} />
      </Card>
    </div>
  );
}
