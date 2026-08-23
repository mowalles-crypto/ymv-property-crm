import { Input, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { t } from "@/lib/i18n";
import type { RequirementsFormState } from "@/lib/types/forms";
import type { PropertyType } from "@/lib/types/domain";

const propertyTypeKeys = Object.keys(
  t.requirements.propertyTypeOptions
) as PropertyType[];

export function RequirementsFields({
  value,
  onChange,
}: {
  value: RequirementsFormState;
  onChange: (next: RequirementsFormState) => void;
}) {
  function set<K extends keyof RequirementsFormState>(
    key: K,
    v: RequirementsFormState[K]
  ) {
    onChange({ ...value, [key]: v });
  }

  function toggleType(type: PropertyType) {
    const next = value.property_types.includes(type)
      ? value.property_types.filter((v) => v !== type)
      : [...value.property_types, type];
    set("property_types", next);
  }

  return (
    <div className="space-y-6">
      <Select
        id="purchase_purpose"
        label={t.requirements.purchasePurpose}
        required
        value={value.purchase_purpose}
        onChange={(e) =>
          set("purchase_purpose", e.target.value as RequirementsFormState["purchase_purpose"])
        }
      >
        <option value="" disabled>
          {t.common.search}…
        </option>
        {Object.entries(t.requirements.purchasePurposeOptions).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </Select>

      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">
          {t.requirements.propertyTypes}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {propertyTypeKeys.map((key) => (
            <Checkbox
              key={key}
              id={`type-${key}`}
              label={t.requirements.propertyTypeOptions[key]}
              checked={value.property_types.includes(key)}
              onChange={() => toggleType(key)}
            />
          ))}
        </div>
      </div>

      <Input
        id="preferred_locations"
        label={t.requirements.preferredLocations}
        placeholder="e.g. Tel Aviv, Herzliya, Ra'anana"
        value={value.preferred_locations}
        onChange={(e) => set("preferred_locations", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="budget_min"
          type="number"
          label={t.requirements.budgetMin}
          value={value.budget_min}
          onChange={(e) => set("budget_min", e.target.value)}
        />
        <Input
          id="budget_max"
          type="number"
          label={t.requirements.budgetMax}
          value={value.budget_max}
          onChange={(e) => set("budget_max", e.target.value)}
        />
      </div>

      <Input
        id="available_equity"
        type="number"
        label={t.requirements.availableEquity}
        value={value.available_equity}
        onChange={(e) => set("available_equity", e.target.value)}
      />

      <Select
        id="financing_required"
        label={t.requirements.financingRequired}
        value={value.financing_required}
        onChange={(e) =>
          set("financing_required", e.target.value as RequirementsFormState["financing_required"])
        }
      >
        {Object.entries(t.requirements.financingOptions).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </Select>

      {value.financing_required === "yes" && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="financing_amount"
            type="number"
            label={t.requirements.financingAmount}
            optional
            value={value.financing_amount}
            onChange={(e) => set("financing_amount", e.target.value)}
          />
          <Input
            id="financing_percentage"
            type="number"
            label={t.requirements.financingPercentage}
            optional
            value={value.financing_percentage}
            onChange={(e) => set("financing_percentage", e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="rooms_min"
          type="number"
          step="0.5"
          label={t.requirements.roomsMin}
          value={value.rooms_min}
          onChange={(e) => set("rooms_min", e.target.value)}
        />
        <Input
          id="rooms_max"
          type="number"
          step="0.5"
          label={t.requirements.roomsMax}
          value={value.rooms_max}
          onChange={(e) => set("rooms_max", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="size_min"
          type="number"
          label={t.requirements.sizeMin}
          value={value.size_min}
          onChange={(e) => set("size_min", e.target.value)}
        />
        <Input
          id="size_max"
          type="number"
          label={t.requirements.sizeMax}
          value={value.size_max}
          onChange={(e) => set("size_max", e.target.value)}
        />
      </div>

      <Select
        id="property_condition"
        label={t.requirements.propertyCondition}
        value={value.property_condition}
        onChange={(e) =>
          set("property_condition", e.target.value as RequirementsFormState["property_condition"])
        }
      >
        {Object.entries(t.requirements.conditionOptions).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </Select>

      <Select
        id="purchase_timeline"
        label={t.requirements.purchaseTimeline}
        required
        value={value.purchase_timeline}
        onChange={(e) =>
          set("purchase_timeline", e.target.value as RequirementsFormState["purchase_timeline"])
        }
      >
        <option value="" disabled>
          {t.common.search}…
        </option>
        {Object.entries(t.requirements.timelineOptions).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </Select>

      {value.purchase_purpose.startsWith("investment") && (
        <Input
          id="desired_yield"
          type="number"
          step="0.1"
          label={t.requirements.desiredYield}
          optional
          value={value.desired_yield}
          onChange={(e) => set("desired_yield", e.target.value)}
        />
      )}

      <div>
        <div className="mb-1 text-sm font-medium text-slate-700">
          {t.requirements.additionalPreferences}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Checkbox
            id="wants_balcony"
            label={t.requirements.wantsBalcony}
            checked={value.wants_balcony}
            onChange={(e) => set("wants_balcony", e.target.checked)}
          />
          <Checkbox
            id="wants_parking"
            label={t.requirements.wantsParking}
            checked={value.wants_parking}
            onChange={(e) => set("wants_parking", e.target.checked)}
          />
          <Checkbox
            id="wants_storage"
            label={t.requirements.wantsStorage}
            checked={value.wants_storage}
            onChange={(e) => set("wants_storage", e.target.checked)}
          />
          <Checkbox
            id="wants_elevator"
            label={t.requirements.wantsElevator}
            checked={value.wants_elevator}
            onChange={(e) => set("wants_elevator", e.target.checked)}
          />
          <Checkbox
            id="wants_accessibility"
            label={t.requirements.wantsAccessibility}
            checked={value.wants_accessibility}
            onChange={(e) => set("wants_accessibility", e.target.checked)}
          />
          <Checkbox
            id="wants_public_transport_proximity"
            label={t.requirements.wantsPublicTransport}
            checked={value.wants_public_transport_proximity}
            onChange={(e) => set("wants_public_transport_proximity", e.target.checked)}
          />
        </div>
      </div>

      <Input
        id="preferred_floor"
        label={t.requirements.preferredFloor}
        optional
        value={value.preferred_floor}
        onChange={(e) => set("preferred_floor", e.target.value)}
      />

      <Textarea
        id="other_preferences"
        label={t.requirements.otherPreferences}
        optional
        rows={2}
        value={value.other_preferences}
        onChange={(e) => set("other_preferences", e.target.value)}
      />

      <Textarea
        id="additional_requirements"
        label={t.requirements.additionalRequirements}
        optional
        rows={3}
        value={value.additional_requirements}
        onChange={(e) => set("additional_requirements", e.target.value)}
      />
    </div>
  );
}
