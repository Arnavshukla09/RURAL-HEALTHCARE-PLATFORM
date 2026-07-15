-- ============================================================
-- Add extra columns to camps table (safe — adds only if missing)
-- Run in Supabase SQL Editor
-- ============================================================

-- Add new rich fields to camps table
ALTER TABLE camps
  ADD COLUMN IF NOT EXISTS address       TEXT,
  ADD COLUMN IF NOT EXISTS start_time    TEXT,
  ADD COLUMN IF NOT EXISTS participants  INTEGER,
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS map_url       TEXT,
  ADD COLUMN IF NOT EXISTS is_annual     BOOLEAN DEFAULT FALSE;

-- Verify columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'camps'
ORDER BY ordinal_position;
