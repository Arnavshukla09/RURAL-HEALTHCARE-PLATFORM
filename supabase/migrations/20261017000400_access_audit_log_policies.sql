-- ============================================================================
-- 20261017000400_access_audit_log_policies.sql
--
-- Task 5: Production Access Audit Logging & Row Level Security Policies
--
-- 1. Ensure access_audit_log table exists with proper schema
-- 2. Explicitly revoke UPDATE and DELETE privileges from all client roles (append-only)
-- 3. Policy: Authenticated users may insert audit entries where user_id = auth.uid()
-- 4. Policy: Patients may select audit log entries associated with their patient_id
-- 5. Policy: Administrators may select audit logs for compliance auditing
-- 6. Add indexes on patient_id, user_id, and created_at
-- ============================================================================

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

ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on access_audit_log
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'access_audit_log'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END;
$$;

-- Revoke mutation and deletion privileges to enforce append-only invariant
REVOKE UPDATE, DELETE ON public.access_audit_log FROM PUBLIC, anon, authenticated;

-- Policy 1: Authenticated users can insert their own audit entries
CREATE POLICY "audit_log_insert_own"
  ON public.access_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- Policy 2: Patients can view audit entries concerning their medical records
CREATE POLICY "patient_select_own_audit_log"
  ON public.access_audit_log
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
    )
  );

-- Policy 3: Administrators can view audit entries for security & compliance oversight
CREATE POLICY "admin_select_audit_log"
  ON public.access_audit_log
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'admin'
  );

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_audit_log_patient_id ON public.access_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.access_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.access_audit_log(created_at DESC);
