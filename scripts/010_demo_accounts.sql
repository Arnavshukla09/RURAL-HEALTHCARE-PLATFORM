-- ============================================================
-- DEMO ACCOUNTS SETUP
-- Run this in Supabase SQL Editor AFTER manually creating the
-- accounts via the app signup OR Supabase Auth dashboard.
-- ============================================================

-- Step 1: Check existing patients
SELECT id, user_id, email, first_name, last_name, role FROM patients;

-- Step 2: Set demo doctor role
-- Replace the email below with the actual email you signed up with
UPDATE patients
SET role = 'doctor', first_name = 'Dr. Demo', last_name = 'Doctor'
WHERE email = 'doctor@ruralhealth.demo';

-- Step 3: Set demo admin role
UPDATE patients
SET role = 'admin', first_name = 'Demo', last_name = 'Admin'
WHERE email = 'admin@ruralhealth.demo';

-- Step 4: Verify roles
SELECT email, first_name, last_name, role FROM patients WHERE role IN ('doctor', 'admin');

-- Step 5: Seed demo appointments for the doctor to see
-- (Requires a patient_id — replace 'YOUR-PATIENT-ID' with a real UUID from the patients table)
-- INSERT INTO appointments (patient_id, appointment_date, status, notes, duration_minutes)
-- VALUES
--   ((SELECT id FROM patients WHERE role='patient' LIMIT 1), NOW() + INTERVAL '2 hours', 'scheduled', '[VIDEO — Dr. Demo Doctor, Demo Hospital] Headache and fever for 3 days', 30),
--   ((SELECT id FROM patients WHERE role='patient' LIMIT 1), NOW() + INTERVAL '1 day', 'scheduled', '[AUDIO — Dr. Demo Doctor, Demo Hospital] Follow-up for diabetes management', 30),
--   ((SELECT id FROM patients WHERE role='patient' LIMIT 1), NOW() - INTERVAL '1 day', 'completed', '[CHAT — Dr. Demo Doctor, Demo Hospital] Routine checkup', 30);
