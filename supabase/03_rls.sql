-- ==========================================
-- 03_rls.sql
-- Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY; -- Prevent postgis public access

-- Clear existing policies to ensure clean state
DROP POLICY IF EXISTS "patients_select_own" ON patients;
DROP POLICY IF EXISTS "patients_insert_own" ON patients;
DROP POLICY IF EXISTS "patients_update_own" ON patients;
DROP POLICY IF EXISTS "patients_delete_own" ON patients;
DROP POLICY IF EXISTS "admin_read_all_patients" ON patients;
DROP POLICY IF EXISTS "doctor_read_all_patients" ON patients;
DROP POLICY IF EXISTS "patients_read_own_row" ON patients;

-- 1. Patients Policies
-- (Critical: this allows login check in Authentication.tsx)
CREATE POLICY "patients_read_own_row" ON patients 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admin_read_all_patients" ON patients 
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "doctor_read_all_patients" ON patients 
  FOR SELECT USING (public.get_user_role() = 'doctor');

CREATE POLICY "patients_update_own" ON patients 
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Appointments Policies
DROP POLICY IF EXISTS "appointments_select_patient" ON appointments;
DROP POLICY IF EXISTS "appointments_select_provider" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_patient" ON appointments;
DROP POLICY IF EXISTS "appointments_update_patient" ON appointments;
DROP POLICY IF EXISTS "doctor_read_all_appointments" ON appointments;
DROP POLICY IF EXISTS "admin_read_all_appointments" ON appointments;

CREATE POLICY "patients_read_own_appointments" ON appointments 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

CREATE POLICY "doctor_read_all_appointments" ON appointments 
  FOR SELECT USING (public.get_user_role() = 'doctor');

CREATE POLICY "admin_read_all_appointments" ON appointments 
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "appointments_insert_patient" ON appointments 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

CREATE POLICY "appointments_update_patient" ON appointments 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- 3. Medical Records Policies
DROP POLICY IF EXISTS "medical_records_select_patient" ON medical_records;
DROP POLICY IF EXISTS "medical_records_select_provider" ON medical_records;
DROP POLICY IF EXISTS "medical_records_insert_provider" ON medical_records;
DROP POLICY IF EXISTS "doctor_read_all_medical_records" ON medical_records;
DROP POLICY IF EXISTS "admin_read_all_medical_records" ON medical_records;

CREATE POLICY "patients_read_own_records" ON medical_records 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

CREATE POLICY "doctor_read_all_medical_records" ON medical_records 
  FOR SELECT USING (public.get_user_role() = 'doctor');

CREATE POLICY "admin_read_all_medical_records" ON medical_records 
  FOR SELECT USING (public.get_user_role() = 'admin');

-- 4. Camps Policies
DROP POLICY IF EXISTS "camps_public_read" ON camps;
DROP POLICY IF EXISTS "camps_admin_write" ON camps;
DROP POLICY IF EXISTS "camps_admin_update" ON camps;
DROP POLICY IF EXISTS "camps_admin_delete" ON camps;
DROP POLICY IF EXISTS "camps_admin_insert" ON camps;

CREATE POLICY "camps_public_read" ON camps 
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "camps_admin_write" ON camps 
  FOR ALL TO authenticated 
  USING (public.get_user_role() = 'admin') 
  WITH CHECK (public.get_user_role() = 'admin');

-- 5. Notifications Policies
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

CREATE POLICY "notifications_select_own" ON notifications 
  FOR SELECT USING (
    recipient_type = 'all' OR 
    (recipient_type = 'role' AND recipient_role = public.get_user_role()) OR
    (recipient_type = 'individual' AND recipient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()))
  );

-- 6. Healthcare Facilities (Public Read)
DROP POLICY IF EXISTS "facilities_public_read" ON healthcare_facilities;
CREATE POLICY "facilities_public_read" ON healthcare_facilities 
  FOR SELECT USING (true);

-- 7. Providers (Public Read)
DROP POLICY IF EXISTS "healthcare_providers_select_all" ON healthcare_providers;
CREATE POLICY "healthcare_providers_select_all" ON healthcare_providers 
  FOR SELECT USING (true);

-- 8. Health Data (Vitals)
DROP POLICY IF EXISTS "health_data_select_own" ON health_data;
DROP POLICY IF EXISTS "health_data_insert_own" ON health_data;
CREATE POLICY "health_data_select_own" ON health_data 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "health_data_insert_own" ON health_data 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
