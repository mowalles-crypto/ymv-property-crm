"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import type { Customer, Property, PropertyStatus } from "@/lib/types/domain";

export function PropertyForm({
  property,
  customers,
  lockedCustomerId,
}: {
  property?: Property;
  customers?: Pick<Customer, "id" | "customer_name">[];
  lockedCustomerId?: string;
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(
    property?.customer_id ?? lockedCustomerId ?? ""
  );
  const [address, setAddress] = useState(property?.property_address ?? "");
  const [purchaseDate, setPurchaseDate] = useState(property?.purchase_date ?? "");
  const [purchasePrice, setPurchasePrice] = useState(
    property?.purchase_price?.toString() ?? ""
  );
  const [keyReceivedDate, setKeyReceivedDate] = useState(
    property?.key_received_date ?? ""
  );
  const [equityPaid, setEquityPaid] = useState(property?.equity_paid?.toString() ?? "0");
  const [bankFinancing, setBankFinancing] = useState(
    property?.bank_financing?.toString() ?? "0"
  );
  const [bankFinancingEndDate, setBankFinancingEndDate] = useState(
    property?.bank_financing_end_date ?? ""
  );
  const [status, setStatus] = useState<PropertyStatus>(
    property?.property_status ?? "vacant"
  );
  const [rentalEndDate, setRentalEndDate] = useState(property?.rental_end_date ?? "");
  const [monthlyRent, setMonthlyRent] = useState(property?.monthly_rent?.toString() ?? "");
  const [saleDate, setSaleDate] = useState(property?.sale_date ?? "");
  const [salePrice, setSalePrice] = useState(property?.sale_price?.toString() ?? "");
  const [notes, setNotes] = useState(property?.notes ?? "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function num(v: string): number | null {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  async function handleSubmit() {
    setError(null);
    if (!customerId) {
      setError("A client must be selected.");
      return;
    }
    if (!address.trim()) {
      setError("Address is required.");
      return;
    }

    const financing = num(bankFinancing) ?? 0;
    const payload = {
      customer_id: customerId,
      property_address: address,
      purchase_date: purchaseDate || null,
      purchase_price: num(purchasePrice),
      key_received_date: keyReceivedDate || null,
      equity_paid: num(equityPaid) ?? 0,
      bank_financing: financing,
      bank_financing_end_date: financing > 0 ? bankFinancingEndDate || null : null,
      property_status: status,
      rental_end_date: rentalEndDate || null,
      monthly_rent: num(monthlyRent),
      sale_date: saleDate || null,
      sale_price: num(salePrice),
      notes: notes || null,
    };

    setSubmitting(true);
    const supabase = createClient();

    if (property) {
      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", property.id);
      setSubmitting(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push(`/admin/properties/${property.id}`);
      router.refresh();
    } else {
      const { data, error } = await supabase
        .from("properties")
        .insert(payload)
        .select("id")
        .single();
      setSubmitting(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push(`/admin/properties/${data.id}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {!lockedCustomerId && customers && (
        <Select
          id="customer_id"
          label={t.property.client}
          required
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="" disabled>
            {t.common.selectPlaceholder}
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.customer_name}
            </option>
          ))}
        </Select>
      )}

      <Input
        id="property_address"
        label={t.property.address}
        required
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="purchase_date"
          type="date"
          label={t.property.purchaseDate}
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />
        <Input
          id="purchase_price"
          type="number"
          label={t.property.purchasePrice}
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
        />
      </div>

      <Input
        id="key_received_date"
        type="date"
        label={t.property.keyReceivedDate}
        value={keyReceivedDate}
        onChange={(e) => setKeyReceivedDate(e.target.value)}
      />

      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">
          {t.property.financingSection}
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="equity_paid"
            type="number"
            label={t.property.equityPaid}
            value={equityPaid}
            onChange={(e) => setEquityPaid(e.target.value)}
          />
          <Input
            id="bank_financing"
            type="number"
            label={t.property.bankFinancing}
            value={bankFinancing}
            onChange={(e) => setBankFinancing(e.target.value)}
          />
        </div>
        {Number(bankFinancing) > 0 && (
          <div className="mt-4">
            <Input
              id="bank_financing_end_date"
              type="date"
              label={t.property.bankFinancingEndDate}
              value={bankFinancingEndDate}
              onChange={(e) => setBankFinancingEndDate(e.target.value)}
            />
          </div>
        )}
      </fieldset>

      <Select
        id="property_status"
        label={t.property.status}
        value={status}
        onChange={(e) => setStatus(e.target.value as PropertyStatus)}
      >
        <option value="vacant">{t.property.statusVacant}</option>
        <option value="rented">{t.property.statusRented}</option>
        <option value="under_construction">{t.property.statusUnderConstruction}</option>
        <option value="sold">{t.property.statusSold}</option>
      </Select>

      {/*
        Rental and sale info stay visible regardless of current status —
        a property that was rented and is now sold must keep its rental
        history visible/editable, not lose it from the UI. Only the
        financing end date is genuinely conditional (it's meaningless,
        and DB-constrained to NULL, when there's no financing at all).
      */}
      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">
          {t.property.rentalSection}
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="monthly_rent"
            type="number"
            label={t.property.monthlyRent}
            optional
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
          />
          <Input
            id="rental_end_date"
            type="date"
            label={t.property.rentalEndDate}
            optional
            value={rentalEndDate}
            onChange={(e) => setRentalEndDate(e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">
          {t.property.saleSection}
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="sale_price"
            type="number"
            label={t.property.salePrice}
            optional
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
          />
          <Input
            id="sale_date"
            type="date"
            label={t.property.saleDate}
            optional
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
          />
        </div>
      </fieldset>

      <Textarea
        id="notes"
        label={t.property.notes}
        optional
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="button" onClick={handleSubmit} disabled={submitting}>
        {submitting ? t.common.loading : t.common.save}
      </Button>
    </div>
  );
}
