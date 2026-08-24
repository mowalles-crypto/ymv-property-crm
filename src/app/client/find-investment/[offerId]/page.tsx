import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { InterestButton } from "@/components/investments/InterestButton";
import { calculateAcquisitionCost } from "@/lib/acquisitionCosts";
import { formatCurrency, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";

const OFFERS_BUCKET = "investment-offers";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: offer }, { data: documents }, { data: rules }, { data: inquiry }] = await Promise.all([
    supabase.from("investment_offers").select("*").eq("id", offerId).single(),
    supabase
      .from("investment_offer_documents")
      .select("*")
      .eq("investment_offer_id", offerId)
      .order("sort_order"),
    supabase.from("acquisition_cost_rules").select("*").eq("active", true),
    supabase
      .from("investment_inquiries")
      .select("id")
      .eq("investment_offer_id", offerId)
      .eq("customer_id", profile.customer_id!)
      .maybeSingle(),
  ]);

  if (!offer) notFound();

  const images = (documents ?? []).filter((d) => d.document_type === "image");
  const docs = (documents ?? []).filter((d) => d.document_type !== "image");

  const signedImageUrls = await Promise.all(
    images.map(async (img) => {
      const { data } = await supabase.storage.from(OFFERS_BUCKET).createSignedUrl(img.storage_path, 300);
      return { id: img.id, url: data?.signedUrl, title: img.title };
    })
  );

  const acquisitionCost = calculateAcquisitionCost(Number(offer.property_price), rules ?? [], {
    purchaseTax: offer.override_purchase_tax_amount,
    lawyerFee: offer.override_lawyer_fee_amount,
    brokerageFee: offer.override_brokerage_fee_amount,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-medium text-slate-900">
          {offer.address_or_project_name}
        </h2>
        <p className="text-sm text-slate-500">{offer.city}</p>
      </div>

      {signedImageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {signedImageUrls.map(
            (img) =>
              img.url && (
                <div key={img.id} className="relative aspect-video overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.title ?? offer.address_or_project_name} className="h-full w-full object-cover" />
                </div>
              )
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label={t.findInvestment.priceLabel} value={formatCurrency(offer.property_price)} />
              <Field label={t.findInvestment.typeLabel} value={t.requirements.propertyTypeOptions[offer.property_type]} />
              {offer.rooms != null && <Field label={t.findInvestment.roomsLabel} value={String(offer.rooms)} />}
              {offer.property_size != null && (
                <Field label={t.findInvestment.sizeLabel} value={`${offer.property_size} sqm`} />
              )}
              {offer.expected_net_yield != null && (
                <Field label={t.findInvestment.yieldLabel} value={`${offer.expected_net_yield}%`} />
              )}
              <Field
                label={t.findInvestment.constructionLabel}
                value={t.requirements.conditionOptions[offer.construction_status]}
              />
            </div>
            {offer.short_description && <p className="mt-4 text-sm text-slate-600">{offer.short_description}</p>}
          </Card>

          {offer.economic_analysis && (
            <Card title={t.findInvestment.economicAnalysis}>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{offer.economic_analysis}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {offer.expected_monthly_rent != null && (
                  <Field label="Expected monthly rent" value={formatCurrency(offer.expected_monthly_rent)} />
                )}
                {offer.expected_annual_income != null && (
                  <Field label="Expected annual income" value={formatCurrency(offer.expected_annual_income)} />
                )}
                {offer.estimated_annual_expenses != null && (
                  <Field label="Estimated annual expenses" value={formatCurrency(offer.estimated_annual_expenses)} />
                )}
                {offer.expected_gross_yield != null && (
                  <Field label="Expected gross yield" value={`${offer.expected_gross_yield}%`} />
                )}
              </dl>
            </Card>
          )}

          {docs.length > 0 && (
            <Card title={t.findInvestment.documents}>
              <ul className="space-y-2 text-sm">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between">
                    <span>{d.title ?? d.original_filename}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title={t.findInvestment.acquisitionCosts}>
            <dl className="space-y-2 text-sm">
              <Row label={t.findInvestment.propertyPrice} value={formatCurrency(acquisitionCost.propertyPrice)} />
              <Row
                label={t.findInvestment.estimatedPurchaseTax}
                value={
                  acquisitionCost.purchaseTax.amount != null
                    ? formatCurrency(acquisitionCost.purchaseTax.amount)
                    : t.findInvestment.notConfigured
                }
              />
              <Row
                label={t.findInvestment.estimatedLawyerFee}
                value={
                  acquisitionCost.lawyerFee.amount != null
                    ? formatCurrency(acquisitionCost.lawyerFee.amount)
                    : t.findInvestment.notConfigured
                }
              />
              <Row
                label={t.findInvestment.estimatedBrokerageFee}
                value={
                  acquisitionCost.brokerageFee.amount != null
                    ? formatCurrency(acquisitionCost.brokerageFee.amount)
                    : t.findInvestment.notConfigured
                }
              />
              <div className="border-t border-slate-200 pt-2">
                <Row
                  label={t.findInvestment.estimatedTotalCost}
                  value={acquisitionCost.totalCost != null ? formatCurrency(acquisitionCost.totalCost) : "—"}
                  strong
                />
              </div>
            </dl>
          </Card>

          <Card title="Financing">
            <dl className="space-y-2 text-sm">
              <Row
                label={t.findInvestment.financingAvailable}
                value={offer.financing_available ? t.common.yes : t.common.no}
              />
              {offer.minimum_equity_required != null && (
                <Row label={t.findInvestment.minimumEquity} value={formatCurrency(offer.minimum_equity_required)} />
              )}
              {offer.expected_delivery_date && (
                <Row label={t.findInvestment.expectedDelivery} value={formatDate(offer.expected_delivery_date)} />
              )}
            </dl>
          </Card>

          <Card>
            <InterestButton
              customerId={profile.customer_id!}
              offerId={offer.id}
              alreadyInterested={!!inquiry}
            />
          </Card>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Figures shown (rent, yield, income, expenses) are BIZRAEL estimates and assumptions, not guaranteed returns.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-medium text-slate-800">{value}</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={strong ? "font-semibold text-gold-dark" : "font-medium text-slate-900"}>{value}</dd>
    </div>
  );
}
