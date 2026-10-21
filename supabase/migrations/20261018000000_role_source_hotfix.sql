-- ============================================================================
-- 20261018000000_role_source_hotfix.sql
--
-- Security Hotfix: Database Role Source Hardening & Privilege Escalation Fix
--
-- 1. get_user_role(): Reads EXCLUSIVELY from public.patients.role.
--    Never inspects user_metadata, raw_user_meta_data, or client-writable JWT fields.
--    Returns NULL if no patient row exists (treated as no privileges).
-- 2. get_current_user_role(): Canonical wrapper around get_user_role().
-- 3. handle_new_user(): Always assigns role = 'patient'. Ignores all metadata.
--    Uses ON CONFLICT (user_id) DO NOTHING (never DO UPDATE).
-- 4. guard_patient_privileges(): Eliminates blind "auth.uid() IS NULL -> allow" on INSERT.
--    Non-patient roles on INSERT strictly require service_role or verified admin.
-- 5. Drop & recreate all policies previously referencing metadata with (SELECT public.get_user_role()).
-- 6. Permanently drop admin moderation/delete policies on medical_records.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Function: public.get_user_role()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role FROM public.patients p WHERE p.user_id = (SELECT auth.uid()) LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Function: public.get_current_user_role()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role();
$$;

REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;

-- Ensure last_name has a safe default to avoid NOT NULL violations on single-name signups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.patients ALTER COLUMN last_name SET DEFAULT '';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Function: public.handle_new_user()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.patients (user_id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'patient'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Function & Trigger: public.guard_patient_privileges()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_patient_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean := false;
  caller_jwt_role text;
  is_service boolean := false;
BEGIN
  -- Extract JWT role claim
  BEGIN
    caller_jwt_role := COALESCE(
      NULLIF(current_setting('request.jwt.claim.role', true), ''),
      auth.role()::text
    );
  EXCEPTION WHEN OTHERS THEN
    caller_jwt_role := NULL;
  END;

  is_service := (caller_jwt_role = 'service_role');

  -- Check if caller is verified admin in patients table
  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    ) INTO caller_is_admin;
  END IF;

  -- Enforce on INSERT
  IF TG_OP = 'INSERT' THEN
    -- If assigning a non-patient role, strictly require service_role or admin
    IF NEW.role IS DISTINCT FROM 'patient' THEN
      IF NOT (is_service OR caller_is_admin) THEN
        RAISE EXCEPTION 'Only an admin or service role can assign a non-patient role' USING ERRCODE = '42501';
      END IF;
    END IF;

    -- For end-user callers (not service role and not admin), enforce user_id = auth.uid()
    IF auth.uid() IS NOT NULL AND NOT (is_service OR caller_is_admin) THEN
      NEW.user_id := auth.uid();
    END IF;

    RETURN NEW;
  END IF;

  -- Enforce on UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Service role can perform administrative updates
    IF is_service THEN
      RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role AND NOT caller_is_admin THEN
      RAISE EXCEPTION 'Only an admin can change a user role' USING ERRCODE = '42501';
    END IF;

    IF NEW.user_id IS DISTINCT FROM OLD.user_id AND NOT caller_is_admin THEN
      RAISE EXCEPTION 'user_id cannot be changed' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_patient_privileges() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_patient_privileges ON public.patients;
CREATE TRIGGER trg_guard_patient_privileges
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.guard_patient_privileges();

-- ----------------------------------------------------------------------------
-- 5. Drop & Recreate Policies using (SELECT public.get_user_role())
-- ----------------------------------------------------------------------------

-- 5.1 healthcare_providers: providers_admin_insert
DROP POLICY IF EXISTS "providers_admin_insert" ON public.healthcare_providers;
CREATE POLICY "providers_admin_insert"
  ON public.healthcare_providers
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

-- 5.2 patients: patients_admin_select & patients_admin_delete
DROP POLICY IF EXISTS "patients_admin_select" ON public.patients;
CREATE POLICY "patients_admin_select"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS "patients_admin_delete" ON public.patients;
CREATE POLICY "patients_admin_delete"
  ON public.patients
  FOR DELETE
  TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

-- 5.3 chat_cache: chat_cache_select_verified & chat_cache_update_verified
DROP POLICY IF EXISTS "chat_cache_select_verified" ON public.chat_cache;
CREATE POLICY "chat_cache_select_verified"
  ON public.chat_cache
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.get_user_role()) IN ('admin', 'doctor')
  );

DROP POLICY IF EXISTS "chat_cache_update_verified" ON public.chat_cache;
CREATE POLICY "chat_cache_update_verified"
  ON public.chat_cache
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.get_user_role()) IN ('admin', 'doctor')
  )
  WITH CHECK (
    (SELECT public.get_user_role()) IN ('admin', 'doctor')
  );

-- 5.4 medical_records: Drop admin moderation and delete policies
DROP POLICY IF EXISTS "admin_select_moderation_medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "admin_delete_medical_records" ON public.medical_records;
