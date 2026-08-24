-- Customer profile expansion: passport, Power of Attorney, spouse/partner,
-- and Israeli bank account information. Documents are never stored in the
-- database — only metadata + a Storage path. The Storage bucket is private;
-- access goes through RLS-gated signed URLs, never a public URL.

-- ============================================================================
-- Enum
-- ============================================================================

create type public.document_type as enum (
  'customer_passport',
  'spouse_passport',
  'power_of_attorney',
  'bank_document',
  'other'
);

-- ============================================================================
-- customer_spouses — at most one per customer for now (unique customer_id).
-- ============================================================================

create table public.customer_spouses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customers (id) on delete cascade,
  full_name text not null,
  phone_1 text,
  phone_2 text,
  email text,
  passport_number text,
  passport_country text,
  passport_issue_date date,
  passport_expiry_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.customer_spouses
  for each row execute function public.set_updated_at();

-- ============================================================================
-- customer_bank_accounts — schema supports many per customer; the UI treats
-- the first one as "the" account for this version.
-- ============================================================================

create table public.customer_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  bank_name text not null,
  bank_number text not null check (bank_number ~ '^[0-9]{1,3}$'),
  branch_name text,
  branch_number text not null check (branch_number ~ '^[0-9]{1,4}$'),
  account_number text not null,
  account_holder_name text not null,
  account_holder_identifier text,
  iban text,
  swift_bic text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_bank_accounts_customer_id_idx on public.customer_bank_accounts (customer_id);

create trigger set_updated_at before update on public.customer_bank_accounts
  for each row execute function public.set_updated_at();

-- ============================================================================
-- customer_documents — metadata only; the file itself lives in the private
-- "customer-documents" Storage bucket at {customer_id}/{document_type}/{...}.
-- customer_passport and power_of_attorney are singletons per customer;
-- spouse_passport is a singleton per spouse. bank_document/other are not
-- restricted, since a customer may have several.
-- ============================================================================

create table public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  spouse_id uuid references public.customer_spouses (id) on delete cascade,
  document_type public.document_type not null,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  -- document_date doubles as "issue date" for passports and "POA date" for
  -- power_of_attorney; expiry_date applies to both. passport_number/country
  -- are only meaningful (and only ever set) for customer_passport /
  -- spouse_passport rows.
  document_date date,
  expiry_date date,
  passport_number text,
  passport_country text,
  notes text,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_documents_spouse_id_check check (
    (document_type = 'spouse_passport') = (spouse_id is not null)
  )
);

create index customer_documents_customer_id_idx on public.customer_documents (customer_id);
create index customer_documents_spouse_id_idx on public.customer_documents (spouse_id);
create index customer_documents_uploaded_by_idx on public.customer_documents (uploaded_by);

create unique index customer_documents_singleton_idx
  on public.customer_documents (customer_id, document_type)
  where document_type in ('customer_passport', 'power_of_attorney');

create unique index customer_documents_spouse_passport_idx
  on public.customer_documents (spouse_id)
  where document_type = 'spouse_passport';

create trigger set_updated_at before update on public.customer_documents
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS — same admin-full / client-read-own-only shape as every other table.
-- ============================================================================

alter table public.customer_spouses enable row level security;
alter table public.customer_bank_accounts enable row level security;
alter table public.customer_documents enable row level security;

create policy "spouses_select" on public.customer_spouses
  for select to authenticated
  using (private.is_admin() or customer_id = private.current_customer_id());
create policy "spouses_insert_admin" on public.customer_spouses
  for insert to authenticated with check (private.is_admin());
create policy "spouses_update_admin" on public.customer_spouses
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "spouses_delete_admin" on public.customer_spouses
  for delete to authenticated using (private.is_admin());

create policy "bank_accounts_select" on public.customer_bank_accounts
  for select to authenticated
  using (private.is_admin() or customer_id = private.current_customer_id());
create policy "bank_accounts_insert_admin" on public.customer_bank_accounts
  for insert to authenticated with check (private.is_admin());
create policy "bank_accounts_update_admin" on public.customer_bank_accounts
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "bank_accounts_delete_admin" on public.customer_bank_accounts
  for delete to authenticated using (private.is_admin());

create policy "documents_select" on public.customer_documents
  for select to authenticated
  using (private.is_admin() or customer_id = private.current_customer_id());
create policy "documents_insert_admin" on public.customer_documents
  for insert to authenticated with check (private.is_admin());
create policy "documents_update_admin" on public.customer_documents
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "documents_delete_admin" on public.customer_documents
  for delete to authenticated using (private.is_admin());

-- ============================================================================
-- Storage: private bucket + path-based RLS.
-- Path convention: {customer_id}/{document_type}/{uuid}.{ext}
-- so (storage.foldername(name))[1] is always the owning customer_id.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-documents',
  'customer-documents',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/jpeg', 'image/png']
);

create policy "customer_documents_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'customer-documents'
    and (
      private.is_admin()
      or (storage.foldername(name))[1] = private.current_customer_id()::text
    )
  );

create policy "customer_documents_storage_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'customer-documents' and private.is_admin());

create policy "customer_documents_storage_update_admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'customer-documents' and private.is_admin())
  with check (bucket_id = 'customer-documents' and private.is_admin());

create policy "customer_documents_storage_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'customer-documents' and private.is_admin());
