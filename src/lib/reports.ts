import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export interface ReportOptions {
  /** Trusted customer id — the caller must derive this from the session,
   * never accept it from client input directly. RLS is the real backstop
   * either way, but this keeps every query correctly scoped from the start. */
  customerId: string;
  /** Omit for a portfolio report across every property the customer owns. */
  propertyId?: string;
  fromDate: string; // YYYY-MM-DD, inclusive
  toDate: string; // YYYY-MM-DD, inclusive
}

export interface ReportTransactionRow {
  id: string;
  transaction_date: string;
  property_id: string;
  property_address: string;
  category: string;
  description: string | null;
  amount: number;
}

export interface PropertyInvestmentBreakdown {
  property_id: string;
  property_address: string;
  purchase_price: number;
  purchase_tax_paid: number;
  purchase_brokerage_fee: number;
  purchase_legal_fee: number;
  recognized_improvement_costs: number;
  total_investment: number;
}

export interface ReportResult {
  fromDate: string;
  toDate: string;
  properties: { id: string; address: string }[];
  totalInvestment: number;
  investmentBreakdown: PropertyInvestmentBreakdown[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeTransactions: ReportTransactionRow[];
  expenseTransactions: ReportTransactionRow[];
}

/** Resolves a UI year selection into an inclusive [fromDate, toDate] range,
 * per the spec: a past year is Jan 1 - Dec 31; the current year is
 * Jan 1 - today (never a future date). */
export function resolveYearPeriod(year: number): { fromDate: string; toDate: string } {
  const currentYear = new Date().getFullYear();
  const fromDate = `${year}-01-01`;
  if (year >= currentYear) {
    const today = new Date();
    const toDate = today.toISOString().slice(0, 10);
    return { fromDate, toDate: year === currentYear ? toDate : fromDate };
  }
  return { fromDate, toDate: `${year}-12-31` };
}

type SB = SupabaseClient<Database>;

export async function generateReport(
  supabase: SB,
  options: ReportOptions
): Promise<ReportResult> {
  const { customerId, propertyId, fromDate, toDate } = options;

  let propertiesQuery = supabase
    .from("properties")
    .select("id, property_address, purchase_price")
    .eq("customer_id", customerId);
  if (propertyId) propertiesQuery = propertiesQuery.eq("id", propertyId);
  const { data: properties, error: propertiesError } = await propertiesQuery;
  if (propertiesError) throw propertiesError;

  const propertyIds = (properties ?? []).map((p) => p.id);
  const addressById = new Map((properties ?? []).map((p) => [p.id, p.property_address]));

  if (propertyIds.length === 0) {
    return {
      fromDate,
      toDate,
      properties: [],
      totalInvestment: 0,
      investmentBreakdown: [],
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      incomeTransactions: [],
      expenseTransactions: [],
    };
  }

  const [{ data: taxBasisRows }, { data: transactions, error: txError }] = await Promise.all([
    supabase.from("property_tax_basis").select("*").in("property_id", propertyIds),
    supabase
      .from("property_transactions")
      .select("id, transaction_date, transaction_type, category, description, amount, property_id")
      .in("property_id", propertyIds)
      .gte("transaction_date", fromDate)
      .lte("transaction_date", toDate)
      .order("transaction_date", { ascending: true }),
  ]);
  if (txError) throw txError;

  const taxBasisByProperty = new Map((taxBasisRows ?? []).map((b) => [b.property_id, b]));

  const investmentBreakdown: PropertyInvestmentBreakdown[] = (properties ?? []).map((p) => {
    const basis = taxBasisByProperty.get(p.id);
    const purchasePrice = Number(p.purchase_price ?? 0);
    const purchaseTax = Number(basis?.purchase_tax_paid ?? 0);
    const brokerage = Number(basis?.purchase_brokerage_fee ?? 0);
    const legal = Number(basis?.purchase_legal_fee ?? 0);
    const improvements = Number(basis?.recognized_improvement_costs ?? 0);
    return {
      property_id: p.id,
      property_address: p.property_address,
      purchase_price: purchasePrice,
      purchase_tax_paid: purchaseTax,
      purchase_brokerage_fee: brokerage,
      purchase_legal_fee: legal,
      recognized_improvement_costs: improvements,
      total_investment: purchasePrice + purchaseTax + brokerage + legal + improvements,
    };
  });
  const totalInvestment = investmentBreakdown.reduce((sum, b) => sum + b.total_investment, 0);

  const incomeTransactions: ReportTransactionRow[] = [];
  const expenseTransactions: ReportTransactionRow[] = [];
  for (const tx of transactions ?? []) {
    const row: ReportTransactionRow = {
      id: tx.id,
      transaction_date: tx.transaction_date,
      property_id: tx.property_id,
      property_address: addressById.get(tx.property_id) ?? "—",
      category: tx.category,
      description: tx.description,
      amount: Number(tx.amount),
    };
    if (tx.transaction_type === "income") incomeTransactions.push(row);
    else expenseTransactions.push(row);
  }

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    fromDate,
    toDate,
    properties: (properties ?? []).map((p) => ({ id: p.id, address: p.property_address })),
    totalInvestment,
    investmentBreakdown,
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    incomeTransactions,
    expenseTransactions,
  };
}
