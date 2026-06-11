-- Migration 003 — App-level Rentcast estimate cache + property coordinates
-- Run in Supabase → SQL Editor.
--
-- WHY: Rentcast's free tier is 50 requests/month and each address lookup costs
-- 3 API calls. We cache every lookup at the APPLICATION level, keyed by the
-- normalized address — NOT per-user, NOT per-property. So:
--   • deleting and re-adding the same property never re-queries Rentcast
--   • a lookup by one collaborator is reused by the other
--   • the cache survives redeploys (unlike the in-memory unstable_cache layer)
-- No expiry for now (test data, fixed small set of properties). A `fetched_at`
-- column is kept so a TTL / manual "refresh" can be added later.

create table if not exists rentcast_cache (
  address          text primary key,        -- normalized: lower(trim(address))
  estimated_value  numeric,
  price_range_low  numeric,
  price_range_high numeric,
  rent_estimate    numeric,
  rent_range_low   numeric,
  rent_range_high  numeric,
  city             text,
  state            text,
  zip_code         text,
  bedrooms         numeric,
  bathrooms        numeric,
  square_footage   integer,
  year_built       integer,
  property_type    text,
  fetched_at       timestamptz not null default now()
);

alter table rentcast_cache enable row level security;

-- Shared reference data (public property estimates, not user-private): any
-- authenticated user may read and write. Writes happen server-side from the
-- /api/property-lookup route under the requesting user's session.
drop policy if exists "rentcast_cache_select" on rentcast_cache;
create policy "rentcast_cache_select" on rentcast_cache
  for select using (auth.role() = 'authenticated');

drop policy if exists "rentcast_cache_insert" on rentcast_cache;
create policy "rentcast_cache_insert" on rentcast_cache
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "rentcast_cache_update" on rentcast_cache;
create policy "rentcast_cache_update" on rentcast_cache
  for update using (auth.role() = 'authenticated');

-- Coordinates from Google Places autocomplete, captured when a property is
-- added. Lets the property-detail map render from stored lat/lng and SKIP a
-- per-view Geocoding API call (falls back to geocoding the address if absent).
alter table properties
  add column if not exists lat double precision,
  add column if not exists lng double precision;
