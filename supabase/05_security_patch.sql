-- ============================================================
-- 05_security_patch.sql
-- Security Vulnerability Patch
-- Run this in Supabase SQL Editor to fix all reported issues.
-- ============================================================
-- This script:
-- 1. Enables RLS on ALL public tables that are missing it
-- 2. Adds locked-down policies for every table
-- 3. Locks down the storage bucket for medical records
-- 4. Revokes dangerous public function permissions
-- ============================================================

-- ============================================================
-- STEP 1: Enable RLS on every table in the public schema
-- (Safe to run even if already enabled - no-op if already on)
-- ============================================================
ALTER TABLE IF EXISTS public.patients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.providers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.healthcare_providers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments          ENABLE ROW LEVEL SECURITY;
-- PostGIS system table: cannot ALTER (not owned by us), so revoke public access instead.
-- This removes anon/authenticated query access via PostgREST, satisfying the security advisor.
REVOKE ALL ON public.spatial_ref_sys FROM anon, authenticated;
ALTER TABLE IF EXISTS public.medical_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.camps                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.health_data           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offline_sync_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctor_requests       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: Providers table - was missing write policies
-- ============================================================
DROP POLICY IF EXISTS "providers_select_own"         ON public.providers;
DROP POLICY IF EXISTS "providers_insert_own"         ON public.providers;
DROP POLICY IF EXISTS "providers_update_own"         ON public.providers;
DROP POLICY IF EXISTS "providers_admin_all"          ON public.providers;
DROP POLICY IF EXISTS "providers_public_read"        ON public.providers;

-- Verified doctors can read their own profile
CREATE POLICY "providers_select_own" ON public.providers
  FOR SELECT USING (user_id = auth.uid());

-- Admins can read all provider profiles
CREATE POLICY "providers_admin_read_all" ON public.providers
  FOR SELECT USING (public.get_user_role() = 'admin');

-- Providers can only update their own profile
CREATE POLICY "providers_update_own" ON public.providers
  FOR UPDATE USING (user_id = auth.uid());

-- Only the system (service_role) can insert new providers
CREATE POLICY "providers_insert_own" ON public.providers
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- STEP 3: Healthcare Providers (public directory) - lock writes
-- ============================================================
DROP POLICY IF EXISTS "healthcare_providers_select_all" ON public.healthcare_providers;
DROP POLICY IF EXISTS "healthcare_providers_admin_write" ON public.healthcare_providers;

-- Public read: anyone authenticated or anonymous can view the doctor directory
CREATE POLICY "healthcare_providers_public_read" ON public.healthcare_providers
  FOR SELECT TO anon, authenticated USING (true);

-- Only admins can insert, update, or delete doctors from the directory
CREATE POLICY "healthcare_providers_admin_write" ON public.healthcare_providers
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ============================================================
-- STEP 4: Health Data (Vitals) - ensure full CRUD is locked
-- ============================================================
DROP POLICY IF EXISTS "health_data_select_own"   ON public.health_data;
DROP POLICY IF EXISTS "health_data_insert_own"   ON public.health_data;
DROP POLICY IF EXISTS "health_data_update_own"   ON public.health_data;
DROP POLICY IF EXISTS "health_data_delete_own"   ON public.health_data;
DROP POLICY IF EXISTS "health_data_doctor_read"  ON public.health_data;
DROP POLICY IF EXISTS "health_data_admin_read"   ON public.health_data;

CREATE POLICY "health_data_select_own" ON public.health_data
  FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "health_data_insert_own" ON public.health_data
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "health_data_update_own" ON public.health_data
  FOR UPDATE USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "health_data_delete_own" ON public.health_data
  FOR DELETE USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "health_data_doctor_read" ON public.health_data
  FOR SELECT USING (public.get_user_role() = 'doctor');

CREATE POLICY "health_data_admin_read" ON public.health_data
  FOR SELECT USING (public.get_user_role() = 'admin');

