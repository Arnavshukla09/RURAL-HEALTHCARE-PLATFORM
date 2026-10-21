-- ============================================================================
-- 20261018000200_reconcile_security_state.sql
--
-- Security Hotfix Reconciliation & Live Production Convergence Migration
--
-- 1. Database Role Authority:
--    - get_user_role(): Reads EXCLUSIVELY from public.patients.role.
--    - get_current_user_role(): Canonical wrapper returning get_user_role().
--    - handle_new_user(): Always assigns role = 'patient', ignores metadata.
--    - guard_patient_privileges(): Rejects non-patient roles on INSERT unless service_role/admin.
--    - has_care_relationship(): Verified doctor role + active appointment ('scheduled', 'completed').
--    - admin_erase_medical_record(): Audited atomic deletion by verified admin only.
-- 2. Complete RLS Policy Purge & Convergence:
--    - Drops ALL legacy permissive policies and metadata-checking policies.
--    - Rebuilds strict least-privilege policies across all tables.
--    - Enforces payments status = 'pending' on client INSERT.
--    - Enforces appointments status IN ('scheduled', 'cancelled') on patient UPDATE (no self-completion).
--    - Enforces right-to-erasure via dedicated RPC only (no client medical_records DELETE).
--    - Enforces immutable audit logging on access_audit_log and offline_sync_log (no client DELETE).
-- 3. Utility Function Hardening:
--    - Drops insecure diagnostic function get_tables().
--    - Secures audit_medical_records() trigger function.
-- 4. Index Deduplication:
--    - Drops duplicate patients_user_id_unique index.
-- ============================================================================

-- ============================================================================
-- PART 1: TABLES, CONSTRAINTS & INDEXES RECONCILIATION
-- ============================================================================

-- Ensure healthcare_providers has user_id foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'healthcare_providers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.healthcare_providers 
      ADD COLUMN user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

REVOKE INSERT (user_id), UPDATE (user_id) ON public.healthcare_providers FROM PUBLIC, anon, authenticated;

-- Ensure payments table exists with strict status constraint
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure processed_client_ops table exists for offline idempotency
CREATE TABLE IF NOT EXISTS public.processed_client_ops (
  user_id UUID NOT NULL,
  client_op_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, client_op_id)
);

