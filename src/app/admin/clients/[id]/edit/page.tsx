import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { t } from "@/lib/i18n";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t.customer.editClient}</h2>
      <Card>
        <CustomerForm customer={customer} />
      </Card>
    </div>
  );
}
