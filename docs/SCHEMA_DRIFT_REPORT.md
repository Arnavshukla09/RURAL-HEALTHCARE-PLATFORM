# Database Schema Drift & Historical In-Place Migration Edits Audit

- **Document Identifier:** SEC-2026-10-17-SCHEMA-DRIFT
- **Incident Reference:** SEC-2026-10-17-ROLE-TRUST
- **Classification:** Architectural & Database Engineering Report
- **Status:** Baseline Frozen & Immutability Enforced

---

## 1. Executive Summary & Root Cause Analysis

In database migration engines (including Supabase CLI, Flyway, Liquibase, and Prisma), migration scripts are intended to be **strictly immutable and append-only**. When a migration script is modified in-place after being executed in any remote or local environment:
1. Environments that applied the migration at timestamp $T_1$ possess a schema state differing from environments applying the modified script at timestamp $T_2$.
2. Migration checksum verifications fail (or are bypassed), creating untracked schema drift.
3. Rollbacks and reproducible database resets produce diverging states.

During the security audit following commit `332c5fc`, investigation revealed that several historical migration scripts dating back to July 2026 (`20260701` through `20260706`) were modified in-place across several commits between `332c5fc` and `50e3376`.

This report documents the exact historical modifications, establishes the cryptographic baseline manifest (`supabase/migrations.sha256`), and introduces the automated immutability gate (`scripts/check_migration_immutability.mjs`) to permanently prevent future in-place edits.

---

## 2. Historical In-Place Edits Diff Table

The following table catalogs the in-place modifications made to baseline migration scripts:

| Migration Script | Commit SHA | Date | Summary of In-Place Edit | Schema Drift & Security Risk |
| :--- | :---: | :---: | :--- | :--- |
| `20260701000000_core_schema.sql` | `332c5fc` | 2026-10-17 | Injected demo user constraints, added `user_id` relations to `healthcare_providers`, and modified column defaults. | Production instances provisioned prior to October 2026 lacked these table constraints unless manually reconciled. |
| `20260702000000_functions_triggers.sql` | `332c5fc` | 2026-10-17 | Modified `public.handle_new_user()` and `public.get_user_role()` function bodies directly in the initial function setup script. | Allowed user metadata to be read on initial account creation, introducing privilege escalation vectors into historical setup scripts. |
| `20260703000000_rls_policies.sql` | `332c5fc` | 2026-10-17 | Replaced baseline `patients_read_own_appointments` and `doctor_read_all_appointments` with complex care-relationship subqueries. | Created circular dependency during initial local stack bootstrap before subsequent helper functions existed. |
| `20260703000000_rls_policies.sql` | `8dd07ac` | 2026-10-17 | Reverted complex subqueries back to simpler baseline definitions (`auth.uid()` checks). | Demonstrated oscillation of baseline migration scripts; local developers had inconsistent policy definitions depending on checkout date. |
| `20260704000000_chat_cache.sql` | `332c5fc` | 2026-10-17 | Changed `chat_cache` RLS policies to check `(SELECT public.get_user_role())`. | Introduced dependency on function behavior that had been altered in earlier files. |
| `20260705000000_security_patch.sql` | `332c5fc` | 2026-10-17 | Altered `health_data` policies and provider access rules in-place. | Modified security patch behavior post-release. |
| `20260705000000_security_patch.sql` | `722e8c7` | 2026-10-17 | Added `DROP POLICY IF EXISTS "providers_admin_read_all"` and `DROP POLICY IF EXISTS "healthcare_providers_public_read"` into patch script. | Fixed missing drop statements by editing past migration instead of creating forward migration `20261017...`. |
| `20260706000000_security_warnings.sql` | `332c5fc` | 2026-10-17 | Modified search paths and permissions for helper functions. | Baseline security warning mitigations altered in-place. |
| `20260706000000_security_warnings.sql` | `25b05ac` | 2026-10-17 | Wrapped `ALTER FUNCTION public.audit_medical_records()` and `REVOKE` in `IF EXISTS (SELECT 1 FROM pg_proc ...)` PL/pgSQL blocks. | Fixed reset failure when `audit_medical_records` did not exist by editing the July 2026 file. |
| `20260706000000_security_warnings.sql` | `50e3376` | 2026-10-17 | Wrapped PostGIS `st_estimatedextent` function revokes and `spatial_ref_sys`, `geometry_columns` table revokes in conditional `DO $$` blocks. | Prevented CLI reset failures when PostGIS extension containers were disabled, but modified baseline file. |

---

## 3. Cryptographic Baseline Manifest (`supabase/migrations.sha256`)

To eliminate retroactive drift, the 16 historical migrations as of the hotfix branch base (`d1c19e3`) are cryptographically pinned in [`supabase/migrations.sha256`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/supabase/migrations.sha256):

