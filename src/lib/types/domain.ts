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
export type PropertyTransaction =
  Database["public"]["Tables"]["property_transactions"]["Row"];
export type InvestmentOffer =
  Database["public"]["Tables"]["investment_offers"]["Row"];
export type InvestmentOfferDocument =
  Database["public"]["Tables"]["investment_offer_documents"]["Row"];
export type InvestmentInquiry =
  Database["public"]["Tables"]["investment_inquiries"]["Row"];
export type PropertySaleRequest =
  Database["public"]["Tables"]["property_sale_requests"]["Row"];
export type PropertyTaxBasis =
  Database["public"]["Tables"]["property_tax_basis"]["Row"];
export type AcquisitionCostRule =
  Database["public"]["Tables"]["acquisition_cost_rules"]["Row"];
export type CapitalGainsTaxRule =
  Database["public"]["Tables"]["capital_gains_tax_rules"]["Row"];
export type CapitalGainsTaxEstimate =
  Database["public"]["Tables"]["capital_gains_tax_estimates"]["Row"];

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
export type TransactionType = Database["public"]["Enums"]["transaction_type"];
export type TransactionCategory =
  Database["public"]["Enums"]["transaction_category"];
export type OfferStatus = Database["public"]["Enums"]["offer_status"];
export type OfferDocumentType =
  Database["public"]["Enums"]["offer_document_type"];
export type InquiryStatus = Database["public"]["Enums"]["inquiry_status"];
export type SaleRequestStatus =
  Database["public"]["Enums"]["sale_request_status"];
export type AcquisitionCostType =
  Database["public"]["Enums"]["acquisition_cost_type"];
export type CostCalculationType =
  Database["public"]["Enums"]["cost_calculation_type"];
