-- ============================================================================
-- 007_security_hardening.sql
-- RuralHealth Platform — Supabase RLS + Index hardening
-- Run in: Supabase SQL Editor
-- ============================================================================

-- ── 1. Admin RLS policies ─────────────────────────────────────────────────────
-- Allow admins to read all patients (for AdminDashboard user management)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_patients' AND tablename = 'patients'
  ) THEN
    CREATE POLICY admin_read_all_patients ON patients
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM patients p2
          WHERE p2.user_id = auth.uid() AND p2.role = 'admin'
        )
      );
  END IF;
END $$;

-- Allow admins to read all appointments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_appointments' AND tablename = 'appointments'
  ) THEN
    CREATE POLICY admin_read_all_appointments ON appointments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM patients p
          WHERE p.user_id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

-- Allow admins to read all medical records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_medical_records' AND tablename = 'medical_records'
  ) THEN
    CREATE POLICY admin_read_all_medical_records ON medical_records
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM patients p
          WHERE p.user_id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

-- ── 2. Doctor RLS policies (read all appointments they're part of) ────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'doctor_read_all_appointments' AND tablename = 'appointments'
  ) THEN
    CREATE POLICY doctor_read_all_appointments ON appointments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM patients p
          WHERE p.user_id = auth.uid() AND p.role = 'doctor'
        )
      );
  END IF;
END $$;

-- ── 3. Provider INSERT/UPDATE policies ────────────────────────────────────────
-- Allow authenticated users to insert into providers (for registration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_insert_providers' AND tablename = 'providers'
  ) THEN
    CREATE POLICY authenticated_insert_providers ON providers
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Allow providers to update their own record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'providers_update_own' AND tablename = 'providers'
  ) THEN
    CREATE POLICY providers_update_own ON providers
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── 4. Missing indexes for performance ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_role ON patients(role);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_data_patient ON health_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_data_type ON health_data(data_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_verified ON healthcare_providers(is_verified);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_specialization ON healthcare_providers(specialization);

-- ── 5. Audit log trigger for medical_records ──────────────────────────────────
CREATE OR REPLACE FUNCTION audit_medical_records()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO offline_sync_log (user_id, table_name, operation, data, synced_at)
  VALUES (
    auth.uid(),
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

DROP TRIGGER IF EXISTS medical_records_audit ON medical_records;
CREATE TRIGGER medical_records_audit
  AFTER INSERT OR UPDATE OR DELETE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION audit_medical_records();

-- ── 6. Add role column to patients table if missing ───────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'role'
  ) THEN
    ALTER TABLE patients ADD COLUMN role TEXT DEFAULT 'patient'
      CHECK (role IN ('patient', 'doctor', 'admin'));
  END IF;
END $$;

-- ── Verification ──────────────────────────────────────────────────────────────
SELECT
  'Policies' as check_type,
  COUNT(*) as count
FROM pg_policies
WHERE tablename IN ('patients', 'appointments', 'medical_records', 'providers')
UNION ALL
SELECT
  'Indexes' as check_type,
  COUNT(*) as count
FROM pg_indexes
WHERE tablename IN ('patients', 'appointments', 'medical_records', 'health_data', 'notifications', 'healthcare_providers');
