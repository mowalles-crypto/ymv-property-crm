-- YMV Property Management CRM — initial schema
-- Enums, core tables, generated accounting columns, RLS, and secure registration RPC.

-- ============================================================================
-- Schemas
-- ============================================================================

create schema if not exists private;

-- ============================================================================
-- Enums
-- ============================================================================

create type public.user_role as enum ('admin', 'client');

create type public.customer_status as enum ('lead', 'active', 'inactive');

create type public.property_status as enum ('under_construction', 'rented', 'vacant', 'sold');

create type public.purchase_purpose as enum (
  'investment',
  'personal_residence',
  'investment_with_future_residence',
  'other'
);

create type public.property_type as enum (
  'apartment',
  'private_house',
  'penthouse',
  'garden_apartment',
  'commercial',
  'office',
  'land',
  'other'
);

create type public.financing_requirement as enum ('yes', 'no', 'not_sure');

create type public.property_condition as enum (
  'new_from_developer',
  'under_construction',
  'second_hand',
  'no_preference'
);

create type public.purchase_timeline as enum (
  'immediately',
  'within_3_months',
  'within_6_months',
  'within_1_year',
  'more_than_1_year',
  'exploring'
);

-- ============================================================================
-- Core tables
-- ============================================================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_1 text not null,
  phone_2 text,
  email text not null unique,
  customer_status public.customer_status not null default 'lead',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_status_idx on public.customers (customer_status);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  customer_id uuid unique references public.customers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_customer_check check (
    (role = 'admin' and customer_id is null) or
    (role = 'client')
  )
);

create index profiles_role_idx on public.profiles (role);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  property_address text not null,
  purchase_date date,
  purchase_price numeric(14, 2) check (purchase_price is null or purchase_price >= 0),
  key_received_date date,
  equity_paid numeric(14, 2) not null default 0 check (equity_paid >= 0),
  bank_financing numeric(14, 2) not null default 0 check (bank_financing >= 0),
  bank_financing_end_date date,
  property_status public.property_status not null default 'vacant',
  rental_end_date date,
  monthly_rent numeric(14, 2) check (monthly_rent is null or monthly_rent >= 0),
  sale_date date,
  sale_price numeric(14, 2) check (sale_price is null or sale_price >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_financing_end_date_check check (
    bank_financing > 0 or bank_financing_end_date is null
  )
);

create index properties_customer_id_idx on public.properties (customer_id);
create index properties_status_idx on public.properties (property_status);

create table public.property_accounting (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  year integer not null check (year between 2000 and 2100),
  month integer not null check (month between 1 and 12),
  rent_received numeric(14, 2) not null default 0,
  expense_1 numeric(14, 2) not null default 0,
  expense_2 numeric(14, 2) not null default 0,
  expense_3 numeric(14, 2) not null default 0,
  expense_4 numeric(14, 2) not null default 0,
  expense_5 numeric(14, 2) not null default 0,
  expense_description text,
  total_expenses numeric(14, 2) generated always as (
    coalesce(expense_1, 0) + coalesce(expense_2, 0) + coalesce(expense_3, 0) +
    coalesce(expense_4, 0) + coalesce(expense_5, 0)
  ) stored,
  profit numeric(14, 2) generated always as (
    coalesce(rent_received, 0) - (
      coalesce(expense_1, 0) + coalesce(expense_2, 0) + coalesce(expense_3, 0) +
      coalesce(expense_4, 0) + coalesce(expense_5, 0)
    )
  ) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, year, month)
);

