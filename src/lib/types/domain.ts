import type { Database } from "./database";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyAccounting =
  Database["public"]["Tables"]["property_accounting"]["Row"];
export type PropertyRequirements =
  Database["public"]["Tables"]["property_requirements"]["Row"];
export type CustomerSpouse =
  Database["public"]["Tables"]["customer_spouses"]["Row"];
export type CustomerBankAccount =
  Database["public"]["Tables"]["customer_bank_accounts"]["Row"];
export type CustomerDocument =
  Database["public"]["Tables"]["customer_documents"]["Row"];

export type UserRole = Database["public"]["Enums"]["user_role"];
export type DocumentType = Database["public"]["Enums"]["document_type"];
export type CustomerStatus = Database["public"]["Enums"]["customer_status"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];
export type PurchasePurpose = Database["public"]["Enums"]["purchase_purpose"];
export type PropertyType = Database["public"]["Enums"]["property_type"];
export type FinancingRequirement =
  Database["public"]["Enums"]["financing_requirement"];
export type PropertyCondition =
  Database["public"]["Enums"]["property_condition"];
export type PurchaseTimeline =
  Database["public"]["Enums"]["purchase_timeline"];