-- Ensure access_audit_log table exists
CREATE TABLE IF NOT EXISTS public.access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT NOT NULL DEFAULT 'unknown',
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  patient_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Foreign Key Covering Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON public.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_patient_status ON public.appointments(provider_id, patient_id, status);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_provider_id ON public.medical_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_health_data_patient ON public.health_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_data_recorded ON public.health_data(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_user_id ON public.healthcare_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_client_ops_age ON public.processed_client_ops(processed_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_access_audit_log_user_id ON public.access_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_audit_log_patient_id ON public.access_audit_log(patient_id);

-- Drop duplicate unique constraint/index on patients
ALTER TABLE IF EXISTS public.patients DROP CONSTRAINT IF EXISTS patients_user_id_unique;
DROP INDEX IF EXISTS public.patients_user_id_unique;

-- Safe default for last_name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.patients ALTER COLUMN last_name SET DEFAULT '';
  END IF;
END $$;


-- ============================================================================
-- PART 2: CORE SECURITY FUNCTIONS
-- ============================================================================

-- 2.1 Function: public.get_user_role()
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

-- 2.2 Function: public.get_current_user_role()
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

-- 2.3 Function: public.handle_new_user()
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

-- 2.4 Function & Trigger: public.guard_patient_privileges()
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
  BEGIN
    caller_jwt_role := COALESCE(
      NULLIF(current_setting('request.jwt.claim.role', true), ''),
      auth.role()::text
    );
  EXCEPTION WHEN OTHERS THEN
    caller_jwt_role := NULL;
  END;

  is_service := (caller_jwt_role = 'service_role');

  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    ) INTO caller_is_admin;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'patient' THEN
      IF NOT (is_service OR caller_is_admin) THEN
        RAISE EXCEPTION 'Only an admin or service role can assign a non-patient role' USING ERRCODE = '42501';
      END IF;
    END IF;

    IF auth.uid() IS NOT NULL AND NOT (is_service OR caller_is_admin) THEN
      NEW.user_id := auth.uid();
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
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

-- 2.5 Function: public.has_care_relationship(p_patient_id uuid)
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
  IF v_user_id IS NULL OR p_patient_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO v_role 
  FROM public.patients 
  WHERE user_id = v_user_id 
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'doctor' THEN
    RETURN false;
  END IF;

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

REVOKE ALL ON FUNCTION public.has_care_relationship(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_care_relationship(uuid) TO authenticated, service_role;

-- 2.6 Function: public.admin_erase_medical_record(p_record_id uuid, p_reason text)
DROP FUNCTION IF EXISTS public.admin_erase_medical_record(uuid, text);
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
  caller_role text;
  caller_uid uuid;
  rec_patient_id uuid;
  trimmed_reason text;
BEGIN
  caller_uid := auth.uid();
  IF caller_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  caller_role := public.get_user_role();
  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  trimmed_reason := TRIM(COALESCE(p_reason, ''));
  IF LENGTH(trimmed_reason) < 10 THEN
    RAISE EXCEPTION 'A detailed justification reason (minimum 10 characters) is required for audit compliance'
      USING ERRCODE = '22023';
  END IF;

  SELECT patient_id INTO rec_patient_id
  FROM public.medical_records
  WHERE id = p_record_id;

  IF rec_patient_id IS NULL THEN
    RAISE EXCEPTION 'Medical record % not found', p_record_id USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.medical_records
  WHERE id = p_record_id;

  INSERT INTO public.access_audit_log (
    user_id,
    user_role,
    action,
    resource_type,
    resource_id,
    patient_id,
    details
  ) VALUES (
    caller_uid,
    'admin',
    'ERASE_MEDICAL_RECORD',
    'medical_records',
    p_record_id,
    rec_patient_id,
    jsonb_build_object(
      'reason', trimmed_reason,
      'erased_at', NOW(),
      'actor_uid', caller_uid
    )
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_erase_medical_record(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_erase_medical_record(uuid, text) TO authenticated, service_role;

-- 2.7 Utility Function Lockdown & Safety Guards
DROP FUNCTION IF EXISTS public.get_tables() CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'audit_medical_records'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.audit_medical_records() SET search_path = public';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.audit_medical_records() FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

-- 2.8 Demo Admin Safety Guard (Strictly restricts admin@ruralhealth.demo)
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
  -- Obtain caller email via auth.users, public.patients, or JWT
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email FROM public.patients WHERE user_id = auth.uid();
  END IF;
  IF v_user_email IS NULL THEN
    v_user_email := auth.jwt()->>'email';
  END IF;

  v_role := public.get_user_role();
  
  -- Strictly check for exact demo admin account (never generic substring match)
  IF LOWER(TRIM(COALESCE(v_user_email, ''))) = 'admin@ruralhealth.demo' THEN
    RAISE EXCEPTION 'Demo admin mode restricted: Modifying or destructive operations are prohibited for preview accounts.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_demo_admin_safety() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guard_demo_admin_safety() TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_appointments_demo_admin_safety ON public.appointments;
CREATE TRIGGER trg_appointments_demo_admin_safety
  BEFORE DELETE OR UPDATE
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_demo_admin_safety();

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


-- ============================================================================
-- PART 3: ROW LEVEL SECURITY RECONCILIATION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 TABLE: public.medical_records
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_all_medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "doctor_read_all_medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_admin_write" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_doctor_write" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_insert_patient" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_insert_provider" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_select_own" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_select_patient" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_select_provider" ON public.medical_records;
DROP POLICY IF EXISTS "patients_delete_own_records" ON public.medical_records;
DROP POLICY IF EXISTS "patients_read_own_records" ON public.medical_records;
DROP POLICY IF EXISTS "patients_update_own_records" ON public.medical_records;
DROP POLICY IF EXISTS "admin_select_moderation_medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "admin_delete_records" ON public.medical_records;
DROP POLICY IF EXISTS "admin_delete_medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "doctor_read_care_records" ON public.medical_records;
DROP POLICY IF EXISTS "doctor_insert_care_records" ON public.medical_records;

-- Patient can read own records
CREATE POLICY "patients_read_own_records" ON public.medical_records
  FOR SELECT TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

-- Patient can insert own records
CREATE POLICY "medical_records_insert_patient" ON public.medical_records
  FOR INSERT TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

-- Doctor can read records only with active care relationship
CREATE POLICY "doctor_read_care_records" ON public.medical_records
  FOR SELECT TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(patient_id)
  );

-- Doctor can insert records only with active care relationship
CREATE POLICY "doctor_insert_care_records" ON public.medical_records
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(patient_id)
  );

-- ----------------------------------------------------------------------------
-- 3.2 TABLE: public.appointments
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_all_appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_patient" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_patient" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_provider" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_patient" ON public.appointments;
DROP POLICY IF EXISTS "doctor_read_all_appointments" ON public.appointments;
DROP POLICY IF EXISTS "doctor_update_appointments" ON public.appointments;
DROP POLICY IF EXISTS "patients_delete_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "patients_read_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "patients_update_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "doctor_read_assigned_appointments" ON public.appointments;
DROP POLICY IF EXISTS "doctor_update_assigned_appointments" ON public.appointments;
DROP POLICY IF EXISTS "admin_delete_appointments" ON public.appointments;
DROP POLICY IF EXISTS "admin_update_appointments" ON public.appointments;
DROP POLICY IF EXISTS "admin_select_appointments" ON public.appointments;

-- Patient can read own appointments
CREATE POLICY "patients_read_own_appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

-- Patient can insert own appointment with scheduled status
CREATE POLICY "appointments_insert_patient" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
    AND status = 'scheduled'
  );

-- Patient can update own appointment (cancel or update notes), but CANNOT self-complete
CREATE POLICY "appointments_update_patient" ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
    AND status IN ('scheduled', 'cancelled')
  );

