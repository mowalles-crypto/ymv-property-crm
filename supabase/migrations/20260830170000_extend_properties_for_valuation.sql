-- Extends `properties` with permanent physical characteristics needed by
-- the BIZRAEL Israel Real Estate Analytics valuation model. Additive only:
-- every new column is nullable, no existing column is touched, no existing
-- row's data is altered or backfilled. Existing CRM workflows (which never
-- reference these columns) are unaffected.
--
-- property_type is a plain, checked `text` column rather than the existing
-- public.property_type enum deliberately: that enum's value set
-- (commercial/office/land, no cottage/townhouse) reflects the new-
-- development investment_offers domain, not the second-hand valuation
-- model's categories. Keeping them separate avoids overloading one enum
-- with two different taxonomies. Revisit if a single type system is
-- preferred instead.
--
-- The check constraint's allowed values are read directly off the trained
-- model's fitted OneHotEncoder (model.named_steps['pre'].transformers_ ->
-- the 'cat' transformer -> its 'property_type' categories_), not
-- guessed - confirmed to be exactly these 7 values, no more, no fewer
-- (an earlier draft of this migration incorrectly included 'Duplex' and
-- 'Villa', which the model was never trained on; OneHotEncoder(handle_
-- unknown="ignore") wouldn't error on them, it would just silently treat
-- them as an unknown category contributing nothing to the prediction -
-- exactly the kind of silent degradation this constraint exists to
-- prevent by rejecting them at write time instead).
--
-- These columns are the permanent, current-best-known characteristics of
-- the property ("what we currently believe about it"). They are distinct
-- from property_valuations.input_* (see that migration), which is a
-- point-in-time snapshot of what was actually fed to the model for one
-- specific historical prediction and never changes retroactively even if
-- these columns are later corrected.
--
-- NOT APPLIED — proposed only, pending review.

alter table public.properties
  add column region text,
  add column city text,
  add column neighborhood text,
  add column property_type text
    check (property_type is null or property_type in (
      'Apartment', 'Cottage', 'Garden Apartment', 'Other',
      'Penthouse', 'Private House', 'Townhouse'
    )),
  add column area_sqm numeric(8, 2) check (area_sqm is null or area_sqm > 0),
  add column rooms numeric(4, 1) check (rooms is null or rooms > 0),
  add column floor integer;

comment on column public.properties.region is
  'Administrative region (e.g. Tel Aviv, Central, South) - used as a valuation-model input.';
comment on column public.properties.city is
  'City name, matched against the valuation model''s training data city names where possible.';
comment on column public.properties.neighborhood is
  'Neighborhood name - used as a valuation-model input; may be unknown for some properties.';
comment on column public.properties.property_type is
  'Normalized property type for valuation purposes - see check constraint for the allowed set.';
comment on column public.properties.area_sqm is
  'Living area in square meters - used as a valuation-model input.';
comment on column public.properties.rooms is
  'Room count (fractional values like 3.5 are valid, matching Israeli listing convention).';
comment on column public.properties.floor is
  'Floor number (0 = ground floor). Nullable - not every property type has a meaningful floor.';