create table public.property_requirements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customers (id) on delete cascade,
  purchase_purpose public.purchase_purpose not null,
  property_types public.property_type[] not null default '{}',
  preferred_locations text[] not null default '{}',
  budget_min numeric(14, 2),
  budget_max numeric(14, 2),
  available_equity numeric(14, 2),
  financing_required public.financing_requirement not null default 'not_sure',
  financing_amount numeric(14, 2),
  financing_percentage numeric(5, 2),
  rooms_min numeric(4, 1),
  rooms_max numeric(4, 1),
  size_min numeric(8, 2),
  size_max numeric(8, 2),
  property_condition public.property_condition not null default 'no_preference',
  purchase_timeline public.purchase_timeline not null,
  desired_yield numeric(5, 2),
  wants_balcony boolean not null default false,
  wants_parking boolean not null default false,
  wants_storage boolean not null default false,
  wants_elevator boolean not null default false,
  wants_accessibility boolean not null default false,
  preferred_floor text,
  wants_public_transport_proximity boolean not null default false,
  other_preferences text,
  additional_requirements text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_requirements_budget_check check (
    budget_min is null or budget_max is null or budget_min <= budget_max
  ),
  constraint property_requirements_rooms_check check (
    rooms_min is null or rooms_max is null or rooms_min <= rooms_max
  ),
  constraint property_requirements_size_check check (
    size_min is null or size_max is null or size_min <= size_max
  )
);

-- ============================================================================
-- updated_at trigger
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_accounting
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.property_requirements
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Auth helper functions (private schema — not exposed via Data API)
-- ============================================================================

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create or replace function private.current_customer_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select customer_id from public.profiles where profiles.user_id = auth.uid();
$$;

revoke all on function private.current_customer_id() from public;
grant execute on function private.current_customer_id() to authenticated;

-- ============================================================================
-- New-user provisioning trigger
-- Every new auth user gets a 'client' profile with no customer link yet.
-- Role can never be set to 'admin' from client input — only a manual,
-- service-role administrative action can promote a profile to admin.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, role, customer_id)
  values (new.id, 'client', null);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Secure registration RPC
-- Creates the customer + links the profile + stores the requirements
-- questionnaire in one transaction, deriving identity solely from auth.uid().
-- Never trusts a client-supplied role, customer_id, or email.
-- ============================================================================

