# Rollout & Execution Runbook — Provider Foreign Key Alignment (Task 1)

This runbook safely aligns the production foreign keys (`appointments.provider_id` and `medical_records.provider_id`) with `public.healthcare_providers`.

---

## 1. Pre-Change Data Export Queries
Run each in the **Supabase Dashboard SQL Editor** and download/save the output CSV as a point-in-time backup:

```sql
-- 1. Appointments Backup (6 rows)
SELECT * FROM public.appointments ORDER BY id;

-- 2. Medical Records with Provider References (8 rows)
SELECT * FROM public.medical_records WHERE provider_id IS NOT NULL ORDER BY id;

-- 3. Providers Table Backup (2 rows)
SELECT * FROM public.providers ORDER BY id;

-- 4. Healthcare Providers Backup (27 rows)
SELECT * FROM public.healthcare_providers ORDER BY id;
```

---

## 2. Dry-Run Analysis for the 2 Doctors in Patients
Running the following diagnostic reveals how the doctors map:
```sql
SELECT 
  p.id as patient_row_id,
  p.user_id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  prov.id as provider_id,
  hp.id as healthcare_provider_id
FROM public.patients p
LEFT JOIN public.providers prov ON p.user_id = prov.user_id
LEFT JOIN public.healthcare_providers hp ON p.user_id = hp.user_id
WHERE p.role = 'doctor';
```

**Diagnostic Result:**
1. `doctor@ruralhealth.com` (`Dr. Rajesh Kumar`, user_id: `9b577f26-0473-4a08-9bd3-3ab94eddf42b`):
   - Has `providers` row `059a47e9-d3e6-46e4-a6c1-0f021d6132dd`.
   - Has directory entry in `healthcare_providers` (`3426d589-0c5e-4220-b92d-74142718a10d`) with email `dr.rajesh@ruralhealth.com`.
   - Migration `20261021000000` copies `059a47e9-...` into `healthcare_providers` with `user_id = 9b577f26-...` and email `doctor@ruralhealth.com`.
2. `doctor@ruralhealth.demo` (`Dr. Arjun Mehta`, user_id: `9de41e70-4998-4f70-b954-11069b567ef6`):
   - Currently has NO `providers` row and NO directory row.
   - We do not fabricate or auto-link. They can claim a profile via `/doctor/claim` or admin link.

---

## 3. Migration Application
Run the contents of `supabase/migrations/20261021000000_align_provider_fks.sql` in the **Supabase Dashboard SQL Editor**.

The script runs inside an explicit `BEGIN ... COMMIT` transaction with automated pre-checks and post-checks that will automatically abort and roll back if any orphan row is detected.

---

## 4. Post-Migration Verification Queries
Run this verification block in the SQL Editor immediately after applying:

```sql
-- VERIFICATION CHECKLIST
SELECT 
  -- 1. Check foreign key targets
  (SELECT count(*) FROM information_schema.referential_constraints 
   WHERE constraint_name IN ('appointments_provider_id_fkey', 'medical_records_provider_id_fkey')
     AND unique_constraint_name LIKE '%healthcare_providers%') = 2 AS fks_target_healthcare_providers,
  
  -- 2. Verify 0 orphan appointments
  (SELECT count(*) FROM public.appointments a 
   LEFT JOIN public.healthcare_providers hp ON a.provider_id = hp.id 
   WHERE hp.id IS NULL) = 0 AS zero_orphan_appointments,

  -- 3. Verify 0 orphan medical records
  (SELECT count(*) FROM public.medical_records m 
   LEFT JOIN public.healthcare_providers hp ON m.provider_id = hp.id 
   WHERE m.provider_id IS NOT NULL AND hp.id IS NULL) = 0 AS zero_orphan_records,

  -- 4. Test has_care_relationship() for Dr. Rajesh Kumar
  public.has_care_relationship('a73fb546-358c-4d3e-96d3-fbf0add30a7c') AS care_rel_evaluates;
```

---

## 5. Live Smoke-Test Checklist
1. **Patient Directory Booking**:
   - Log in as patient, select any directory doctor from `/consultation` or `/appointments`.
   - Book a slot. Confirm the booking succeeds with no 23503 foreign key violation.
2. **Doctor Visibility**:
   - Log in as `doctor@ruralhealth.com`.
   - Open `/doctor/dashboard` and `/doctor/patients`.
   - Confirm patient records are visible and not empty.
3. **Unrelated Doctor Isolation**:
   - Log in as another doctor or test account.
   - Confirm they cannot access records of patients with whom they have no appointment.

---

## 6. Rollback SQL (If Needed)
If anything goes wrong, run this block to revert both foreign keys back to `public.providers`:

```sql
BEGIN;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_provider_id_fkey;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_provider_id_fkey
  FOREIGN KEY (provider_id)
  REFERENCES public.providers(id)
  ON DELETE CASCADE;

ALTER TABLE public.medical_records
  DROP CONSTRAINT IF EXISTS medical_records_provider_id_fkey;

ALTER TABLE public.medical_records
  ADD CONSTRAINT medical_records_provider_id_fkey
  FOREIGN KEY (provider_id)
  REFERENCES public.providers(id)
  ON DELETE CASCADE;

COMMIT;
```
*(Note: Rolling back restores FKs to `providers`. Any newly created appointment booked with a non-providers directory doctor during testing would need to be deleted before rollback can execute).*
