-- Replace the single shared expense_description column with one description
-- per expense, so each of the 5 expense amounts carries its own note.
-- Demo data only at this stage — no data-preserving backfill needed; the
-- old shared descriptions are dropped and seed data is regenerated.

alter table public.property_accounting
  add column expense_1_description text,
  add column expense_2_description text,
  add column expense_3_description text,
  add column expense_4_description text,
  add column expense_5_description text;

alter table public.property_accounting
  drop column expense_description;
