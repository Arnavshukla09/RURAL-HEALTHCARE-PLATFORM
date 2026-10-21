-- ============================================================================
-- 09_scale_and_security.sql
-- Fixes found in the audit. RUN ON A STAGING PROJECT FIRST, then production.
-- Safe to re-run (idempotent). Read every section before running.
--
-- NOTE: written without access to a live Postgres, so review it once and run
-- it in the Supabase SQL editor on STAGING before touching production.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. PRE-FLIGHT: duplicate patients rows per user (blocks the UNIQUE index)
-- ----------------------------------------------------------------------------
-- If this returns rows, resolve them first (keep the row you trust, delete the
-- rest) and then re-run this file. Duplicate rows are also how an attacker
-- could plant an extra 'admin' row for themselves (see section 1).
SELECT user_id, count(*) AS rows, array_agg(role) AS roles
FROM public.patients
GROUP BY user_id
HAVING count(*) > 1;


-- ----------------------------------------------------------------------------
-- 1. CRITICAL: stop users promoting themselves to admin/doctor
-- ----------------------------------------------------------------------------
-- Before this fix the patients table had:
--   * UPDATE policy "user_id = auth.uid()" with no column limits  -> a patient
--     could run  UPDATE patients SET role='admin'  on their own row, and
--   * INSERT policy "user_id = auth.uid()" and no UNIQUE(user_id) -> a patient
--     could INSERT a second row for themselves with role='admin'.
-- The rules below are enforced for every caller that is a signed-in end user
-- (auth.uid() IS NOT NULL). The service role and SQL editor are unaffected.

CREATE OR REPLACE FUNCTION public.guard_patient_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  -- Service role / SQL editor / auth triggers: no end-user JWT, allow.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  ) INTO caller_is_admin;

  IF TG_OP = 'INSERT' THEN
    IF NOT caller_is_admin THEN
      NEW.role := 'patient';             -- ignore whatever the client sent
      NEW.user_id := auth.uid();         -- can only create a row for yourself
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT caller_is_admin THEN
    RAISE EXCEPTION 'Only an admin can change a user role' USING ERRCODE = '42501';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id AND NOT caller_is_admin THEN
    RAISE EXCEPTION 'user_id cannot be changed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_patient_privileges() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_patient_privileges ON public.patients;
CREATE TRIGGER trg_guard_patient_privileges
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.guard_patient_privileges();

-- One patients row per auth user (also makes `.eq('user_id', ...).single()` safe
-- and gives the hottest lookup in the app an index).
CREATE UNIQUE INDEX IF NOT EXISTS patients_user_id_key
  ON public.patients (user_id);


-- ----------------------------------------------------------------------------
-- 2. get_user_role(): let the planner treat it as stable
-- ----------------------------------------------------------------------------
-- Used inside ~40 RLS policies. Marking it STABLE lets Postgres avoid
-- re-running it for every row where it can. (Best practice is also to call it
-- as  (select public.get_user_role())  inside policies; see section 6.)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role FROM public.patients p WHERE p.user_id = auth.uid() LIMIT 1;
$$;

-- RLS policies call this function as the signed-in user, so they need EXECUTE.
-- (08_fix_permissions.sql already did this; repeated so the final state does
--  not depend on which security file ran last.)
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;


