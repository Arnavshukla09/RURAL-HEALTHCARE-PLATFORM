-- ============================================================
-- NOTIFICATIONS TABLE
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type  TEXT NOT NULL DEFAULT 'all' CHECK (recipient_type IN ('all', 'individual', 'role')),
  recipient_id    UUID REFERENCES patients(id) ON DELETE CASCADE,
  recipient_role  TEXT,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'emergency')),
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup per user
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS: admin can read/write all; patients read their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow admins full access
CREATE POLICY "admins_all_notifications"
  ON notifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM patients WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Allow patients to read their own notifications
CREATE POLICY "patients_read_own_notifications"
  ON notifications FOR SELECT
  USING (
    recipient_type = 'all'
    OR recipient_id = (SELECT id FROM patients WHERE user_id = auth.uid())
    OR recipient_role = (SELECT role FROM patients WHERE user_id = auth.uid())
  );

-- Verify
SELECT table_name FROM information_schema.tables WHERE table_name = 'notifications';
