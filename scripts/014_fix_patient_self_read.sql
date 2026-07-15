-- ============================================================
-- 014_fix_patient_self_read.sql
-- URGENT: Restore patient self-read on patients table
-- This was broken by 013_fix_rls_doctor_admin.sql
-- Run in Supabase SQL Editor IMMEDIATELY
-- ============================================================

-- Drop any conflicting policy first
DROP POLICY IF EXISTS "patients_read_own_row"   ON patients;
DROP POLICY IF EXISTS "patient_read_own"        ON patients;
DROP POLICY IF EXISTS "Users can view own data" ON patients;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON patients;

-- Allow every authenticated user to read their OWN row
CREATE POLICY "patients_read_own_row"
  ON patients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Verify all current patient policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY cmd, policyname;
