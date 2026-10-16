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

## 3. Verification Summary

- Unit Suite (`npm run test:unit`): **162/162 passing**.
- Integration Suite (`npm run test:integration`): **Behavioral RLS suite with real JWTs**; safety guard invariant checks passing; fast-fail verified under `REQUIRE_DB=1`.
- Component Pre-commit Check (`node scripts/check_components.mjs`): **All 5 stages passing cleanly**.
- Security Audit Enforcer (`node scripts/audit_allowlist.mjs`): **All high advisories audited against expiring allowlist (Expires 2026-12-31)**.
