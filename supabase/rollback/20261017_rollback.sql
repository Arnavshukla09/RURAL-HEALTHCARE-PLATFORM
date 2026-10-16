-- ============================================================================
-- supabase/rollback/20261017_rollback.sql
--
-- Emergency Rollback Script for Task 3:
-- Restores the exact pre-migration state of RLS policies on medical_records
-- and patients as recorded in docs/RLS_SNAPSHOT_before.md.
-- ============================================================================

-- Step 1: Drop current policies on medical_records and patients
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

-- Step 2: Restore policies on medical_records from snapshot
CREATE POLICY "admin_read_all_medical_records"
  ON public.medical_records FOR SELECT TO authenticated
  USING (get_current_user_role() = 'admin'::text);

CREATE POLICY "doctor_read_all_medical_records"
  ON public.medical_records FOR SELECT TO authenticated
  USING (get_current_user_role() = 'doctor'::text);

CREATE POLICY "medical_records_admin_write"
  ON public.medical_records FOR ALL TO authenticated
  USING (get_user_role() = 'admin'::text)
  WITH CHECK (get_user_role() = 'admin'::text);

CREATE POLICY "medical_records_doctor_write"
  ON public.medical_records FOR ALL TO authenticated
  USING (get_user_role() = 'doctor'::text)
  WITH CHECK (get_user_role() = 'doctor'::text);

CREATE POLICY "medical_records_insert_patient"
  ON public.medical_records FOR INSERT TO public
  WITH CHECK (auth.uid() = (SELECT patients.user_id FROM public.patients WHERE (patients.id = medical_records.patient_id)));

CREATE POLICY "medical_records_insert_provider"
  ON public.medical_records FOR INSERT TO public
  WITH CHECK (auth.uid() = (SELECT providers.user_id FROM public.providers WHERE (providers.id = medical_records.provider_id)));

CREATE POLICY "medical_records_select_own"
  ON public.medical_records FOR SELECT TO public
  USING (auth.uid() = (SELECT patients.user_id FROM public.patients WHERE (patients.id = medical_records.patient_id)));

CREATE POLICY "medical_records_select_patient"
  ON public.medical_records FOR SELECT TO public
  USING (auth.uid() = (SELECT patients.user_id FROM public.patients WHERE (patients.id = medical_records.patient_id)));

CREATE POLICY "medical_records_select_provider"
  ON public.medical_records FOR SELECT TO public
  USING (auth.uid() = (SELECT providers.user_id FROM public.providers WHERE (providers.id = medical_records.provider_id)));

CREATE POLICY "patients_delete_own_records"
  ON public.medical_records FOR DELETE TO public
  USING (patient_id IN (SELECT patients.id FROM public.patients WHERE (patients.user_id = auth.uid())));

CREATE POLICY "patients_read_own_records"
  ON public.medical_records FOR SELECT TO authenticated
  USING (patient_id IN (SELECT patients.id FROM public.patients WHERE (patients.user_id = auth.uid())));

CREATE POLICY "patients_update_own_records"
  ON public.medical_records FOR UPDATE TO public
  USING (patient_id IN (SELECT patients.id FROM public.patients WHERE (patients.user_id = auth.uid())));

-- Step 3: Restore policies on patients from snapshot
CREATE POLICY "admin_read_all_patients"
  ON public.patients FOR SELECT TO authenticated
  USING (get_current_user_role() = 'admin'::text);

CREATE POLICY "doctor_read_all_patients"
  ON public.patients FOR SELECT TO authenticated
  USING (get_current_user_role() = 'doctor'::text);

CREATE POLICY "patients_delete_own"
  ON public.patients FOR DELETE TO public
  USING (auth.uid() = user_id);

CREATE POLICY "patients_insert_own"
  ON public.patients FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "patients_read_own_row"
  ON public.patients FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "patients_select_own"
  ON public.patients FOR SELECT TO public
  USING (auth.uid() = user_id);

CREATE POLICY "patients_update_own"
  ON public.patients FOR UPDATE TO public
  USING (auth.uid() = user_id);
