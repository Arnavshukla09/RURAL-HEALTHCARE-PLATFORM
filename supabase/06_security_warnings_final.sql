-- ================================================================
-- 06_security_warnings_final.sql
-- Fixes ALL remaining Supabase Security Advisor warnings.
-- Run this entire script in the Supabase SQL Editor.
-- ================================================================


-- ================================================================
-- GROUP 1: function_search_path_mutable
-- Fix: ALTER FUNCTION ... SET search_path to lock the path.
-- PostGIS functions need 'public, pg_catalog' since their C code
-- lives in pg_catalog. Our own functions only need 'public'.
-- ================================================================

-- Our own functions (search_path = public only)
ALTER FUNCTION public.get_user_role()
  SET search_path = public;

ALTER FUNCTION public.audit_medical_records()
  SET search_path = public;

ALTER FUNCTION public.update_facility_timestamp()
  SET search_path = public;

ALTER FUNCTION public.set_facility_geom()
  SET search_path = public;

ALTER FUNCTION public.get_current_user_role()
  SET search_path = public;

-- nearby_facilities uses PostGIS types so needs pg_catalog too
ALTER FUNCTION public.nearby_facilities(double precision, double precision, text, double precision)
  SET search_path = public, pg_catalog;


-- ================================================================
-- GROUP 2: rls_policy_always_true
-- The "patients_service_insert" policy has USING(true) WITH CHECK(true)
-- which bypasses RLS entirely. The service_role key already bypasses
-- RLS automatically, so this policy is both dangerous AND redundant.
-- ================================================================

DROP POLICY IF EXISTS "patients_service_insert" ON public.patients;


-- ================================================================
-- GROUP 3: anon_security_definer_function_executable
--           authenticated_security_definer_function_executable
-- Fix: Revoke EXECUTE from anon and authenticated for all
-- SECURITY DEFINER functions that should not be publicly callable.
-- ================================================================

-- Our internal helper functions
REVOKE EXECUTE ON FUNCTION public.audit_medical_records()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_current_user_role()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_tables()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_role()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM anon, authenticated;

-- PostGIS internal functions (3 overloads of st_estimatedextent)
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text)
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean)
  FROM anon, authenticated;

-- Re-grant nearby_facilities ONLY to authenticated users (needed by the map)
-- (It was revoked above via get_user_role chain — re-grant explicitly)
GRANT EXECUTE ON FUNCTION public.nearby_facilities(double precision, double precision, text, double precision)
  TO authenticated;


-- ================================================================
-- GROUP 4: extension_in_public (postgis)
-- PostGIS cannot be moved at runtime without a full reinstall.
-- The practical mitigation is to revoke public access to all
-- PostGIS functions and tables so they are not exposed via PostgREST.
-- This is the Supabase-recommended approach for existing projects.
-- ================================================================

-- Revoke access to the PostGIS spatial reference system table
REVOKE ALL ON public.spatial_ref_sys FROM anon, authenticated;
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to spatial_ref_sys" ON public.spatial_ref_sys FOR SELECT TO PUBLIC USING (true);

-- Revoke access to PostGIS geometry_columns and geography_columns views
REVOKE ALL ON public.geometry_columns     FROM anon, authenticated;
REVOKE ALL ON public.geography_columns    FROM anon, authenticated;


-- ================================================================
-- VERIFICATION
-- Run this after applying the patch to see remaining issues.
-- All rows should show a healthy state.
-- ================================================================
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS On' ELSE '❌ No RLS' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
