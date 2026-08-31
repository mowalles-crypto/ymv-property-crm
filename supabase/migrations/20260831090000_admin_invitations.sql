-- Secure Admin registration for the BIZRAEL Israel Real Estate Analytics
-- dashboard (a separate Streamlit app). Additive only. Public self-service
-- signup can NEVER produce an admin account by itself - it always relies
-- on the existing public.handle_new_user() trigger, unchanged here, which
-- hardcodes role='client' regardless of any client-supplied metadata
-- (verified live: user_metadata/app_metadata containing role='admin' at
-- account creation still yields role='client' - this migration does not
-- change that guarantee, it only adds a narrow, audited path for a
-- genuinely authorized admin to promote a specific invited account).
--
-- Two new functions and one new table:
--   * admin_invitations - single-use, expiring, email-bound invitation
--     records. Only a token HASH is ever stored (sha256 via pgcrypto's
--     digest()) - the raw token exists only transiently in
--     create_admin_invitation()'s return value, handed once to the
--     calling admin, never persisted anywhere in plaintext.
--   * create_admin_invitation(p_email, p_validity_hours) - callable only
--     by an authenticated admin (checked with private.is_admin() inside
--     the function, not just via a table-level RLS policy, so this holds
--     even if someone tries calling the RPC directly). Generates a
--     cryptographically random token via pgcrypto's gen_random_bytes(32),
--     stores only its hash, returns the raw token.
--   * register_admin_with_invitation(p_token, ...) - the only way any
--     account can ever become role='admin' outside of a human directly
--     editing the database. SECURITY DEFINER so it can update `profiles`
--     regardless of RLS, but it derives the calling identity solely from
--     auth.uid() (exactly like the existing complete_client_registration
--     pattern) - it never accepts a user id, role, or "is this an admin"
--     flag as a parameter, so there is no argument a caller could forge
--     to promote an arbitrary account. The invitation row is locked with
--     FOR UPDATE during validation, so two concurrent calls against the
--     same token cannot both succeed (the second sees the row only after
--     the first's UPDATE commits, and by then used_at is no longer null,
--     so the WHERE clause no longer matches it).
--
-- Also adds complete_simple_client_registration(p_first_name, p_last_name,
-- p_phone) - a lighter-weight sibling to the existing
-- complete_client_registration RPC (which requires the full property-
-- requirements questionnaire and is used by the YMV Next.js frontend's own
-- signup flow, left completely untouched here). This dashboard's simpler
-- signup form only collects name/phone, so this function only creates the
-- `customers` row and links it - no property_requirements row, which is
-- fine (nothing in the schema requires one to exist). Like
-- complete_client_registration, it has NO role parameter at all - it is
-- structurally impossible to pass 'admin' through it.
--
-- NOT APPLIED by any automated process - this file is proposed only. Run
-- `supabase db push` yourself after review.
--
-- Token generation uses pgcrypto's gen_random_bytes()/digest(), which
-- Supabase projects install into the `extensions` schema by default (the
-- standard convention for every Supabase-provisioned project). The line
-- below is idempotent (IF NOT EXISTS) and a no-op if already present. If
-- your project's pgcrypto happens to live in a different schema, the fix
-- is a one-line search/replace of `extensions.` before applying.

create extension if not exists pgcrypto with schema extensions;

-- ============================================================================
-- admin_invitations
-- ============================================================================

create table public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users (id),
  is_active boolean not null default true,
  constraint admin_invitations_used_consistency check (
    (used_at is null) = (used_by is null)
  ),
  constraint admin_invitations_expiry_check check (expires_at > created_at)
);

create index admin_invitations_email_idx on public.admin_invitations (lower(email));
create index admin_invitations_token_hash_idx on public.admin_invitations (token_hash);

-- ============================================================================
-- RLS - admin-only, full stop. No client-facing access of any kind:
-- neither reading the invitation list nor (obviously) writing to it. All
-- writes happen through the SECURITY DEFINER functions below, which do
-- their own explicit private.is_admin() / auth.uid() checks independent of
-- these policies - this is defense-in-depth, not the only guard.
-- ============================================================================

