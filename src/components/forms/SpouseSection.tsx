"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { DocumentCard } from "@/components/forms/DocumentCard";
import { t } from "@/lib/i18n";
import type { CustomerDocument, CustomerSpouse } from "@/lib/types/domain";

export function SpouseSection({
  customerId,
  spouse,
  spouseDocument,
  editable,
}: {
  customerId: string;
  spouse: CustomerSpouse | null;
  spouseDocument: CustomerDocument | null;
  editable: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(spouse?.full_name ?? "");
  const [phone1, setPhone1] = useState(spouse?.phone_1 ?? "");
  const [phone2, setPhone2] = useState(spouse?.phone_2 ?? "");
  const [email, setEmail] = useState(spouse?.email ?? "");
  const [notes, setNotes] = useState(spouse?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!fullName.trim()) {
      setError(t.common.required);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      customer_id: customerId,
      full_name: fullName,
      phone_1: phone1 || null,
      phone_2: phone2 || null,
      email: email || null,
      notes: notes || null,
    };

    const { error } = spouse
      ? await supabase.from("customer_spouses").update(payload).eq("id", spouse.id)
      : await supabase.from("customer_spouses").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleRemove() {
    if (!spouse) return;
    if (!window.confirm(t.spouse.confirmRemove)) return;
    const supabase = createClient();
    if (spouseDocument) {
      await supabase.storage.from("customer-documents").remove([spouseDocument.storage_path]);
    }
    const { error } = await supabase.from("customer_spouses").delete().eq("id", spouse.id);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  if (!spouse && !editing) {
    return (
      <Card title={t.spouse.title}>
        <p className="text-sm text-slate-400">{t.spouse.none}</p>
        {editable && (
          <Button type="button" className="mt-3" onClick={() => setEditing(true)}>
            {t.spouse.add}
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card
      title={t.spouse.title}
      action={
        editable && !editing ? (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              {t.spouse.edit}
            </Button>
            <Button type="button" variant="danger" onClick={handleRemove}>
              {t.spouse.remove}
            </Button>
          </div>
        ) : undefined
      }
    >
      {editing ? (
        <div className="space-y-4">
          <Input
            id="spouse_full_name"
            label={t.spouse.fullName}
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="spouse_phone_1"
              type="tel"
              label={t.spouse.phone1}
              optional
              value={phone1}
              onChange={(e) => setPhone1(e.target.value)}
            />
            <Input
              id="spouse_phone_2"
              type="tel"
              label={t.spouse.phone2}
              optional
              value={phone2}
              onChange={(e) => setPhone2(e.target.value)}
            />
          </div>
          <Input
            id="spouse_email"
            type="email"
            label={t.spouse.email}
            optional
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Textarea
            id="spouse_notes"
            label={t.spouse.notes}
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
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">{t.spouse.fullName}</dt>
            <dd className="font-medium text-slate-900">{spouse!.full_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t.spouse.phone1}</dt>
            <dd className="font-medium text-slate-900">{spouse!.phone_1 || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t.spouse.phone2}</dt>
            <dd className="font-medium text-slate-900">{spouse!.phone_2 || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t.spouse.email}</dt>
            <dd className="font-medium text-slate-900">{spouse!.email || "—"}</dd>
          </div>
          {spouse!.notes && (
            <div className="flex justify-between">
              <dt className="text-slate-500">{t.spouse.notes}</dt>
              <dd className="font-medium text-slate-900">{spouse!.notes}</dd>
            </div>
          )}
        </dl>
      )}

      {spouse && !editing && (
        <div className="mt-4">
          <DocumentCard
            key={spouseDocument?.id ?? "spouse-passport-empty"}
            customerId={customerId}
            spouseId={spouse.id}
            documentType="spouse_passport"
            document={spouseDocument}
            variant="passport"
            title={t.documents.spousePassport}
            editable={editable}
          />
        </div>
      )}
    </Card>
  );
}
