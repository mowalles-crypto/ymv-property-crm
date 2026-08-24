"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { PropertyTransaction, TransactionCategory, TransactionType } from "@/lib/types/domain";

const categoryKeys = Object.keys(t.transactionCategoryOptions) as TransactionCategory[];

export function TransactionsTable({
  propertyId,
  transactions,
}: {
  propertyId: string;
  transactions: PropertyTransaction[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PropertyTransaction | null>(null);

  const totalIncome = transactions
    .filter((tx) => tx.transaction_type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpense = transactions
    .filter((tx) => tx.transaction_type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("property_transactions").delete().eq("id", id);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-6 text-sm">
          <span className="text-slate-500">
            {t.reports.totalIncome}: <span className="font-medium text-emerald-700">{formatCurrency(totalIncome)}</span>
          </span>
          <span className="text-slate-500">
            {t.reports.totalExpenses}: <span className="font-medium text-red-600">{formatCurrency(totalExpense)}</span>
          </span>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          {t.financialActivityAdmin.addTransaction}
        </Button>
      </div>

      {showForm && (
        <TransactionForm
          propertyId={propertyId}
          transaction={editing}
          onDone={() => {
            setShowForm(false);
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="py-2 pr-3">{t.financialActivityAdmin.date}</th>
              <th className="py-2 pr-3">{t.financialActivityAdmin.type}</th>
              <th className="py-2 pr-3">{t.financialActivityAdmin.category}</th>
              <th className="py-2 pr-3">{t.financialActivityAdmin.description}</th>
              <th className="py-2 pr-3 text-right">{t.financialActivityAdmin.amount}</th>
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 pr-3">{formatDate(tx.transaction_date)}</td>
                <td className="py-2 pr-3">
                  <span
                    className={
                      tx.transaction_type === "income"
                        ? "text-emerald-700"
                        : "text-red-600"
                    }
                  >
                    {tx.transaction_type === "income" ? t.financialActivityAdmin.typeIncome : t.financialActivityAdmin.typeExpense}
                  </span>
                </td>
                <td className="py-2 pr-3">{t.transactionCategoryOptions[tx.category]}</td>
                <td className="py-2 pr-3 text-slate-500">{tx.description ?? "—"}</td>
                <td className="py-2 pr-3 text-right">{formatCurrency(tx.amount)}</td>
                <td className="py-2 pr-3 text-right">
                  <button
                    type="button"
                    className="mr-3 text-xs font-medium text-gold-dark hover:text-gold"
                    onClick={() => {
                      setEditing(tx);
                      setShowForm(true);
                    }}
                  >
                    {t.common.edit}
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(tx.id)}
                  >
                    {t.common.delete}
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  {t.common.noResults}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionForm({
  propertyId,
  transaction,
  onDone,
  onCancel,
}: {
  propertyId: string;
  transaction: PropertyTransaction | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [transactionType, setTransactionType] = useState<TransactionType>(
    transaction?.transaction_type ?? "income"
  );
  const [category, setCategory] = useState<TransactionCategory>(transaction?.category ?? "rent");
  const [date, setDate] = useState(transaction?.transaction_date ?? new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [notes, setNotes] = useState(transaction?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    const numAmount = Number(amount);
    if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const payload = {
      property_id: propertyId,
      transaction_date: date,
      transaction_type: transactionType,
      category,
      amount: numAmount,
      description: description || null,
      notes: notes || null,
    };

    const { error } = transaction
      ? await supabase.from("property_transactions").update(payload).eq("id", transaction.id)
      : await supabase.from("property_transactions").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onDone();
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Select
          id="tx_type"
          label={t.financialActivityAdmin.type}
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value as TransactionType)}
        >
          <option value="income">{t.financialActivityAdmin.typeIncome}</option>
          <option value="expense">{t.financialActivityAdmin.typeExpense}</option>
        </Select>
        <Select
          id="tx_category"
          label={t.financialActivityAdmin.category}
          value={category}
          onChange={(e) => setCategory(e.target.value as TransactionCategory)}
        >
          {categoryKeys.map((k) => (
            <option key={k} value={k}>
              {t.transactionCategoryOptions[k]}
            </option>
          ))}
        </Select>
        <Input
          id="tx_date"
          type="date"
          label={t.financialActivityAdmin.date}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          id="tx_amount"
          type="number"
          label={t.financialActivityAdmin.amount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="tx_description"
          label={t.financialActivityAdmin.description}
          optional
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Textarea
          id="tx_notes"
          label={t.financialActivityAdmin.notes}
          optional
          rows={1}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t.common.loading : t.common.save}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          {t.common.cancel}
        </Button>
      </div>
    </div>
  );
}
