-- ============================================================================
-- 20261017000000_provider_user_link.sql
--
-- Task 1: Link healthcare_providers to auth.users and create performance index
--
-- 1. Add user_id column to public.healthcare_providers referencing auth.users(id)
-- 2. Revoke client-side write privileges on user_id to prevent privilege escalation
-- 3. Perform safe 1:1 email conditional backfill
-- 4. Create compound index on appointments (provider_id, patient_id, status)
-- 5. Create index on healthcare_providers(user_id)
-- ============================================================================

-- 1. Add user_id column if not exists
ALTER TABLE public.healthcare_providers 
ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Revoke client write privileges on user_id column
REVOKE INSERT (user_id), UPDATE (user_id) ON public.healthcare_providers FROM PUBLIC, anon, authenticated;

-- 3. Safe conditional backfill:
-- Link where email strictly matches 1:1 between healthcare_providers and auth.users,
-- and where healthcare_providers email is unique.
UPDATE public.healthcare_providers hp
SET user_id = u.id
FROM auth.users u
WHERE hp.user_id IS NULL
  AND hp.email IS NOT NULL
  AND LOWER(TRIM(hp.email)) = LOWER(TRIM(u.email))
  AND (
    SELECT COUNT(*) 
    FROM public.healthcare_providers hp2 
    WHERE LOWER(TRIM(hp2.email)) = LOWER(TRIM(hp.email))
  ) = 1;

-- 4. Compound index on appointments for fast care relationship resolution
CREATE INDEX IF NOT EXISTS idx_appointments_provider_patient_status 
ON public.appointments (provider_id, patient_id, status);

-- 5. Index on healthcare_providers(user_id) for fast lookup by authenticated user
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_user_id 
ON public.healthcare_providers (user_id);
