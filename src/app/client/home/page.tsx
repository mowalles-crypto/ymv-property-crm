import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { generateReport, resolveYearPeriod } from "@/lib/reports";
import { ActionCard } from "@/components/ui/ActionCard";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";

export default async function ClientHomePage() {
  const profile = await requireProfile();
  const customerId = profile.customer_id!;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("customer_name")
    .eq("id", customerId)
    .single();

  const { data: properties } = await supabase
    .from("properties")
    .select("id")
    .eq("customer_id", customerId);

  const { fromDate, toDate } = resolveYearPeriod(new Date().getFullYear());
  const report = await generateReport(supabase, { customerId, fromDate, toDate });

  return (
    <div className="space-y-10">
      <div>
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-medium text-slate-900">
          {customer?.customer_name ? `${t.home.welcome}, ${customer.customer_name}` : t.home.welcome}
        </h2>
        <div className="mt-2 h-px w-12 bg-gradient-to-r from-gold-light via-gold to-gold-dark" />
        <p className="mt-4 text-lg text-slate-600">{t.home.question}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <ActionCard
          href="/client/reports"
          title={t.home.viewInvestmentsTitle}
          description={t.home.viewInvestmentsDesc}
          icon={<ChartIcon />}
        />
        <ActionCard
          href="/client/find-investment"
          title={t.home.findInvestmentTitle}
          description={t.home.findInvestmentDesc}
          icon={<SearchIcon />}
        />
        <ActionCard
          href="/client/sell"
          title={t.home.sellInvestmentTitle}
          description={t.home.sellInvestmentDesc}
          icon={<KeyIcon />}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={t.home.activeProperties} value={properties?.length ?? 0} />
        <StatCard label={t.home.incomeThisYear} value={formatCurrency(report.totalIncome)} />
        <StatCard label={t.home.expensesThisYear} value={formatCurrency(report.totalExpenses)} />
        <StatCard label={t.home.netProfitThisYear} value={formatCurrency(report.netProfit)} />
      </div>
    </div>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-4" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6M15.5 7.5 18 5M17.5 9.5 20 7" />
    </svg>
  );
}
