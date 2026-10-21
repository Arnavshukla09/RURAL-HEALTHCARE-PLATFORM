-- ============================================================================
-- 20261017000100_care_relationship_fn.sql
--
-- Task 2: Implement robust public.has_care_relationship(p_patient_id uuid)
--
-- Corrections over previous implementation:
-- 1. Eliminates false conflation: appointments.provider_id references
--    healthcare_providers(id), NOT auth.uid(). Matches via healthcare_providers.user_id.
-- 2. Scopes appointments strictly to active care relationships ('scheduled', 'completed').
--    Cancelled appointments ('cancelled') do NOT grant access.
-- 3. Clarifies doctor_requests table role: doctor_requests is an administrative table
--    for clinician onboarding, not patient referrals, and lacks patient_id.
-- 4. Sets search_path = public, pg_temp; marks STABLE, SECURITY DEFINER.
-- 5. Revokes execution from PUBLIC and anon; grants to authenticated.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_care_relationship(p_patient_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
BEGIN
  -- 1. Fast guard: unauthenticated users or missing patient ID have no relationship
  IF v_user_id IS NULL OR p_patient_id IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Verify current authenticated user has doctor role
  SELECT role INTO v_role 
  FROM public.patients 
  WHERE user_id = v_user_id 
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'doctor' THEN
    RETURN false;
  END IF;

  -- 3. Check for active or completed clinical appointment
  -- Matches appointments where the patient is p_patient_id,
  -- the provider is mapped to the authenticated clinician's user_id,
  -- and status indicates legitimate clinical care ('scheduled' or 'completed').
  RETURN EXISTS (
    SELECT 1 
    FROM public.appointments a
    WHERE a.patient_id = p_patient_id
      AND a.provider_id IN (
        SELECT hp.id 
        FROM public.healthcare_providers hp 
        WHERE hp.user_id = v_user_id
      )
      AND a.status IN ('scheduled', 'completed')
  );
END;
$$;

-- Secure execution privileges
REVOKE ALL ON FUNCTION public.has_care_relationship(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_care_relationship(uuid) TO authenticated;