-- Doctor can read assigned appointments
CREATE POLICY "doctor_read_assigned_appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND provider_id IN (
      SELECT hp.id FROM public.healthcare_providers hp WHERE hp.user_id = (SELECT auth.uid())
    )
  );

-- Doctor can update assigned appointments
CREATE POLICY "doctor_update_assigned_appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND provider_id IN (
      SELECT hp.id FROM public.healthcare_providers hp WHERE hp.user_id = (SELECT auth.uid())
    )
  );

-- Admin can manage appointments
CREATE POLICY "admin_select_appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "admin_delete_appointments" ON public.appointments
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "admin_update_appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

-- ----------------------------------------------------------------------------
-- 3.3 TABLE: public.patients
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_all_patients" ON public.patients;
DROP POLICY IF EXISTS "doctor_read_all_patients" ON public.patients;
DROP POLICY IF EXISTS "patients_delete_own" ON public.patients;
DROP POLICY IF EXISTS "patients_insert_own" ON public.patients;
DROP POLICY IF EXISTS "patients_read_own_row" ON public.patients;
DROP POLICY IF EXISTS "patients_select_own" ON public.patients;
DROP POLICY IF EXISTS "patients_update_own" ON public.patients;
DROP POLICY IF EXISTS "patients_admin_select" ON public.patients;
DROP POLICY IF EXISTS "patients_admin_delete" ON public.patients;
DROP POLICY IF EXISTS "doctor_read_care_patients" ON public.patients;

CREATE POLICY "patients_select_own" ON public.patients
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "patients_insert_own" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "patients_update_own" ON public.patients
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "doctor_read_care_patients" ON public.patients
  FOR SELECT TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(id)
  );

CREATE POLICY "patients_admin_select" ON public.patients
  FOR SELECT TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "patients_admin_delete" ON public.patients
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

-- ----------------------------------------------------------------------------
-- 3.4 TABLE: public.health_data
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.health_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "health_data_admin_read" ON public.health_data;
DROP POLICY IF EXISTS "health_data_delete_own" ON public.health_data;
DROP POLICY IF EXISTS "health_data_doctor_read" ON public.health_data;
DROP POLICY IF EXISTS "health_data_insert_own" ON public.health_data;
DROP POLICY IF EXISTS "health_data_select_own" ON public.health_data;
DROP POLICY IF EXISTS "health_data_update_own" ON public.health_data;

CREATE POLICY "health_data_select_own" ON public.health_data
  FOR SELECT TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "health_data_insert_own" ON public.health_data
  FOR INSERT TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "health_data_update_own" ON public.health_data
  FOR UPDATE TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "health_data_delete_own" ON public.health_data
  FOR DELETE TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "health_data_doctor_read" ON public.health_data
  FOR SELECT TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(patient_id)
  );

-- ----------------------------------------------------------------------------
-- 3.5 TABLE: public.chat_cache
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.chat_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and doctors can update chat cache entries" ON public.chat_cache;
DROP POLICY IF EXISTS "Admins and doctors can view pending entries for review" ON public.chat_cache;
DROP POLICY IF EXISTS "chat_cache_select_verified" ON public.chat_cache;
DROP POLICY IF EXISTS "chat_cache_update_verified" ON public.chat_cache;

CREATE POLICY "chat_cache_select_verified" ON public.chat_cache
  FOR SELECT TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'doctor'));

CREATE POLICY "chat_cache_update_verified" ON public.chat_cache
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'doctor'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'doctor'));

-- ----------------------------------------------------------------------------
-- 3.6 TABLE: public.providers & public.healthcare_providers
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_insert_providers" ON public.providers;
DROP POLICY IF EXISTS "providers_insert_own" ON public.providers;
DROP POLICY IF EXISTS "providers_admin_insert" ON public.providers;
DROP POLICY IF EXISTS "providers_delete_own" ON public.providers;
DROP POLICY IF EXISTS "providers_select_own" ON public.providers;
DROP POLICY IF EXISTS "providers_update_own" ON public.providers;
DROP POLICY IF EXISTS "providers_admin_read_all" ON public.providers;

