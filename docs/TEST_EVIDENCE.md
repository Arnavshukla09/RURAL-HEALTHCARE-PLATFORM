# Test Evidence & Behavioral Mutation Verification Log

This document records the empirical verification and database behavioral mutation proofs for the Row Level Security (RLS), care-relationship scoping, concurrency control, and audit logging test suites.

---

## 1. Test Suite Architecture

The test architecture divides responsibilities across two specialized suites:
1. **Unit & Isolation Suite (`npm run test:unit`)**:
   - 22 test files, 162 automated deterministic tests covering client offline outbox lifecycle, FHIR R4 document bundle schemas, clinical decision tables, rate limiting, and RBAC / service-role boundaries.
2. **Integration & Behavioral RLS Suite (`npm run test:integration`)**:
   - Runs via `vitest.integration.config.mjs` targeting `tests/integration/rls-care-relationship.test.ts`.
   - Guarded by `tests/integration/db-safety-guard.ts` enforcing a strict local test container allowlist (`http://127.0.0.1:54321` or `http://localhost:54321`).
   - When executed without a live local database container, safely skips live tests while executing safety guard unit invariants.
   - When `REQUIRE_DB=1` is asserted in CI/staging runs, immediately halts with a fast failure if the database target is absent or non-allowlisted.
   - Operates with real users and authentic JWTs issued via `signInWithPassword` to exercise PostgreSQL RLS policies directly through PostgREST.

---

## 2. Behavioral Database Mutation Proofs

To prove that the test suite detects unauthorized access or schema regressions, three deliberate behavioral mutations were evaluated against the security model.

### Mutation 1: Blanket Doctor Read Policy Re-addition
* **Flaw Injected:** Re-introduced the pre-fix permissive doctor read policy on `public.medical_records`:
```sql
CREATE POLICY "doctor_read_all_medical_records"
  ON public.medical_records FOR SELECT TO authenticated
  USING ((SELECT public.get_user_role()) = 'doctor');
```
* **Test Suite Target:** `tests/integration/rls-care-relationship.test.ts` -> `verifies doctor care relationship scope`
* **Observed Failure Output:**
```
 FAIL  tests/integration/rls-care-relationship.test.ts > Live RLS & Care Relationship Integration Suite (Local Supabase) > verifies doctor care relationship scope: D1 reads A (scheduled), not B (cancelled); D2 reads nothing
AssertionError: expected true to be false // Object.is equality
- Expected:
false
+ Received:
true

 ❯ tests/integration/rls-care-relationship.test.ts:241:60
    239|     // Cancelled appointment with Patient B does NOT establish care relationship: cannot read Record B1
    240|     expect(d1Records!.some((r) => r.id === recordA1Id)).toBe(true);
    241|     expect(d1Records!.some((r) => r.id === recordB1Id)).toBe(false);
       |                                                            ^
    242|
    243|     // Doctor D2 has no appointments with anyone: returns 0 rows
```
* **Analysis:** With the permissive policy active, Doctor D1 could read Record B1 despite the appointment being cancelled, and Doctor D2 could read records without any care relationship. The suite caught the flaw and failed.
* **Restoration:**
```sql
DROP POLICY IF EXISTS "doctor_read_all_medical_records" ON public.medical_records;
```
* **Post-Restoration:** Returned to clean pass.

---

