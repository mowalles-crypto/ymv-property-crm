-- Task-driven Client investment platform: transaction-level accounting,
-- the report engine's data source, investment offers marketplace,
-- acquisition-cost and capital-gains-tax estimate frameworks, and property
-- sale requests. Additive only — the existing monthly property_accounting
-- table and its Admin UI are left completely untouched (see README for the
-- documented relationship between the two).

-- ============================================================================
-- Enums
-- ============================================================================

create type public.transaction_type as enum ('income', 'expense');

create type public.transaction_category as enum (
  'rent', 'maintenance', 'repair', 'municipal_tax', 'insurance',
  'management_fee', 'utilities', 'legal', 'brokerage', 'financing', 'other'
);

create type public.offer_status as enum ('draft', 'active', 'reserved', 'sold', 'archived');

create type public.offer_document_type as enum (
  'image', 'floor_plan', 'brochure', 'permit', 'planning_approval', 'zoning', 'specification', 'other'
);

create type public.inquiry_status as enum ('new', 'contacted', 'in_discussion', 'closed_won', 'closed_lost');

create type public.sale_request_status as enum (
  'submitted', 'under_review', 'approved_for_marketing', 'marketing', 'offer_received', 'sold', 'cancelled'
);

create type public.acquisition_cost_type as enum ('purchase_tax', 'lawyer_fee', 'brokerage_fee');

create type public.cost_calculation_type as enum ('percentage', 'fixed', 'tiered', 'custom');

-- ============================================================================
-- property_transactions — the date-accurate ledger behind the report engine.
-- Independent from the existing monthly property_accounting table (kept
-- as-is for its existing Admin UI); see README for why they're not merged.
-- ============================================================================

create table public.property_transactions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  transaction_date date not null,
  transaction_type public.transaction_type not null,
  category public.transaction_category not null default 'other',
  amount numeric(14, 2) not null check (amount > 0),
  description text,
  notes text,
  source text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index property_transactions_property_id_idx on public.property_transactions (property_id);
create index property_transactions_date_idx on public.property_transactions (property_id, transaction_date);
create index property_transactions_created_by_idx on public.property_transactions (created_by);

create trigger set_updated_at before update on public.property_transactions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- investment_offers — the marketplace Admin publishes and Clients browse.
-- Reuses existing enums (property_type, purchase_purpose, property_condition)
-- rather than duplicating them.
-- ============================================================================

create table public.investment_offers (
  id uuid primary key default gen_random_uuid(),
  address_or_project_name text not null,
  city text not null,
  location text,
  property_type public.property_type not null,
  property_purpose public.purchase_purpose not null default 'investment',
  rooms numeric(4, 1),
  property_size numeric(8, 2),
  property_price numeric(14, 2) not null check (property_price >= 0),
  expected_monthly_rent numeric(14, 2),
  expected_annual_income numeric(14, 2),
  estimated_annual_expenses numeric(14, 2),
  expected_gross_yield numeric(5, 2),
  expected_net_yield numeric(5, 2),
  construction_status public.property_condition not null default 'second_hand',
  expected_delivery_date date,
  minimum_equity_required numeric(14, 2),
  financing_available boolean not null default false,
  -- Offer-specific overrides for the global acquisition_cost_rules below —
  -- used only when this particular offer's costs genuinely differ.
  override_purchase_tax_amount numeric(14, 2),
  override_lawyer_fee_amount numeric(14, 2),
  override_brokerage_fee_amount numeric(14, 2),
  economic_analysis text,
  short_description text,
  status public.offer_status not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index investment_offers_status_idx on public.investment_offers (status);
create index investment_offers_city_idx on public.investment_offers (city);

create trigger set_updated_at before update on public.investment_offers
  for each row execute function public.set_updated_at();

create table public.investment_offer_documents (
  id uuid primary key default gen_random_uuid(),
  investment_offer_id uuid not null references public.investment_offers (id) on delete cascade,
  document_type public.offer_document_type not null default 'other',
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  title text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index investment_offer_documents_offer_id_idx on public.investment_offer_documents (investment_offer_id);

create trigger set_updated_at before update on public.investment_offer_documents
  for each row execute function public.set_updated_at();

create table public.investment_inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  investment_offer_id uuid not null references public.investment_offers (id) on delete cascade,
  status public.inquiry_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, investment_offer_id)
);

