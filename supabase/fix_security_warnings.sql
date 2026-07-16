-- 1. Fix: Function Search Path Mutable
-- This prevents search path injection attacks by explicitly setting the search path to public.
ALTER FUNCTION public.nearby_facilities SET search_path = public;
ALTER FUNCTION public.audit_medical_records SET search_path = public;
ALTER FUNCTION public.update_facility_timestamp SET search_path = public;
ALTER FUNCTION public.set_facility_geom SET search_path = public;
ALTER FUNCTION public.get_current_user_role SET search_path = public;

-- 2. Fix: RLS Policy Always True
-- The `patients_service_insert` policy is overly permissive (USING true / WITH CHECK true). 
-- The `service_role` key automatically bypasses RLS, so an explicitly permissive policy is dangerous and unnecessary.
DROP POLICY IF EXISTS "patients_service_insert" ON public.patients;

-- 3. Fix: Public Can Execute SECURITY DEFINER Function
-- Revoke execution rights from public APIs to prevent arbitrary execution by anonymous or logged-in users.
REVOKE EXECUTE ON FUNCTION public.audit_medical_records FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_tables FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM PUBLIC, anon, authenticated;

-- PostGIS function fixes
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM PUBLIC, anon, authenticated;