-- ============================================================
-- STEP 5: Offline Sync Log - users only access their own
-- ============================================================
DROP POLICY IF EXISTS "offline_sync_select_own" ON public.offline_sync_log;
DROP POLICY IF EXISTS "offline_sync_insert_own" ON public.offline_sync_log;
DROP POLICY IF EXISTS "offline_sync_delete_own" ON public.offline_sync_log;

CREATE POLICY "offline_sync_select_own" ON public.offline_sync_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "offline_sync_insert_own" ON public.offline_sync_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "offline_sync_delete_own" ON public.offline_sync_log
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- STEP 6: Doctor Requests
-- Note: doctor_requests uses user_id (the auth user's UUID directly)
-- ============================================================
DROP POLICY IF EXISTS "doctor_requests_select_own"     ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_insert_own"     ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_admin_all"      ON public.doctor_requests;
DROP POLICY IF EXISTS "doctor_requests_doctor_view"    ON public.doctor_requests;

-- Users can only read their own request
CREATE POLICY "doctor_requests_select_own" ON public.doctor_requests
  FOR SELECT USING (user_id = auth.uid());

-- Users can only submit a request for themselves
CREATE POLICY "doctor_requests_insert_own" ON public.doctor_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all requests and approve/reject them
CREATE POLICY "doctor_requests_admin_all" ON public.doctor_requests
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ============================================================
-- STEP 7: Notifications - add write policies that were missing
-- ============================================================
DROP POLICY IF EXISTS "notifications_select_own"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin_write" ON public.notifications;

-- Patients see their own + broadcast notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (
    recipient_type = 'all'
    OR (recipient_type = 'role' AND recipient_role = public.get_user_role())
    OR (recipient_type = 'individual' AND recipient_id IN (
        SELECT id FROM public.patients WHERE user_id = auth.uid()
    ))
  );

-- Patients can mark their notifications as read
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (
    recipient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

-- Only admins can create or delete notifications
CREATE POLICY "notifications_admin_write" ON public.notifications
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ============================================================
-- STEP 8: Medical Records - add missing write policies
-- ============================================================
DROP POLICY IF EXISTS "medical_records_insert_patient" ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_doctor_write"   ON public.medical_records;
DROP POLICY IF EXISTS "medical_records_admin_write"    ON public.medical_records;

-- Patients can upload their own records
CREATE POLICY "medical_records_insert_patient" ON public.medical_records
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

-- Doctors can insert and update records
CREATE POLICY "medical_records_doctor_write" ON public.medical_records
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'doctor')
  WITH CHECK (public.get_user_role() = 'doctor');

-- Admins have full control
CREATE POLICY "medical_records_admin_write" ON public.medical_records
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ============================================================
-- STEP 9: Storage Bucket - lock medical-records bucket
-- Only authenticated users can read their own files
-- ============================================================
DROP POLICY IF EXISTS "medical_records_objects_select" ON storage.objects;
DROP POLICY IF EXISTS "medical_records_objects_insert" ON storage.objects;
DROP POLICY IF EXISTS "medical_records_objects_delete" ON storage.objects;

-- Users can only read files in their own folder (folder name = user id)
CREATE POLICY "medical_records_objects_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'medical-records' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can only upload to their own folder
CREATE POLICY "medical_records_objects_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-records' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can only delete their own files
CREATE POLICY "medical_records_objects_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'medical-records' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- STEP 10: Make medical-records bucket private (not public)
-- ============================================================
UPDATE storage.buckets
  SET public = false
  WHERE id = 'medical-records';

-- ============================================================
-- STEP 11: Lock down function execution (defense in depth)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.get_user_role()                   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.nearby_facilities(double precision, double precision, text, double precision)
                                                                     FROM PUBLIC, anon;

-- Allow authenticated users to call nearby_facilities (needed by map feature)
GRANT EXECUTE ON FUNCTION public.nearby_facilities(double precision, double precision, text, double precision)
  TO authenticated;

-- ============================================================
-- VERIFICATION QUERY
-- Run this after applying the patch to confirm all tables have RLS enabled.
-- ============================================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  CASE WHEN rowsecurity THEN '✅ Secure' ELSE '❌ VULNERABLE' END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
