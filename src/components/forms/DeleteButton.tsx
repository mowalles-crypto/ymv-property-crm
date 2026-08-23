"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

export function DeleteButton({
  table,
  id,
  redirectTo,
  confirmMessage,
}: {
  table: "customers" | "properties" | "property_accounting";
  id: string;
  redirectTo: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    setPending(false);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button type="button" variant="danger" onClick={handleDelete} disabled={pending}>
      {pending ? t.common.loading : t.common.delete}
    </Button>
  );
}
