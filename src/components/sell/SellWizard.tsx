"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { TaxEstimateDisplay } from "@/components/sell/TaxEstimateDisplay";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { CapitalGainsTaxEstimate } from "@/lib/types/domain";

type Step = "property" | "details" | "summary" | "done";

export function SellWizard({
  customerId,
  properties,
}: {
  customerId: string;
  properties: { id: string; property_address: string }[];
}) {
  const [step, setStep] = useState<Step>("property");
  const [propertyId, setPropertyId] = useState("");
  const [requestedPrice, setRequestedPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saleRequestId, setSaleRequestId] = useState<string | null>(null);

  const [estimate, setEstimate] = useState<CapitalGainsTaxEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  const selectedProperty = properties.find((p) => p.id === propertyId);

  async function handleSubmit() {
    setError(null);
    const price = Number(requestedPrice);
    if (!requestedPrice || Number.isNaN(price) || price <= 0) {
      setError("Please enter a valid requested sale price.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("property_sale_requests").insert({
      customer_id: customerId,
      property_id: propertyId,
      requested_sale_price: price,
      minimum_acceptable_price: minPrice ? Number(minPrice) : null,
      payment_terms: paymentTerms || null,
      desired_sale_date: saleDate || null,
      notes: notes || null,
    });

    if (insertError) {
      setSubmitting(false);
      setError(insertError.message);
      return;
    }

    // property_sale_requests has no client-facing SELECT policy (admin_notes
    // confidentiality), so the new row's id is resolved via the client-safe RPC.
    const { data: myRequests, error: rpcError } = await supabase.rpc("get_my_sale_requests");
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const newest = myRequests
      ?.filter((r) => r.property_id === propertyId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
    setSaleRequestId(newest?.id ?? null);
    setStep("done");
  }

  async function handleEstimateTax() {
    setEstimateError(null);
    setEstimating(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("estimate_capital_gains_tax", {
      p_property_id: propertyId,
      p_estimated_sale_price: Number(requestedPrice),
      p_sale_request_id: saleRequestId ?? undefined,
    });
    setEstimating(false);
    if (error) {
      setEstimateError(error.message);
      return;
    }
    setEstimate(data);
  }

  if (step === "done") {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center">
            <h3 style={{ fontFamily: "var(--font-display)" }} className="text-lg font-medium text-slate-900">
              {t.sellFlow.submitted}
            </h3>
            <p className="mt-2 text-sm text-slate-500">{selectedProperty?.property_address}</p>
            {!estimate && (
              <Button className="mt-5" onClick={handleEstimateTax} disabled={estimating}>
                {estimating ? t.common.loading : t.sellFlow.estimateTaxCta}
              </Button>
            )}
            {estimateError && <p className="mt-3 text-sm text-red-600">{estimateError}</p>}
          </div>
        </Card>
        {estimate && <TaxEstimateDisplay estimate={estimate} />}
      </div>
    );
  }

  return (
    <Card>
      {step === "property" && (
        <div>
          <h3 className="text-base font-medium text-slate-900">{t.sellFlow.selectPropertyQuestion}</h3>
          <div className="mt-4 space-y-2">
            {properties.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPropertyId(p.id);
                  setStep("details");
                }}
                className="block w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm hover:border-gold hover:bg-gold/5"
              >
                {p.property_address}
              </button>
            ))}
            {properties.length === 0 && <p className="text-sm text-slate-400">{t.common.noResults}</p>}
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="space-y-4">
          <h3 className="text-base font-medium text-slate-900">{selectedProperty?.property_address}</h3>
          <Input
            id="requested_price"
            type="number"
            label={t.sellFlow.requestedPrice}
            required
            value={requestedPrice}
            onChange={(e) => setRequestedPrice(e.target.value)}
          />
          <Input
            id="min_price"
            type="number"
            label={t.sellFlow.minAcceptablePrice}
            optional
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Textarea
            id="payment_terms"
            label={t.sellFlow.paymentTerms}
            optional
            rows={2}
            placeholder={t.sellFlow.paymentTermsPlaceholder}
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
          <Input
            id="sale_date"
            type="date"
            label={t.sellFlow.desiredSaleDate}
            optional
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
          />
          <Textarea
            id="notes"
            label={t.sellFlow.additionalNotes}
            optional
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep("property")}>
              ← {t.reports.back}
            </Button>
            <Button onClick={() => setStep("summary")} disabled={!requestedPrice}>
              {t.registration.next}
            </Button>
          </div>
        </div>
      )}

      {step === "summary" && (
        <div>
          <h3 className="text-base font-medium text-slate-900">{t.sellFlow.summaryTitle}</h3>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <SummaryRow label={t.property.address} value={selectedProperty?.property_address ?? ""} />
            <SummaryRow label={t.sellFlow.requestedPrice} value={formatCurrency(Number(requestedPrice))} />
            {minPrice && <SummaryRow label={t.sellFlow.minAcceptablePrice} value={formatCurrency(Number(minPrice))} />}
            {paymentTerms && <SummaryRow label={t.sellFlow.paymentTerms} value={paymentTerms} />}
            {saleDate && <SummaryRow label={t.sellFlow.desiredSaleDate} value={saleDate} />}
          </dl>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex gap-2">
            <Button variant="ghost" onClick={() => setStep("details")} disabled={submitting}>
              ← {t.reports.back}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? t.common.loading : t.sellFlow.submit}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
