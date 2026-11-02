-- ============================================================================
-- cleanup_staging.sql — removes everything created by seed_staging.sql
-- Only touches rows with the synthetic markers. Run on STAGING.
-- ============================================================================

-- Deleting the auth users cascades to patients, then appointments,
-- medical_records and notifications (all have ON DELETE CASCADE to patients).
DELETE FROM auth.users
WHERE email LIKE 'loadtest+%@loadtest.example.com';

DELETE FROM public.healthcare_providers
WHERE email LIKE 'loadtest-doc-%@loadtest.example.com';

-- Broadcast / role notices have no recipient, so they do not cascade:
DELETE FROM public.notifications WHERE title LIKE 'Synthetic %';

-- Rows created by the load test itself (bookings made through the API):
DELETE FROM public.appointments WHERE notes LIKE 'loadtest%';

VACUUM ANALYZE;

SELECT 'remaining loadtest users' AS check, count(*)
FROM auth.users WHERE email LIKE 'loadtest+%@loadtest.example.com';
