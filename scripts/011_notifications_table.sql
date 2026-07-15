-- ============================================================
-- STEP 1: Drop old broken table completely and start fresh
-- ============================================================
DROP TABLE IF EXISTS notifications CASCADE;

-- ============================================================
-- STEP 2: Create clean notifications table (no foreign keys)
-- ============================================================
CREATE TABLE notifications (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type TEXT        NOT NULL DEFAULT 'all',
  recipient_id   UUID,
  recipient_role TEXT,
  title          TEXT        NOT NULL,
  message        TEXT        NOT NULL,
  type           TEXT        NOT NULL DEFAULT 'info',
  is_read        BOOLEAN     DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 3: Indexes
-- ============================================================
CREATE INDEX idx_notif_recipient_id   ON notifications(recipient_id);
CREATE INDEX idx_notif_recipient_role ON notifications(recipient_role);
CREATE INDEX idx_notif_created_at     ON notifications(created_at DESC);

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Admin can do everything
-- ============================================================
CREATE POLICY "admin_full_access"
  ON notifications FOR ALL TO authenticated
  USING (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- ============================================================
-- STEP 6: Users read their own / broadcast notifications
-- ============================================================
CREATE POLICY "users_read_notifications"
  ON notifications FOR SELECT TO authenticated
  USING (
    recipient_type = 'all'
    OR recipient_role = (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1)
    OR recipient_id  = (SELECT id   FROM patients WHERE user_id = auth.uid() LIMIT 1)
  );

-- ============================================================
-- STEP 7: Verify it worked
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
