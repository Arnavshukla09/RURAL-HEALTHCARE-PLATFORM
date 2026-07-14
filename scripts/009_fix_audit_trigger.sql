-- ============================================================================
-- 009_fix_audit_trigger.sql
-- Fixes: "null value in column user_id of relation offline_sync_log"
--
-- ROOT CAUSE:
--   The `audit_medical_records` trigger fires after every INSERT/UPDATE/DELETE
--   on `medical_records`. It inserts into `offline_sync_log` using auth.uid().
--   When the API uses the admin/service-role client (which bypasses RLS),
--   auth.uid() returns NULL, violating the NOT NULL constraint on user_id.
--
-- FIX:
--   1. Replace the trigger function with a NULL-safe version that skips the
--      log entry when auth.uid() is NULL (i.e., service-role inserts).
--   2. Set a DEFAULT '{}' on offline_sync_log.data (prevents NULL JSONB).
--   3. Recreate the trigger to pick up the updated function.
-- ============================================================================

-- Step 1: Fix offline_sync_log.data to never be NULL
ALTER TABLE offline_sync_log
  ALTER COLUMN data SET DEFAULT '{}';

-- Step 2: Replace trigger function with NULL-safe version
CREATE OR REPLACE FUNCTION audit_medical_records()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- auth.uid() is NULL when called from service-role / admin client.
  -- In that case, skip the audit log entirely to avoid NOT NULL violation.
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO offline_sync_log (user_id, table_name, operation, data, synced_at)
  VALUES (
    v_user_id,
    'medical_records',
    TG_OP,
    CASE
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb
      ELSE row_to_json(NEW)::jsonb
    END,
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger (picks up the new function body)
DROP TRIGGER IF EXISTS medical_records_audit ON medical_records;
CREATE TRIGGER medical_records_audit
  AFTER INSERT OR UPDATE OR DELETE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION audit_medical_records();

-- Step 4: Verify the trigger is active
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'medical_records_audit';
-- Expected: 3 rows (INSERT, UPDATE, DELETE), all AFTER on medical_records
