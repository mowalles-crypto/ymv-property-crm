"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RequirementsFields } from "@/components/forms/RequirementsFields";
import { OfferCard } from "@/components/investments/OfferCard";
import { t } from "@/lib/i18n";
import { matchOffers, type MatchProfile, type MatchResult } from "@/lib/matching";
import {
  emptyRequirementsForm,
  requirementsFormToUpdatePayload,
  type RequirementsFormState,
} from "@/lib/types/forms";
import type { InvestmentOffer } from "@/lib/types/domain";

type Step = "intro" | "questionnaire" | "results";

function toMatchProfile(f: {
  purchase_purpose: string | null;
  property_types: string[];
  preferred_locations: string[];
  budget_min: number | string | null;
  budget_max: number | string | null;
  financing_required: string | null;
  rooms_min: number | string | null;
  rooms_max: number | string | null;
  size_min: number | string | null;
  size_max: number | string | null;
  desired_yield: number | string | null;
}): MatchProfile {
  const num = (v: number | string | null) => {
    if (v === null || v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };
  return {
    purchase_purpose: (f.purchase_purpose as MatchProfile["purchase_purpose"]) ?? null,
    property_types: f.property_types as MatchProfile["property_types"],
    preferred_locations: f.preferred_locations,
    budget_min: num(f.budget_min),
    budget_max: num(f.budget_max),
    financing_required: (f.financing_required as MatchProfile["financing_required"]) ?? null,
    rooms_min: num(f.rooms_min),
    rooms_max: num(f.rooms_max),
    size_min: num(f.size_min),
    size_max: num(f.size_max),
    desired_yield: num(f.desired_yield),
  };
}

export function FindInvestmentWizard({
  customerId,
  savedProfile,
  offers,
}: {
  customerId: string;
  savedProfile: MatchProfile | null;
  offers: InvestmentOffer[];
}) {
  const [step, setStep] = useState<Step>("intro");
  const [criteria, setCriteria] = useState<RequirementsFormState>(emptyRequirementsForm);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function showMatchProfile() {
    if (!savedProfile) {
      setStep("questionnaire");
      return;
    }
    setResults(matchOffers(savedProfile, offers));
    setStep("results");
  }

  function submitQuestionnaire() {
    const profile = toMatchProfile({
      purchase_purpose: criteria.purchase_purpose || null,
      property_types: criteria.property_types,
      preferred_locations: criteria.preferred_locations.split(",").map((s) => s.trim()).filter(Boolean),
      budget_min: criteria.budget_min,
      budget_max: criteria.budget_max,
      financing_required: criteria.financing_required,
      rooms_min: criteria.rooms_min,
      rooms_max: criteria.rooms_max,
      size_min: criteria.size_min,
      size_max: criteria.size_max,
      desired_yield: criteria.desired_yield,
    });
    setResults(matchOffers(profile, offers));
    setStep("results");
  }

  async function handleSaveAsProfile() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("property_requirements")
      .update(requirementsFormToUpdatePayload(criteria))
      .eq("customer_id", customerId);
    setSaving(false);
    if (!error) setSaved(true);
  }

  if (step === "intro") {
    return (
      <Card>
        <h3 className="text-base font-medium text-slate-900">{t.findInvestment.intro}</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={showMatchProfile}
            className="rounded-lg border-2 border-gold bg-gold/5 p-5 text-left hover:bg-gold/10"
          >
            <div className="font-medium text-slate-900">{t.findInvestment.matchProfile}</div>
            <div className="mt-1 text-sm text-slate-500">{t.findInvestment.matchProfileDesc}</div>
          </button>
          <button
            type="button"
            onClick={() => setStep("questionnaire")}
            className="rounded-lg border border-slate-200 p-5 text-left hover:border-gold hover:bg-gold/5"
          >
            <div className="font-medium text-slate-900">{t.findInvestment.searchDifferent}</div>
            <div className="mt-1 text-sm text-slate-500">{t.findInvestment.searchDifferentDesc}</div>
          </button>
        </div>
      </Card>
    );
  }

  if (step === "questionnaire") {
    return (
      <Card>
        <RequirementsFields value={criteria} onChange={setCriteria} variant="light" />
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" onClick={() => setStep("intro")}>
            ← {t.reports.back}
          </Button>
          <Button onClick={submitQuestionnaire}>{t.registration.next}</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep("intro")}>
          ← {t.reports.startOver}
        </Button>
        {step === "results" && criteria.purchase_purpose && !saved && (
          <Button variant="secondary" onClick={handleSaveAsProfile} disabled={saving}>
            {saving ? t.common.loading : t.findInvestment.saveAsProfile}
          </Button>
        )}
        {saved && <p className="text-sm text-emerald-700">{t.findInvestment.saveAsProfileSaved}</p>}
      </div>

      <h3 className="text-base font-medium text-slate-900">{t.findInvestment.resultsTitle}</h3>

      {results.length === 0 ? (
        <p className="text-sm text-slate-400">{t.findInvestment.noResults}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {results.map((r) => (
            <OfferCard key={r.offer.id} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}
