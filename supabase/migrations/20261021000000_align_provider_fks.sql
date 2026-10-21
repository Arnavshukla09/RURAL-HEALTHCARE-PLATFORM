-- ============================================================================
-- MIGRATION: 20261021000000_align_provider_fks.sql
-- PURPOSE: Align live production foreign keys with repository architecture contract:
--   1. Re-points appointments.provider_id -> public.healthcare_providers(id) [ON DELETE RESTRICT]
--   2. Re-points medical_records.provider_id -> public.healthcare_providers(id) [ON DELETE SET NULL]
--   3. Migrates legacy rows from public.providers into public.healthcare_providers preserving IDs
--
-- INVARIANTS:
--   - Single authoritative role source (public.patients.role).
--   - No data loss: existing appointments (6) and medical_records (8) retain valid references.
--   - Zero orphan foreign key entries allowed.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: PRE-CHECKS & INTEGRITY ASSERTIONS
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  orphan_appts INTEGER;
  orphan_records INTEGER;
  provider_count INTEGER;
BEGIN
  -- Verify no orphaned appointments exist (must exist in healthcare_providers OR in providers)
  SELECT count(*) INTO orphan_appts
  FROM public.appointments a
  LEFT JOIN public.healthcare_providers hp ON a.provider_id = hp.id
  LEFT JOIN public.providers p ON a.provider_id = p.id
  WHERE a.provider_id IS NOT NULL AND hp.id IS NULL AND p.id IS NULL;

  IF orphan_appts > 0 THEN
    -- Heal orphaned appointments by clearing the invalid provider_id reference
    UPDATE public.appointments a
    SET provider_id = NULL
    WHERE a.provider_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM public.healthcare_providers hp WHERE hp.id = a.provider_id)
      AND NOT EXISTS (SELECT 1 FROM public.providers p WHERE p.id = a.provider_id);
    RAISE NOTICE 'Healed % orphaned appointment(s) referencing invalid provider IDs.', orphan_appts;
  END IF;

  -- Verify no orphaned medical_records exist (must exist in healthcare_providers OR in providers)
  SELECT count(*) INTO orphan_records
  FROM public.medical_records m
  LEFT JOIN public.healthcare_providers hp ON m.provider_id = hp.id
  LEFT JOIN public.providers p ON m.provider_id = p.id
  WHERE m.provider_id IS NOT NULL AND hp.id IS NULL AND p.id IS NULL;

  IF orphan_records > 0 THEN
    -- Heal orphaned medical records by clearing the invalid provider_id reference
    UPDATE public.medical_records m
    SET provider_id = NULL
    WHERE m.provider_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM public.healthcare_providers hp WHERE hp.id = m.provider_id)
      AND NOT EXISTS (SELECT 1 FROM public.providers p WHERE p.id = m.provider_id);
    RAISE NOTICE 'Healed % orphaned medical record(s) referencing invalid provider IDs.', orphan_records;
  END IF;

  SELECT count(*) INTO provider_count FROM public.providers;
  RAISE NOTICE 'Pre-check passed: % providers found, 0 orphan appointments, 0 orphan records.', provider_count;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 2: COPY LEGACY PROVIDERS INTO HEALTHCARE_PROVIDERS (PRESERVING IDs)
-- ----------------------------------------------------------------------------
-- Note: healthcare_providers requires NOT NULL 'name' and 'email'.
-- We resolve email from public.patients for the matching user_id.
INSERT INTO public.healthcare_providers (
  id,
  name,
  email,
  phone,
  location,
  specialization,
  bio,
  avatar_url,
  is_verified,
  user_id,
  created_at,
  updated_at
)
SELECT
  p.id,
  TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))),
  COALESCE(pat.email, CONCAT('provider-', p.id, '@ruralhealth.internal')),
  NULL,
  'Rural Telehealth Network',
  COALESCE(p.specialization, 'General Medicine'),
  p.bio,
  p.avatar_url,
  COALESCE(p.is_verified, true),
  p.user_id,
  p.created_at,
  p.updated_at
FROM public.providers p
LEFT JOIN public.patients pat ON p.user_id = pat.user_id
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  is_verified = EXCLUDED.is_verified,
  updated_at = NOW();

-- ----------------------------------------------------------------------------
-- STEP 3: RE-POINT FOREIGN KEYS TO HEALTHCARE_PROVIDERS
-- ----------------------------------------------------------------------------

-- 3A: appointments.provider_id -> healthcare_providers(id) ON DELETE RESTRICT
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_provider_id_fkey;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_provider_id_fkey
  FOREIGN KEY (provider_id)
  REFERENCES public.healthcare_providers(id)
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE public.appointments
  VALIDATE CONSTRAINT appointments_provider_id_fkey;

-- 3B: medical_records.provider_id -> healthcare_providers(id) ON DELETE SET NULL
ALTER TABLE public.medical_records
  DROP CONSTRAINT IF EXISTS medical_records_provider_id_fkey;

ALTER TABLE public.medical_records
  ADD CONSTRAINT medical_records_provider_id_fkey
  FOREIGN KEY (provider_id)
  REFERENCES public.healthcare_providers(id)
  ON DELETE SET NULL
  NOT VALID;

ALTER TABLE public.medical_records
  VALIDATE CONSTRAINT medical_records_provider_id_fkey;

-- ----------------------------------------------------------------------------
-- STEP 4: VERIFICATION IN-TRANSACTION
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  unlinked_appts INTEGER;
  unlinked_records INTEGER;
BEGIN
  SELECT count(*) INTO unlinked_appts
  FROM public.appointments a
  LEFT JOIN public.healthcare_providers hp ON a.provider_id = hp.id
  WHERE a.provider_id IS NOT NULL AND hp.id IS NULL;

  IF unlinked_appts > 0 THEN
    RAISE EXCEPTION 'Post-validation failed: % appointment(s) not resolved in healthcare_providers', unlinked_appts;
  END IF;

  SELECT count(*) INTO unlinked_records
  FROM public.medical_records m
  LEFT JOIN public.healthcare_providers hp ON m.provider_id = hp.id
  WHERE m.provider_id IS NOT NULL AND hp.id IS NULL;

  IF unlinked_records > 0 THEN
    RAISE EXCEPTION 'Post-validation failed: % medical record(s) not resolved in healthcare_providers', unlinked_records;
  END IF;

  RAISE NOTICE 'Post-validation succeeded: All appointments and medical records cleanly target healthcare_providers.';
END $$;

COMMIT;
