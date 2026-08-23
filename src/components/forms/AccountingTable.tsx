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
  | "expense_2"
  | "expense_3"
  | "expense_4"
  | "expense_5"
  | "expense_description"
  | "total_expenses"
  | "profit"
>;

const numericFields = [
  "rent_received",
  "expense_1",
  "expense_2",
  "expense_3",
  "expense_4",
  "expense_5",
] as const;

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

  function updateField(
    month: number,
    field: (typeof numericFields)[number] | "expense_description",
    value: string
  ) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.month !== month) return r;
        const updated = { ...r, [field]: value } as Row;
        if (field !== "expense_description") {
          const total = numericFields
            .filter((f) => f !== "rent_received")
            .reduce((sum, f) => sum + (Number(updated[f]) || 0), 0);
          updated.total_expenses = total;
          updated.profit = (Number(updated.rent_received) || 0) - total;
        }
        return updated;
      })
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
      expense_2: Number(r.expense_2) || 0,
      expense_3: Number(r.expense_3) || 0,
      expense_4: Number(r.expense_4) || 0,
      expense_5: Number(r.expense_5) || 0,
      expense_description: r.expense_description,
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
    (acc, r) => ({
      rent_received: acc.rent_received + (Number(r.rent_received) || 0),
      expense_1: acc.expense_1 + (Number(r.expense_1) || 0),
      expense_2: acc.expense_2 + (Number(r.expense_2) || 0),
      expense_3: acc.expense_3 + (Number(r.expense_3) || 0),
      expense_4: acc.expense_4 + (Number(r.expense_4) || 0),
      expense_5: acc.expense_5 + (Number(r.expense_5) || 0),
      total_expenses: acc.total_expenses + (Number(r.total_expenses) || 0),
      profit: acc.profit + (Number(r.profit) || 0),
    }),
    {
      rent_received: 0,
      expense_1: 0,
      expense_2: 0,
      expense_3: 0,
      expense_4: 0,
      expense_5: 0,
      total_expenses: 0,
      profit: 0,
    }
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

  const cellClass = editable
    ? "w-24 rounded border border-transparent bg-transparent px-1.5 py-1 text-right text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
    : "px-1.5 py-1 text-right text-sm";

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="py-2 pr-2 text-left">{t.accounting.month}</th>
              <th className="py-2 pr-2 text-right">{t.accounting.rentReceived}</th>
              <th className="py-2 pr-2 text-right">{t.accounting.expense1}</th>
              <th className="py-2 pr-2 text-right">{t.accounting.expense2}</th>
              <th className="py-2 pr-2 text-right">{t.accounting.expense3}</th>
              <th className="py-2 pr-2 text-right">{t.accounting.expense4}</th>
              <th className="py-2 pr-2 text-right">{t.accounting.expense5}</th>
              <th className="py-2 pr-2 text-left">{t.accounting.expenseDescription}</th>
              <th className="py-2 pr-2 text-right">{t.accounting.totalExpenses}</th>
              <th className="py-2 pr-2 text-right">{t.accounting.profit}</th>
            </tr>
          </thead>
          <tbody>
            {t.accounting.months.map((label, i) => {
              const month = i + 1;
              const row = byMonth.get(month);
              if (!row) return null;
              return (
                <tr key={month} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-1 pr-2 font-medium text-slate-700">{label}</td>
                  {numericFields.map((f) => (
                    <td key={f} className="py-1 pr-2">
                      {editable ? (
                        <input
                          type="number"
                          className={cellClass}
                          value={row[f] ?? 0}
                          onChange={(e) => updateField(month, f, e.target.value)}
                        />
                      ) : (
                        <div className={cellClass}>{formatCurrency(row[f])}</div>
                      )}
                    </td>
                  ))}
                  <td className="py-1 pr-2">
                    {editable ? (
                      <input
                        type="text"
                        className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
                        value={row.expense_description ?? ""}
                        onChange={(e) =>
                          updateField(month, "expense_description", e.target.value)
                        }
                      />
                    ) : (
                      <span className="text-slate-500">{row.expense_description ?? "—"}</span>
                    )}
                  </td>
                  <td className="py-1 pr-2 text-right text-slate-600">
                    {formatCurrency(row.total_expenses)}
                  </td>
                  <td
                    className={`py-1 pr-2 text-right font-medium ${
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
              <td className="py-2 pr-2">{t.common.total}</td>
              <td className="py-2 pr-2 text-right">{formatCurrency(totals.rent_received)}</td>
              <td className="py-2 pr-2 text-right">{formatCurrency(totals.expense_1)}</td>
              <td className="py-2 pr-2 text-right">{formatCurrency(totals.expense_2)}</td>
              <td className="py-2 pr-2 text-right">{formatCurrency(totals.expense_3)}</td>
              <td className="py-2 pr-2 text-right">{formatCurrency(totals.expense_4)}</td>
              <td className="py-2 pr-2 text-right">{formatCurrency(totals.expense_5)}</td>
              <td className="py-2 pr-2"></td>
              <td className="py-2 pr-2 text-right">{formatCurrency(totals.total_expenses)}</td>
              <td className="py-2 pr-2 text-right">{formatCurrency(totals.profit)}</td>
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
