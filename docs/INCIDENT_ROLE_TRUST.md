# Security Incident Report: User-Controlled Role Privilege Escalation

- **Incident Identifier:** SEC-2026-10-17-ROLE-TRUST
- **Date Reported:** October 17, 2026
- **Severity:** P0 / Critical (Privilege Escalation & Unauthorized Access)
- **Status:** Triage In Progress (Step 0)
- **Branch:** `hotfix/role-trust`

---

## 1. Incident Summary & What Was Found

During review of commits following `332c5fc` on branch `main` (`@d1c19e3`), an external security audit identified that database functions, triggers, and Row-Level Security (RLS) policies were modified to trust user-writable metadata:

1. **`public.get_user_role()` Fallback Order Vulnerability:**
   In migration `20261017000500_comprehensive_security_and_rls_reconciliation.sql`, `get_user_role()` was redefined to read:
   `auth.jwt()->'user_metadata'->>'role'`, followed by `app_metadata`, then `patients.role`.
   Because `user_metadata` is writable by the client via `supabase.auth.updateUser({ data: { role: 'admin' } })`, any authenticated user could elevate their effective privileges to `admin` or `doctor` in all RLS policies invoking `get_user_role()`.

2. **`public.handle_new_user()` Signup Privilege Escalation:**
   The same migration changed `handle_new_user()` to insert:
   `COALESCE(new.raw_user_meta_data->>'role', 'patient')` into `patients.role`.
   Because `guard_patient_privileges()` bypasses role enforcement when `auth.uid() IS NULL` (during initial signup trigger execution), an unauthenticated attacker could register directly as `admin` or `doctor` by supplying `{ "role": "admin" }` in the public signup metadata payload.

3. **RLS Policy Direct Metadata Comparisons:**
   Policies in `20261017000200_rebuild_rls_medical_records_patients.sql` and `20261017000500_comprehensive_security_and_rls_reconciliation.sql` incorporated explicit checks against `(auth.jwt()->'user_metadata'->>'role') = 'admin'`.

4. **Medical Record Confidentiality Invariant Breach:**
   Policy `admin_select_moderation_medical_records` allowed `admin` role callers to `SELECT` rows where `record_type IN ('lab_report', 'other', 'moderation')` or where content contained `'disposable'` or `'erasure'`, violating the invariant that administrators must have zero direct `SELECT` access to clinical medical records.

5. **Test Fixture Role Reliance:**
   Integration tests (`tests/integration/rls-care-relationship.test.ts`) and seed scripts (`scripts/seed_e2e_users.js`) created fixture accounts with `user_metadata: { role }`, masking the flaw in test suites.

---

## 2. Scope & Investigation Queries (Step 0)

To determine whether the vulnerable migrations were applied to remote environments and whether any unauthorized role escalation occurred, the following audit queries are executed on production and staging databases:

```sql
-- 1. Identify all users holding elevated roles (admin or doctor) in public.patients
select user_id, email, role, created_at from public.patients
where role in ('admin','doctor') order by created_at desc;

-- 2. Identify all auth accounts with 'role' set in client-controlled raw_user_meta_data
select id, email, created_at, raw_user_meta_data->>'role' as meta_role,
       raw_app_meta_data->>'role' as app_role
from auth.users
where raw_user_meta_data ? 'role' order by created_at desc;

-- 3. Verify the live definition of public.get_user_role()
select pg_get_functiondef('public.get_user_role()'::regprocedure);

-- 4. Verify the live definition of public.handle_new_user()
select pg_get_functiondef('public.handle_new_user()'::regprocedure);

-- 5. Detect any public policies querying user_metadata
select tablename, policyname, cmd from pg_policies
where schemaname='public' and (qual ilike '%user_metadata%' or with_check ilike '%user_metadata%');
```

---

## 3. Triage Results (Pending User Output)

- **Production Migration State (`20261017000200` & `20261017000500` applied?):** *Awaiting confirmation from database administrator.*
- **Unrecognized Admin/Doctor Profiles:** *Pending query 1 output.*
- **Non-Patient `meta_role` Accounts:** *Pending query 2 output.*
- **Live Function Definitions:** *Pending queries 3 & 4 output.*
- **Live Policies with `user_metadata`:** *Pending query 5 output.*

---

## 4. Remediation Progress

### Step 1: Fix the Role Source (`20261018000000_role_source_hotfix.sql`) - COMPLETED
- **`public.get_user_role()`:** Redefined with body strictly querying `SELECT p.role FROM public.patients p WHERE p.user_id = (SELECT auth.uid()) LIMIT 1;`. All metadata paths removed. Returns NULL when no row exists.
- **`public.get_current_user_role()`:** Wraps `get_user_role()`.
- **`public.handle_new_user()`:** Inserts `role = 'patient'` unconditionally on auth signup. Metadata role ignored completely. Uses `ON CONFLICT (user_id) DO NOTHING`.
- **`public.guard_patient_privileges()`:** Removed blind `auth.uid() IS NULL` bypass on INSERT. Inserting a non-patient role strictly requires caller JWT role claim to be `service_role` or the caller to be a verified administrator.
- **Policies Dropped & Recreated:**
  - `healthcare_providers.providers_admin_insert`: Recreated with `WITH CHECK ((SELECT public.get_user_role()) = 'admin')`.
  - `patients.patients_admin_select`: Recreated with `USING ((SELECT public.get_user_role()) = 'admin')`.
  - `patients.patients_admin_delete`: Recreated with `USING ((SELECT public.get_user_role()) = 'admin')`.
  - `chat_cache.chat_cache_select_verified`: Recreated with `USING ((SELECT public.get_user_role()) IN ('admin', 'doctor'))`.
  - `chat_cache.chat_cache_update_verified`: Recreated with `USING ((SELECT public.get_user_role()) IN ('admin', 'doctor')) WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'doctor'))`.
  - `medical_records.admin_select_moderation_medical_records`: Permanently dropped.
  - `medical_records.admin_delete_medical_records`: Permanently dropped.
- **Application Endpoints Updated:**
  - `app/api/auth/login/route.ts`: Removed `user_metadata?.role` fallback. Role resolved strictly from database `patients.role`.
  - `components/Authentication.tsx`: Removed `role: "patient"` from client signup `options.data`.

### Step 2: Replace Admin Moderation Hack with Audited Function - PENDING
- Implement `public.admin_erase_medical_record(p_record_id uuid, p_reason text)`.
- Expose admin erasure endpoint with session client.

### Step 3: Test Fixtures & Mutation Proofs - PENDING
- Update fixtures to use service role database insertions.
- Add 6 automated security tests with documented mutation proofs.