```
780d9098f7ff489903bcac403e9c93d774bcaf9e385d8a1b0d7162d3ec6686ba  supabase/migrations/20260701000000_core_schema.sql
5529ab0b8a659371acb7e6b2446b33d5502e31e930c97426e23ce6926dd83646  supabase/migrations/20260702000000_functions_triggers.sql
071d8bb91d7a8c958d118a33e7ae56b41a6c5241723fd0a21e7bbd66c815021e  supabase/migrations/20260703000000_rls_policies.sql
108667cad48ba84041c89370b2d7cc1f09a488953c13e34889f459977a9caf4b  supabase/migrations/20260704000000_chat_cache.sql
0bd09b894e2248bf05a321f70ff82479837362abb8103876a1d9aac2b5f21305  supabase/migrations/20260705000000_security_patch.sql
08aa05ae6d9d8d651bc1dac943260734899abb3643c094fd21e927e35fd6b2a8  supabase/migrations/20260706000000_security_warnings.sql
9c193fb1b1caa26030031cb641b4f3c48da3476fbc2734065aaf186d196741d4  supabase/migrations/20260707000000_seed_camps.sql
d5d36fa54e532178fe66eb2d3fa87d8e929aa299212930e486dd9000f6bf3e52  supabase/migrations/20260708000000_fix_permissions.sql
47353c94e72f7259054920af5916490d45a3fff4ef6f4b7ae7b3e54b5c766871  supabase/migrations/20261011000000_scale_and_security.sql
ca8bb1fc2ec8e84ebea35741b7a20e7368a21d763da403b90c366d81707e824f  supabase/migrations/20261016000000_scope_doctor_access_and_audit.sql
9c3649be4a739430f6effdfa2ee6e0a8b8c79c9339e2ab49ece546f84952566c  supabase/migrations/20261017000000_provider_user_link.sql
c015639f71466f471843ff6f206d089d66fdbb9366ed06e303be4593e82f8f4f  supabase/migrations/20261017000100_care_relationship_fn.sql
9bab9bf87ddbfd51066b191b7f2b62475cba27d089f1aa01dc5ba13497254429  supabase/migrations/20261017000200_rebuild_rls_medical_records_patients.sql
de08ffb55d807e60d60f1656a337bb54a4f497c9feabe46d46fa7029aae2cb00  supabase/migrations/20261017000300_demo_guard_fix.sql
48ada349eb1d582e36d51eda4374a1004e6b44913f39f706bcf212618021ced5  supabase/migrations/20261017000400_access_audit_log_policies.sql
da9d92a827c9e18ca549400c410dd1a920bf8cf888461584365e923c51d381ae  supabase/migrations/20261017000500_comprehensive_security_and_rls_reconciliation.sql
```

---

## 4. Automated Immutability & Ordering Gate

The immutability gate is implemented in [`scripts/check_migration_immutability.mjs`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/scripts/check_migration_immutability.mjs) and enforced at two mandatory levels:
1. **Pre-commit Hook:** Runs automatically via `node scripts/check_components.mjs` (Step 6) before any commit can be created.
2. **CI Pipeline:** Runs automatically in job `test-and-build` via `npm run check:migrations`.

### Rules Enforced by the Gate:
1. **Zero Baseline Mutation:** If any of the 16 manifest files has a SHA-256 mismatch, the build fails immediately.
2. **Zero Baseline Deletion:** If any manifest file is renamed or deleted, the build fails immediately.
3. **Strict Forward-Only Timestamping:** Any new migration added to `supabase/migrations/` MUST have a 14-digit timestamp greater than or equal to `20261017000500`. Back-dated or inserted migrations fail immediately.

---

## 5. Architectural Protocols for Future Database Changes

1. **Never edit an existing migration file.** Once committed to `main` or released, migrations are permanent immutable records.
2. **Always create a new forward migration file.** Use `supabase migration new <name>` or generate a timestamped file `YYYYMMDDHHmmss_<description>.sql`.
3. **All corrective actions are forward-only.** If a past migration had a syntax error, bug, or missing DROP policy, create a forward migration that issues the necessary `ALTER`, `DROP`, or `CREATE` statements.
4. **Idempotency in migrations:** Use `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, and conditional blocks `IF EXISTS (...)` to ensure forward migrations apply cleanly on both pristine databases and drifted instances.

---

## 6. Production Database Reconciliation Evidence (`boyzdmlvzvcplzolenef`)

On 2026-10-17, live inspection of production Supabase database `boyzdmlvzvcplzolenef` revealed historical schema and policy divergence:
- Only migrations `20260701000000` and `20260702000000` were tracked in `supabase_migrations.schema_migrations`.
- Legacy permissive policies remained active (e.g., `doctor_read_all_medical_records`, `authenticated_insert_providers`, `Users can insert payments`).
- Legacy diagnostic function `public.get_tables()` remained accessible.

### Reconciliation Execution:
1. Applied forward reconciliation migration [`20261018000200_reconcile_security_state.sql`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/supabase/migrations/20261018000200_reconcile_security_state.sql).
2. Completely dropped all legacy permissive policies and client metadata trust paths.
3. Dropped schema enumeration function `public.get_tables()`.
4. Removed redundant indexes (`patients_user_id_unique`, `idx_appointments_patient`, `idx_medical_records_patient`, etc.).
5. Synchronized `supabase_migrations.schema_migrations` tracking table to version `20261018000200`.

### Current Verification Status:
- `npx supabase migration list --project-ref boyzdmlvzvcplzolenef`: **All 19 migrations synchronized (local == remote)**.
- Query for policies with `user_metadata`: **0 rows (completely eliminated)**.
- Supabase Security Advisors: **0 critical findings, 0 duplicate index warnings**.
- Schema Drift Status: **RESOLVED & ZERO DRIFT CONFIRMED**.

