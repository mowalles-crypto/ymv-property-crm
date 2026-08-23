import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";

async function getStats() {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const [
    { count: totalClients },
    { count: totalLeads },
    { count: totalActive },
    { count: totalProperties },
    { count: rented },
    { count: underConstruction },
    { count: vacant },
    { count: sold },
    { data: accountingRows },
  ] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("customer_status", "lead"),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("customer_status", "active"),
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("property_status", "rented"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("property_status", "under_construction"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("property_status", "vacant"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("property_status", "sold"),
    supabase
      .from("property_accounting")
      .select("rent_received, total_expenses, profit")
      .eq("year", currentYear),
  ]);

  const rentThisYear = (accountingRows ?? []).reduce(
    (sum, r) => sum + Number(r.rent_received ?? 0),
    0
  );
  const expensesThisYear = (accountingRows ?? []).reduce(
    (sum, r) => sum + Number(r.total_expenses ?? 0),
    0
  );
  const profitThisYear = (accountingRows ?? []).reduce(
    (sum, r) => sum + Number(r.profit ?? 0),
    0
  );

  return {
    totalClients: totalClients ?? 0,
    totalLeads: totalLeads ?? 0,
    totalActive: totalActive ?? 0,
    totalProperties: totalProperties ?? 0,
    rented: rented ?? 0,
    underConstruction: underConstruction ?? 0,
    vacant: vacant ?? 0,
    sold: sold ?? 0,
    rentThisYear,
    expensesThisYear,
    profitThisYear,
  };
}

export default async function AdminDashboardPage() {
  const s = await getStats();

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-slate-900">
        {t.dashboard.admin.title}
      </h2>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-500">Clients</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label={t.dashboard.admin.totalClients} value={s.totalClients} />
          <StatCard label={t.dashboard.admin.totalLeads} value={s.totalLeads} />
          <StatCard label={t.dashboard.admin.totalActive} value={s.totalActive} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-500">Properties</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label={t.dashboard.admin.totalProperties} value={s.totalProperties} />
          <StatCard label={t.dashboard.admin.rentedProperties} value={s.rented} />
          <StatCard label={t.dashboard.admin.underConstruction} value={s.underConstruction} />
          <StatCard label={t.dashboard.admin.vacantProperties} value={s.vacant} />
          <StatCard label={t.dashboard.admin.soldProperties} value={s.sold} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-500">
          Financials — {new Date().getFullYear()}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label={t.dashboard.admin.rentThisYear}
            value={formatCurrency(s.rentThisYear)}
          />
          <StatCard
            label={t.dashboard.admin.expensesThisYear}
            value={formatCurrency(s.expensesThisYear)}
          />
          <StatCard
            label={t.dashboard.admin.profitThisYear}
            value={formatCurrency(s.profitThisYear)}
          />
        </div>
      </div>
    </div>
  );
}
