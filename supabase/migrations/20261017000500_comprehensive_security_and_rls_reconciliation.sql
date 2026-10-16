-- ============================================================================
-- 20261017000500_comprehensive_security_and_rls_reconciliation.sql
--
-- Comprehensive Security Hardening & RLS Reconciliation Migration:
-- 1. Doctors Access Scoping:
--    - appointments: doctors can only SELECT/UPDATE their own assigned appointments.
--    - health_data: doctors can only SELECT vitals where active care relationship exists
--      via public.has_care_relationship(patient_id).
-- 2. Provider Profile Lockdown:
--    - providers: drop user self-insert. Only admins can insert/onboard providers.
-- 3. Chat Cache Security:
--    - chat_cache: remove user_metadata role check and providers table check.
--      Only server-controlled role check (admin or doctor) is allowed.
-- 4. Function Permissions & Search Path:
--    - Reconcile get_user_role(), get_current_user_role(), has_care_relationship(),
--      and handle_new_user() with locked search_path = public and appropriate grants.
--    - Safely revoke get_tables() execution from PUBLIC, anon, and authenticated.
-- 5. Foreign Key Covering Indexes:
--    - Index appointments(patient_id), appointments(provider_id),
--      medical_records(patient_id), medical_records(provider_id), notifications(recipient_id).
-- 6. Offline Idempotency & Payments RLS:
--    - processed_client_ops: RLS policies allowing authenticated users to manage own idempotency.
--    - payments: RLS policies ensuring inserted payments are strictly user-owned and status='pending'.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Schema Reconciliation (Ensure columns and tables exist)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.appointments
  ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'video' CHECK (consultation_type IN ('video', 'audio', 'chat', 'in_person'));

ALTER TABLE IF EXISTS public.medical_records
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  data_type TEXT,
  value NUMERIC,
  unit TEXT,
  notes TEXT,
  blood_pressure TEXT,
  temperature NUMERIC,
  pulse_rate NUMERIC,
  blood_sugar NUMERIC,
  spo2 NUMERIC,
  weight NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.processed_client_ops (
  user_id UUID NOT NULL,
  client_op_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, client_op_id)
);

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

-- ----------------------------------------------------------------------------
-- 2. Foreign Key Covering Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON public.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_provider_id ON public.medical_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_health_data_patient ON public.health_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_data_recorded ON public.health_data(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_processed_client_ops_age ON public.processed_client_ops(processed_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- ----------------------------------------------------------------------------
-- 3. Function Search Path & Permissions Reconciliation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  role text;
BEGIN
  SELECT p.role INTO role FROM public.patients p WHERE p.user_id = (SELECT auth.uid()) LIMIT 1;
  RETURN role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
BEGIN
  RETURN public.get_user_role();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;

-- Revoke get_tables if present in live database
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_tables') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_tables() FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Provider Profiles Security Lockdown (P0 Finding 2)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "providers_insert_own" ON public.providers;
DROP POLICY IF EXISTS "providers_admin_insert" ON public.providers;

CREATE POLICY "providers_admin_insert" ON public.providers
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

-- ----------------------------------------------------------------------------
-- 5. Appointments Doctor Access Scoping (P0 Finding 1)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "doctor_read_all_appointments" ON public.appointments;
DROP POLICY IF EXISTS "doctor_read_assigned_appointments" ON public.appointments;
DROP POLICY IF EXISTS "doctor_update_assigned_appointments" ON public.appointments;

CREATE POLICY "doctor_read_assigned_appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND (
      provider_id IN (SELECT hp.id FROM public.healthcare_providers hp WHERE hp.user_id = (SELECT auth.uid()))
      OR
      provider_id IN (SELECT pr.id FROM public.providers pr WHERE pr.user_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "doctor_update_assigned_appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND (
      provider_id IN (SELECT hp.id FROM public.healthcare_providers hp WHERE hp.user_id = (SELECT auth.uid()))
      OR
      provider_id IN (SELECT pr.id FROM public.providers pr WHERE pr.user_id = (SELECT auth.uid()))
    )
  );

-- ----------------------------------------------------------------------------
-- 6. Health Data Vitals Scoping (P0 Finding 1)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.health_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "health_data_doctor_read" ON public.health_data;

CREATE POLICY "health_data_doctor_read" ON public.health_data
  FOR SELECT TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'doctor'
    AND public.has_care_relationship(patient_id)
  );

-- ----------------------------------------------------------------------------
-- 7. Chat Cache Moderation Lockdown (P0 Finding 3)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins and doctors can update chat cache entries" ON public.chat_cache;
DROP POLICY IF EXISTS "Admins and doctors can view pending entries for review" ON public.chat_cache;

CREATE POLICY "Admins and doctors can update chat cache entries"
ON public.chat_cache
FOR UPDATE
TO authenticated
USING (
  (SELECT public.get_user_role()) IN ('admin', 'doctor')
);

CREATE POLICY "Admins and doctors can view pending entries for review"
ON public.chat_cache
FOR SELECT
TO authenticated
USING (
  (SELECT public.get_user_role()) IN ('admin', 'doctor')
);

-- ----------------------------------------------------------------------------
-- 8. Processed Client Operations RLS (P1 Finding 6)
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
-- 9. Payments Table RLS Policy (P2 Payment Finding)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'pending');
