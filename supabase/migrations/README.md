# Supabase Migrations (`supabase/migrations/`)

This directory is the **single source of truth** for all database schema definitions and migrations, compatible with the standard **Supabase CLI** workflow (`supabase migration up`).

---

## 1. Sequence & History

The migrations reproduce the application's database evolution in chronological order:

| Timestamp | Migration File | Purpose |
|---|---|---|
| `20260701000000_core_schema.sql` | Core schema | Core tables: `patients`, `healthcare_providers`, `appointments`, `medical_records`, `notifications`, `camps`, `healthcare_facilities` (PostGIS). |
| `20260702000000_functions_triggers.sql` | Functions & triggers | Core functions, `handle_new_user()` trigger, and PostGIS RPC `nearby_facilities()`. |
| `20260703000000_rls_policies.sql` | Base RLS | Base Row-Level Security (RLS) policies for patient data isolation. |
| `20260704000000_chat_cache.sql` | Chat cache | Clinical review queue and response cache table. |
| `20260705000000_security_patch.sql` | Security patch | Hardened RLS policies, storage bucket lockdown, and RPC permission enforcement. |
| `20260706000000_security_warnings.sql` | Security advisor | Security advisor lint fixes and function search_path hardening. |
| `20260707000000_seed_camps.sql` | Seed camps | Seed data for initial rural medical camps in Madhya Pradesh. |
| `20260708000000_fix_permissions.sql` | Fix permissions | Clean UTF-8 grant of `get_user_role()` to authenticated role. |
| `20261011000000_scale_and_security.sql` | Scale & security | `guard_patient_privileges()` trigger, `patients_user_id_key` unique index, slot double-booking index, foreign key performance indexes, and `processed_client_ops` idempotency table. |
| `20261016000000_scope_doctor_access_and_audit.sql` | Confidentiality & scoping | Doctor care-relationship scoping via `has_care_relationship()`, admin clinical file confidentiality protection, demo admin preview mode DB trigger `guard_demo_admin_safety()`, and append-only `access_audit_log`. |

---

## 2. Seed Data

Test seed data is stored in `supabase/seed.sql` for local and staging database initialization.

---

## 3. Applying Migrations

With the Supabase CLI:
```bash
# Local development
npx supabase migration up

# Or link and push to a remote project
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```
