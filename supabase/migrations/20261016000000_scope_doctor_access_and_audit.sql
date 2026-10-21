-- ============================================================================
-- 20261016000000_scope_doctor_access_and_audit.sql
-- 
-- Phase 3 Hardening:
-- 1. Doctor Care Relationship Scoping: Doctors can only view patients and records
--    for which an active consultation or appointment relationship exists.
-- 2. Doctor-Patient Confidentiality Architecture: Administrators have moderation
--    and deletion rights (for compliance / right-to-erasure / storage limits),
--    but have NO read access to confidential clinical records or patient files.
-- 3. Demo Admin Safety Guard: Database trigger strictly blocks preview/demo admin
--    accounts from destructive operations (deleting users, deleting records,
--    changing user roles, modifying active consultations).
-- 4. Access Audit Log: Append-only audit table tracking access to clinical records.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNCTION: has_care_relationship(p_patient_id uuid)
-- Evaluates whether the currently authenticated doctor has an established
-- care relationship (appointment or explicit referral) with the given patient.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_care_relationship(p_patient_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
BEGIN
  IF v_user_id IS NULL OR p_patient_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verify current user has doctor role
  SELECT role INTO v_role FROM public.patients WHERE user_id = v_user_id LIMIT 1;
  IF v_role <> 'doctor' THEN
    RETURN false;
  END IF;

  -- 1. Check if an appointment exists between doctor and patient
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.patient_id = p_patient_id
      AND (
        a.provider_id = v_user_id
        OR a.provider_id IN (
          SELECT hp.id FROM public.healthcare_providers hp WHERE hp.user_id = v_user_id
        )
      )
  ) THEN
    RETURN true;
  END IF;

  -- 2. Check if a doctor request / referral exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'doctor_requests'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM public.doctor_requests dr
      WHERE dr.patient_id = p_patient_id
        AND dr.doctor_id = v_user_id
        AND dr.status IN ('approved', 'active', 'pending')
    ) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_care_relationship(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. SCOPE DOCTOR RLS POLICIES ON public.patients
-- Doctors can ONLY read patient demographics for patients in their care.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "doctor_read_all_patients"  ON public.patients;
DROP POLICY IF EXISTS "doctor_read_patients"      ON public.patients;
DROP POLICY IF EXISTS "doctor_read_care_patients" ON public.patients;

CREATE POLICY "doctor_read_care_patients" ON public.patients
  FOR SELECT USING (
    (SELECT public.get_user_role()) = 'doctor' 
    AND public.has_care_relationship(id)
  );

-- ----------------------------------------------------------------------------
-- 3. SCOPE DOCTOR & ADMIN RLS POLICIES ON public.medical_records
-- Confidentiality Rule:
-- - Patients read their own records.
-- - Doctors ONLY read / create records for patients with an active care relationship.
-- - Admins CANNOT read clinical notes or access files via direct SELECT.
-- - Admins CAN delete records for moderation / right-to-erasure compliance.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "doctor_read_all_records"   ON public.medical_records;
DROP POLICY IF EXISTS "doctor_read_records"       ON public.medical_records;
DROP POLICY IF EXISTS "doctor_select_care_records" ON public.medical_records;
DROP POLICY IF EXISTS "doctor_insert_care_records" ON public.medical_records;
DROP POLICY IF EXISTS "admin_read_all_records"    ON public.medical_records;
DROP POLICY IF EXISTS "admin_read_records"        ON public.medical_records;
DROP POLICY IF EXISTS "admin_delete_records"      ON public.medical_records;

-- Doctors can only view records of patients under their care
CREATE POLICY "doctor_select_care_records" ON public.medical_records
  FOR SELECT USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(patient_id)
  );

-- Doctors can insert records for patients under their care
CREATE POLICY "doctor_insert_care_records" ON public.medical_records
  FOR INSERT WITH CHECK (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(patient_id)
  );

-- Admins CANNOT select clinical records directly (confidentiality enforcement)
-- Direct SELECT by admin returns 0 rows. Administrative metadata must be queried
-- via server-side API which redacts clinical text and suppresses file_url.

-- Admins CAN delete records (moderation, cleanup, right-to-erasure)
CREATE POLICY "admin_delete_records" ON public.medical_records
  FOR DELETE USING (
    (SELECT public.get_user_role()) = 'admin'
  );

-- ----------------------------------------------------------------------------
-- 4. DEMO ADMIN SAFETY TRIGGER
-- Prevents demo admin (admin@ruralhealth.demo or %demo%) from deleting data,
-- changing user roles, or mutating appointments.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_demo_admin_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Obtain caller's authenticated email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  IF v_user_email ILIKE '%demo%' OR v_user_email = 'admin@ruralhealth.demo' THEN
    RAISE EXCEPTION 'Demo admin mode restricted: Modifying or destructive operations are prohibited for preview accounts.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Protect patients table from deletion and role tampering by demo admin
DROP TRIGGER IF EXISTS trg_patients_demo_admin_safety ON public.patients;
CREATE TRIGGER trg_patients_demo_admin_safety
  BEFORE DELETE OR UPDATE OF role
  ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_demo_admin_safety();

-- Protect medical_records table from deletion by demo admin
DROP TRIGGER IF EXISTS trg_medical_records_demo_admin_safety ON public.medical_records;
CREATE TRIGGER trg_medical_records_demo_admin_safety
  BEFORE DELETE OR UPDATE
  ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_demo_admin_safety();

-- Protect appointments table from mutation by demo admin
DROP TRIGGER IF EXISTS trg_appointments_demo_admin_safety ON public.appointments;
CREATE TRIGGER trg_appointments_demo_admin_safety
  BEFORE DELETE OR UPDATE
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_demo_admin_safety();

-- ----------------------------------------------------------------------------
-- 5. ACCESS AUDIT LOG TABLE
-- Append-only log tracking access to sensitive clinical and personal data.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  patient_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user_created ON public.access_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_patient_created ON public.access_audit_log (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.access_audit_log (action);

ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
DROP POLICY IF EXISTS "admin_read_audit_log" ON public.access_audit_log;
CREATE POLICY "admin_read_audit_log" ON public.access_audit_log
  FOR SELECT USING ((SELECT public.get_user_role()) = 'admin');

-- Authenticated callers can append audit entries
DROP POLICY IF EXISTS "authenticated_insert_audit_log" ON public.access_audit_log;
CREATE POLICY "authenticated_insert_audit_log" ON public.access_audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Deny UPDATE and DELETE to all users (immutable append-only audit trail)
REVOKE UPDATE, DELETE ON public.access_audit_log FROM PUBLIC, anon, authenticated;
