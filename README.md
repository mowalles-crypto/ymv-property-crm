# YMV Property CRM

A CRM for a property management company: clients, properties, per-property monthly accounting, a client self-registration flow with a property requirements questionnaire, and role-based admin/client portals — built on Next.js and Supabase.

## Features

- **Auth**: email/password login, self-registration, email confirmation, forgot/reset password, protected routes, role-aware redirects.
- **Roles**: `admin` (full CRUD on all business data) and `client` (read-only access to their own data only), enforced by Postgres Row Level Security — not just hidden UI.
- **Clients**: list with search/filter, create/edit/delete, detail page with contact info, requirements, and owned properties.
- **Properties**: list with search/filter by client and status, create/edit/delete, detail page with financing/rental/sale sections shown conditionally by status.
- **Accounting**: monthly rent/expenses per property/year with database-computed totals and profit (Postgres generated columns — they cannot drift from the underlying numbers), a one-click "create accounting year" that provisions all 12 months, and an annual total row.
- **Client registration**: multi-step wizard (account → contact → property requirements → confirmation) that creates the customer record and links it to the authenticated user server-side, via a `SECURITY DEFINER` RPC that derives identity from the session — never from client-supplied input.
- **Property requirements questionnaire**: purchase purpose, property type(s), locations, budget, equity, financing, rooms, size, condition, timeline, desired yield, amenities, free text.
- **Dashboards**: admin sees company-wide stats (clients, leads, properties by status, this year's rent/expenses/profit); clients see only their own.
- **i18n-ready**: all UI strings live in `src/lib/i18n/en.ts` behind a single `t` import — no strings scattered through components — so `he`/`es` dictionaries can be added later without touching component code. RTL is a one-line `dir` change away.

## Tech stack

- Next.js 16 (App Router, TypeScript, Turbopack) + Tailwind CSS 4
- Supabase (Postgres, Auth, RLS, Data API) via `@supabase/ssr` and `@supabase/supabase-js`
- No ORM — hand-written SQL migrations, `supabase` CLI for schema management

## Project structure

```
src/
  app/            Routes (App Router). (auth)/ = public auth pages, admin/ and client/ = role-gated portals
  components/
    ui/           Generic building blocks (Button, Card, Field, Badge, StatCard)
    layout/       AppShell, Sidebar, SignOutButton
    forms/        Feature forms (CustomerForm, PropertyForm, AccountingTable, RegisterWizard, ...)
  lib/
    supabase/     client.ts (browser), server.ts (RSC/route handlers), admin.ts (service role, server-only), middleware.ts (session refresh)
    auth.ts       requireProfile/requireAdmin/requireClient guards used at the top of pages/layouts
    i18n/         String dictionary
    types/        Generated DB types (database.ts) + hand-written domain/form types
  proxy.ts        Next.js 16 proxy (formerly "middleware") — refreshes the session and gates routes on every request
supabase/
  migrations/     Hand-written SQL migrations (schema, RLS, functions)
scripts/
  seed.mjs        Creates demo auth users + customers + properties + accounting + requirements
  test-rls.mjs    Exercises RLS directly against the Data API as admin / two different clients / anonymous
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values from
`https://supabase.com/dashboard/project/<ref>/settings/api`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # safe for the browser
SUPABASE_SECRET_KEY=...                    # server-only — never prefix with NEXT_PUBLIC_
```

`SUPABASE_SECRET_KEY` is only read from `src/lib/supabase/admin.ts`, which is guarded by the `server-only` package — importing it from a Client Component is a build error, not just a convention.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in real values

# Link to your Supabase project and apply migrations
npx supabase login --token <personal-access-token>
npx supabase link --project-ref <your-project-ref>
npx supabase db push --linked

# Regenerate types after any schema change
npx supabase gen types typescript --linked --schema public > src/lib/types/database.ts

npm run dev
```

## Database schema

Three migrations under `supabase/migrations/`:

1. **`init_schema.sql`** — enums, `customers`, `profiles`, `properties`, `property_accounting`, `property_requirements`; `total_expenses`/`profit` as Postgres `GENERATED ALWAYS AS ... STORED` columns; a unique `(property_id, year, month)` constraint; `handle_new_user()` trigger that gives every new auth user a bare `client` profile; the `complete_client_registration` RPC; the `create_accounting_year` RPC; and the initial RLS policies.
2. **`fix_rls_policy_perf.sql`** — follow-up fixing two `supabase db advisors` findings: policies re-evaluating `auth.uid()` per row instead of once per query, and redundant overlapping SELECT policies (split into one policy per action instead of an admin "for all" + a separate "select own" policy).
3. **`split_expense_descriptions.sql`** — replaced the single shared `expense_description` column on `property_accounting` with `expense_1_description` … `expense_5_description`, one per expense. `total_expenses`/`profit` are unaffected (they only ever summed the five amount columns).

No table exists per client/property/year — everything is normalized behind foreign keys, and the UI does the narrowing.

## Authentication & registration architecture

- Supabase Auth handles sign-up, sign-in, password reset, and email confirmation.
- A database trigger (`handle_new_user`) fires on every `auth.users` insert and creates a `profiles` row with `role = 'client'` and `customer_id = null` — hardcoded, never taken from client input, so there is no path for a user to grant themselves `admin`.
- Registration collects account + contact + the requirements questionnaire client-side, then calls `complete_client_registration(...)`, a `SECURITY DEFINER` Postgres function that: reads the caller's identity from `auth.uid()` (not a parameter), creates the `customers` row, links `profiles.customer_id`, sets `customer_status = 'lead'`, and inserts `property_requirements` — all in one transaction. If email confirmation is required, sign-up returns no session yet; the user finishes the same step at `/register/complete-requirements` right after confirming their email (the root route sends any authenticated client with no linked customer there automatically).
- **Promoting a user to admin is intentionally not available anywhere in the app UI.** It's a direct database update by whoever holds project access — e.g. `update public.profiles set role = 'admin' where user_id = '<uuid>';` run with your own credentials against the linked project. `scripts/seed.mjs` does exactly this for the one demo admin.

## Row Level Security

Every table has RLS enabled. Two `SECURITY DEFINER` helper functions in a `private` schema (not exposed via the Data API) avoid the classic self-referencing-policy recursion problem:

- `private.is_admin()` — reads the caller's own `profiles` row, bypassing RLS internally (that's the point of `SECURITY DEFINER` here) so it can safely be used inside `profiles`' own policies without recursing.
- `private.current_customer_id()` — same pattern, returns the caller's linked `customer_id`.

