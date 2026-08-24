"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { t } from "@/lib/i18n";
import type { CustomerBankAccount } from "@/lib/types/domain";

function mask(value: string | null): string {
  if (!value) return "—";
  const visible = value.slice(-4);
  return `${"*".repeat(Math.max(value.length - 4, 4))}${visible}`;
}

export function BankAccountSection({
  customerId,
  account,
  editable,
}: {
  customerId: string;
  account: CustomerBankAccount | null;
  editable: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [bankName, setBankName] = useState(account?.bank_name ?? "");
  const [bankNumber, setBankNumber] = useState(account?.bank_number ?? "");
  const [branchName, setBranchName] = useState(account?.branch_name ?? "");
  const [branchNumber, setBranchNumber] = useState(account?.branch_number ?? "");
  const [accountNumber, setAccountNumber] = useState(account?.account_number ?? "");
  const [accountHolderName, setAccountHolderName] = useState(account?.account_holder_name ?? "");
  const [accountHolderIdentifier, setAccountHolderIdentifier] = useState(
    account?.account_holder_identifier ?? ""
  );
  const [iban, setIban] = useState(account?.iban ?? "");
  const [swiftBic, setSwiftBic] = useState(account?.swift_bic ?? "");
  const [notes, setNotes] = useState(account?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!bankName.trim() || !bankNumber.trim() || !branchNumber.trim() || !accountNumber.trim() || !accountHolderName.trim()) {
      setError(t.common.required);
      return;
    }
    if (!/^[0-9]{1,3}$/.test(bankNumber)) {
      setError("Bank number must be 1-3 digits.");
      return;
    }
    if (!/^[0-9]{1,4}$/.test(branchNumber)) {
      setError("Branch number must be 1-4 digits.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const payload = {
      customer_id: customerId,
      bank_name: bankName,
      bank_number: bankNumber,
      branch_name: branchName || null,
      branch_number: branchNumber,
      account_number: accountNumber,
      account_holder_name: accountHolderName,
      account_holder_identifier: accountHolderIdentifier || null,
      iban: iban || null,
      swift_bic: swiftBic || null,
      notes: notes || null,
    };

    const { error } = account
      ? await supabase.from("customer_bank_accounts").update(payload).eq("id", account.id)
      : await supabase.from("customer_bank_accounts").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleRemove() {
    if (!account) return;
    if (!window.confirm(t.bank.confirmRemove)) return;
    const supabase = createClient();
    const { error } = await supabase.from("customer_bank_accounts").delete().eq("id", account.id);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  if (!account && !editing) {
    return (
      <Card title={t.bank.title}>
        <p className="text-sm text-slate-400">{t.bank.none}</p>
        {editable && (
          <Button type="button" className="mt-3" onClick={() => setEditing(true)}>
            {t.bank.add}
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card
      title={t.bank.title}
      action={
        editable && !editing ? (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              {t.bank.edit}
            </Button>
            <Button type="button" variant="danger" onClick={handleRemove}>
              {t.bank.remove}
            </Button>
          </div>
        ) : undefined
      }
    >
      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="bank_name"
              label={t.bank.bankName}
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            <Input
              id="bank_number"
              label={t.bank.bankNumber}
              required
              value={bankNumber}
              onChange={(e) => setBankNumber(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="branch_name"
              label={t.bank.branchName}
              optional
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
            />
            <Input
              id="branch_number"
              label={t.bank.branchNumber}
              required
              value={branchNumber}
              onChange={(e) => setBranchNumber(e.target.value)}
            />
          </div>
          <Input
            id="account_number"
            label={t.bank.accountNumber}
            required
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="account_holder_name"
              label={t.bank.accountHolderName}
              required
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
            />
            <Input
              id="account_holder_identifier"
              label={t.bank.accountHolderIdentifier}
              optional
              value={accountHolderIdentifier}
              onChange={(e) => setAccountHolderIdentifier(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="iban"
              label={t.bank.iban}
              optional
              value={iban}
              onChange={(e) => setIban(e.target.value)}
            />
            <Input
              id="swift_bic"
              label={t.bank.swiftBic}
              optional
              value={swiftBic}
              onChange={(e) => setSwiftBic(e.target.value)}
            />
          </div>
          <Textarea
            id="bank_notes"
            label={t.bank.notes}
            optional
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? t.common.loading : t.common.save}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <dl className="space-y-2 text-sm">
            <Row label={t.bank.bankName} value={account!.bank_name} />
            <Row label={t.bank.bankNumber} value={account!.bank_number} />
            <Row label={t.bank.branchName} value={account!.branch_name || "—"} />
            <Row label={t.bank.branchNumber} value={account!.branch_number} />
            <Row
              label={t.bank.accountNumber}
              value={revealed ? account!.account_number : mask(account!.account_number)}
            />
            <Row label={t.bank.accountHolderName} value={account!.account_holder_name} />
            {account!.account_holder_identifier && (
              <Row
                label={t.bank.accountHolderIdentifier}
                value={revealed ? account!.account_holder_identifier : mask(account!.account_holder_identifier)}
              />
            )}
            {account!.iban && (
              <Row label={t.bank.iban} value={revealed ? account!.iban : mask(account!.iban)} />
            )}
            {account!.swift_bic && <Row label={t.bank.swiftBic} value={account!.swift_bic} />}
            {account!.notes && <Row label={t.bank.notes} value={account!.notes} />}
          </dl>
          <Button
            type="button"
            variant="ghost"
            className="mt-3"
            onClick={() => setRevealed((v) => !v)}
          >
            {revealed ? t.bank.hide : t.bank.reveal}
          </Button>
        </div>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
