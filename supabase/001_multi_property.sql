-- ============================================================
-- Migration 001: Multi-property support + v0 schema extension
-- Run this in: Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. Drop the unique constraint on user_id so users can have many properties.
--    The constraint name varies; we try both common names.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'properties_user_id_key' AND conrelid = 'properties'::regclass
  ) THEN
    ALTER TABLE properties DROP CONSTRAINT properties_user_id_key;
  END IF;
END $$;

-- 2. Add v0 fields to properties (all optional to stay backward-compatible).
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS location      text,
  ADD COLUMN IF NOT EXISTS type          text DEFAULT 'Primary',
  ADD COLUMN IF NOT EXISTS mort_rate     numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS income        numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS occupancy     integer DEFAULT 0;

-- 3. Extend bills with v0 fields.
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS category     text    DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS autopay      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status       text    DEFAULT 'green',
  ADD COLUMN IF NOT EXISTS status_label text,
  ADD COLUMN IF NOT EXISTS source       text    DEFAULT 'manual';

-- 4. Bookings table (STR per-stay economics).
CREATE TABLE IF NOT EXISTS bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  platform      text NOT NULL,
  guest         text,
  check_in      date,
  check_out     date,
  nights        integer,
  gross         numeric(10,2) DEFAULT 0,
  platform_fee  numeric(10,2) DEFAULT 0,
  cleaning_fee  numeric(10,2) DEFAULT 0,
  taxes         numeric(10,2) DEFAULT 0,
  net           numeric(10,2) DEFAULT 0,
  status        text DEFAULT 'upcoming',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'users_own_bookings'
  ) THEN
    CREATE POLICY users_own_bookings ON bookings
      FOR ALL USING (
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- 5. Utility months table (monthly spend chart data).
CREATE TABLE IF NOT EXISTS utility_months (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  month       text NOT NULL,
  electric    numeric(10,2) DEFAULT 0,
  water       numeric(10,2) DEFAULT 0,
  gas         numeric(10,2) DEFAULT 0,
  solar       numeric(10,2) DEFAULT 0,
  budget      numeric(10,2) DEFAULT 0
);

ALTER TABLE utility_months ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'utility_months' AND policyname = 'users_own_utility_months'
  ) THEN
    CREATE POLICY users_own_utility_months ON utility_months
      FOR ALL USING (
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- 6. Action items table.
CREATE TABLE IF NOT EXISTS action_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  priority    text NOT NULL,
  label       text NOT NULL,
  detail      text,
  category    text,
  due_in      text,
  amount      numeric(10,2),
  cta_label   text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'action_items' AND policyname = 'users_own_action_items'
  ) THEN
    CREATE POLICY users_own_action_items ON action_items
      FOR ALL USING (
        property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
      );
  END IF;
END $$;