Policy shape per table: one `SELECT` policy (`is_admin() OR <ownership check>`), plus separate admin-only `INSERT`/`UPDATE`/`DELETE` policies. Clients get zero write policies on business tables (`customers`, `properties`, `property_accounting`) — their access is read-only by construction, not by hiding buttons in the UI.

`supabase db advisors --linked --type security` reports one `WARN`, and it's expected: `complete_client_registration` is a `SECURITY DEFINER` function callable by any authenticated user. That's required for self-registration to work — it's guarded internally by reading `auth.uid()` and hardcoding `role`/`customer_status`, so there's no privilege-escalation path through it. All performance findings (`auth_rls_initplan`, `multiple_permissive_policies`) are resolved.

## Seed data

```bash
npm run seed
```

Creates 1 admin + 5 customers (3 with portal logins spanning lead/active/inactive status), 7 properties across every status, a year of accounting for the income-producing ones, and a requirements record for each customer. Requires `SUPABASE_SECRET_KEY` in `.env.local`. Demo login credentials are generated fresh each run, printed to the console, and written to `.secrets/demo-credentials.txt` (gitignored — never committed).

## RLS testing

```bash
node scripts/test-rls.mjs
```

Signs in as the seeded admin, two different clients, and an anonymous session, then runs 20 assertions straight against the Data API (no service role, no frontend) covering the checklist from the spec: admin full CRUD; a client reading only their own customer/properties/accounting/requirements; a client blocked from writing business data (verified by confirming the row is unchanged, since an RLS-blocked UPDATE/DELETE affects 0 rows rather than throwing); and two clients each unable to see the other's data. **Last run: 20/20 passed.**

## Internationalization

All strings are centralized in `src/lib/i18n/en.ts` behind `src/lib/i18n/index.ts`'s `t` export. Components only ever do `import { t } from "@/lib/i18n"` — no hardcoded copy. Adding Hebrew or Spanish means writing `he.ts`/`es.ts` matching the same shape and switching `getLocale()`; `dir` is already a separate export so flipping to `rtl` for Hebrew doesn't touch component code.

## Running

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint      # ESLint
```

## Known limitations / next steps

- **UI design tool**: the task required using Stitch MCP for UX/UI design. Stitch's tools were unavailable for the entire session (`Incompatible auth server: does not support dynamic client registration` on every call, confirmed on repeated retries at the start and end of the build). Per instructions, no other AI design tool (DesignSync, etc.) was substituted — the UI was hand-built directly with Tailwind CSS using conventional admin-CRM patterns (cards, tables, status badges, tabs). Re-run through Stitch once its MCP connection is fixed.
- **Node version**: `@supabase/supabase-js` now expects Node 22+; this environment has Node 20.17, so both the app and the scripts run with a harmless deprecation warning. Upgrade Node when convenient.
- **Admin inviting a client**: an admin can create a `customers` record directly (e.g. a lead entered from a phone call), but there's no "send this person a portal invite" email flow yet — a client currently gets a login only via self-registration.
- **Accounting edit UX**: edits are per-cell controlled inputs with a single "Save" that upserts changed months; there's no per-row autosave or optimistic-conflict handling if two admins edit the same property simultaneously.
- **Only English is populated**; the i18n architecture is ready for `he`/`es` but those dictionaries don't exist yet.