create index investment_inquiries_customer_id_idx on public.investment_inquiries (customer_id);
create index investment_inquiries_offer_id_idx on public.investment_inquiries (investment_offer_id);

create trigger set_updated_at before update on public.investment_inquiries
  for each row execute function public.set_updated_at();

-- ============================================================================
-- property_sale_requests — admin_notes is deliberately NOT exposed through
-- any client-facing SELECT policy on this table (see get_my_sale_requests()
-- below, which is the only client read path and nulls it out). This is the
-- one place in the schema that needs column-level, not just row-level,
-- confidentiality, and Postgres RLS alone can't express that — hence the
-- SECURITY DEFINER function pattern.
-- ============================================================================

create table public.property_sale_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  requested_sale_price numeric(14, 2) not null check (requested_sale_price >= 0),
  minimum_acceptable_price numeric(14, 2),
  payment_terms text,
  desired_sale_date date,
  notes text,
  admin_notes text,
  status public.sale_request_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index property_sale_requests_customer_id_idx on public.property_sale_requests (customer_id);
create index property_sale_requests_property_id_idx on public.property_sale_requests (property_id);

create trigger set_updated_at before update on public.property_sale_requests
  for each row execute function public.set_updated_at();

-- ============================================================================
-- property_tax_basis — deliberately does NOT duplicate purchase_date /
-- purchase_price, which already live on properties; joins to that table
-- instead, per the spec's own instruction to avoid inconsistent duplicates.
-- ============================================================================

