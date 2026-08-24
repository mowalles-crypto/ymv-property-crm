import { t } from "@/lib/i18n";
import type { InvestmentOffer, PropertyType, PurchasePurpose } from "@/lib/types/domain";

/**
 * Shape a match can be scored against — deliberately narrower than
 * PropertyRequirements so the same scoring logic works for both the saved
 * profile and an ad-hoc "search with different criteria" questionnaire that
 * was never persisted.
 */
export interface MatchProfile {
  purchase_purpose: PurchasePurpose | null;
  property_types: PropertyType[];
  preferred_locations: string[];
  budget_min: number | null;
  budget_max: number | null;
  financing_required: "yes" | "no" | "not_sure" | null;
  rooms_min: number | null;
  rooms_max: number | null;
  size_min: number | null;
  size_max: number | null;
  desired_yield: number | null;
}

export interface MatchResult {
  offer: InvestmentOffer;
  score: number; // 0-100, deterministic — never presented as AI-generated
  reasons: string[];
}

/** This is a deterministic, transparent scoring system — not a machine
 * learning model. Every point awarded has a human-readable reason attached,
 * per the spec's explicit "do not hide how recommendations were generated." */
export function scoreOffer(profile: MatchProfile, offer: InvestmentOffer): MatchResult {
  let score = 0;
  let maxScore = 0;
  const reasons: string[] = [];

  // Budget (weight 25)
  maxScore += 25;
  if (profile.budget_min != null || profile.budget_max != null) {
    const min = profile.budget_min ?? 0;
    const max = profile.budget_max ?? Number.POSITIVE_INFINITY;
    const price = Number(offer.property_price);
    if (price >= min && price <= max) {
      score += 25;
      reasons.push("Within your target budget");
    } else {
      const nearestBound = price < min ? min : max;
      const distance = Math.abs(price - nearestBound) / (nearestBound || 1);
      if (distance <= 0.1) {
        score += 12;
        reasons.push("Close to your target budget");
      }
    }
  } else {
    score += 12;
  }

  // Location (weight 20)
  maxScore += 20;
  if (profile.preferred_locations.length > 0) {
    const city = offer.city.toLowerCase();
    const location = (offer.location ?? "").toLowerCase();
    const matched = profile.preferred_locations.some((loc) => {
      const l = loc.trim().toLowerCase();
      return l.length > 0 && (city.includes(l) || l.includes(city) || location.includes(l));
    });
    if (matched) {
      score += 20;
      reasons.push(`Located in one of your preferred areas (${offer.city})`);
    }
  } else {
    score += 10;
  }

  // Property type (weight 15)
  maxScore += 15;
  if (profile.property_types.length > 0) {
    if (profile.property_types.includes(offer.property_type)) {
      score += 15;
      reasons.push(`Matches your preferred property type (${t.requirements.propertyTypeOptions[offer.property_type]})`);
    }
  } else {
    score += 8;
  }

  // Purpose (weight 10)
  maxScore += 10;
  if (profile.purchase_purpose) {
    if (
      profile.purchase_purpose === offer.property_purpose ||
      (profile.purchase_purpose === "investment_with_future_residence" &&
        (offer.property_purpose === "investment" || offer.property_purpose === "personal_residence"))
    ) {
      score += 10;
      reasons.push("Suitable for your stated purchase purpose");
    }
  } else {
    score += 5;
  }

  // Yield (weight 15)
  maxScore += 15;
  if (profile.desired_yield != null && offer.expected_net_yield != null) {
    const target = Number(profile.desired_yield);
    const actual = Number(offer.expected_net_yield);
    if (actual >= target) {
      score += 15;
      reasons.push(`Expected net yield (${actual}%) meets your target (${target}%)`);
    } else if (actual >= target - 1) {
      score += 7;
      reasons.push(`Expected net yield (${actual}%) is close to your target`);
    }
  } else {
    score += 7;
  }

  // Financing suitability (weight 5)
  maxScore += 5;
  if (profile.financing_required === "yes") {
    if (offer.financing_available) {
      score += 5;
      reasons.push("Financing is available for this opportunity");
    }
  } else {
    score += 5;
  }

  // Size / rooms (weight 10)
  maxScore += 10;
  const roomsOk =
    offer.rooms == null ||
    ((profile.rooms_min == null || Number(offer.rooms) >= profile.rooms_min) &&
      (profile.rooms_max == null || Number(offer.rooms) <= profile.rooms_max));
  const sizeOk =
    offer.property_size == null ||
    ((profile.size_min == null || Number(offer.property_size) >= profile.size_min) &&
      (profile.size_max == null || Number(offer.property_size) <= profile.size_max));
  if (roomsOk && sizeOk) {
    score += 10;
    if (profile.rooms_min != null || profile.rooms_max != null || profile.size_min != null || profile.size_max != null) {
      reasons.push("Matches your size/room preferences");
    }
  } else if (roomsOk || sizeOk) {
    score += 5;
  }

  return {
    offer,
    score: Math.round((score / maxScore) * 100),
    reasons,
  };
}

export function matchOffers(profile: MatchProfile, offers: InvestmentOffer[]): MatchResult[] {
  return offers.map((offer) => scoreOffer(profile, offer)).sort((a, b) => b.score - a.score);
}
