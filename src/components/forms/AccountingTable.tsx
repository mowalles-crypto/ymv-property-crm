"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { PropertyAccounting } from "@/lib/types/domain";

type Row = Pick<
  PropertyAccounting,
  | "id"
  | "month"
  | "rent_received"
  | "expense_1"
  | "expense_1_description"
  | "expense_2"
  | "expense_2_description"
  | "expense_3"
  | "expense_3_description"
  | "expense_4"
  | "expense_4_description"
  | "expense_5"
  | "expense_5_description"
  | "total_expenses"
  | "profit"
>;

type AmountField = "expense_1" | "expense_2" | "expense_3" | "expense_4" | "expense_5";
type DescriptionField =
  | "expense_1_description"
  | "expense_2_description"
  | "expense_3_description"
  | "expense_4_description"
  | "expense_5_description";

const expenseFields: {
  amount: AmountField;
  description: DescriptionField;
  label: string;
  descriptionLabel: string;
}[] = [
  {
    amount: "expense_1",
    description: "expense_1_description",
    label: t.accounting.expense1,
    descriptionLabel: t.accounting.expense1Description,
  },
  {
    amount: "expense_2",
    description: "expense_2_description",
    label: t.accounting.expense2,
    descriptionLabel: t.accounting.expense2Description,
  },
  {
    amount: "expense_3",
    description: "expense_3_description",
    label: t.accounting.expense3,
    descriptionLabel: t.accounting.expense3Description,
  },
  {
    amount: "expense_4",
    description: "expense_4_description",
    label: t.accounting.expense4,
    descriptionLabel: t.accounting.expense4Description,
  },
  {
    amount: "expense_5",
    description: "expense_5_description",
    label: t.accounting.expense5,
    descriptionLabel: t.accounting.expense5Description,
  },
];

