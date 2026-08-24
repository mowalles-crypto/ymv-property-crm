# BIZRAEL Property Management

A CRM for BIZRAEL, a property management company: clients, properties, per-property monthly accounting, a client self-registration flow with a property requirements questionnaire, and role-based admin/client portals — built on Next.js and Supabase. (Repo/package name `ymv-crm` predates the BIZRAEL brand and was kept to avoid an unrelated rename churn.)

## Features

- **Branded entry portal**: a premium, dark charcoal + champagne-gold login/register/password-recovery experience built around the real BIZRAEL logo (`public/brand/bizrael-logo.png`) — see **Branding** below.
- **Auth**: email/password login, self-registration, email confirmation, forgot/reset password, protected routes, role-aware redirects, session-expired detection.
- **Roles**: `admin` (full CRUD on all business data) and `client` (read-only access to their own data only), enforced by Postgres Row Level Security — not just hidden UI.
- **Clients**: list with search/filter, create/edit/delete, detail page with contact info, requirements, and owned properties.
- **Properties**: list with search/filter by client and status, create/edit/delete, detail page with financing/rental/sale sections shown conditionally by status.
- **Accounting**: monthly rent/expenses per property/year with database-computed totals and profit (Postgres generated columns — they cannot drift from the underlying numbers), a one-click "create accounting year" that provisions all 12 months, and an annual total row.
- **Client registration**: multi-step wizard (account → contact → property requirements → confirmation) that creates the customer record and links it to the authenticated user server-side, via a `SECURITY DEFINER` RPC that derives identity from the session — never from client-supplied input.
- **Property requirements questionnaire**: purchase purpose, property type(s), locations, budget, equity, financing, rooms, size, condition, timeline, desired yield, amenities, free text.
- **Dashboards**: admin sees company-wide stats (clients, leads, properties by status, this year's rent/expenses/profit); clients see only their own.
- **Customer profile documents**: passport (client + spouse), Power of Attorney, spouse/partner details, and Israeli bank account information, each in its own tab on the client detail page. Files live in a **private** Supabase Storage bucket — never a public URL — accessed only through short-lived signed URLs the caller's own RLS policy allows them to request. Expiry-aware status badges (Valid / Expiring soon / Expired / Missing) on passports and POA. Bank account numbers are masked (`****1234`) behind a "Reveal" toggle everywhere they're shown.
- **i18n-ready**: all UI strings live in `src/lib/i18n/en.ts` behind a single `t` import — no strings scattered through components — so `he`/`es` dictionaries can be added later without touching component code. RTL is a one-line `dir` change away.
- **Task-driven client experience**: the client portal opens on a "What would you like to do today?" Home page with three guided flows instead of a database-style dashboard — **View My Existing Investments**, **Find a New Investment**, **Sell an Existing Investment**. See **Task-driven investment platform** below.
- **Report engine**: Portfolio (all properties) or single-Property reports, for a Custom Date Range or a Full Year (past years run Jan 1–Dec 31; the current year is capped at Jan 1–today — never a future date), showing Total Investment / Total Income / Total Expenses / Net Profit with optional transaction-level detail, printable as a branded PDF (`window.print()` — no PDF library) and exportable as CSV.
- **Investment offers marketplace**: an admin-managed catalog of investment opportunities (`investment_offers`) with images/documents, matched against a client's saved property requirements by a deterministic (non-AI) scoring engine that shows *why* each result matched, plus an ad-hoc search that never overwrites the client's saved profile unless they explicitly save it.
- **Sell-an-investment flow**: a guided request (price, terms, timeline) that creates a `property_sale_requests` row, with an optional capital-gains-tax estimate carrying a mandatory, prominent "not tax/legal advice" disclaimer. Internal admin notes on a sale request are readable by admin but never by the client — enforced at the column level, not just by row (see **Column-level confidentiality** below).

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
    forms/        Feature forms (CustomerForm, PropertyForm, AccountingTable, RegisterWizard, DocumentCard, SpouseSection, BankAccountSection, ...)
  lib/
    supabase/     client.ts (browser), server.ts (RSC/route handlers), admin.ts (service role, server-only), middleware.ts (session refresh)
    auth.ts       requireProfile/requireAdmin/requireClient guards used at the top of pages/layouts
    documents.ts  Storage path builder, file validation, expiry-status logic shared by admin + client document views
    i18n/         String dictionary
    types/        Generated DB types (database.ts) + hand-written domain/form types
    reports.ts    generateReport() — the report engine (Portfolio/Property x Custom/Full Year)
    matching.ts   scoreOffer()/matchOffers() — deterministic investment-offer matching
    acquisitionCosts.ts  calculateAcquisitionCost() — purchase tax/lawyer/brokerage, admin-rule-driven
  proxy.ts        Next.js 16 proxy (formerly "middleware") — refreshes the session and gates routes on every request
supabase/
  migrations/     Hand-written SQL migrations (schema, RLS, functions, Storage bucket + policies)
scripts/
  seed.mjs                    Creates demo auth users + customers + properties + accounting + requirements
  seed-more.mjs                A second wave of demo customers/properties (run after seed.mjs)
  seed-profile-expansion.mjs  Demo passport/POA/spouse/bank-account data, incl. fake placeholder document uploads
  seed-investment-platform.mjs  Acquisition-cost/capital-gains-tax rules, tax basis, property_transactions backfill, investment offers + documents/images, sample inquiry + sale request
  test-rls.mjs                Exercises RLS + Storage policies directly against the API as admin / two clients / anonymous
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

Four migrations under `supabase/migrations/`:

1. **`init_schema.sql`** — enums, `customers`, `profiles`, `properties`, `property_accounting`, `property_requirements`; `total_expenses`/`profit` as Postgres `GENERATED ALWAYS AS ... STORED` columns; a unique `(property_id, year, month)` constraint; `handle_new_user()` trigger that gives every new auth user a bare `client` profile; the `complete_client_registration` RPC; the `create_accounting_year` RPC; and the initial RLS policies.
2. **`fix_rls_policy_perf.sql`** — follow-up fixing two `supabase db advisors` findings: policies re-evaluating `auth.uid()` per row instead of once per query, and redundant overlapping SELECT policies (split into one policy per action instead of an admin "for all" + a separate "select own" policy).
3. **`split_expense_descriptions.sql`** — replaced the single shared `expense_description` column on `property_accounting` with `expense_1_description` … `expense_5_description`, one per expense. `total_expenses`/`profit` are unaffected (they only ever summed the five amount columns).
4. **`customer_profile_expansion.sql`** — `customer_spouses` (one per customer for now), `customer_bank_accounts` (schema allows several per customer; the UI treats the first as "the" account), `customer_documents` (metadata only — passport/POA/spouse-passport/bank-document/other, with a `document_type`+`customer_id` unique index making passport and POA singletons per customer, and a unique index on `spouse_id` making the spouse's passport a singleton per spouse), plus the private `customer-documents` Storage bucket and its RLS policies. See **Documents & Storage** below.
5. **`task_driven_investment_platform.sql`** — `property_transactions` (a flexible, category-enum ledger — see **Report engine** below); `investment_offers` + `investment_offer_documents` + `investment_inquiries`; `property_sale_requests` (incl. the confidential `admin_notes` column); `property_tax_basis`, `acquisition_cost_rules`, `capital_gains_tax_rules`, `capital_gains_tax_estimates`; the `get_my_sale_requests()` and `estimate_capital_gains_tax()` functions; the private `investment-offers` Storage bucket and its policies. Two narrow follow-up indexes (`capital_gains_tax_estimates_sale_request_id_idx` etc., flagged by `db advisors` for FK columns used in joins) were added directly to this file rather than as a separate migration, since they were applied in the same working session before anything downstream depended on the migration boundary.

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

`supabase db advisors --linked --type security` reports one `WARN`, and it's expected: `complete_client_registration` is a `SECURITY DEFINER` function callable by any authenticated user. That's required for self-registration to work — it's guarded internally by reading `auth.uid()` and hardcoding `role`/`customer_status`, so there's no privilege-escalation path through it. All performance findings (`auth_rls_initplan`, `multiple_permissive_policies`) are resolved. The advisor also flags `auth_leaked_password_protection` (Supabase's HaveIBeenPwned check is off by default on a new project) — unrelated to this app's own schema/RLS, toggle it in the dashboard under Auth settings when convenient.

## Documents & Storage

Passport, Power of Attorney, and spouse-passport files live in the **private** `customer-documents` Storage bucket (`public: false`, 10 MB limit, PDF/JPEG/PNG only) — never a public URL. Every object path is `{customer_id}/{document_type}/{uuid}.{ext}`, and the Storage RLS policies on `storage.objects` check `(storage.foldername(name))[1]` against the caller's own `customer_id` (or `private.is_admin()`) — the same ownership check used everywhere else, just applied to file paths instead of table rows. Only admin can INSERT/UPDATE/DELETE storage objects; both admin and the owning client can SELECT (needed to request a signed URL for their own file).

The database only ever stores metadata (`customer_documents`): filename, mime type, size, structured passport fields (`passport_number`, `passport_country`) or POA fields (`document_date`, `expiry_date`, `notes`), and the storage path — never the file bytes. Viewing or downloading calls `supabase.storage.from('customer-documents').createSignedUrl(path, 60)` client-side, which only succeeds if the Storage RLS SELECT policy allows it; a 60-second signed URL is generated fresh on every click, nothing permanent is ever exposed. "Replace" deletes the old object + row and inserts a new one (the singleton unique index would otherwise conflict).

Bank account numbers, the account-holder identifier, and IBAN are masked (`****1234`) by default in the UI, for both admin and client, behind a "Reveal" toggle — per the spec's requirement to treat bank data as sensitive even inside the authorized detail screen, not just in list views.

## Task-driven investment platform

### Report engine and `property_transactions` vs. `property_accounting`

The pre-existing `property_accounting` table (one row per property/month, five fixed numbered expense slots with independent descriptions) remains the admin's monthly bookkeeping UI and is untouched. Client-facing reports (Portfolio/Property × Custom Date Range/Full Year) are instead built from a new, separate `property_transactions` table — a flexible ledger with a `transaction_type` (income/expense) and a `transaction_category` enum, one row per real-world event rather than one row per month. The two are **not merged**: their shapes are structurally incompatible (fixed monthly slots vs. an open-ended dated ledger), and unifying them would have meant either weakening the accounting UI's month/year structure or losing the transaction-level detail reports need. `scripts/seed-investment-platform.mjs` backfills `property_transactions` from the existing `property_accounting` demo rows so the two numerically agree for the current demo data, but there is no ongoing sync between them — a production rollout would need admin data entry (or a real sync job) to keep both current going forward. `src/lib/reports.ts`'s `generateReport()` is a pure function taking a trusted `customerId` (from the session, never from client input) plus an optional `propertyId` and date range; it computes Total Investment (purchase price + purchase tax + brokerage + legal fees + recognized capital improvements — explicitly *not* ordinary repairs/maintenance) from `property_tax_basis`, and Income/Expenses/Net Profit from `property_transactions`. PDF export is `window.print()` against a print-optimized layout (`print:` Tailwind variants, with the app chrome hidden via `print:hidden` on `AppShell`) rather than a PDF library dependency; CSV export is a client-side Blob download.

### Investment offers & the matching engine

`investment_offers` (with images/documents in the private `investment-offers` Storage bucket, same signed-URL pattern as customer documents) is an admin-managed catalog; clients only ever see `status = 'active'` rows (enforced by RLS, not UI filtering). `src/lib/matching.ts`'s `scoreOffer()` is a **deterministic, explainable** weighted scorer (budget/location/property-type/purpose/yield/financing/size — no AI, no black box) that always attaches human-readable `reasons[]` ("Within your target budget", "Located in one of your preferred areas", ...) so a client can see *why* a result matched. The "Search Using Different Criteria" alternate questionnaire reuses the same `RequirementsFields` component the onboarding wizard uses (via an additive `variant="light"` prop) but only ever writes back to the client's saved `property_requirements` profile if they explicitly click "Save these preferences as my new profile" — an ad-hoc search never silently overwrites the permanent profile.

### Acquisition cost engine

`src/lib/acquisitionCosts.ts`'s `calculateAcquisitionCost()` computes purchase tax, lawyer fee, and brokerage fee from an admin-configurable `acquisition_cost_rules` table (percentage / fixed / tiered-bracket / custom calculation types, with `active`/`effective_from` versioning). **No Israeli tax bracket is hardcoded or invented** — the demo seed leaves `purchase_tax` deliberately unconfigured (`calculation_type: 'custom'`, `active: false`-equivalent via no matching active rule) so the UI shows "Not yet configured" rather than a plausible-looking wrong number; lawyer fee (1%) and brokerage fee (2%) are configured with a `notes` field citing market-convention sources. The total acquisition cost is only ever shown once **all three** components resolve to a real number — a partial total is never displayed, since that would silently understate the true cost.

### Capital gains tax (Mas Shevach) estimator

`capital_gains_tax_rules` + `capital_gains_tax_estimates` + the `estimate_capital_gains_tax()` `SECURITY INVOKER` RPC form a versioned, auditable estimate framework rather than a fixed-percentage calculation presented as reliable. The one seeded demo rule (`demo-2026-flat-25`) is a flat 25% on nominal gain, explicitly labeled as a demo rule in its own `notes` and **does not** model inflation indexation, the sole-home exemption, or the high-earner surcharge — real Israeli capital gains tax law was not implemented from memory; the seed script's `source` field cites the web sources checked while writing the demo rule, so its limitations are traceable rather than silently wrong. Every estimate the RPC produces is persisted (`capital_gains_tax_estimates`) with its rule version and a full cost-basis breakdown, and every place an estimate is shown to a client carries the mandatory disclaimer: *"Estimated calculation only. This result is not a final tax assessment and does not constitute legal or tax advice. Final liability depends on the applicable law, exemptions, individual circumstances and confirmation by an appropriate tax professional and/or the Israel Tax Authority."* Missing `property_tax_basis` data is surfaced as an explicit "this estimate may be incomplete" warning rather than silently treated as zero.

### Column-level confidentiality (`property_sale_requests.admin_notes`)

Admin and client share one Postgres role (`authenticated`), so ordinary row-level RLS can't hide a single column from a client who otherwise has SELECT on the row. `property_sale_requests` has **no client-facing base-table SELECT policy at all** — only an admin-only one — and clients instead read their own sale requests through `get_my_sale_requests()`, a `SECURITY DEFINER` function that explicitly returns `null::text as admin_notes`. This means a client's insert (creating a new sale request) also can't chain PostgREST's `.select()`/`RETURNING`, since Postgres enforces the SELECT policy on the `RETURNING` clause too — the client app inserts without `.select()`, then re-reads the new row's id via `get_my_sale_requests()`. (This exact gap — an insert that silently fails RLS only when combined with `.select()` — was the one real bug this phase's live browser testing caught that the original test suite had missed; `scripts/test-rls.mjs` now has a dedicated client-INSERT-path assertion for it.)

## Seed data

```bash
npm run seed                          # 1 admin + 5 customers + properties + accounting + requirements
node scripts/seed-more.mjs            # optional: 5 more customers + properties (run after the above)
node scripts/seed-profile-expansion.mjs  # passport/POA/spouse/bank-account demo data (fake placeholder PDFs)
node scripts/seed-investment-platform.mjs  # acquisition-cost/capital-gains rules, tax basis, property_transactions backfill, 5 investment offers + docs/images, sample inquiry + sale request
```

Requires `SUPABASE_SECRET_KEY` in `.env.local`. Demo login credentials are generated fresh each run, printed to the console, and appended to `.secrets/demo-credentials.txt` (gitignored — never committed). All uploaded demo documents are clearly-fake placeholder PDFs generated in memory — no real personal data or documents are ever written to disk or committed.

## RLS testing

```bash
node scripts/test-rls.mjs
```

Signs in as the seeded admin, two different clients, and an anonymous session, then runs 46 assertions straight against the Data API and Storage API (no service role, no frontend) covering the checklist from the spec: admin full CRUD on every table; a client reading only their own customer/properties/accounting/requirements/spouse/bank-account/documents; a client blocked from writing business data (verified by confirming the row is unchanged, since an RLS-blocked UPDATE/DELETE affects 0 rows rather than throwing); two clients each unable to see the other's data or bank/spouse records; at the Storage level, not just the metadata table, a client unable to get a signed URL for another client's passport file even knowing its exact path, and an anonymous caller unable to get one for anybody's; and, for the task-driven investment platform, a client reading only their own `property_transactions` and unable to insert one (admin-managed only), seeing only `active` investment offers and unable to fetch a `draft` one by id, inserting an inquiry under their own identity but not impersonating another customer, `get_my_sale_requests()` never leaking `admin_notes` while the base table is unreadable to a client directly, a client's own sale-request **insert** succeeding for their own property (and failing for someone else's property, someone else's `customer_id`, or a client-supplied `admin_notes`), and a client generating a capital-gains estimate only for their own property. **Last run: 46/46 passed.** (Requires `scripts/seed-profile-expansion.mjs` and `scripts/seed-investment-platform.mjs` to have run for those respective sections' assertions; they're skipped otherwise.)

## Branding

The BIZRAEL logo (`public/brand/bizrael-logo.png`) is the real supplied asset — never recreated, redrawn, or recolored — used at its native aspect ratio in the sidebar (authenticated app) and full-size on the entry portal.

Two visually distinct surfaces share one component library:

- **Entry portal** (`(auth)` route group, plus `/register/complete-requirements`): full-screen dark charcoal (`bg-charcoal`), champagne-gold accents (`text-gold`, the `gold`/`gold-outline` Button variants), a subtle gold architectural line-and-circle SVG background, and Playfair Display for headings (`var(--font-display)`) against Geist Sans for UI text.
- **Authenticated CRM** (admin/client dashboards, forms, tables): stays light and dense for daily data-entry usability, with gold used only as an accent — the sidebar's active-nav indicator, a hairline gold divider under the top header, and a thin gold top border on dashboard `StatCard`s. No business action button was recolored gold; that color is reserved for the brand/entry surfaces per the design brief ("gold only as an accent... do not make every component gold").

The color tokens (`--color-charcoal`, `--color-gold`, `--color-ivory`, `--color-warmgray`, etc.) are defined once in `src/app/globals.css` via Tailwind v4's `@theme`. The shared form primitives in `src/components/ui/Field.tsx` (`Input`/`Select`/`Textarea`/`Checkbox`) and `Button.tsx` take an additive `variant`/`"dark"` option — every existing light-themed call site across the CRM (`CustomerForm`, `PropertyForm`, `SpouseSection`, `BankAccountSection`, ...) is untouched and defaults to light; only the onboarding-only components (`RegisterWizard`, `RequirementsFields`, `CompleteRequirementsForm`, the login/forgot/reset pages) opt into `variant="dark"`.

**Stitch MCP** was checked again before this work (same `Incompatible auth server: does not support dynamic client registration` failure as every prior check this project) and remains unavailable — this design was hand-built with Tailwind, not substituted with another AI design tool, consistent with the rest of the app.

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
- **Passport numbers, bank details, etc. are not column-level-encrypted** in Postgres — security here relies on Supabase's encryption at rest, RLS (verified: nobody but the owning client or an admin can read the rows or the files), and the private Storage bucket. There is no application-layer encryption (e.g. `pgcrypto`) on top of that.
- **Leaked password protection** is off by default on this Supabase project (flagged by `db advisors`, unrelated to the app's own schema) — worth enabling in the dashboard.
- **Mobile viewport of the new entry portal was not visually verified** — the browser automation tool's window resize didn't change the rendered viewport in this environment, so mobile-width screenshots weren't possible. The layout (`(auth)/layout.tsx`) stacks correctly at the `lg:` breakpoint by ordinary Tailwind convention (the brand/login panels are plain block-stacked children until `lg:grid` kicks in), which is a standard, low-risk pattern, but it wasn't seen rendered at a phone width. Worth a manual check.
- **No square favicon/app icon derived from the logo**: the supplied BIZRAEL asset is a wide wordmark (218×80), which reads poorly cropped down to 16–32px — the existing default Next.js favicon was left in place rather than shipping an unreadable one. The logo is used at readable sizes everywhere it actually needs to be (entry portal, sidebar).
- **"Remember me" was intentionally not added** to the login form — the spec listed it as optional ("if implemented securely"), and doing it properly would mean giving the `@supabase/ssr` cookie-based session model a non-default, session-only cookie mode, which risks subtly breaking auth for a checkbox that was explicitly optional. A non-functional checkbox would have been worse than omitting it.
- **Capital gains tax demo rule is not real Israeli tax law**: a flat 25% on nominal gain, with no indexation, sole-home exemption, or high-earner surcharge modeled. It's clearly labeled `demo-2026-flat-25` with a `notes` field explaining exactly what it omits and citing the web sources checked while writing it. Anyone deploying this for a real client needs a tax professional to author a verified, versioned real rule in `capital_gains_tax_rules` before this estimate is shown as anything but a rough illustration — the disclaimer shown alongside every estimate says exactly this.
- **`acquisition_cost_rules.purchase_tax` is deliberately left unconfigured** in the demo seed (shows "Not yet configured" in the UI, never a fabricated number) — same reasoning: Israeli purchase tax brackets weren't invented from memory, and a real deployment needs an admin (ideally with tax/legal sign-off) to add a real, versioned rule.
- **`property_transactions` and `property_accounting` are two independent mechanisms**, not a single source of truth kept in sync automatically — see **Report engine and `property_transactions` vs. `property_accounting`** above. The seed script backfills one from the other once; nothing keeps them aligned as new data is entered going forward.
- **Investment offer images/documents in the demo seed are fake placeholder files** (a 1×1 PNG, a minimal synthetic PDF) — same "clearly fake, generated in memory, never real content" approach as the customer-documents seed.