alter table public.admin_invitations enable row level security;

create policy "admin_invitations_admin_all" on public.admin_invitations
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- ============================================================================
-- create_admin_invitation - admin-only, returns the raw token exactly once.
-- ============================================================================

create or replace function public.create_admin_invitation(
  p_email text,
  p_validity_hours integer default 72
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_token text;
  v_token_hash text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if not private.is_admin() then
    raise exception 'Only an administrator may create an admin invitation';
  end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email address is required';
  end if;
  if p_validity_hours is null or p_validity_hours <= 0 or p_validity_hours > 24 * 30 then
    raise exception 'p_validity_hours must be between 1 and 720 (30 days)';
  end if;

  -- 32 random bytes, hex-encoded -> 64 hex characters of entropy. Only the
  -- SHA-256 hash is ever persisted; this raw value is returned once, to
  -- the calling admin only, and never stored anywhere in this database.
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  insert into public.admin_invitations (email, token_hash, created_by, expires_at)
  values (lower(p_email), v_token_hash, v_uid, now() + make_interval(hours => p_validity_hours));

  return v_token;
end;
$$;

revoke all on function public.create_admin_invitation(text, integer) from public, anon;
grant execute on function public.create_admin_invitation(text, integer) to authenticated;

-- ============================================================================
-- register_admin_with_invitation - the ONLY path to role='admin'.
-- ============================================================================

create or replace function public.register_admin_with_invitation(
  p_token text,
  p_first_name text,
  p_last_name text,
  p_phone text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_token_hash text;
  v_invite public.admin_invitations;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    raise exception 'Could not resolve the current user''s email';
  end if;

  v_token_hash := encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');

  select * into v_invite
  from public.admin_invitations
  where token_hash = v_token_hash
    and is_active = true
    and used_at is null
    and expires_at > now()
    and lower(email) = lower(v_email)
  for update;

  if v_invite is null then
    raise exception 'This admin invitation is invalid, expired, already used, or does not match the '
      'signed-in account''s email address. No admin access was granted.';
  end if;

  update public.profiles
  set role = 'admin'
  where user_id = v_uid;

  update public.admin_invitations
  set used_at = now(), used_by = v_uid, is_active = false
  where id = v_invite.id;

  -- Best-effort: record name/phone on an existing customer row if this
  -- account happens to already have one (unusual for a fresh admin, but
  -- harmless either way); admins are not required to have a customer_id
  -- (see profiles_role_customer_check in the original schema).
  update public.customers c
  set customer_name = coalesce(nullif(trim(p_first_name || ' ' || p_last_name), ''), c.customer_name),
      phone_1 = coalesce(p_phone, c.phone_1)
  from public.profiles pr
  where pr.user_id = v_uid and pr.customer_id = c.id;
end;
$$;

revoke all on function public.register_admin_with_invitation(text, text, text, text) from public, anon;
grant execute on function public.register_admin_with_invitation(text, text, text, text) to authenticated;

-- ============================================================================
-- complete_simple_client_registration - lightweight sibling of the
-- existing complete_client_registration RPC (untouched), for this
-- dashboard's simpler signup form. No role parameter exists.
-- ============================================================================

create or replace function public.complete_simple_client_registration(
  p_first_name text,
  p_last_name text,
  p_phone text
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

  insert into public.customers (customer_name, phone_1, email, customer_status)
  values (trim(coalesce(p_first_name, '') || ' ' || coalesce(p_last_name, '')), p_phone, v_email, 'lead')
  returning id into v_customer_id;

  update public.profiles
  set customer_id = v_customer_id,
      role = 'client'
  where user_id = v_uid;

  return v_customer_id;
end;
$$;

revoke all on function public.complete_simple_client_registration(text, text, text) from public, anon;
grant execute on function public.complete_simple_client_registration(text, text, text) to authenticated;
