import type { CustomerStatus, PropertyStatus } from "@/lib/types/domain";
import { t } from "@/lib/i18n";

const base =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const customerStatusStyles: Record<CustomerStatus, string> = {
  lead: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-600",
};

const customerStatusLabel: Record<CustomerStatus, string> = {
  lead: t.customer.statusLead,
  active: t.customer.statusActive,
  inactive: t.customer.statusInactive,
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span className={`${base} ${customerStatusStyles[status]}`}>
      {customerStatusLabel[status]}
    </span>
  );
}

const propertyStatusStyles: Record<PropertyStatus, string> = {
  under_construction: "bg-sky-100 text-sky-800",
  rented: "bg-emerald-100 text-emerald-800",
  vacant: "bg-slate-100 text-slate-600",
  sold: "bg-violet-100 text-violet-800",
};

const propertyStatusLabel: Record<PropertyStatus, string> = {
  under_construction: t.property.statusUnderConstruction,
  rented: t.property.statusRented,
  vacant: t.property.statusVacant,
  sold: t.property.statusSold,
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <span className={`${base} ${propertyStatusStyles[status]}`}>
      {propertyStatusLabel[status]}
    </span>
  );
}
