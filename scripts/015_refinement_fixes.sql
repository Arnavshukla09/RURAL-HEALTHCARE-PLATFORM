-- ============================================================
-- 015_refinement_fixes.sql
-- Fixes RLS infinite recursion on patients table
-- Align all policies to use a SECURITY DEFINER function
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Create SECURITY DEFINER Function ──────────────────────────────────────
-- This function bypasses RLS on the patients table to safely check roles.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.patients WHERE user_id = auth.uid() LIMIT 1;
  RETURN COALESCE(v_role, 'patient');
END;
$$;

-- ── 2. Fix Patients Table Policies ───────────────────────────────────────────
DROP POLICY IF EXISTS "patients_read_own_row" ON patients;
DROP POLICY IF EXISTS "patient_read_own" ON patients;
DROP POLICY IF EXISTS "Users can view own data" ON patients;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON patients;
DROP POLICY IF EXISTS "admin_read_all_patients" ON patients;
DROP POLICY IF EXISTS "doctor_read_all_patients" ON patients;

-- Users can read their own row (critical for login fallback if needed, but not recursive anymore)
CREATE POLICY "patients_read_own_row" 
  ON patients FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admin_read_all_patients" 
  ON patients FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "doctor_read_all_patients" 
  ON patients FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'doctor');

-- ── 3. Fix Appointments Table Policies ───────────────────────────────────────
DROP POLICY IF EXISTS "patients_read_own_appointments" ON appointments;
DROP POLICY IF EXISTS "doctor_read_all_appointments" ON appointments;
DROP POLICY IF EXISTS "admin_read_all_appointments" ON appointments;

CREATE POLICY "patients_read_own_appointments" 
  ON appointments FOR SELECT TO authenticated
  USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

CREATE POLICY "doctor_read_all_appointments" 
  ON appointments FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'doctor');

CREATE POLICY "admin_read_all_appointments" 
  ON appointments FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- ── 4. Fix Medical Records Table Policies ────────────────────────────────────
DROP POLICY IF EXISTS "patients_read_own_records" ON medical_records;
DROP POLICY IF EXISTS "doctor_read_all_medical_records" ON medical_records;
DROP POLICY IF EXISTS "admin_read_all_medical_records" ON medical_records;

CREATE POLICY "patients_read_own_records" 
  ON medical_records FOR SELECT TO authenticated
  USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

CREATE POLICY "doctor_read_all_medical_records" 
  ON medical_records FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'doctor');

CREATE POLICY "admin_read_all_medical_records" 
  ON medical_records FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- ── 5. Fix Notifications Table Policies ──────────────────────────────────────
DROP POLICY IF EXISTS "admin_full_access" ON notifications;
DROP POLICY IF EXISTS "users_read_notifications" ON notifications;

CREATE POLICY "admin_full_access" 
  ON notifications FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "users_read_notifications" 
  ON notifications FOR SELECT TO authenticated
  USING (
    recipient_type = 'all'
    OR (recipient_type = 'role' AND recipient_role = public.get_current_user_role())
    OR (recipient_type = 'individual' AND recipient_id = auth.uid())
  );

-- Users can mark their OWN individual notifications as read
CREATE POLICY "users_update_notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (recipient_type = 'individual' AND recipient_id = auth.uid())
  WITH CHECK (recipient_type = 'individual' AND recipient_id = auth.uid());