CREATE POLICY "providers_select_own" ON public.providers
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "providers_admin_read_all" ON public.providers
  FOR SELECT TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "providers_admin_insert" ON public.providers
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "providers_update_own" ON public.providers
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- healthcare_providers
ALTER TABLE IF EXISTS public.healthcare_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "providers_admin_insert" ON public.healthcare_providers;
DROP POLICY IF EXISTS "healthcare_providers_admin_write" ON public.healthcare_providers;
DROP POLICY IF EXISTS "healthcare_providers_read_all" ON public.healthcare_providers;
DROP POLICY IF EXISTS "providers_public_read" ON public.healthcare_providers;
DROP POLICY IF EXISTS "healthcare_providers_public_read" ON public.healthcare_providers;

CREATE POLICY "healthcare_providers_public_read" ON public.healthcare_providers
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "healthcare_providers_admin_write" ON public.healthcare_providers
  FOR ALL TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin')
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "providers_admin_insert" ON public.healthcare_providers
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

-- ----------------------------------------------------------------------------
-- 3.7 TABLE: public.payments
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'pending');

-- ----------------------------------------------------------------------------
-- 3.8 TABLE: public.processed_client_ops
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.processed_client_ops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "processed_client_ops_own_select" ON public.processed_client_ops;
DROP POLICY IF EXISTS "processed_client_ops_own_insert" ON public.processed_client_ops;

CREATE POLICY "processed_client_ops_own_select" ON public.processed_client_ops
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "processed_client_ops_own_insert" ON public.processed_client_ops
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- 3.9 TABLE: public.offline_sync_log (Append-only audit, no DELETE)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.offline_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offline_sync_delete_own" ON public.offline_sync_log;
DROP POLICY IF EXISTS "offline_sync_insert_own" ON public.offline_sync_log;
DROP POLICY IF EXISTS "offline_sync_select_own" ON public.offline_sync_log;
DROP POLICY IF EXISTS "offline_sync_log_insert_own" ON public.offline_sync_log;
DROP POLICY IF EXISTS "offline_sync_log_select_own" ON public.offline_sync_log;

CREATE POLICY "offline_sync_log_select_own" ON public.offline_sync_log
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "offline_sync_log_insert_own" ON public.offline_sync_log
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- 3.10 TABLE: public.access_audit_log (Admin read, auth insert, no client delete)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.access_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.access_audit_log FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.access_audit_log TO authenticated, service_role;

DROP POLICY IF EXISTS "access_audit_log_admin_read" ON public.access_audit_log;
DROP POLICY IF EXISTS "access_audit_log_auth_insert" ON public.access_audit_log;

CREATE POLICY "access_audit_log_admin_read" ON public.access_audit_log
  FOR SELECT TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "access_audit_log_auth_insert" ON public.access_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR user_id IS NULL);

-- ----------------------------------------------------------------------------
-- 3.11 TABLE: public.notifications (Deduplicate & reconcile least privilege)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_access" ON public.notifications;
DROP POLICY IF EXISTS "users_read_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_update_notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin_write" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;

CREATE POLICY "notifications_admin_write" ON public.notifications
  FOR ALL TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin')
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    (recipient_type = 'all')
    OR ((recipient_type = 'role') AND (recipient_role = (SELECT public.get_user_role())))
    OR ((recipient_type = 'individual') AND (recipient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )))
  );

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (
    recipient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    recipient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- 3.12 TABLE: public.doctor_requests (Deduplicate policies)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.doctor_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manages_all" ON public.doctor_requests;
DROP POLICY IF EXISTS "user_inserts_own" ON public.doctor_requests;
DROP POLICY IF EXISTS "user_sees_own" ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_admin_all" ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_insert_own" ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_select_own" ON public.doctor_requests;

CREATE POLICY "doctor_requests_admin_all" ON public.doctor_requests
  FOR ALL TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin')
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

CREATE POLICY "doctor_requests_select_own" ON public.doctor_requests
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "doctor_requests_insert_own" ON public.doctor_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- PART 4: DROP IDENTICAL / REDUNDANT INDEXES DETECTED BY ADVISOR
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_appointments_patient;
DROP INDEX IF EXISTS public.idx_appointments_provider;
DROP INDEX IF EXISTS public.idx_medical_records_patient;
DROP INDEX IF EXISTS public.idx_medical_records_provider;
DROP INDEX IF EXISTS public.idx_notif_recipient_id;

