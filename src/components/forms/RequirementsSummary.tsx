import { t } from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { PropertyRequirements } from "@/lib/types/domain";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export function RequirementsSummary({ r }: { r: PropertyRequirements }) {
  return (
    <dl>
      <Row
        label={t.requirements.purchasePurpose}
        value={t.requirements.purchasePurposeOptions[r.purchase_purpose]}
      />
      <Row
        label={t.requirements.propertyTypes}
        value={
          r.property_types.length
            ? r.property_types.map((pt) => t.requirements.propertyTypeOptions[pt]).join(", ")
            : "—"
        }
      />
      <Row
        label={t.requirements.preferredLocations}
        value={r.preferred_locations.length ? r.preferred_locations.join(", ") : "—"}
      />
      <Row
        label={t.requirements.budgetMin + " – " + t.requirements.budgetMax}
        value={`${formatCurrency(r.budget_min)} – ${formatCurrency(r.budget_max)}`}
      />
      <Row label={t.requirements.availableEquity} value={formatCurrency(r.available_equity)} />
      <Row
        label={t.requirements.financingRequired}
        value={t.requirements.financingOptions[r.financing_required]}
      />
      {r.financing_required === "yes" && (
        <>
          <Row label={t.requirements.financingAmount} value={formatCurrency(r.financing_amount)} />
          <Row
            label={t.requirements.financingPercentage}
            value={r.financing_percentage ? `${r.financing_percentage}%` : "—"}
          />
        </>
      )}
      <Row
        label={t.requirements.roomsMin + " – " + t.requirements.roomsMax}
        value={`${formatNumber(r.rooms_min)} – ${formatNumber(r.rooms_max)}`}
      />
      <Row
        label={t.requirements.sizeMin + " – " + t.requirements.sizeMax}
        value={`${formatNumber(r.size_min)} – ${formatNumber(r.size_max)} sqm`}
      />
      <Row
        label={t.requirements.propertyCondition}
        value={t.requirements.conditionOptions[r.property_condition]}
      />
      <Row
        label={t.requirements.purchaseTimeline}
        value={t.requirements.timelineOptions[r.purchase_timeline]}
      />
      {r.desired_yield && (
        <Row label={t.requirements.desiredYield} value={`${r.desired_yield}%`} />
      )}
      <Row
        label={t.requirements.additionalPreferences}
        value={
          [
            r.wants_balcony && t.requirements.wantsBalcony,
            r.wants_parking && t.requirements.wantsParking,
            r.wants_storage && t.requirements.wantsStorage,
            r.wants_elevator && t.requirements.wantsElevator,
            r.wants_accessibility && t.requirements.wantsAccessibility,
            r.wants_public_transport_proximity && t.requirements.wantsPublicTransport,
          ]
            .filter(Boolean)
            .join(", ") || "—"
        }
      />
      {r.preferred_floor && (
        <Row label={t.requirements.preferredFloor} value={r.preferred_floor} />
      )}
      {r.other_preferences && (
        <Row label={t.requirements.otherPreferences} value={r.other_preferences} />
      )}
      {r.additional_requirements && (
        <Row label={t.requirements.additionalRequirements} value={r.additional_requirements} />
      )}
    </dl>
  );
}