create or replace function public.complete_client_registration(
  p_customer_name text,
  p_phone_1 text,
  p_phone_2 text,
  p_purchase_purpose public.purchase_purpose,
  p_property_types public.property_type[],
  p_preferred_locations text[],
  p_budget_min numeric,
  p_budget_max numeric,
  p_available_equity numeric,
  p_financing_required public.financing_requirement,
  p_financing_amount numeric,
  p_financing_percentage numeric,
  p_rooms_min numeric,
  p_rooms_max numeric,
  p_size_min numeric,
  p_size_max numeric,
  p_property_condition public.property_condition,
  p_purchase_timeline public.purchase_timeline,
  p_desired_yield numeric,
  p_wants_balcony boolean,
  p_wants_parking boolean,
  p_wants_storage boolean,
  p_wants_elevator boolean,
  p_wants_accessibility boolean,
  p_preferred_floor text,
  p_wants_public_transport_proximity boolean,
  p_other_preferences text,
  p_additional_requirements text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_profile public.profiles;
  v_customer_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_profile from public.profiles where user_id = v_uid;

  if v_profile is null then
    raise exception 'Profile not found for current user';
  end if;

  if v_profile.customer_id is not null then
    raise exception 'Registration already completed for this account';
  end if;

  select email into v_email from auth.users where id = v_uid;

  insert into public.customers (customer_name, phone_1, phone_2, email, customer_status)
  values (p_customer_name, p_phone_1, nullif(p_phone_2, ''), v_email, 'lead')
  returning id into v_customer_id;

  update public.profiles
  set customer_id = v_customer_id,
      role = 'client'
  where user_id = v_uid;

  insert into public.property_requirements (
    customer_id, purchase_purpose, property_types, preferred_locations,
    budget_min, budget_max, available_equity,
    financing_required, financing_amount, financing_percentage,
    rooms_min, rooms_max, size_min, size_max,
    property_condition, purchase_timeline, desired_yield,
    wants_balcony, wants_parking, wants_storage, wants_elevator, wants_accessibility,
    preferred_floor, wants_public_transport_proximity, other_preferences, additional_requirements
  ) values (
    v_customer_id, p_purchase_purpose, coalesce(p_property_types, '{}'), coalesce(p_preferred_locations, '{}'),
    p_budget_min, p_budget_max, p_available_equity,
    p_financing_required, p_financing_amount, p_financing_percentage,
    p_rooms_min, p_rooms_max, p_size_min, p_size_max,
    p_property_condition, p_purchase_timeline, p_desired_yield,
    coalesce(p_wants_balcony, false), coalesce(p_wants_parking, false), coalesce(p_wants_storage, false),
    coalesce(p_wants_elevator, false), coalesce(p_wants_accessibility, false),
    p_preferred_floor, coalesce(p_wants_public_transport_proximity, false), p_other_preferences, p_additional_requirements
  );

  return v_customer_id;
end;
$$;

revoke all on function public.complete_client_registration(
  text, text, text, public.purchase_purpose, public.property_type[], text[],
  numeric, numeric, numeric, public.financing_requirement, numeric, numeric,
  numeric, numeric, numeric, numeric, public.property_condition, public.purchase_timeline,
  numeric, boolean, boolean, boolean, boolean, boolean, text, boolean, text, text
) from public, anon;
grant execute on function public.complete_client_registration(
  text, text, text, public.purchase_purpose, public.property_type[], text[],
  numeric, numeric, numeric, public.financing_requirement, numeric, numeric,
  numeric, numeric, numeric, numeric, public.property_condition, public.purchase_timeline,
  numeric, boolean, boolean, boolean, boolean, boolean, text, boolean, text, text
) to authenticated;

-- ============================================================================
-- Admin convenience RPC: auto-create the 12 monthly accounting rows for a
-- property/year. Runs as the caller (security invoker) so RLS still applies —
-- only an admin can actually insert rows via this function.
-- ============================================================================

create or replace function public.create_accounting_year(p_property_id uuid, p_year integer)
returns setof public.property_accounting
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.property_accounting (property_id, year, month)
  select p_property_id, p_year, m
  from generate_series(1, 12) as m
  on conflict (property_id, year, month) do nothing;

  return query
  select * from public.property_accounting
  where property_id = p_property_id and year = p_year
  order by month;
end;
$$;

grant execute on function public.create_accounting_year(uuid, integer) to authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.customers enable row level security;
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_accounting enable row level security;
alter table public.property_requirements enable row level security;

-- profiles: users read their own profile; admins read/manage all profiles.
-- No client-facing INSERT/UPDATE policy exists — all mutation happens via
-- the SECURITY DEFINER trigger/RPC above, which bypasses RLS deliberately.
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or private.is_admin());

create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- customers: admin full access; client can read only their own record.
create policy "customers_select_own_or_admin" on public.customers
  for select to authenticated
  using (private.is_admin() or id = private.current_customer_id());

create policy "customers_admin_write" on public.customers
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- properties: admin full access; client can read only their own properties.
create policy "properties_select_own_or_admin" on public.properties
  for select to authenticated
  using (private.is_admin() or customer_id = private.current_customer_id());

create policy "properties_admin_write" on public.properties
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- property_accounting: admin full access; client can read accounting only
-- for properties they own (checked via a join back to properties).
create policy "accounting_select_own_or_admin" on public.property_accounting
  for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.properties p
      where p.id = property_accounting.property_id
        and p.customer_id = private.current_customer_id()
    )
  );

create policy "accounting_admin_write" on public.property_accounting
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- property_requirements: admin full access; client can read only their own.
create policy "requirements_select_own_or_admin" on public.property_requirements
  for select to authenticated
  using (private.is_admin() or customer_id = private.current_customer_id());

create policy "requirements_admin_write" on public.property_requirements
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());
