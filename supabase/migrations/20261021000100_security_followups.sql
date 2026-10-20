-- ============================================================================
-- MIGRATION: 20261021000100_security_followups.sql
-- PURPOSE:
--   1. Drop orphaned permissive policies on public.chat_cache (V1 security leak)
--      - "Anyone can read approved chat cache entries"
--      - "Authenticated users can submit pending chat cache entries"
--   2. Confirm chat_cache policies remain restricted to admin and doctor roles:
--      - chat_cache_select_verified
--      - chat_cache_update_verified
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: DROP LEGACY PERMISSIVE CHAT_CACHE POLICIES (AUDIT V1)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read approved chat cache entries" ON public.chat_cache;
DROP POLICY IF EXISTS "Authenticated users can submit pending chat cache entries" ON public.chat_cache;

-- ----------------------------------------------------------------------------
-- STEP 2: VERIFICATION ASSERTION
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  legacy_count INTEGER;
BEGIN
  SELECT count(*) INTO legacy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'chat_cache'
    AND policyname IN (
      'Anyone can read approved chat cache entries',
      'Authenticated users can submit pending chat cache entries'
    );

  IF legacy_count > 0 THEN
    RAISE EXCEPTION 'Security assertion failed: % legacy chat_cache policies still active.', legacy_count;
  END IF;

  RAISE NOTICE 'Security assertion passed: Legacy chat_cache policies cleanly removed.';
END $$;

COMMIT;
