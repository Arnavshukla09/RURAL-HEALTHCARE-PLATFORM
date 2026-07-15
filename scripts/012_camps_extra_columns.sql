-- ============================================================
-- CREATE camps table from scratch (includes all rich fields)
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS camps (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT        NOT NULL,
  description   TEXT,
  location      TEXT        NOT NULL,
  address       TEXT,
  start_date    DATE        NOT NULL,
  end_date      DATE,
  start_time    TEXT,
  status        TEXT        NOT NULL DEFAULT 'upcoming'
                CHECK (status IN ('active', 'upcoming', 'ended')),
  category      TEXT        NOT NULL DEFAULT 'checkup',
  participants  INTEGER,
  phone         TEXT,
  map_url       TEXT,
  is_annual     BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick status/date lookups
CREATE INDEX IF NOT EXISTS idx_camps_status     ON camps(status);
CREATE INDEX IF NOT EXISTS idx_camps_start_date ON camps(start_date);

-- Enable RLS
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;

-- Anyone can read camps (public health info)
DROP POLICY IF EXISTS "camps_public_read"  ON camps;
DROP POLICY IF EXISTS "camps_admin_write"  ON camps;

CREATE POLICY "camps_public_read"
  ON camps FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can insert / update / delete
CREATE POLICY "camps_admin_write"
  ON camps FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- Seed one demo camp entry so the list isn't empty
INSERT INTO camps (title, description, location, address, start_date, end_date, start_time, status, category, participants, phone, map_url, is_annual)
VALUES (
  'RNTCP TB Screening Camp',
  'Free sputum test, chest X-ray, CBNAAT testing under Nikshay Poshan Yojana',
  'District TB Centre, Hamidia Hospital, Bhopal',
  'Inside Hamidia Hospital Campus',
  '2026-08-12',
  '2026-08-12',
  '10:00',
  'upcoming',
  'tb_screening',
  90,
  '+91 75524 00100',
  'https://maps.google.com/?q=Hamidia+Hospital+Bhopal',
  TRUE
);

-- Verify
SELECT id, title, status, start_date FROM camps ORDER BY start_date;