create table public.property_tax_basis (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties (id) on delete cascade,
  purchase_tax_paid numeric(14, 2),
  purchase_brokerage_fee numeric(14, 2),
  purchase_legal_fee numeric(14, 2),
  sale_brokerage_fee numeric(14, 2),
  sale_legal_fee numeric(14, 2),
  recognized_improvement_costs numeric(14, 2),
  other_recognized_costs numeric(14, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.property_tax_basis
  for each row execute function public.set_updated_at();

-- ============================================================================
-- acquisition_cost_rules — global, versioned, Admin-configurable. See
-- README for what is and isn't legally verified.
-- ============================================================================

create table public.acquisition_cost_rules (
  id uuid primary key default gen_random_uuid(),
  cost_type public.acquisition_cost_type not null,
  calculation_type public.cost_calculation_type not null,
  percentage_rate numeric(6, 4),
  fixed_amount numeric(14, 2),
  minimum_amount numeric(14, 2),
  maximum_amount numeric(14, 2),
  tiers jsonb,
  effective_from date not null,
  effective_to date,
  conditions text,
  notes text,
  source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index acquisition_cost_rules_type_active_idx on public.acquisition_cost_rules (cost_type, active);

create trigger set_updated_at before update on public.acquisition_cost_rules
  for each row execute function public.set_updated_at();

-- ============================================================================
-- capital_gains_tax_rules — versioned, Admin-configurable. NOT verified as
-- legally complete (no indexation, no exemption logic) — see README.
-- ============================================================================

create table public.capital_gains_tax_rules (
  id uuid primary key default gen_random_uuid(),
  rule_version text not null unique,
  effective_from date not null,
  effective_to date,
  tax_rate numeric(6, 4) not null,
  calculation_notes text,
  parameters jsonb not null default '{}',
  source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.capital_gains_tax_rules
  for each row execute function public.set_updated_at();

create table public.capital_gains_tax_estimates (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  sale_request_id uuid references public.property_sale_requests (id) on delete set null,
  estimated_sale_price numeric(14, 2) not null,
  calculated_cost_basis numeric(14, 2) not null,
  estimated_gain numeric(14, 2) not null,
  estimated_tax numeric(14, 2) not null,
  rule_version text not null,
  calculation_details jsonb not null default '{}',
  disclaimer_acknowledged boolean not null default false,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index capital_gains_tax_estimates_customer_id_idx on public.capital_gains_tax_estimates (customer_id);
create index capital_gains_tax_estimates_property_id_idx on public.capital_gains_tax_estimates (property_id);
create index capital_gains_tax_estimates_sale_request_id_idx on public.capital_gains_tax_estimates (sale_request_id);

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.property_transactions enable row level security;
alter table public.investment_offers enable row level security;
alter table public.investment_offer_documents enable row level security;
alter table public.investment_inquiries enable row level security;
alter table public.property_sale_requests enable row level security;
alter table public.property_tax_basis enable row level security;
alter table public.acquisition_cost_rules enable row level security;
alter table public.capital_gains_tax_rules enable row level security;
alter table public.capital_gains_tax_estimates enable row level security;

-- property_transactions: read own-or-admin (via join to properties);
-- write admin-only (this is the same shape as property_accounting).
create policy "transactions_select" on public.property_transactions
  for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.properties p
      where p.id = property_transactions.property_id
        and p.customer_id = private.current_customer_id()
    )
  );
create policy "transactions_insert_admin" on public.property_transactions
  for insert to authenticated with check (private.is_admin());
create policy "transactions_update_admin" on public.property_transactions
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "transactions_delete_admin" on public.property_transactions
  for delete to authenticated using (private.is_admin());

-- investment_offers: clients see only 'active'; admin sees/manages all.
create policy "offers_select" on public.investment_offers
  for select to authenticated
  using (private.is_admin() or status = 'active');
create policy "offers_insert_admin" on public.investment_offers
  for insert to authenticated with check (private.is_admin());
create policy "offers_update_admin" on public.investment_offers
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "offers_delete_admin" on public.investment_offers
  for delete to authenticated using (private.is_admin());

-- investment_offer_documents: readable when the parent offer is active (or
-- by admin); writable by admin only.
create policy "offer_documents_select" on public.investment_offer_documents
  for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.investment_offers o
      where o.id = investment_offer_documents.investment_offer_id
        and o.status = 'active'
    )
  );
create policy "offer_documents_insert_admin" on public.investment_offer_documents
  for insert to authenticated with check (private.is_admin());
create policy "offer_documents_update_admin" on public.investment_offer_documents
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "offer_documents_delete_admin" on public.investment_offer_documents
  for delete to authenticated using (private.is_admin());

-- investment_inquiries: client creates/reads their own; admin manages all.
create policy "inquiries_select" on public.investment_inquiries
  for select to authenticated
  using (private.is_admin() or customer_id = private.current_customer_id());
create policy "inquiries_insert_client" on public.investment_inquiries
  for insert to authenticated
  with check (
    customer_id = private.current_customer_id()
    and exists (
      select 1 from public.investment_offers o
      where o.id = investment_offer_id and o.status = 'active'
    )
  );
create policy "inquiries_update_admin" on public.investment_inquiries
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "inquiries_delete_admin" on public.investment_inquiries
  for delete to authenticated using (private.is_admin());

-- property_sale_requests: admin has full SELECT (incl. admin_notes) via
-- this policy; clients read their own rows ONLY through
-- get_my_sale_requests() below, which strips admin_notes. There is
-- deliberately no client SELECT policy on the base table.
create policy "sale_requests_select_admin" on public.property_sale_requests
  for select to authenticated using (private.is_admin());
create policy "sale_requests_insert_client" on public.property_sale_requests
  for insert to authenticated
  with check (
    customer_id = private.current_customer_id()
    and status = 'submitted'
    and admin_notes is null
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.customer_id = private.current_customer_id()
    )
  );
