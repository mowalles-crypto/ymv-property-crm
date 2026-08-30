-- property_valuations — ML-model valuation history for the BIZRAEL Israel
-- Real Estate Analytics dashboard (a separate Streamlit app; see
-- bizrael_realestate_dashboard/README.md). Additive only. Immutable by
-- design: historical predictions are never overwritten, so there is
-- deliberately no UPDATE policy (matches the existing
-- capital_gains_tax_estimates precedent, which is also insert+select-only).
--
-- This table also stores the model-input characteristics
-- (input_city/input_area_sqm/etc.) actually supplied for each valuation, as
-- a point-in-time snapshot independent of whatever `properties` looks like
-- later (see the companion 20260830170000_extend_properties_for_valuation
-- migration, which gives `properties` its own permanent copy of these
-- fields so users aren't re-entering them on every valuation - the two are
-- deliberately not the same data: `properties.*` is "what we currently
-- believe about this property", `property_valuations.input_*` is "what was
-- actually fed to the model for this specific historical prediction").
--
-- REVISION (this version): two corrections from the initial draft -
--   1. property_id now uses ON DELETE RESTRICT instead of CASCADE (see
--      below) so a property with valuation history cannot be silently
--      deleted along with that history.
--   2. The client-facing INSERT policy has been REMOVED. There is no path
--      by which an authenticated client (calling Supabase's REST API
--      directly with their own valid session, bypassing the dashboard UI
--      entirely) can insert a property_valuations row with fabricated
--      predicted_value/model_r2/etc. and have it stored as if it were a
--      genuine BIZRAEL model output. The only insert path is the
--      dashboard's own server-side process using the Supabase service-role
--      key (which bypasses RLS by design), and only after that same
--      process has itself computed the prediction from the loaded ML
--      model - see services/supabase_client.py's insert_valuation() in the
--      dashboard repo for the enforcement code. Admin retains a
--      RLS-governed INSERT policy for legitimate manual/administrative
--      entry (e.g. recording an external appraisal), consistent with
--      admin's full-write access to every other table in this schema.
--
-- NOT APPLIED by any automated process — this file is proposed only. Run
-- `supabase db push` (or your normal migration deploy step) yourself when
-- ready.

-- ============================================================================
-- property_valuations
-- ============================================================================

create table public.property_valuations (
  id uuid primary key default gen_random_uuid(),
  -- ON DELETE RESTRICT (not CASCADE): a property with valuation history
  -- cannot be physically deleted while that history exists - the DELETE
  -- statement itself will fail with a foreign-key-violation error. This is
  -- intentional: valuations are an audit trail, and normal CRM lifecycle
  -- changes (sold, inactive, etc.) already have a dedicated mechanism -
  -- properties.property_status - so physical deletion of a property with
  -- real history should be a deliberate, rare, and explicit action (delete
  -- or reassign the valuations first), never an accidental side effect of
  -- deleting the property row. Postgres's plain (non-deferrable) NO ACTION
  -- would behave identically here since nothing below is declared
  -- DEFERRABLE; RESTRICT is used for its more explicit, self-documenting
  -- intent.
  property_id uuid not null references public.properties (id) on delete restrict,
  valuation_date timestamptz not null default now(),
  predicted_value numeric(14, 2) not null check (predicted_value >= 0),
  lower_estimate numeric(14, 2) check (lower_estimate is null or lower_estimate >= 0),
  upper_estimate numeric(14, 2) check (upper_estimate is null or upper_estimate >= 0),
  model_name text not null,
  model_version text not null,
  model_data_latest_date date,
  model_r2 numeric(6, 4),
  model_mae numeric(14, 2),
  model_rmse numeric(14, 2),
  -- model-input characteristics actually used for this valuation (see header)
  input_region text,
  input_city text,
  input_neighborhood text,
  input_property_type text,
  input_area_sqm numeric(8, 2),
  input_rooms numeric(4, 1),
  input_floor integer,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint property_valuations_range_check check (
    lower_estimate is null or upper_estimate is null or lower_estimate <= upper_estimate
  )
);

create index property_valuations_property_id_idx on public.property_valuations (property_id);
create index property_valuations_date_idx on public.property_valuations (property_id, valuation_date desc);
create index property_valuations_created_by_idx on public.property_valuations (created_by);

-- ============================================================================
-- Row Level Security
--
-- SELECT: admin full access, or client via join to
--   properties.customer_id = private.current_customer_id() - identical
--   shape to property_transactions/property_tax_basis.
--
-- INSERT: admin only, via RLS - for legitimate manual/administrative entry.
--   There is deliberately NO client-facing insert policy. The dashboard's
--   normal "generate a valuation" flow (for both client and admin users)
--   never uses this RLS path at all - it always goes through the
--   service-role write in services/supabase_client.py's insert_valuation(),
--   which bypasses RLS and is reachable only from that one, narrowly-scoped
--   server-side function that always computes real values first. This
--   means: even an admin's own valid session, used to call the REST API
--   directly, is still constrained by real RLS if it tries the
--   client-style anonymous-insert path - only a deliberate admin action
--   through Supabase's own tooling (dashboard, SQL editor) with an admin
--   account can use this policy, and it's still gated by private.is_admin().
--
-- UPDATE: none, for anyone. Valuations are immutable - superseding a stale
--   one means inserting a new row, never editing the old one.
--
-- DELETE: admin only, for correcting a genuine data-entry mistake.
-- ============================================================================

alter table public.property_valuations enable row level security;

create policy "valuations_select" on public.property_valuations
  for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.properties p
      where p.id = property_valuations.property_id
        and p.customer_id = private.current_customer_id()
    )
  );

create policy "valuations_insert_admin" on public.property_valuations
  for insert to authenticated
  with check (private.is_admin());

create policy "valuations_delete_admin" on public.property_valuations
  for delete to authenticated using (private.is_admin());
