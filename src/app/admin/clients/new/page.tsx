import { Card } from "@/components/ui/Card";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { t } from "@/lib/i18n";

export default function NewClientPage() {
  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t.customer.newClient}</h2>
      <Card>
        <CustomerForm />
      </Card>
    </div>
  );
}
