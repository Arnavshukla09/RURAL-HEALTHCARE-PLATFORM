-- ============================================================
-- 013_fix_rls_doctor_admin.sql
-- Fix RLS so doctors & admins can read all appointments, records, and camps
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. appointments ────────────────────────────────────────────────────────────
-- Drop old policies and recreate cleanly
DROP POLICY IF EXISTS "doctor_read_all_appointments"    ON appointments;
DROP POLICY IF EXISTS "admin_read_all_appointments"     ON appointments;
DROP POLICY IF EXISTS "patients_read_own_appointments"  ON appointments;

-- Patients read own
CREATE POLICY "patients_read_own_appointments"
  ON appointments FOR SELECT TO authenticated
  USING (
    patient_id = (SELECT id FROM patients WHERE user_id = auth.uid() LIMIT 1)
    AND (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'patient'
  );

-- Doctors read ALL
CREATE POLICY "doctor_read_all_appointments"
  ON appointments FOR SELECT TO authenticated
  USING (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'doctor'
  );

-- Admins read ALL
CREATE POLICY "admin_read_all_appointments"
  ON appointments FOR SELECT TO authenticated
  USING (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- ── 2. medical_records ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_read_all_medical_records"   ON medical_records;
DROP POLICY IF EXISTS "doctor_read_all_medical_records"  ON medical_records;
DROP POLICY IF EXISTS "patients_read_own_records"        ON medical_records;

-- Patients read own
CREATE POLICY "patients_read_own_records"
  ON medical_records FOR SELECT TO authenticated
  USING (
    patient_id = (SELECT id FROM patients WHERE user_id = auth.uid() LIMIT 1)
    AND (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'patient'
  );

-- Doctors read ALL
CREATE POLICY "doctor_read_all_medical_records"
  ON medical_records FOR SELECT TO authenticated
  USING (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'doctor'
  );

-- Admins read ALL
CREATE POLICY "admin_read_all_medical_records"
  ON medical_records FOR SELECT TO authenticated
  USING (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- ── 3. patients table — doctors & admins read all ──────────────────────────────
DROP POLICY IF EXISTS "admin_read_all_patients"   ON patients;
DROP POLICY IF EXISTS "doctor_read_all_patients"  ON patients;

CREATE POLICY "admin_read_all_patients"
  ON patients FOR SELECT TO authenticated
  USING (
    (SELECT role FROM patients p2 WHERE p2.user_id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "doctor_read_all_patients"
  ON patients FOR SELECT TO authenticated
  USING (
    (SELECT role FROM patients p2 WHERE p2.user_id = auth.uid() LIMIT 1) = 'doctor'
  );

-- ── 4. camps — fix admin write + public read ───────────────────────────────────
DROP POLICY IF EXISTS "camps_public_read"  ON camps;
DROP POLICY IF EXISTS "camps_admin_write"  ON camps;

-- Anyone (even unauthenticated) can read camps
CREATE POLICY "camps_public_read"
  ON camps FOR SELECT
  USING (true);

-- Admins full write access
CREATE POLICY "camps_admin_insert"
  ON camps FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "camps_admin_update"
  ON camps FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "camps_admin_delete"
  ON camps FOR DELETE TO authenticated
  USING (
    (SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- ── 5. notifications — fix column reference (our table has no user_id) ─────────
-- Only recreate if old index exists with wrong column
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_notifications_read;

-- ── 6. Verify ──────────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('appointments','medical_records','patients','camps')
ORDER BY tablename, cmd;