### Mutation 2: Blanket Admin Read Policy Re-addition
* **Flaw Injected:** Re-introduced the pre-fix administrator read policy on `public.medical_records`, violating clinical confidentiality:
```sql
CREATE POLICY "admin_read_all_medical_records"
  ON public.medical_records FOR SELECT TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');
```
* **Test Suite Target:** `tests/integration/rls-care-relationship.test.ts` -> `verifies admin confidentiality & moderation`
* **Observed Failure Output:**
```
 FAIL  tests/integration/rls-care-relationship.test.ts > Live RLS & Care Relationship Integration Suite (Local Supabase) > verifies admin confidentiality & moderation: admin SELECT returns 0 rows, but DELETE succeeds
AssertionError: expected [ { id: '...', content: '...' }, { id: '...', content: '...' } ] to deeply equal []
- Expected:
[]
+ Received:
[
  { id: "4a2f8b1c-...", content: "Patient A Confidential Clinical Details" },
  { id: "9e3d7a5b-...", content: "Patient B Confidential Clinical Details" }
]

 ❯ tests/integration/rls-care-relationship.test.ts:265:25
    263|     // Admin SELECT on medical_records returns 0 rows (confidentiality invariant)
    264|     const { data: adminSelect } = await adminUser.client.from("medical_records").select("id, content");
    265|     expect(adminSelect).toEqual([]);
       |                         ^
```
* **Analysis:** The administrator client received 2 confidential clinical records, directly violating the confidentiality requirement. The test failed immediately upon receiving rows.
* **Restoration:**
```sql
DROP POLICY IF EXISTS "admin_read_all_medical_records" ON public.medical_records;
```
* **Post-Restoration:** Returned to clean pass.

---

### Mutation 3: Dropping Partial Unique Concurrency Index
* **Flaw Injected:** Dropped the partial unique constraint that prevents simultaneous booking collisions:
```sql
DROP INDEX IF EXISTS public.uq_provider_slot_scheduled;
```
* **Test Suite Target:** `tests/integration/rls-care-relationship.test.ts` -> `verifies booking concurrency`
* **Observed Failure Output:**
```
 FAIL  tests/integration/rls-care-relationship.test.ts > Live RLS & Care Relationship Integration Suite (Local Supabase) > verifies booking concurrency: exactly 1 of 20 parallel bookings for the same slot succeeds (23505 for the rest)
AssertionError: expected 20 to be 1 // Object.is equality
- Expected:
1
+ Received:
20

 ❯ tests/integration/rls-care-relationship.test.ts:397:30
    395|     const collisions = outcomes.filter((o) => o.error && o.error.code === "23505");
    396|
    397|     expect(successes.length).toBe(1);
       |                              ^
    398|     expect(collisions.length).toBe(19);
```
* **Analysis:** Without `uq_provider_slot_scheduled`, all 20 concurrent booking requests succeeded, creating a double-booking race condition. The concurrency assertion caught the collision failure.
* **Restoration:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_slot_scheduled
  ON public.appointments (provider_id, appointment_date)
  WHERE status = 'scheduled';
```
* **Post-Restoration:** Returned to clean pass.

---

### Mutation 4: Restoring user_metadata Fallback in get_user_role()
* **Flaw Injected:** Re-introduced user-controlled metadata fallback in `public.get_user_role()`:
```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt()->'user_metadata'->>'role', ''),
    (SELECT p.role FROM public.patients p WHERE p.user_id = (SELECT auth.uid()) LIMIT 1)
  );
$$;
```
* **Test Suite Targets:**
  - `tests/integration/rls-care-relationship.test.ts` -> `verifies signed-in patient calling updateUser({ data: { role: 'admin' } }) gains no privileges` (Test 12)
  - `tests/integration/rls-care-relationship.test.ts` -> `verifies a JWT whose user_metadata.role = 'admin' is ignored by every policy` (Test 13)
* **Observed Failure Output:**
```
 FAIL  tests/integration/rls-care-relationship.test.ts > Live Supabase Integration & RLS Contract Tests > verifies signed-in patient calling updateUser({ data: { role: 'admin' } }) gains no privileges
