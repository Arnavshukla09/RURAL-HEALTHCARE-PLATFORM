-- ============================================================
-- NOTIFICATIONS TABLE — Fixed Version
-- Run each block separately in Supabase SQL Editor if needed
-- ============================================================

-- Step 1: Add 'role' column to patients if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'role'
  ) THEN
    ALTER TABLE patients ADD COLUMN role TEXT NOT NULL DEFAULT 'patient';
  END IF;
END $$;

-- Step 2: Add 'email' column to patients if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'email'
  ) THEN
    ALTER TABLE patients ADD COLUMN email TEXT;
  END IF;
END $$;

-- Step 3: Create notifications table (no FK on recipient_id to avoid cascade issues)
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type  TEXT NOT NULL DEFAULT 'all'
                  CHECK (recipient_type IN ('all', 'individual', 'role')),
  recipient_id    UUID,                          -- patient row id (no FK, optional)
  recipient_role  TEXT,                          -- 'patient' | 'doctor' | 'admin'
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'info'
                  CHECK (type IN ('info', 'warning', 'success', 'emergency')),
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id   ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at     ON notifications(created_at DESC);

-- Step 5: Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "admins_all_notifications"          ON notifications;
DROP POLICY IF EXISTS "patients_read_own_notifications"   ON notifications;

-- Step 7: Admin full access
CREATE POLICY "admins_all_notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.user_id = auth.uid()
        AND patients.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.user_id = auth.uid()
        AND patients.role = 'admin'
    )
  );

-- Step 8: Patients read their own + broadcast notifications
CREATE POLICY "patients_read_own_notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    recipient_type = 'all'
    OR (
      recipient_type = 'role'
      AND recipient_role = (
        SELECT role FROM patients WHERE patients.user_id = auth.uid() LIMIT 1
      )
    )
    OR (
      recipient_type = 'individual'
      AND recipient_id = (
        SELECT id FROM patients WHERE patients.user_id = auth.uid() LIMIT 1
      )
    )
  );

-- Step 9: Verify
SELECT COUNT(*) AS notifications_table_exists
FROM information_schema.tables
WHERE table_name = 'notifications';
