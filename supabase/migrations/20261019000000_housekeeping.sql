-- ============================================================================
-- Migration: 20261019000000_housekeeping.sql
-- Description: Drop legacy duplicate storage policies and revoke public/anon
--              execution privileges on internal trigger functions.
-- Author: Arnav Shukla (github.com/Arnavshukla09)
-- ============================================================================

-- 1. Drop the 5 legacy duplicate storage policies on storage.objects
-- Keep strictly: medical_records_objects_select, medical_records_objects_insert, medical_records_objects_delete
DROP POLICY IF EXISTS "Users can upload their own records" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own records" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own files" ON storage.objects;

-- 2. Revoke direct EXECUTE on internal trigger functions from PUBLIC, anon, and authenticated
-- These functions are strictly trigger procedures called by PostgreSQL triggers,
-- and must never be callable via RPC or direct SQL invocation by client roles.
REVOKE EXECUTE ON FUNCTION public.guard_demo_admin_safety() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_facility_geom() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_facility_timestamp() FROM PUBLIC, anon, authenticated;
