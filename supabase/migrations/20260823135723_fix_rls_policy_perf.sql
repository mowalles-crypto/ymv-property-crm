-- Fix RLS advisor findings from the initial schema:
--   * auth_rls_initplan: wrap auth.<fn>() calls in (select ...) so they are
--     evaluated once per query instead of once per row.
--   * multiple_permissive_policies: replace the "select_own_or_admin" +
--     "for all" policy pairs with one policy per action, eliminating the
--     redundant SELECT evaluation.

-- Single-statement SQL functions can be inlined by the planner, which would
-- reintroduce per-row auth.uid() evaluation inside the policies that call
-- them — wrap the inner call too.

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where profiles.user_id = (select auth.uid())
      and profiles.role = 'admin'
  );
$$;

create or replace function private.current_customer_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select customer_id from public.profiles where profiles.user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());

create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated
  with check (private.is_admin());

create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------

drop policy if exists "customers_select_own_or_admin" on public.customers;
drop policy if exists "customers_admin_write" on public.customers;

create policy "customers_select" on public.customers
  for select to authenticated
  using (private.is_admin() or id = private.current_customer_id());

create policy "customers_insert_admin" on public.customers
  for insert to authenticated
  with check (private.is_admin());

create policy "customers_update_admin" on public.customers
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "customers_delete_admin" on public.customers
  for delete to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------

drop policy if exists "properties_select_own_or_admin" on public.properties;
drop policy if exists "properties_admin_write" on public.properties;

create policy "properties_select" on public.properties
  for select to authenticated
  using (private.is_admin() or customer_id = private.current_customer_id());

create policy "properties_insert_admin" on public.properties
  for insert to authenticated
  with check (private.is_admin());

create policy "properties_update_admin" on public.properties
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "properties_delete_admin" on public.properties
  for delete to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------------------
-- property_accounting
-- ---------------------------------------------------------------------------

drop policy if exists "accounting_select_own_or_admin" on public.property_accounting;
drop policy if exists "accounting_admin_write" on public.property_accounting;

create policy "accounting_select" on public.property_accounting
  for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.properties p
      where p.id = property_accounting.property_id
        and p.customer_id = private.current_customer_id()
    )
  );

create policy "accounting_insert_admin" on public.property_accounting
  for insert to authenticated
  with check (private.is_admin());

create policy "accounting_update_admin" on public.property_accounting
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "accounting_delete_admin" on public.property_accounting
  for delete to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------------------
-- property_requirements
-- ---------------------------------------------------------------------------

drop policy if exists "requirements_select_own_or_admin" on public.property_requirements;
drop policy if exists "requirements_admin_write" on public.property_requirements;

create policy "requirements_select" on public.property_requirements
  for select to authenticated
  using (private.is_admin() or customer_id = private.current_customer_id());

create policy "requirements_insert_admin" on public.property_requirements
  for insert to authenticated
  with check (private.is_admin());

create policy "requirements_update_admin" on public.property_requirements
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "requirements_delete_admin" on public.property_requirements
  for delete to authenticated
  using (private.is_admin());
