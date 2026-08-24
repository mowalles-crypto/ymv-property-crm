import { formatCurrency, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { CapitalGainsTaxEstimate } from "@/lib/types/domain";

interface CalculationDetails {
  purchase_price?: number | null;
  purchase_tax_paid?: number | null;
  purchase_brokerage_fee?: number | null;
  purchase_legal_fee?: number | null;
  recognized_improvement_costs?: number | null;
  other_recognized_costs?: number | null;
  sale_brokerage_fee?: number | null;
  sale_legal_fee?: number | null;
  tax_rate?: number | null;
  rule_source?: string | null;
  rule_notes?: string | null;
}

export function TaxEstimateDisplay({ estimate }: { estimate: CapitalGainsTaxEstimate }) {
  const details = (estimate.calculation_details ?? {}) as CalculationDetails;
  const hasMissingBasis =
    details.purchase_tax_paid == null &&
    details.purchase_brokerage_fee == null &&
    details.purchase_legal_fee == null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 style={{ fontFamily: "var(--font-display)" }} className="text-lg font-medium text-slate-900">
        {t.taxEstimate.title}
      </h3>

      <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {t.taxEstimate.disclaimer}
      </div>

      {hasMissingBasis && (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t.taxEstimate.missingTaxBasisNote}
        </div>
      )}

      <dl className="mt-5 space-y-2 text-sm">
        <Row label={t.taxEstimate.proposedSalePrice} value={formatCurrency(estimate.estimated_sale_price)} />
        <div className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.taxEstimate.lessCostBasis}
        </div>
        <Row label={t.taxEstimate.purchasePrice} value={formatCurrency(details.purchase_price)} indent />
        <Row label={t.taxEstimate.purchaseTax} value={formatCurrency(details.purchase_tax_paid)} indent />
        <Row label={t.taxEstimate.purchaseBrokerage} value={formatCurrency(details.purchase_brokerage_fee)} indent />
        <Row label={t.taxEstimate.purchaseLegal} value={formatCurrency(details.purchase_legal_fee)} indent />
        <Row
          label={t.taxEstimate.recognizedImprovements}
          value={formatCurrency(details.recognized_improvement_costs)}
          indent
        />
        <Row label={t.taxEstimate.saleBrokerage} value={formatCurrency(details.sale_brokerage_fee)} indent />
        <Row label={t.taxEstimate.saleLegal} value={formatCurrency(details.sale_legal_fee)} indent />
        <Row
          label={t.taxEstimate.otherRecognizedCosts}
          value={formatCurrency(details.other_recognized_costs)}
          indent
        />
        <Row
          label="= Adjusted Cost Basis"
          value={formatCurrency(estimate.calculated_cost_basis)}
          strong
        />
        <div className="border-t border-slate-200 pt-2" />
        <Row label={t.taxEstimate.estimatedGain} value={formatCurrency(estimate.estimated_gain)} strong />
        <Row
          label={`${t.taxEstimate.estimatedTax} (${details.tax_rate != null ? `${(details.tax_rate * 100).toFixed(1)}%` : "—"})`}
          value={formatCurrency(estimate.estimated_tax)}
          strong
          tone="gold"
        />
      </dl>

      <div className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-400">
        <p>
          {t.taxEstimate.ruleVersion}: {estimate.rule_version}
          {details.rule_source && ` · ${details.rule_source}`}
        </p>
        <p>
          {t.taxEstimate.calculatedOn}: {formatDate(estimate.calculated_at)}
        </p>
        {details.rule_notes && <p className="mt-1">{details.rule_notes}</p>}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  indent,
  strong,
  tone,
}: {
  label: string;
  value: string;
  indent?: boolean;
  strong?: boolean;
  tone?: "gold";
}) {
  return (
    <div className={`flex justify-between ${indent ? "pl-4" : ""}`}>
      <dt className={strong ? "font-semibold text-slate-900" : "text-slate-500"}>{label}</dt>
      <dd
        className={
          tone === "gold"
            ? "font-semibold text-gold-dark"
            : strong
              ? "font-semibold text-slate-900"
              : "text-slate-700"
        }
      >
        {value}
      </dd>
    </div>
  );
}
