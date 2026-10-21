-- ============================================================================
-- 20261017000300_demo_guard_fix.sql
--
-- Task 4: Fix Demo Admin Safety Guard
--
-- Restricts guard_demo_admin_safety() to trigger ONLY when:
-- 1. The caller is an administrator (public.get_user_role() = 'admin')
-- 2. The caller's email strictly equals 'admin@ruralhealth.demo' (exact match, case-insensitive trimmed)
--
-- Eliminates false positives on non-admin users whose email happens to contain 'demo'.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.guard_demo_admin_safety()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_email text;
  v_role text;
BEGIN
  -- Check user role first
  v_role := public.get_user_role();
  
  -- Only administrative accounts are subject to preview admin safety guard
  IF v_role = 'admin' THEN
    -- Obtain caller's authenticated email
    SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
    
    -- Strictly check for exact demo admin account (never generic substring match)
    IF LOWER(TRIM(COALESCE(v_user_email, ''))) = 'admin@ruralhealth.demo' THEN
      RAISE EXCEPTION 'Demo admin mode restricted: Modifying or destructive operations are prohibited for preview accounts.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Secure execution privileges
REVOKE ALL ON FUNCTION public.guard_demo_admin_safety() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guard_demo_admin_safety() TO authenticated;

-- Ensure triggers exist on target tables
DROP TRIGGER IF EXISTS trg_patients_demo_admin_safety ON public.patients;
CREATE TRIGGER trg_patients_demo_admin_safety
  BEFORE DELETE OR UPDATE OF role
  ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_demo_admin_safety();

DROP TRIGGER IF EXISTS trg_medical_records_demo_admin_safety ON public.medical_records;
CREATE TRIGGER trg_medical_records_demo_admin_safety
  BEFORE DELETE OR UPDATE
  ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_demo_admin_safety();

DROP TRIGGER IF EXISTS trg_appointments_demo_admin_safety ON public.appointments;
CREATE TRIGGER trg_appointments_demo_admin_safety
  BEFORE DELETE OR UPDATE
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_demo_admin_safety();
