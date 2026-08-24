import type {
  FinancingRequirement,
  PropertyCondition,
  PropertyType,
  PurchasePurpose,
  PurchaseTimeline,
} from "@/lib/types/domain";
import type { Database } from "@/lib/types/database";

type RegistrationRpcArgs =
  Database["public"]["Functions"]["complete_client_registration"]["Args"];

export interface RequirementsFormState {
  purchase_purpose: PurchasePurpose | "";
  property_types: PropertyType[];
  preferred_locations: string;
  budget_min: string;
  budget_max: string;
  available_equity: string;
  financing_required: FinancingRequirement;
  financing_amount: string;
  financing_percentage: string;
  rooms_min: string;
  rooms_max: string;
  size_min: string;
  size_max: string;
  property_condition: PropertyCondition;
  purchase_timeline: PurchaseTimeline | "";
  desired_yield: string;
  wants_balcony: boolean;
  wants_parking: boolean;
  wants_storage: boolean;
  wants_elevator: boolean;
  wants_accessibility: boolean;
  preferred_floor: string;
  wants_public_transport_proximity: boolean;
  other_preferences: string;
  additional_requirements: string;
}

export const emptyRequirementsForm: RequirementsFormState = {
  purchase_purpose: "",
  property_types: [],
  preferred_locations: "",
  budget_min: "",
  budget_max: "",
  available_equity: "",
  financing_required: "not_sure",
  financing_amount: "",
  financing_percentage: "",
  rooms_min: "",
  rooms_max: "",
  size_min: "",
  size_max: "",
  property_condition: "no_preference",
  purchase_timeline: "",
  desired_yield: "",
  wants_balcony: false,
  wants_parking: false,
  wants_storage: false,
  wants_elevator: false,
  wants_accessibility: false,
  preferred_floor: "",
  wants_public_transport_proximity: false,
  other_preferences: "",
  additional_requirements: "",
};

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function buildRegistrationRpcArgs(
  fullName: string,
  phone1: string,
  phone2: string,
  f: RequirementsFormState
): RegistrationRpcArgs {
  const args = {
    p_customer_name: fullName,
    p_phone_1: phone1,
    p_phone_2: phone2 || "",
    ...requirementsFormToRpcArgs(f),
  };
  // The generated types mark every Arg as non-nullable, but the underlying
  // Postgres function accepts NULL for every optional field — this cast
  // reflects that gap rather than papering over a real type mismatch.
  return args as unknown as RegistrationRpcArgs;
}

/** Plain column-named payload for updating an existing property_requirements
 * row directly (as opposed to the p_-prefixed RPC argument shape above). */
export function requirementsFormToUpdatePayload(f: RequirementsFormState) {
  return {
    purchase_purpose: f.purchase_purpose as PurchasePurpose,
    property_types: f.property_types,
    preferred_locations: f.preferred_locations
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    budget_min: numOrNull(f.budget_min),
    budget_max: numOrNull(f.budget_max),
    available_equity: numOrNull(f.available_equity),
    financing_required: f.financing_required,
    financing_amount: numOrNull(f.financing_amount),
    financing_percentage: numOrNull(f.financing_percentage),
    rooms_min: numOrNull(f.rooms_min),
    rooms_max: numOrNull(f.rooms_max),
    size_min: numOrNull(f.size_min),
    size_max: numOrNull(f.size_max),
    property_condition: f.property_condition,
    purchase_timeline: f.purchase_timeline as PurchaseTimeline,
    desired_yield: numOrNull(f.desired_yield),
    wants_balcony: f.wants_balcony,
    wants_parking: f.wants_parking,
    wants_storage: f.wants_storage,
    wants_elevator: f.wants_elevator,
    wants_accessibility: f.wants_accessibility,
    preferred_floor: f.preferred_floor || null,
    wants_public_transport_proximity: f.wants_public_transport_proximity,
    other_preferences: f.other_preferences || null,
    additional_requirements: f.additional_requirements || null,
  };
}

function requirementsFormToRpcArgs(f: RequirementsFormState) {
  return {
    p_purchase_purpose: f.purchase_purpose as PurchasePurpose,
    p_property_types: f.property_types,
    p_preferred_locations: f.preferred_locations
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    p_budget_min: numOrNull(f.budget_min),
    p_budget_max: numOrNull(f.budget_max),
    p_available_equity: numOrNull(f.available_equity),
    p_financing_required: f.financing_required,
    p_financing_amount: numOrNull(f.financing_amount),
    p_financing_percentage: numOrNull(f.financing_percentage),
    p_rooms_min: numOrNull(f.rooms_min),
    p_rooms_max: numOrNull(f.rooms_max),
    p_size_min: numOrNull(f.size_min),
    p_size_max: numOrNull(f.size_max),
    p_property_condition: f.property_condition,
    p_purchase_timeline: f.purchase_timeline as PurchaseTimeline,
    p_desired_yield: numOrNull(f.desired_yield),
    p_wants_balcony: f.wants_balcony,
    p_wants_parking: f.wants_parking,
    p_wants_storage: f.wants_storage,
    p_wants_elevator: f.wants_elevator,
    p_wants_accessibility: f.wants_accessibility,
    p_preferred_floor: f.preferred_floor || null,
    p_wants_public_transport_proximity: f.wants_public_transport_proximity,
    p_other_preferences: f.other_preferences || null,
    p_additional_requirements: f.additional_requirements || null,
  };
}