export function AccountingTable({
  propertyId,
  year,
  initialRows,
  editable,
}: {
  propertyId: string;
  year: number;
  initialRows: Row[];
  editable: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byMonth = useMemo(() => {
    const map = new Map<number, Row>();
    rows.forEach((r) => map.set(r.month, r));
    return map;
  }, [rows]);

  function recalculate(row: Row): Row {
    const total = expenseFields.reduce(
      (sum, f) => sum + (Number(row[f.amount]) || 0),
      0
    );
    return {
      ...row,
      total_expenses: total,
      profit: (Number(row.rent_received) || 0) - total,
    };
  }

  function updateAmount(month: number, field: "rent_received" | AmountField, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.month === month ? recalculate({ ...r, [field]: value }) : r))
    );
    setDirty((prev) => new Set(prev).add(String(month)));
  }

  function updateDescription(month: number, field: DescriptionField, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.month === month ? { ...r, [field]: value } : r))
    );
    setDirty((prev) => new Set(prev).add(String(month)));
  }

  async function handleCreateYear() {
    setCreating(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_accounting_year", {
      p_property_id: propertyId,
      p_year: year,
    });
    setCreating(false);
    if (error) {
      setError(error.message);
      return;
    }
    setRows((data ?? []) as Row[]);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const changedRows = rows.filter((r) => dirty.has(String(r.month)));
    const payload = changedRows.map((r) => ({
      id: r.id,
      property_id: propertyId,
      year,
      month: r.month,
      rent_received: Number(r.rent_received) || 0,
      expense_1: Number(r.expense_1) || 0,
      expense_1_description: r.expense_1_description,
      expense_2: Number(r.expense_2) || 0,
      expense_2_description: r.expense_2_description,
      expense_3: Number(r.expense_3) || 0,
      expense_3_description: r.expense_3_description,
      expense_4: Number(r.expense_4) || 0,
      expense_4_description: r.expense_4_description,
      expense_5: Number(r.expense_5) || 0,
      expense_5_description: r.expense_5_description,
    }));

    const { error } = await supabase
      .from("property_accounting")
      .upsert(payload, { onConflict: "property_id,year,month" });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDirty(new Set());
  }

  const totals = rows.reduce(
    (acc, r) => {
      const next = { ...acc };
      next.rent_received += Number(r.rent_received) || 0;
      for (const f of expenseFields) next[f.amount] += Number(r[f.amount]) || 0;
      next.total_expenses += Number(r.total_expenses) || 0;
      next.profit += Number(r.profit) || 0;
      return next;
    },
    {
      rent_received: 0,
      expense_1: 0,
      expense_2: 0,
      expense_3: 0,
      expense_4: 0,
      expense_5: 0,
      total_expenses: 0,
      profit: 0,
    } as Record<"rent_received" | AmountField | "total_expenses" | "profit", number>
  );

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500">No accounting records for {year} yet.</p>
        {editable && (
          <Button className="mt-3" onClick={handleCreateYear} disabled={creating}>
            {creating ? t.common.loading : t.accounting.createYear}
          </Button>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const amountInputClass =
    "w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 text-right text-sm focus:border-indigo-400 focus:bg-white focus:outline-none";
  const descInputClass =
    "w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs text-slate-500 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none";

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="py-2 pr-3 text-left align-bottom">{t.accounting.month}</th>
              <th className="py-2 pr-3 text-right align-bottom">{t.accounting.rentReceived}</th>
              {expenseFields.map((f) => (
                <th key={f.amount} className="py-2 pr-3 text-right align-bottom" style={{ minWidth: 150 }}>
                  {f.label}
                  <div className="mt-0.5 text-[10px] font-normal normal-case text-slate-400">
                    {f.descriptionLabel}
                  </div>
                </th>
              ))}
              <th className="py-2 pr-3 text-right align-bottom">{t.accounting.totalExpenses}</th>
              <th className="py-2 pr-3 text-right align-bottom">{t.accounting.profit}</th>
            </tr>
          </thead>
          <tbody>
            {t.accounting.months.map((label, i) => {
              const month = i + 1;
              const row = byMonth.get(month);
              if (!row) return null;
              return (
                <tr key={month} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-1.5 pr-3 align-top font-medium text-slate-700">{label}</td>
                  <td className="py-1.5 pr-3 align-top">
                    {editable ? (
                      <input
                        type="number"
                        className={amountInputClass}
                        value={row.rent_received ?? 0}
                        onChange={(e) => updateAmount(month, "rent_received", e.target.value)}
                      />
                    ) : (
                      <div className="px-1.5 py-0.5 text-right">{formatCurrency(row.rent_received)}</div>
                    )}
                  </td>
                  {expenseFields.map((f) => (
                    <td key={f.amount} className="py-1.5 pr-3 align-top">
                      {editable ? (
                        <div className="space-y-0.5">
                          <input
                            type="number"
                            className={amountInputClass}
                            value={row[f.amount] ?? 0}
                            onChange={(e) => updateAmount(month, f.amount, e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder={f.descriptionLabel}
                            className={descInputClass}
                            value={row[f.description] ?? ""}
                            onChange={(e) => updateDescription(month, f.description, e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="px-1.5 py-0.5 text-right">{formatCurrency(row[f.amount])}</div>
                          {row[f.description] && (
                            <div className="px-1.5 text-right text-xs text-slate-500">
                              {row[f.description]}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="py-1.5 pr-3 align-top text-right text-slate-600">
                    {formatCurrency(row.total_expenses)}
                  </td>
                  <td
                    className={`py-1.5 pr-3 align-top text-right font-medium ${
                      (row.profit ?? 0) < 0 ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(row.profit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-semibold text-slate-900">
              <td className="py-2 pr-3">{t.common.total}</td>
              <td className="py-2 pr-3 text-right">{formatCurrency(totals.rent_received)}</td>
              {expenseFields.map((f) => (
                <td key={f.amount} className="py-2 pr-3 text-right">
                  {formatCurrency(totals[f.amount])}
                </td>
              ))}
              <td className="py-2 pr-3 text-right">{formatCurrency(totals.total_expenses)}</td>
              <td className="py-2 pr-3 text-right">{formatCurrency(totals.profit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {editable && (
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving || dirty.size === 0}>
            {saving ? t.common.loading : t.common.save}
          </Button>
          {dirty.size > 0 && (
            <span className="text-xs text-slate-500">{dirty.size} month(s) changed</span>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
