-- ============================================================================
-- 20261017000200_rebuild_rls_medical_records_patients.sql
--
-- Task 3: Clean slate dynamic drop of drifted policies and rebuild of
--         scoped, confidential Row Level Security (RLS) on medical_records and patients.
--
-- Security Guarantees:
-- 1. medical_records:
--    - Patients: SELECT, INSERT, UPDATE, DELETE own records strictly.
--    - Doctors: SELECT, INSERT, UPDATE ONLY where active care relationship exists
--      via public.has_care_relationship(patient_id). NO DELETE privilege.
--    - Admins: DELETE ONLY for moderation/erasure. NO SELECT, NO UPDATE (protects confidentiality).
-- 2. patients:
--    - Patients: SELECT, INSERT, UPDATE, DELETE own row strictly.
--    - Doctors: SELECT ONLY where active care relationship exists via public.has_care_relationship(id).
--    - Admins: SELECT allowed for directory oversight and user management.
-- ============================================================================

-- Step 1: Dynamically drop ALL existing policies on medical_records and patients
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('medical_records', 'patients')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END;
$$;

-- Step 2: Ensure Row Level Security is explicitly enabled
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Step 3: Rebuild policies on public.medical_records
-- ----------------------------------------------------------------------------

-- Patient policies (Own records)
CREATE POLICY "patient_select_own_medical_records"
  ON public.medical_records
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "patient_insert_own_medical_records"
  ON public.medical_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "patient_update_own_medical_records"
  ON public.medical_records
  FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "patient_delete_own_medical_records"
  ON public.medical_records
  FOR DELETE
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

-- Doctor policies (Strictly scoped by active care relationship; NO DELETE)
CREATE POLICY "doctor_select_care_medical_records"
  ON public.medical_records
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(patient_id)
  );

CREATE POLICY "doctor_insert_care_medical_records"
  ON public.medical_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(patient_id)
  );

CREATE POLICY "doctor_update_care_medical_records"
  ON public.medical_records
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(patient_id)
  )
  WITH CHECK (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(patient_id)
  );

-- Admin policies (DELETE ONLY for moderation / GDPR right-to-erasure / storage pruning)
-- Admins have NO SELECT or UPDATE policies, protecting patient-doctor clinical confidentiality.
CREATE POLICY "admin_delete_medical_records"
  ON public.medical_records
  FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() = 'admin'
    OR (SELECT public.get_user_role()) = 'admin'
    OR (SELECT p.role FROM public.patients p WHERE p.user_id = auth.uid() LIMIT 1) = 'admin'
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
  );

-- ----------------------------------------------------------------------------
-- Step 4: Rebuild policies on public.patients
-- ----------------------------------------------------------------------------

-- Patient policies (Own profile)
CREATE POLICY "patient_select_own_profile"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "patient_insert_own_profile"
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "patient_update_own_profile"
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "patient_delete_own_profile"
  ON public.patients
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  );

-- Doctor policies (Scoped by active care relationship)
CREATE POLICY "doctor_select_care_patients"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(id)
  );

-- Admin policies (SELECT allowed for user management and directory oversight)
CREATE POLICY "admin_select_all_patients"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'admin'
  );
