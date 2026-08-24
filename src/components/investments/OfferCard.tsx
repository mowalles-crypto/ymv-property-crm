import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { MatchResult } from "@/lib/matching";

export function OfferCard({ result }: { result: MatchResult }) {
  const { offer, score, reasons } = result;

  return (
    <Link
      href={`/client/find-investment/${offer.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-slate-900">{offer.address_or_project_name}</h3>
          <p className="text-sm text-slate-500">{offer.city}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-gold-light to-gold-dark px-2.5 py-0.5 text-xs font-semibold text-charcoal">
            {score}% {t.findInvestment.matchScore}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Field label={t.findInvestment.priceLabel} value={formatCurrency(offer.property_price)} />
        <Field
          label={t.findInvestment.typeLabel}
          value={t.requirements.propertyTypeOptions[offer.property_type]}
        />
        {offer.rooms != null && <Field label={t.findInvestment.roomsLabel} value={String(offer.rooms)} />}
        {offer.expected_net_yield != null && (
          <Field label={t.findInvestment.yieldLabel} value={`${offer.expected_net_yield}%`} />
        )}
      </div>

      {reasons.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {t.findInvestment.whyThisMatches}
          </p>
          <ul className="mt-1 space-y-0.5 text-sm text-slate-600">
            {reasons.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </div>
      )}

      {offer.featured && (
        <div className="mt-3">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            Featured
          </span>
        </div>
      )}
    </Link>
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
