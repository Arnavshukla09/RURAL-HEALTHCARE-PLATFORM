-- ============================================================================
-- 20261018000100_admin_erasure_function.sql
--
-- Security Hotfix (Step 2): Audited Right-to-Erasure Function for Medical Records
--
-- Invariant: Administrators have ZERO direct SELECT, INSERT, or UPDATE privileges
-- on public.medical_records under RLS.
-- Erasure can only be performed via this audited SECURITY DEFINER function.
-- ============================================================================

-- Ensure all admin direct RLS policies on medical_records are completely purged
DROP POLICY IF EXISTS "admin_select_moderation_medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "admin_delete_medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "admin_read_all_medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_admin_write" ON public.medical_records;
DROP POLICY IF EXISTS "admin_delete_records" ON public.medical_records;

CREATE OR REPLACE FUNCTION public.admin_erase_medical_record(
  p_record_id uuid,
  p_reason text DEFAULT 'Admin right-to-erasure / moderation'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_actor uuid := auth.uid();
  v_role text;
BEGIN
  -- Strict caller verification: caller MUST have role = 'admin' in patients table
  v_role := public.get_user_role();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  -- Locate patient_id of the target record
  SELECT patient_id INTO v_patient_id
  FROM public.medical_records
  WHERE id = p_record_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Medical record not found' USING ERRCODE = 'P0002';
  END IF;

  -- Delete the medical record
  DELETE FROM public.medical_records WHERE id = p_record_id;

  -- Record in access_audit_log
  INSERT INTO public.access_audit_log (
    user_id,
    user_role,
    action,
    resource_type,
    resource_id,
    patient_id,
    details,
    created_at
  ) VALUES (
    v_actor,
    'admin',
    'ERASE_MEDICAL_RECORD',
    'medical_records',
    p_record_id::text,
    v_patient_id,
    jsonb_build_object(
      'reason', COALESCE(p_reason, 'Admin right-to-erasure / moderation'),
      'erased_at', timezone('utc'::text, now())
    ),
    timezone('utc'::text, now())
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_erase_medical_record(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_erase_medical_record(uuid, text) TO authenticated;