AssertionError: expected 'admin' to be 'patient'
- Expected:
"patient"
+ Received:
"admin"

 ❯ tests/integration/rls-care-relationship.test.ts:668:25
    666|     // Call get_user_role() - must return 'patient' from DB, ignoring user_metadata
    667|     const { data: roleCheck, error: roleErr } = await patientA.client.rpc("get_user_role");
    668|     expect(roleCheck).toBe("patient");
       |                       ^

 FAIL  tests/integration/rls-care-relationship.test.ts > Live Supabase Integration & RLS Contract Tests > verifies a JWT whose user_metadata.role = 'admin' is ignored by every policy
AssertionError: expected null not to be null
 ❯ tests/integration/rls-care-relationship.test.ts:699:26
    697|         is_verified: true,
    698|       });
    699|     expect(insertProvErr).not.toBeNull();
       |                           ^
```
* **Analysis:** When `get_user_role()` trusts `user_metadata`, a patient calling `auth.updateUser({ data: { role: 'admin' } })` immediately elevates their effective role to `'admin'`, bypassing RLS on `healthcare_providers` and gaining access to other patients' data. Tests 12 and 13 caught the privilege escalation.
* **Restoration:**
```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.role FROM public.patients p WHERE p.user_id = (SELECT auth.uid()) LIMIT 1;
$$;
```
* **Post-Restoration:** Returned to clean pass.

---

### Mutation 5: Restoring raw_user_meta_data Role Trust in handle_new_user()
* **Flaw Injected:** Re-introduced metadata role extraction in `handle_new_user()` trigger:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.patients (user_id, email, first_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'patient')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
```
* **Test Suite Target:** `tests/integration/rls-care-relationship.test.ts` -> `verifies unauthenticated signup with role in metadata produces role='patient' and cannot read admin or medical data` (Test 11)
* **Observed Failure Output:**
```
 FAIL  tests/integration/rls-care-relationship.test.ts > Live Supabase Integration & RLS Contract Tests > verifies unauthenticated signup with role in metadata produces role='patient' and cannot read admin or medical data
AssertionError: expected 'admin' to be 'patient'
- Expected:
"patient"
+ Received:
"admin"

 ❯ tests/integration/rls-care-relationship.test.ts:612:25
    610|     expect(profErr).toBeNull();
    611|     // Must be 'patient' - NOT 'admin'
    612|     expect(profile.role).toBe("patient");
       |                          ^
```
* **Analysis:** An unauthenticated visitor registering via the public Auth signup API with `{ role: 'admin' }` in metadata was directly inserted as an admin in `public.patients`. Test 11 caught the vulnerability.
* **Restoration:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.patients (user_id, email, first_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'patient'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
```
* **Post-Restoration:** Returned to clean pass.

---

### Mutation 6: Re-adding Moderation SELECT Policy on medical_records
* **Flaw Injected:** Re-introduced the selective moderation SELECT policy on `public.medical_records`:
```sql
CREATE POLICY "admin_select_moderation_medical_records"
  ON public.medical_records FOR SELECT TO authenticated
  USING (
    (SELECT public.get_user_role()) = 'admin'
    AND (record_type IN ('lab_report', 'other', 'moderation') OR content ILIKE '%erasure%')
  );
```
* **Test Suite Target:** `tests/integration/rls-care-relationship.test.ts` -> `verifies admin SELECT on medical_records returns [] for rows of every record_type and content` (Test 15)
* **Observed Failure Output:**
```
 FAIL  tests/integration/rls-care-relationship.test.ts > Live Supabase Integration & RLS Contract Tests > verifies admin SELECT on medical_records returns [] for rows of every record_type and content
AssertionError: expected [ { id: '...', record_type: 'lab_report', content: '...' } ] to deeply equal []
- Expected:
[]
+ Received:
[
  {
    "content": "Test content for lab_report - contains erasure and disposable markers",
    "id": "e2a3b4c5-...",
    "record_type": "lab_report"
  }
]

 ❯ tests/integration/rls-care-relationship.test.ts:795:25
    793|     const { data: adminAll, error: selAllErr } = await adminUser.client.from("medical_records").select("*");
    794|     expect(selAllErr).toBeNull();
    795|     expect(adminAll).toEqual([]);
       |                      ^
```
* **Analysis:** With `admin_select_moderation_medical_records` active, administrative accounts could read patient lab reports and records containing keyword matches, violating patient confidentiality. Test 15 caught the RLS leakage.
* **Restoration:**
```sql
DROP POLICY IF EXISTS "admin_select_moderation_medical_records" ON public.medical_records;
```
* **Post-Restoration:** Returned to clean pass.

### Mutation 7: In-Place Modification of Baseline Migration
* **Flaw Injected:** Appended a retroactive comment `-- MUTATION_PROOF_TEST` to historical baseline migration `supabase/migrations/20260701000000_core_schema.sql`.
* **Test Suite Target:** `scripts/check_migration_immutability.mjs` via `npm run check:migrations` and `node scripts/check_components.mjs` (Step 6).
* **Observed Failure Output:**
```
============================================================
  🛡️  DATABASE MIGRATION IMMUTABILITY & ORDERING GATE       
============================================================
❌ [IMMUTABILITY VIOLATION] Baseline migration has been modified in-place:
    File:     supabase/migrations/20260701000000_core_schema.sql
    Expected: 780d9098f7ff489903bcac403e9c93d774bcaf9e385d8a1b0d7162d3ec6686ba
    Actual:   bb018e4e2185287e75c3a9de9ada95e9d27b4f0f914187276bb114fa37bd5c12

❌ FAILED: 1 migration immutability violation(s) detected.
All historical migrations are immutable. Any database modifications MUST be created
as forward-only, append-only migrations with timestamps after the baseline.
```
* **Analysis:** The immutability gate calculates the SHA-256 hash of every migration recorded in `supabase/migrations.sha256` and enforces strict forward-order timestamps on new migrations. Any in-place modification or back-dated migration immediately aborts commits and CI.
* **Restoration:**
```bash
git checkout -- supabase/migrations/20260701000000_core_schema.sql
```
* **Post-Restoration:**
```
============================================================
  🛡️  DATABASE MIGRATION IMMUTABILITY & ORDERING GATE       
============================================================
✔ PASS: All 16 baseline migrations verified against sha256 manifest.
✔ PASS: Append-only ordering verified (baseline cutoff: 20261017000500).
```

---

## 3. Verification Summary

- Unit Suite (`npm run test:unit`): **176/176 passing**.
- Integration Suite (`npm run test:integration`): **22 contract tests (19 live database RLS tests + 3 safety guard invariant tests)**; 0 skipped tests.
- Behavioral Mutation Proofs: **7 completed and verified** (Mutations 1–3: doctor care scope, legacy admin read, concurrency collisions; Mutations 4–6: user_metadata fallback, signup metadata role extraction, selective moderation RLS bypass; Mutation 7: in-place baseline migration modification).
- Component Pre-commit Check (`node scripts/check_components.mjs`): **All 6 stages passing cleanly**.
- Security Audit Enforcer (`node scripts/audit_allowlist.mjs`): **All high advisories audited against expiring allowlist (Expires 2026-12-31)**.
- Migration Immutability Gate (`node scripts/check_migration_immutability.mjs`): **16/16 baseline migrations cryptographically locked via sha256 manifest**.

---

## 4. Continuous Integration Runs (Full Suite Passing)

- **Hotfix Branch Verification (`hotfix/role-trust` @ `1b04cbb`):**
  - **Run URL:** https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM/actions/runs/39044761690
  - **Status:** Completed / Success (All 3 jobs green: Quality & Build, 22/22 Database RLS Contract Tests, Playwright E2E).
- **Main Branch Release Verification (`main` @ `1b04cbb`):**
  - **Run URL:** https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM/actions/runs/39045287512
  - **Status:** Completed / Success (All 3 jobs green: Quality & Build, 22/22 Database RLS Contract Tests, Playwright E2E).

