-- ============================================================================
-- 010_make_provider_optional.sql
-- RuralHealth Platform — Allow medical records without a specific provider
-- Run in: Supabase SQL Editor
-- ============================================================================

-- Medical records like camp registrations or self-uploaded lab results 
-- do not always belong to a specific registered provider in the system.
ALTER TABLE public.medical_records ALTER COLUMN provider_id DROP NOT NULL;
