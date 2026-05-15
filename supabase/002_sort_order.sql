-- Migration 002: Add sort_order to properties table for drag-to-reorder on portfolio page
-- Run in Supabase → SQL Editor

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS sort_order integer;

-- Back-fill existing rows with their current order (by updated_at desc, per old default sort)
-- This is best-effort; users can drag to re-order after running this.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) - 1 AS rn
  FROM properties
)
UPDATE properties
SET sort_order = ranked.rn
FROM ranked
WHERE properties.id = ranked.id AND properties.sort_order IS NULL;
