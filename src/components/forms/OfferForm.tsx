"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import type {
  InvestmentOffer,
  OfferStatus,
  PropertyCondition,
  PropertyType,
  PurchasePurpose,
} from "@/lib/types/domain";

const propertyTypeKeys = Object.keys(t.requirements.propertyTypeOptions) as PropertyType[];
const purposeKeys = Object.keys(t.requirements.purchasePurposeOptions) as PurchasePurpose[];
const conditionKeys = Object.keys(t.requirements.conditionOptions) as PropertyCondition[];
const statusKeys = Object.keys(t.offerStatusOptions) as OfferStatus[];

export function OfferForm({ offer }: { offer?: InvestmentOffer }) {
  const router = useRouter();
  const [addressOrProjectName, setAddressOrProjectName] = useState(offer?.address_or_project_name ?? "");
  const [city, setCity] = useState(offer?.city ?? "");
  const [location, setLocation] = useState(offer?.location ?? "");
  const [propertyType, setPropertyType] = useState<PropertyType>(offer?.property_type ?? "apartment");
  const [propertyPurpose, setPropertyPurpose] = useState<PurchasePurpose>(offer?.property_purpose ?? "investment");
  const [rooms, setRooms] = useState(offer?.rooms?.toString() ?? "");
  const [propertySize, setPropertySize] = useState(offer?.property_size?.toString() ?? "");
  const [propertyPrice, setPropertyPrice] = useState(offer?.property_price?.toString() ?? "");
  const [expectedMonthlyRent, setExpectedMonthlyRent] = useState(offer?.expected_monthly_rent?.toString() ?? "");
  const [expectedAnnualIncome, setExpectedAnnualIncome] = useState(offer?.expected_annual_income?.toString() ?? "");
  const [estimatedAnnualExpenses, setEstimatedAnnualExpenses] = useState(
    offer?.estimated_annual_expenses?.toString() ?? ""
  );
  const [expectedGrossYield, setExpectedGrossYield] = useState(offer?.expected_gross_yield?.toString() ?? "");
  const [expectedNetYield, setExpectedNetYield] = useState(offer?.expected_net_yield?.toString() ?? "");
  const [constructionStatus, setConstructionStatus] = useState<PropertyCondition>(
    offer?.construction_status ?? "second_hand"
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(offer?.expected_delivery_date ?? "");
  const [minimumEquityRequired, setMinimumEquityRequired] = useState(
    offer?.minimum_equity_required?.toString() ?? ""
  );
  const [financingAvailable, setFinancingAvailable] = useState(offer?.financing_available ?? false);
  const [overridePurchaseTax, setOverridePurchaseTax] = useState(
    offer?.override_purchase_tax_amount?.toString() ?? ""
  );
  const [overrideLawyerFee, setOverrideLawyerFee] = useState(offer?.override_lawyer_fee_amount?.toString() ?? "");
  const [overrideBrokerageFee, setOverrideBrokerageFee] = useState(
    offer?.override_brokerage_fee_amount?.toString() ?? ""
  );
  const [economicAnalysis, setEconomicAnalysis] = useState(offer?.economic_analysis ?? "");
  const [shortDescription, setShortDescription] = useState(offer?.short_description ?? "");
  const [status, setStatus] = useState<OfferStatus>(offer?.status ?? "draft");
  const [featured, setFeatured] = useState(offer?.featured ?? false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function num(v: string): number | null {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  async function handleSave() {
    setError(null);
    if (!addressOrProjectName.trim() || !city.trim() || !propertyPrice) {
      setError(t.common.required);
      return;
    }

    const payload = {
      address_or_project_name: addressOrProjectName,
      city,
      location: location || null,
      property_type: propertyType,
      property_purpose: propertyPurpose,
      rooms: num(rooms),
      property_size: num(propertySize),
      property_price: num(propertyPrice) ?? 0,
      expected_monthly_rent: num(expectedMonthlyRent),
      expected_annual_income: num(expectedAnnualIncome),
      estimated_annual_expenses: num(estimatedAnnualExpenses),
      expected_gross_yield: num(expectedGrossYield),
      expected_net_yield: num(expectedNetYield),
      construction_status: constructionStatus,
      expected_delivery_date: expectedDeliveryDate || null,
      minimum_equity_required: num(minimumEquityRequired),
      financing_available: financingAvailable,
      override_purchase_tax_amount: num(overridePurchaseTax),
      override_lawyer_fee_amount: num(overrideLawyerFee),
      override_brokerage_fee_amount: num(overrideBrokerageFee),
      economic_analysis: economicAnalysis || null,
      short_description: shortDescription || null,
      status,
      featured,
      published_at: status === "active" ? new Date().toISOString() : offer?.published_at ?? null,
    };

    setSaving(true);
    const supabase = createClient();

    if (offer) {
      const { error } = await supabase.from("investment_offers").update(payload).eq("id", offer.id);
      setSaving(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.refresh();
    } else {
      const { data, error } = await supabase
        .from("investment_offers")
        .insert(payload)
        .select("id")
        .single();
      setSaving(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push(`/admin/offers/${data.id}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Property Information</legend>
        <div className="space-y-4">
          <Input
            id="project_name"
            label={t.offersAdmin.projectName}
            required
            value={addressOrProjectName}
            onChange={(e) => setAddressOrProjectName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input id="city" label={t.offersAdmin.city} required value={city} onChange={(e) => setCity(e.target.value)} />
            <Input
              id="location"
              label={t.offersAdmin.location}
              optional
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Select
              id="property_type"
              label={t.offersAdmin.propertyType}
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
            >
              {propertyTypeKeys.map((k) => (
                <option key={k} value={k}>
                  {t.requirements.propertyTypeOptions[k]}
                </option>
              ))}
            </Select>
            <Select
              id="property_purpose"
              label={t.offersAdmin.propertyPurpose}
              value={propertyPurpose}
              onChange={(e) => setPropertyPurpose(e.target.value as PurchasePurpose)}
            >
              {purposeKeys.map((k) => (
                <option key={k} value={k}>
                  {t.requirements.purchasePurposeOptions[k]}
                </option>
              ))}
            </Select>
            <Input id="rooms" type="number" step="0.5" label={t.offersAdmin.rooms} optional value={rooms} onChange={(e) => setRooms(e.target.value)} />
            <Input id="size" type="number" label={t.offersAdmin.size} optional value={propertySize} onChange={(e) => setPropertySize(e.target.value)} />
          </div>
          <Select
            id="construction_status"
            label={t.offersAdmin.constructionStatus}
            value={constructionStatus}
            onChange={(e) => setConstructionStatus(e.target.value as PropertyCondition)}
          >
            {conditionKeys.map((k) => (
              <option key={k} value={k}>
                {t.requirements.conditionOptions[k]}
              </option>
            ))}
          </Select>
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Economic Analysis</legend>
        <div className="space-y-4">
          <Input
            id="price"
            type="number"
            label={t.offersAdmin.price}
            required
            value={propertyPrice}
            onChange={(e) => setPropertyPrice(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input id="monthly_rent" type="number" label={t.offersAdmin.monthlyRent} optional value={expectedMonthlyRent} onChange={(e) => setExpectedMonthlyRent(e.target.value)} />
            <Input id="annual_income" type="number" label={t.offersAdmin.annualIncome} optional value={expectedAnnualIncome} onChange={(e) => setExpectedAnnualIncome(e.target.value)} />
            <Input id="annual_expenses" type="number" label={t.offersAdmin.annualExpenses} optional value={estimatedAnnualExpenses} onChange={(e) => setEstimatedAnnualExpenses(e.target.value)} />
            <Input id="gross_yield" type="number" step="0.1" label={t.offersAdmin.grossYield} optional value={expectedGrossYield} onChange={(e) => setExpectedGrossYield(e.target.value)} />
          </div>
          <Input id="net_yield" type="number" step="0.1" label={t.offersAdmin.netYield} optional value={expectedNetYield} onChange={(e) => setExpectedNetYield(e.target.value)} />
          <Textarea
            id="economic_analysis"
            label={t.offersAdmin.economicAnalysis}
            optional
            rows={4}
            value={economicAnalysis}
            onChange={(e) => setEconomicAnalysis(e.target.value)}
          />
          <Textarea
            id="short_description"
            label={t.offersAdmin.shortDescription}
            optional
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Financing</legend>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="min_equity" type="number" label={t.offersAdmin.minEquity} optional value={minimumEquityRequired} onChange={(e) => setMinimumEquityRequired(e.target.value)} />
            <Input id="delivery_date" type="date" label={t.offersAdmin.deliveryDate} optional value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
          </div>
          <Checkbox
            id="financing_available"
            label={t.offersAdmin.financingAvailable}
            checked={financingAvailable}
            onChange={(e) => setFinancingAvailable(e.target.checked)}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">{t.offersAdmin.overridesTitle}</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input id="override_tax" type="number" label={t.offersAdmin.overridePurchaseTax} optional value={overridePurchaseTax} onChange={(e) => setOverridePurchaseTax(e.target.value)} />
          <Input id="override_lawyer" type="number" label={t.offersAdmin.overrideLawyerFee} optional value={overrideLawyerFee} onChange={(e) => setOverrideLawyerFee(e.target.value)} />
          <Input id="override_brokerage" type="number" label={t.offersAdmin.overrideBrokerageFee} optional value={overrideBrokerageFee} onChange={(e) => setOverrideBrokerageFee(e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">{t.offersAdmin.status}</legend>
        <div className="grid grid-cols-2 gap-4">
          <Select id="status" label={t.offersAdmin.status} value={status} onChange={(e) => setStatus(e.target.value as OfferStatus)}>
            {statusKeys.map((k) => (
              <option key={k} value={k}>
                {t.offerStatusOptions[k]}
              </option>
            ))}
          </Select>
          <div className="flex items-end pb-2">
            <Checkbox id="featured" label={t.offersAdmin.featured} checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          </div>
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? t.common.loading : t.common.save}
      </Button>
    </div>
  );
}
