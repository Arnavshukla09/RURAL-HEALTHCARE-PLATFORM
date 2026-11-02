-- ============================================================================
-- seed_staging.sql  —  synthetic data for LOAD TESTING
--
--   !!  RUN ONLY ON A SEPARATE STAGING SUPABASE PROJECT  !!
--   !!  NEVER ON PRODUCTION. It inserts directly into auth.users.  !!
--
-- Creates (defaults, edit the constants below):
--   10,000 users (auth.users + auth.identities + patients via your trigger)
--      200 providers (healthcare_providers)
--   50,000 appointments, 100,000 medical records, 20,000 notifications
--
-- All synthetic rows are recognisable and removable:
--   users     loadtest+000001@loadtest.example.com ... (password below)
--   providers loadtest-doc-0001@loadtest.example.com ...
--   cleanup:  seed/cleanup_staging.sql
--
-- Start small (users = 1000) to check it works, then scale up.
-- The same bcrypt hash is reused for every user so the seed stays fast.
-- NOTE: written without a live Postgres to test on. Run on staging, run the
-- verification queries at the bottom, and log in ONE seeded user by hand
-- before trusting it.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $seed$
DECLARE
  -- >>> EDIT THESE <<<
  v_i_am_on_staging boolean := false;      -- set to true ONLY on the staging project
  v_users     int  := 10000;
  v_providers int  := 200;
  v_appts     int  := 50000;
  v_records   int  := 100000;
  v_notifs    int  := 20000;
  v_password  text := 'LoadTest#2026';     -- same for all synthetic users

  v_hash      text;
  v_patient_ids  uuid[];
  v_provider_ids uuid[];
  v_np int;
  v_nd int;
