import { Card } from "@/components/ui/Card";
import { OfferForm } from "@/components/forms/OfferForm";
import { t } from "@/lib/i18n";

export default function NewOfferPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t.offersAdmin.newOffer}</h2>
      <Card>
        <OfferForm />
      </Card>
    </div>
  );
}
