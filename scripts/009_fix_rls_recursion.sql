-- ============================================================================
-- 009_fix_rls_recursion.sql
-- RuralHealth Platform — Fix Infinite Recursion in Admin/Doctor Policies
-- Run in: Supabase SQL Editor
-- ============================================================================

-- The previous policies used `EXISTS (SELECT 1 FROM patients WHERE ...)` 
-- on the patients table itself, which causes an infinite loop when 
-- PostgreSQL evaluates the policy for the patients table.

-- 1. Create a SECURITY DEFINER function to safely check user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM patients WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "admin_read_all_patients" ON patients;
DROP POLICY IF EXISTS "admin_read_all_appointments" ON appointments;
DROP POLICY IF EXISTS "admin_read_all_medical_records" ON medical_records;
DROP POLICY IF EXISTS "doctor_read_all_appointments" ON appointments;

-- 3. Recreate them using the safe function
CREATE POLICY "admin_read_all_patients" ON patients
  FOR SELECT
  USING ( public.get_user_role() = 'admin' );

CREATE POLICY "admin_read_all_appointments" ON appointments
  FOR SELECT
  USING ( public.get_user_role() = 'admin' );

CREATE POLICY "admin_read_all_medical_records" ON medical_records
  FOR SELECT
  USING ( public.get_user_role() = 'admin' );

CREATE POLICY "doctor_read_all_appointments" ON appointments
  FOR SELECT
  USING ( public.get_user_role() = 'doctor' );