BEGIN
  IF NOT v_i_am_on_staging THEN
    RAISE EXCEPTION 'Refusing to run: set v_i_am_on_staging := true, and only on the STAGING project.';
  END IF;

  v_hash := crypt(v_password, gen_salt('bf', 6));

  -- 1. Auth users (your on_auth_user_created trigger creates the patients rows)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  SELECT
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'loadtest+' || lpad(g::text, 6, '0') || '@loadtest.example.com',
    v_hash, now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Load Test ' || g, 'loadtest', true),
    now(), now(), '', '', '', ''
  FROM generate_series(1, v_users) AS g
  ON CONFLICT DO NOTHING;

  -- 2. Identities (needed for email+password sign-in)
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), u.id, u.id::text,
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
         'email', now(), now(), now()
  FROM auth.users u
  WHERE u.email LIKE 'loadtest+%@loadtest.example.com'
    AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email');

  -- 3. Make sure every synthetic user has exactly one patients row, then fill it in
  INSERT INTO public.patients (user_id, email, first_name, last_name, role)
  SELECT u.id, u.email, 'Load', 'Test', 'patient'
  FROM auth.users u
  WHERE u.email LIKE 'loadtest+%@loadtest.example.com'
    AND NOT EXISTS (SELECT 1 FROM public.patients p WHERE p.user_id = u.id);

  UPDATE public.patients p SET
    first_name = 'Load',
    last_name  = 'Test',
    phone      = '9' || lpad((floor(random() * 1e9))::bigint::text, 9, '0'),
    gender     = (ARRAY['male','female','other'])[1 + floor(random()*3)::int],
    date_of_birth = (date '1950-01-01' + (floor(random() * 25000))::int),
    address    = 'Village ' || (1 + floor(random()*500))::int || ', Madhya Pradesh'
  WHERE p.email LIKE 'loadtest+%@loadtest.example.com';

  -- make ~1% of synthetic users doctors (trigger allows this: no end-user JWT here)
  UPDATE public.patients SET role = 'doctor'
  WHERE email LIKE 'loadtest+%@loadtest.example.com'
    AND (hashtext(email) % 100) = 0;

  -- 4. Providers
  INSERT INTO public.healthcare_providers (name, email, phone, location, specialization, bio, is_verified)
  SELECT
    'Dr. Load Test ' || g,
    'loadtest-doc-' || lpad(g::text, 4, '0') || '@loadtest.example.com',
    '8' || lpad((floor(random() * 1e9))::bigint::text, 9, '0'),
    (ARRAY['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Rewa','Satna'])[1 + floor(random()*8)::int],
    (ARRAY['General Physician','Pediatrics','Gynecology','Cardiology','Orthopedics','Dermatology','ENT','Psychiatry'])[1 + floor(random()*8)::int],
    'Synthetic provider for load testing.',
    true
  FROM generate_series(1, v_providers) AS g
  WHERE NOT EXISTS (
    SELECT 1 FROM public.healthcare_providers hp
    WHERE hp.email = 'loadtest-doc-' || lpad(g::text, 4, '0') || '@loadtest.example.com'
  );

  SELECT array_agg(id) INTO v_patient_ids  FROM public.patients            WHERE email LIKE 'loadtest+%@loadtest.example.com';
  SELECT array_agg(id) INTO v_provider_ids FROM public.healthcare_providers WHERE email LIKE 'loadtest-doc-%@loadtest.example.com';
  v_np := array_length(v_patient_ids, 1);
  v_nd := array_length(v_provider_ids, 1);

  IF v_np IS NULL OR v_nd IS NULL THEN
    RAISE EXCEPTION 'No synthetic patients/providers were created; check the trigger and constraints.';
  END IF;

  -- 5. Appointments (random time with microseconds so the unique slot index is not hit)
  INSERT INTO public.appointments (patient_id, provider_id, appointment_date, status, notes, teleconsult_room_id)
  SELECT
    v_patient_ids[1 + floor(random() * v_np)::int],
    v_provider_ids[1 + floor(random() * v_nd)::int],
    now() + ((random() * 120 - 60) * interval '1 day'),
    (ARRAY['scheduled','scheduled','completed','cancelled'])[1 + floor(random()*4)::int],
    'synthetic',
    'lt-' || md5(random()::text || g::text)
  FROM generate_series(1, v_appts) AS g;

  -- 6. Medical records
  INSERT INTO public.medical_records (patient_id, provider_id, record_type, content)
  SELECT
    v_patient_ids[1 + floor(random() * v_np)::int],
    v_provider_ids[1 + floor(random() * v_nd)::int],
    (ARRAY['diagnosis','prescription','lab_report','vaccination','note'])[1 + floor(random()*5)::int],
    'Synthetic record ' || g || ': ' || repeat(md5(random()::text), 6)
  FROM generate_series(1, v_records) AS g;

  -- 7. Notifications: a few broadcasts, a few role-wide, the rest individual
  INSERT INTO public.notifications (title, message, type, recipient_type, recipient_role, recipient_id, is_read)
  SELECT 'Synthetic broadcast ' || g, 'Load test broadcast', 'info', 'all', NULL, NULL, false
  FROM generate_series(1, 5) AS g;

  INSERT INTO public.notifications (title, message, type, recipient_type, recipient_role, recipient_id, is_read)
  SELECT 'Synthetic doctor notice ' || g, 'Load test role notice', 'info', 'role', 'doctor', NULL, false
  FROM generate_series(1, 5) AS g;

  INSERT INTO public.notifications (title, message, type, recipient_type, recipient_role, recipient_id, is_read)
  SELECT
    'Synthetic notice ' || g, 'Load test individual notice',
    (ARRAY['info','warning','success'])[1 + floor(random()*3)::int],
    'individual', NULL,
    v_patient_ids[1 + floor(random() * v_np)::int],
    (random() < 0.5)
  FROM generate_series(1, v_notifs) AS g;

  RAISE NOTICE 'Seed complete: % patients, % providers', v_np, v_nd;
END
$seed$;

ANALYZE;

-- ---------------------------------------------------------------------------
-- Verification (run these after the seed)
-- ---------------------------------------------------------------------------
SELECT 'auth.users'          AS t, count(*) FROM auth.users              WHERE email LIKE 'loadtest+%@loadtest.example.com'
UNION ALL SELECT 'auth.identities',    count(*) FROM auth.identities     WHERE identity_data->>'email' LIKE 'loadtest+%@loadtest.example.com'
UNION ALL SELECT 'patients',           count(*) FROM public.patients     WHERE email LIKE 'loadtest+%@loadtest.example.com'
UNION ALL SELECT 'doctors (patients)', count(*) FROM public.patients     WHERE email LIKE 'loadtest+%@loadtest.example.com' AND role = 'doctor'
UNION ALL SELECT 'providers',          count(*) FROM public.healthcare_providers WHERE email LIKE 'loadtest-doc-%@loadtest.example.com'
UNION ALL SELECT 'appointments',       count(*) FROM public.appointments WHERE notes = 'synthetic'
UNION ALL SELECT 'medical_records',    count(*) FROM public.medical_records WHERE content LIKE 'Synthetic record %'
UNION ALL SELECT 'notifications',      count(*) FROM public.notifications WHERE title LIKE 'Synthetic %';
