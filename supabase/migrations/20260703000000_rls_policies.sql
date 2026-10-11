-- ==========================================
-- 03_rls.sql
-- Row Level Security (RLS) Policies
-- Complete & hardened — all tables covered.
-- ==========================================

-- ==========================================
-- STEP 1: Enable RLS on ALL tables
-- ==========================================
ALTER TABLE IF EXISTS public.patients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.providers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.healthcare_providers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medical_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.camps                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.health_data           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offline_sync_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctor_requests       ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- TABLE: patients
-- ==========================================
DROP POLICY IF EXISTS "patients_read_own_row"     ON public.patients;
DROP POLICY IF EXISTS "patients_update_own"       ON public.patients;
DROP POLICY IF EXISTS "admin_read_all_patients"   ON public.patients;
DROP POLICY IF EXISTS "doctor_read_all_patients"  ON public.patients;
DROP POLICY IF EXISTS "patients_service_insert"   ON public.patients;  -- over-permissive, removed

CREATE POLICY "patients_read_own_row" ON public.patients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admin_read_all_patients" ON public.patients
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "doctor_read_all_patients" ON public.patients
  FOR SELECT USING (public.get_user_role() = 'doctor');

CREATE POLICY "patients_update_own" ON public.patients
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "patients_insert_own" ON public.patients
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ==========================================
-- TABLE: providers
-- ==========================================
DROP POLICY IF EXISTS "providers_select_own"       ON public.providers;
DROP POLICY IF EXISTS "providers_insert_own"       ON public.providers;
DROP POLICY IF EXISTS "providers_update_own"       ON public.providers;
DROP POLICY IF EXISTS "providers_admin_read_all"   ON public.providers;

CREATE POLICY "providers_select_own" ON public.providers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "providers_admin_read_all" ON public.providers
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "providers_update_own" ON public.providers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "providers_insert_own" ON public.providers
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ==========================================
-- TABLE: healthcare_providers (public directory)
-- ==========================================
DROP POLICY IF EXISTS "healthcare_providers_public_read"  ON public.healthcare_providers;
DROP POLICY IF EXISTS "healthcare_providers_admin_write"  ON public.healthcare_providers;

CREATE POLICY "healthcare_providers_public_read" ON public.healthcare_providers
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "healthcare_providers_admin_write" ON public.healthcare_providers
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ==========================================
-- TABLE: appointments
-- ==========================================
DROP POLICY IF EXISTS "patients_read_own_appointments"   ON public.appointments;
DROP POLICY IF EXISTS "doctor_read_all_appointments"     ON public.appointments;
DROP POLICY IF EXISTS "admin_read_all_appointments"      ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_patient"      ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_patient"      ON public.appointments;

CREATE POLICY "patients_read_own_appointments" ON public.appointments
  FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "doctor_read_all_appointments" ON public.appointments
  FOR SELECT USING (public.get_user_role() = 'doctor');

CREATE POLICY "admin_read_all_appointments" ON public.appointments
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "appointments_insert_patient" ON public.appointments
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "appointments_update_patient" ON public.appointments
  FOR UPDATE USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

-- ==========================================
-- TABLE: medical_records
-- ==========================================
DROP POLICY IF EXISTS "patients_read_own_records"        ON public.medical_records;
DROP POLICY IF EXISTS "doctor_read_all_medical_records"  ON public.medical_records;
DROP POLICY IF EXISTS "admin_read_all_medical_records"   ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_insert_patient"   ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_doctor_write"     ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_admin_write"      ON public.medical_records;

CREATE POLICY "patients_read_own_records" ON public.medical_records
  FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "medical_records_insert_patient" ON public.medical_records
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "doctor_read_all_medical_records" ON public.medical_records
  FOR SELECT USING (public.get_user_role() = 'doctor');

CREATE POLICY "medical_records_doctor_write" ON public.medical_records
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'doctor')
  WITH CHECK (public.get_user_role() = 'doctor');