create policy "sale_requests_update_admin" on public.property_sale_requests
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "sale_requests_delete_admin" on public.property_sale_requests
  for delete to authenticated using (private.is_admin());

-- property_tax_basis: read own-or-admin; write admin-only.
create policy "tax_basis_select" on public.property_tax_basis
  for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.properties p
      where p.id = property_tax_basis.property_id
        and p.customer_id = private.current_customer_id()
    )
  );
create policy "tax_basis_insert_admin" on public.property_tax_basis
  for insert to authenticated with check (private.is_admin());
create policy "tax_basis_update_admin" on public.property_tax_basis
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "tax_basis_delete_admin" on public.property_tax_basis
  for delete to authenticated using (private.is_admin());

-- acquisition_cost_rules / capital_gains_tax_rules: any authenticated user
-- can read the currently-active rules (needed to run estimates); only
-- admin can read inactive/historical versions or write.
create policy "acquisition_rules_select" on public.acquisition_cost_rules
  for select to authenticated using (private.is_admin() or active = true);
create policy "acquisition_rules_insert_admin" on public.acquisition_cost_rules
  for insert to authenticated with check (private.is_admin());
create policy "acquisition_rules_update_admin" on public.acquisition_cost_rules
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "acquisition_rules_delete_admin" on public.acquisition_cost_rules
  for delete to authenticated using (private.is_admin());

create policy "cgt_rules_select" on public.capital_gains_tax_rules
  for select to authenticated using (private.is_admin() or active = true);
create policy "cgt_rules_insert_admin" on public.capital_gains_tax_rules
  for insert to authenticated with check (private.is_admin());
create policy "cgt_rules_update_admin" on public.capital_gains_tax_rules
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "cgt_rules_delete_admin" on public.capital_gains_tax_rules
  for delete to authenticated using (private.is_admin());

-- capital_gains_tax_estimates: read own-or-admin; insert only via the
-- estimate_capital_gains_tax() RPC below (SECURITY INVOKER — relies on
-- this same policy), which is why the WITH CHECK mirrors sale_requests'
-- ownership check.
create policy "cgt_estimates_select" on public.capital_gains_tax_estimates
  for select to authenticated
  using (private.is_admin() or customer_id = private.current_customer_id());
create policy "cgt_estimates_insert_client" on public.capital_gains_tax_estimates
  for insert to authenticated
  with check (
    customer_id = private.current_customer_id()
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.customer_id = private.current_customer_id()
    )
  );
create policy "cgt_estimates_delete_admin" on public.capital_gains_tax_estimates
  for delete to authenticated using (private.is_admin());

-- ============================================================================
-- get_my_sale_requests(): the only client-facing read path for
-- property_sale_requests. SECURITY DEFINER so it can bypass the admin-only
-- base-table SELECT policy, but it only ever returns the caller's own rows
-- (via private.current_customer_id()) with admin_notes nulled out.
-- ============================================================================

create or replace function public.get_my_sale_requests()
returns setof public.property_sale_requests
language sql
security definer
set search_path = ''
stable
as $$
  select
    id, customer_id, property_id, requested_sale_price, minimum_acceptable_price,
    payment_terms, desired_sale_date, notes, null::text as admin_notes,
    status, created_at, updated_at
  from public.property_sale_requests
  where customer_id = private.current_customer_id();
$$;

revoke all on function public.get_my_sale_requests() from public, anon;
grant execute on function public.get_my_sale_requests() to authenticated;

-- ============================================================================
-- estimate_capital_gains_tax(): computes and stores an estimate for one of
-- the caller's own properties. SECURITY INVOKER — it relies entirely on the
-- RLS policies above (properties/property_tax_basis/capital_gains_tax_rules
-- SELECT, capital_gains_tax_estimates INSERT) rather than bypassing them,
-- so an admin can also call it for any property while a client is
-- naturally confined to their own by the same policies.
-- ============================================================================

