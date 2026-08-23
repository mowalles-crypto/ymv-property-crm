"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import type { Customer, CustomerStatus } from "@/lib/types/domain";

export function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const [name, setName] = useState(customer?.customer_name ?? "");
  const [phone1, setPhone1] = useState(customer?.phone_1 ?? "");
  const [phone2, setPhone2] = useState(customer?.phone_2 ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [status, setStatus] = useState<CustomerStatus>(
    customer?.customer_status ?? "lead"
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!name.trim() || !phone1.trim() || !email.trim()) {
      setError(t.common.required);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    if (customer) {
      const { error } = await supabase
        .from("customers")
        .update({
          customer_name: name,
          phone_1: phone1,
          phone_2: phone2 || null,
          email,
          customer_status: status,
        })
        .eq("id", customer.id);
      setSubmitting(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.refresh();
    } else {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          customer_name: name,
          phone_1: phone1,
          phone_2: phone2 || null,
          email,
          customer_status: status,
        })
        .select("id")
        .single();
      setSubmitting(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push(`/admin/clients/${data.id}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <Input
        id="customer_name"
        label={t.customer.name}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="phone_1"
          type="tel"
          label={t.customer.phone1}
          required
          value={phone1}
          onChange={(e) => setPhone1(e.target.value)}
        />
        <Input
          id="phone_2"
          type="tel"
          label={t.customer.phone2}
          optional
          value={phone2}
          onChange={(e) => setPhone2(e.target.value)}
        />
      </div>
      <Input
        id="email"
        type="email"
        label={t.customer.email}
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Select
        id="customer_status"
        label={t.customer.status}
        value={status}
        onChange={(e) => setStatus(e.target.value as CustomerStatus)}
      >
        <option value="lead">{t.customer.statusLead}</option>
        <option value="active">{t.customer.statusActive}</option>
        <option value="inactive">{t.customer.statusInactive}</option>
      </Select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="button" onClick={handleSubmit} disabled={submitting}>
        {submitting ? t.common.loading : t.common.save}
      </Button>
    </div>
  );
}