CREATE POLICY "admin_read_all_medical_records" ON public.medical_records
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "medical_records_admin_write" ON public.medical_records
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ==========================================
-- TABLE: camps (public read, admin write)
-- ==========================================
DROP POLICY IF EXISTS "camps_public_read"  ON public.camps;
DROP POLICY IF EXISTS "camps_admin_write"  ON public.camps;

CREATE POLICY "camps_public_read" ON public.camps
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "camps_admin_write" ON public.camps
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ==========================================
-- TABLE: notifications
-- ==========================================
DROP POLICY IF EXISTS "notifications_select_own"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin_write" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (
    recipient_type = 'all'
    OR (recipient_type = 'role' AND recipient_role = public.get_user_role())
    OR (recipient_type = 'individual' AND recipient_id IN (
        SELECT id FROM public.patients WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (
    recipient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

CREATE POLICY "notifications_admin_write" ON public.notifications
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ==========================================
-- TABLE: healthcare_facilities (public read)
-- ==========================================
DROP POLICY IF EXISTS "facilities_public_read"   ON public.healthcare_facilities;
DROP POLICY IF EXISTS "facilities_admin_write"   ON public.healthcare_facilities;

CREATE POLICY "facilities_public_read" ON public.healthcare_facilities
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "facilities_admin_write" ON public.healthcare_facilities
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ==========================================
-- TABLE: health_data (vitals)
-- ==========================================
DROP POLICY IF EXISTS "health_data_select_own"  ON public.health_data;
DROP POLICY IF EXISTS "health_data_insert_own"  ON public.health_data;
DROP POLICY IF EXISTS "health_data_update_own"  ON public.health_data;
DROP POLICY IF EXISTS "health_data_delete_own"  ON public.health_data;
DROP POLICY IF EXISTS "health_data_doctor_read" ON public.health_data;
DROP POLICY IF EXISTS "health_data_admin_read"  ON public.health_data;

CREATE POLICY "health_data_select_own" ON public.health_data
  FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "health_data_insert_own" ON public.health_data
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "health_data_update_own" ON public.health_data
  FOR UPDATE USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "health_data_delete_own" ON public.health_data
  FOR DELETE USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "health_data_doctor_read" ON public.health_data
  FOR SELECT USING (public.get_user_role() = 'doctor');

CREATE POLICY "health_data_admin_read" ON public.health_data
  FOR SELECT USING (public.get_user_role() = 'admin');

-- ==========================================
-- TABLE: offline_sync_log
-- ==========================================
DROP POLICY IF EXISTS "offline_sync_select_own" ON public.offline_sync_log;
DROP POLICY IF EXISTS "offline_sync_insert_own" ON public.offline_sync_log;
DROP POLICY IF EXISTS "offline_sync_delete_own" ON public.offline_sync_log;

CREATE POLICY "offline_sync_select_own" ON public.offline_sync_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "offline_sync_insert_own" ON public.offline_sync_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "offline_sync_delete_own" ON public.offline_sync_log
  FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- TABLE: doctor_requests
-- Note: uses user_id directly (not patient_id)
-- ==========================================
DROP POLICY IF EXISTS "doctor_requests_select_own"  ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_insert_own"  ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_doctor_view" ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_admin_all"   ON public.doctor_requests;

-- Users can read their own request
CREATE POLICY "doctor_requests_select_own" ON public.doctor_requests
  FOR SELECT USING (user_id = auth.uid());

-- Users can submit a request only for themselves
CREATE POLICY "doctor_requests_insert_own" ON public.doctor_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all and approve/reject
CREATE POLICY "doctor_requests_admin_all" ON public.doctor_requests
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ==========================================
-- FUNCTION PERMISSIONS (defense in depth)
-- ==========================================
REVOKE EXECUTE ON FUNCTION public.get_user_role()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.nearby_facilities(double precision, double precision, text, double precision)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nearby_facilities(double precision, double precision, text, double precision)
  TO authenticated;