create or replace function public.estimate_capital_gains_tax(
  p_property_id uuid,
  p_estimated_sale_price numeric,
  p_sale_request_id uuid default null
)
returns public.capital_gains_tax_estimates
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_purchase_price numeric;
  v_basis public.property_tax_basis;
  v_rule public.capital_gains_tax_rules;
  v_cost_basis numeric;
  v_gain numeric;
  v_tax numeric;
  v_details jsonb;
  v_result public.capital_gains_tax_estimates;
begin
  select customer_id, purchase_price into v_customer_id, v_purchase_price
  from public.properties where id = p_property_id;

  if v_customer_id is null then
    raise exception 'Property not found or not accessible';
  end if;

  select * into v_basis from public.property_tax_basis where property_id = p_property_id;

  select * into v_rule
  from public.capital_gains_tax_rules
  where active = true and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
  order by effective_from desc
  limit 1;

  if v_rule is null then
    raise exception 'No active capital gains tax rule is configured. An admin must configure one before estimates can be generated.';
  end if;

  v_cost_basis := coalesce(v_purchase_price, 0)
    + coalesce(v_basis.purchase_tax_paid, 0)
    + coalesce(v_basis.purchase_brokerage_fee, 0)
    + coalesce(v_basis.purchase_legal_fee, 0)
    + coalesce(v_basis.recognized_improvement_costs, 0)
    + coalesce(v_basis.other_recognized_costs, 0)
    + coalesce(v_basis.sale_brokerage_fee, 0)
    + coalesce(v_basis.sale_legal_fee, 0);

  v_gain := greatest(p_estimated_sale_price - v_cost_basis, 0);
  v_tax := round(v_gain * v_rule.tax_rate, 2);

  v_details := jsonb_build_object(
    'purchase_price', v_purchase_price,
    'purchase_tax_paid', v_basis.purchase_tax_paid,
    'purchase_brokerage_fee', v_basis.purchase_brokerage_fee,
    'purchase_legal_fee', v_basis.purchase_legal_fee,
    'recognized_improvement_costs', v_basis.recognized_improvement_costs,
    'other_recognized_costs', v_basis.other_recognized_costs,
    'sale_brokerage_fee', v_basis.sale_brokerage_fee,
    'sale_legal_fee', v_basis.sale_legal_fee,
    'tax_rate', v_rule.tax_rate,
    'rule_source', v_rule.source,
    'rule_notes', v_rule.calculation_notes
  );

  insert into public.capital_gains_tax_estimates (
    customer_id, property_id, sale_request_id, estimated_sale_price,
    calculated_cost_basis, estimated_gain, estimated_tax, rule_version,
    calculation_details, disclaimer_acknowledged
  ) values (
    v_customer_id, p_property_id, p_sale_request_id, p_estimated_sale_price,
    v_cost_basis, v_gain, v_tax, v_rule.rule_version, v_details, true
  )
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.estimate_capital_gains_tax(uuid, numeric, uuid) from public, anon;
grant execute on function public.estimate_capital_gains_tax(uuid, numeric, uuid) to authenticated;

-- ============================================================================
-- Storage: a second private bucket for investment-offer media/documents.
-- Path convention {investment_offer_id}/{document_type}/{uuid}.{ext} so RLS
-- can join the leading path segment back to investment_offers.status.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'investment-offers',
  'investment-offers',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

create policy "investment_offers_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'investment-offers'
    and (
      private.is_admin()
      or exists (
        select 1 from public.investment_offers o
        where o.id::text = (storage.foldername(name))[1]
          and o.status = 'active'
      )
    )
  );

create policy "investment_offers_storage_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'investment-offers' and private.is_admin());

create policy "investment_offers_storage_update_admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'investment-offers' and private.is_admin())
  with check (bucket_id = 'investment-offers' and private.is_admin());

create policy "investment_offers_storage_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'investment-offers' and private.is_admin());
