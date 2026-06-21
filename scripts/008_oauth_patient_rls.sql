-- ============================================================================
-- 008_oauth_patient_rls.sql
-- RuralHealth Platform — Allow OAuth users to auto-create their patient row
-- Run in: Supabase SQL Editor
-- ============================================================================
-- REQUIRED for Google OAuth login to work properly.
-- Without these policies, the auto-upsert in fetchUserWithRole will fail silently.

-- ── 1. Enable RLS on patients table (if not already) ──────────────────────────
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- ── 2. Allow authenticated users to INSERT their own patient row ──────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'patients_insert_own' AND tablename = 'patients'
  ) THEN
    CREATE POLICY patients_insert_own ON patients
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── 3. Allow authenticated users to SELECT their own patient row ──────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'patients_select_own' AND tablename = 'patients'
  ) THEN
    CREATE POLICY patients_select_own ON patients
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ── 4. Allow authenticated users to UPDATE their own patient row ──────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'patients_update_own' AND tablename = 'patients'
  ) THEN
    CREATE POLICY patients_update_own ON patients
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── 5. Allow patients to INSERT their own appointments ────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'appointments_insert_own' AND tablename = 'appointments'
  ) THEN
    CREATE POLICY appointments_insert_own ON appointments
      FOR INSERT
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ── 6. Allow patients to SELECT their own appointments ────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'appointments_select_own' AND tablename = 'appointments'
  ) THEN
    CREATE POLICY appointments_select_own ON appointments
      FOR SELECT
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ── 7. Allow patients to SELECT their own medical records ─────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'medical_records_select_own' AND tablename = 'medical_records'
  ) THEN
    CREATE POLICY medical_records_select_own ON medical_records
      FOR SELECT
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ── 8. Allow patients to SELECT their own health data ─────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'health_data_select_own' AND tablename = 'health_data'
  ) THEN
    CREATE POLICY health_data_select_own ON health_data
      FOR SELECT
      USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ── 9. Allow all authenticated users to read healthcare_providers ─────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'healthcare_providers_read_all' AND tablename = 'healthcare_providers'
  ) THEN
    CREATE POLICY healthcare_providers_read_all ON healthcare_providers
      FOR SELECT
      USING (true);  -- Public read for doctor directory
  END IF;
END $$;

-- ── 10. Allow patients to manage their own notifications ──────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_select_own' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY notifications_select_own ON notifications
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_update_own' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY notifications_update_own ON notifications
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── Verification ──────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('patients', 'appointments', 'medical_records', 'health_data', 'healthcare_providers', 'notifications')
ORDER BY tablename, policyname;