-- ----------------------------------------------------------------------------
-- 3. Indexes: every foreign key / hot filter the app uses
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date
  ON public.appointments (patient_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_provider_date
  ON public.appointments (provider_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_status_date
  ON public.appointments (status, appointment_date);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_created
  ON public.medical_records (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_medical_records_provider
  ON public.medical_records (provider_id);

CREATE INDEX IF NOT EXISTS idx_medical_records_appointment
  ON public.medical_records (appointment_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON public.notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type_role_created
  ON public.notifications (recipient_type, recipient_role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_providers_user
  ON public.providers (user_id);

CREATE INDEX IF NOT EXISTS idx_healthcare_providers_verified
  ON public.healthcare_providers (is_verified, specialization);

-- The Gemini review queue is read by admins by status + age.
CREATE INDEX IF NOT EXISTS idx_chat_cache_status_created
  ON public.chat_cache (status, created_at DESC);


-- ----------------------------------------------------------------------------
-- 4. Double-booking guard (race condition under concurrent bookings)
-- ----------------------------------------------------------------------------
-- A provider can have only one *scheduled* appointment at an exact time.
-- The API must translate error code 23505 into HTTP 409 "slot already taken".
-- If this fails because of existing duplicates, fix those rows and re-run.
CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_slot_scheduled
  ON public.appointments (provider_id, appointment_date)
  WHERE status = 'scheduled';


-- ----------------------------------------------------------------------------
-- 5. Idempotency for offline sync (retrying a request must not duplicate rows)
-- ----------------------------------------------------------------------------
-- The client generates a UUID per queued operation and sends it as
-- `client_op_id`. The server records it; a repeat is a no-op.
CREATE TABLE IF NOT EXISTS public.processed_client_ops (
  user_id      uuid        NOT NULL,
  client_op_id uuid        NOT NULL,
  table_name   text        NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, client_op_id)
);
ALTER TABLE public.processed_client_ops ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service role (API route) touches it.

CREATE INDEX IF NOT EXISTS idx_processed_client_ops_age
  ON public.processed_client_ops (processed_at);


-- ----------------------------------------------------------------------------
-- 6. Review aid: policies that call auth.uid()/get_user_role() "bare"
-- ----------------------------------------------------------------------------
-- Postgres re-evaluates a bare auth.uid() or function call per row. Wrapping it
-- as (select auth.uid()) makes it evaluate once per query. This query lists
-- every policy still using the slow form. Rewrite them (example below) after
-- reading pg_policies on your own project, because names differ between the
-- 03_rls.sql and 05_security_patch.sql runs.
SELECT schemaname, tablename, policyname, cmd,
       COALESCE(qual, '') AS using_expr,
       COALESCE(with_check, '') AS check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND (
        (COALESCE(qual,'') || COALESCE(with_check,'')) ~ 'auth\.uid\(\)'
     OR (COALESCE(qual,'') || COALESCE(with_check,'')) ~ 'get_user_role\(\)'
      )
  AND (COALESCE(qual,'') || COALESCE(with_check,'')) !~ '\(\s*SELECT\s+auth\.uid\(\)'
ORDER BY tablename, policyname;

-- EXAMPLE rewrite (run only after checking the exact current policy names):
--
-- DROP POLICY IF EXISTS patients_read_own_appointments ON public.appointments;
-- CREATE POLICY patients_read_own_appointments ON public.appointments
--   FOR SELECT USING (
--     patient_id IN (SELECT id FROM public.patients WHERE user_id = (SELECT auth.uid()))
--   );
--
-- DROP POLICY IF EXISTS doctor_read_all_appointments ON public.appointments;
-- CREATE POLICY doctor_read_all_appointments ON public.appointments
--   FOR SELECT USING ((SELECT public.get_user_role()) = 'doctor');


-- ----------------------------------------------------------------------------
-- 7. Housekeeping so tables don't grow forever
-- ----------------------------------------------------------------------------
-- offline_sync_log and processed_client_ops are append-only. Schedule pruning
-- (Database > Extensions > pg_cron, then):
--
-- SELECT cron.schedule('prune-sync-log', '17 3 * * *',
--   $$ DELETE FROM public.offline_sync_log WHERE created_at < now() - interval '30 days' $$);
-- SELECT cron.schedule('prune-client-ops', '23 3 * * *',
--   $$ DELETE FROM public.processed_client_ops WHERE processed_at < now() - interval '30 days' $$);
--
-- Slow-query visibility (Database > Extensions > pg_stat_statements), then
-- check Dashboard > Reports > Query Performance after every load test.

ANALYZE;
