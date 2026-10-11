-- ============================================================================
-- 11_rls_initplan.sql
-- Optimizes RLS policy execution by wrapping auth.uid() and get_user_role()
-- in subqueries: (SELECT auth.uid()) and (SELECT public.get_user_role()).
--
-- WHY: A bare auth.uid() function call is re-evaluated by the Postgres planner
-- for EVERY row in a table scan. Wrapping it as (SELECT auth.uid()) turns it
-- into an InitPlan that executes ONCE per query, accelerating scans by 10x-50x.
--
-- NOTE: Do not run this file automatically. Review and run on staging first.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE: patients
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "patients_read_own_row"    ON public.patients;
DROP POLICY IF EXISTS "admin_read_all_patients"  ON public.patients;
DROP POLICY IF EXISTS "doctor_read_all_patients" ON public.patients;
DROP POLICY IF EXISTS "patients_update_own"      ON public.patients;
DROP POLICY IF EXISTS "patients_insert_own"      ON public.patients;

CREATE POLICY "patients_read_own_row" ON public.patients
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "admin_read_all_patients" ON public.patients
  FOR SELECT USING ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "doctor_read_all_patients" ON public.patients
  FOR SELECT USING ((SELECT public.get_user_role()) = 'doctor');

CREATE POLICY "patients_update_own" ON public.patients
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "patients_insert_own" ON public.patients
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));


-- ----------------------------------------------------------------------------
-- 2. TABLE: appointments
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "patients_read_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "doctor_read_all_appointments"   ON public.appointments;
DROP POLICY IF EXISTS "admin_read_all_appointments"    ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_patient"    ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_patient"    ON public.appointments;

CREATE POLICY "patients_read_own_appointments" ON public.appointments
  FOR SELECT USING (
    patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "doctor_read_all_appointments" ON public.appointments
  FOR SELECT USING ((SELECT public.get_user_role()) = 'doctor');

CREATE POLICY "admin_read_all_appointments" ON public.appointments
  FOR SELECT USING ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "appointments_insert_patient" ON public.appointments
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "appointments_update_patient" ON public.appointments
  FOR UPDATE USING (
    patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid()))
  );


-- ----------------------------------------------------------------------------
-- 3. TABLE: medical_records
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "patients_read_own_records"        ON public.medical_records;
DROP POLICY IF EXISTS "doctor_read_all_medical_records"  ON public.medical_records;
DROP POLICY IF EXISTS "admin_read_all_medical_records"   ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_insert_patient"   ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_doctor_write"     ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_admin_write"      ON public.medical_records;

CREATE POLICY "patients_read_own_records" ON public.medical_records
  FOR SELECT USING (
    patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "medical_records_insert_patient" ON public.medical_records
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "doctor_read_all_medical_records" ON public.medical_records
  FOR SELECT USING ((SELECT public.get_user_role()) = 'doctor');

CREATE POLICY "medical_records_doctor_write" ON public.medical_records
  FOR ALL TO authenticated
  USING ((SELECT public.get_user_role()) = 'doctor')
  WITH CHECK ((SELECT public.get_user_role()) = 'doctor');

CREATE POLICY "medical_records_admin_write" ON public.medical_records
  FOR ALL TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin')
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');


-- ----------------------------------------------------------------------------
-- 4. TABLE: notifications
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_select_own"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin_write" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (
    recipient_type = 'all'
    OR (recipient_type = 'role' AND recipient_role = (SELECT public.get_user_role()))
    OR (recipient_type = 'individual' AND recipient_id IN (
        SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    ))
  );

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (
    recipient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "notifications_admin_write" ON public.notifications
  FOR ALL TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin')
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');


-- ----------------------------------------------------------------------------
-- 5. TABLE: health_data
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "health_data_select_own"   ON public.health_data;
DROP POLICY IF EXISTS "health_data_insert_own"   ON public.health_data;
DROP POLICY IF EXISTS "health_data_update_own"   ON public.health_data;
DROP POLICY IF EXISTS "health_data_delete_own"   ON public.health_data;
DROP POLICY IF EXISTS "health_data_doctor_read"  ON public.health_data;
DROP POLICY IF EXISTS "health_data_admin_read"   ON public.health_data;

CREATE POLICY "health_data_select_own" ON public.health_data
  FOR SELECT USING (
    patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "health_data_insert_own" ON public.health_data
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "health_data_update_own" ON public.health_data
  FOR UPDATE USING (
    patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "health_data_delete_own" ON public.health_data
  FOR DELETE USING (
    patient_id IN (SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "health_data_doctor_read" ON public.health_data
  FOR SELECT USING ((SELECT public.get_user_role()) = 'doctor');

CREATE POLICY "health_data_admin_read" ON public.health_data
  FOR SELECT USING ((SELECT public.get_user_role()) = 'admin');


-- ----------------------------------------------------------------------------
-- 6. TABLE: doctor_requests
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "doctor_requests_select_own"  ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_insert_own"  ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_admin_all"   ON public.doctor_requests;

CREATE POLICY "doctor_requests_select_own" ON public.doctor_requests
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "doctor_requests_insert_own" ON public.doctor_requests
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "doctor_requests_admin_all" ON public.doctor_requests
  FOR ALL TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin')
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

ANALYZE;
