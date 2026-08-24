import type { AcquisitionCostRule } from "@/lib/types/domain";

export interface AcquisitionCostLine {
  amount: number | null; // null = rule not configured for this cost type
  source: string | null;
}

export interface AcquisitionCostBreakdown {
  propertyPrice: number;
  purchaseTax: AcquisitionCostLine;
  lawyerFee: AcquisitionCostLine;
  brokerageFee: AcquisitionCostLine;
  /** Only a real number when every component above resolved; otherwise the
   * UI must show "estimate incomplete" rather than a misleading total. */
  totalCost: number | null;
}

interface Tier {
  upTo: number | null; // null = no upper bound (final bracket)
  rate: number;
}

function computeTiered(amount: number, tiers: Tier[]): number {
  const sorted = [...tiers].sort((a, b) => (a.upTo ?? Infinity) - (b.upTo ?? Infinity));
  let remaining = amount;
  let previousBound = 0;
  let total = 0;
  for (const tier of sorted) {
    const bound = tier.upTo ?? Infinity;
    const bracketSize = Math.max(bound - previousBound, 0);
    const taxedInBracket = Math.min(remaining, bracketSize);
    total += taxedInBracket * tier.rate;
    remaining -= taxedInBracket;
    previousBound = bound;
    if (remaining <= 0) break;
  }
  return total;
}

function applyRule(propertyPrice: number, rule: AcquisitionCostRule | undefined): AcquisitionCostLine {
  if (!rule) return { amount: null, source: null };

  let amount: number | null = null;
  if (rule.calculation_type === "fixed") {
    amount = Number(rule.fixed_amount ?? 0);
  } else if (rule.calculation_type === "percentage") {
    if (rule.percentage_rate == null) return { amount: null, source: rule.source };
    amount = propertyPrice * Number(rule.percentage_rate);
  } else if (rule.calculation_type === "tiered") {
    const tiers = Array.isArray(rule.tiers) ? (rule.tiers as unknown as Tier[]) : null;
    if (!tiers || tiers.length === 0) return { amount: null, source: rule.source };
    amount = computeTiered(propertyPrice, tiers);
  } else {
    // 'custom' — deliberately not auto-computed; requires a real
    // implementation once the actual rule is known and verified.
    return { amount: null, source: rule.source };
  }

  if (amount != null) {
    if (rule.minimum_amount != null) amount = Math.max(amount, Number(rule.minimum_amount));
    if (rule.maximum_amount != null) amount = Math.min(amount, Number(rule.maximum_amount));
  }

  return { amount, source: rule.source };
}

function pickActiveRule(
  rules: AcquisitionCostRule[],
  costType: AcquisitionCostRule["cost_type"]
): AcquisitionCostRule | undefined {
  const today = new Date().toISOString().slice(0, 10);
  return rules
    .filter(
      (r) =>
        r.cost_type === costType &&
        r.active &&
        r.effective_from <= today &&
        (r.effective_to == null || r.effective_to >= today)
    )
    .sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1))[0];
}

export function calculateAcquisitionCost(
  propertyPrice: number,
  rules: AcquisitionCostRule[],
  overrides?: {
    purchaseTax?: number | null;
    lawyerFee?: number | null;
    brokerageFee?: number | null;
  }
): AcquisitionCostBreakdown {
  const purchaseTax: AcquisitionCostLine =
    overrides?.purchaseTax != null
      ? { amount: overrides.purchaseTax, source: "Offer-specific override" }
      : applyRule(propertyPrice, pickActiveRule(rules, "purchase_tax"));

  const lawyerFee: AcquisitionCostLine =
    overrides?.lawyerFee != null
      ? { amount: overrides.lawyerFee, source: "Offer-specific override" }
      : applyRule(propertyPrice, pickActiveRule(rules, "lawyer_fee"));

  const brokerageFee: AcquisitionCostLine =
    overrides?.brokerageFee != null
      ? { amount: overrides.brokerageFee, source: "Offer-specific override" }
      : applyRule(propertyPrice, pickActiveRule(rules, "brokerage_fee"));

  const allResolved = purchaseTax.amount != null && lawyerFee.amount != null && brokerageFee.amount != null;

  return {
    propertyPrice,
    purchaseTax,
    lawyerFee,
    brokerageFee,
    totalCost: allResolved
      ? propertyPrice + purchaseTax.amount! + lawyerFee.amount! + brokerageFee.amount!
      : null,
  };
}
