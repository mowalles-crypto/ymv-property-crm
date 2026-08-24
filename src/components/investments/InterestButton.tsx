"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

export function InterestButton({
  customerId,
  offerId,
  alreadyInterested,
}: {
  customerId: string;
  offerId: string;
  alreadyInterested: boolean;
}) {
  const [sent, setSent] = useState(alreadyInterested);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("investment_inquiries").insert({
      customer_id: customerId,
      investment_offer_id: offerId,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <p className="text-sm font-medium text-emerald-700">{t.findInvestment.interestSent}</p>;
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={submitting}>
        {submitting ? t.common.loading : t.findInvestment.imInterested}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
