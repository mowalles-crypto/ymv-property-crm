"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { RequirementsFields } from "@/components/forms/RequirementsFields";
import { t } from "@/lib/i18n";
import {
  buildRegistrationRpcArgs,
  emptyRequirementsForm,
  type RequirementsFormState,
} from "@/lib/types/forms";

export function CompleteRequirementsForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [requirements, setRequirements] =
    useState<RequirementsFormState>(emptyRequirementsForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!fullName.trim() || !phone1.trim()) {
      setError("Name and primary phone are required.");
      return;
    }
    if (!requirements.purchase_purpose || !requirements.purchase_timeline) {
      setError("Purchase purpose and timeline are required.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc(
      "complete_client_registration",
      buildRegistrationRpcArgs(fullName, phone1, phone2, requirements)
    );
    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message || t.auth.genericError);
      return;
    }

    router.push("/client/home");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Input
          id="fullName"
          label={t.auth.fullName}
          variant="dark"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          id="phone1"
          type="tel"
          label={t.auth.phone1}
          variant="dark"
          required
          value={phone1}
          onChange={(e) => setPhone1(e.target.value)}
        />
        <Input
          id="phone2"
          type="tel"
          label={t.auth.phone2}
          variant="dark"
          optional
          value={phone2}
          onChange={(e) => setPhone2(e.target.value)}
        />
      </div>

      <RequirementsFields value={requirements} onChange={setRequirements} />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="button" variant="gold" onClick={handleSubmit} disabled={submitting} className="w-full">
        {submitting ? t.registration.submitting : t.registration.submit}
      </Button>
    </div>
  );
}
