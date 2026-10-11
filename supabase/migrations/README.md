# Supabase Migrations (`supabase/migrations/`)

This directory contains timestamped, sequential PostgreSQL migrations compatible with the standard **Supabase CLI** workflow (`supabase migration up`).

---

## 1. Sequence & History

The migrations reproduce the application's database evolution in chronological order:

| Timestamp | Source File | Purpose |
|---|---|---|
| `20260701000000_core_schema.sql` | `01_schema.sql` | Core schema: `patients`, `healthcare_providers`, `appointments`, `medical_records`, `notifications`, `camps`, `healthcare_facilities` (PostGIS). |
| `20260702000000_functions_triggers.sql` | `02_functions_triggers.sql` | Core functions, `handle_new_user()` trigger, and PostGIS RPC `nearby_facilities()`. |
| `20260703000000_rls_policies.sql` | `03_rls.sql` | Base Row-Level Security (RLS) policies for patient data isolation. |
| `20260704000000_chat_cache.sql` | `05_chat_cache.sql` | Gemini clinical review queue and response cache table. |
| `20260705000000_security_patch.sql` | `05_security_patch.sql` | Hardened RLS policies, storage bucket lockdown, and RPC permission enforcement. |
| `20260706000000_security_warnings.sql` | `06_security_warnings_final.sql` | Security advisor lint fixes and function search_path hardening. |
| `20260707000000_seed_camps.sql` | `07_seed_camps.sql` | Seed data for initial rural medical camps in Madhya Pradesh. |
| `20260708000000_fix_permissions.sql` | `08_fix_permissions.sql` | Clean UTF-8 grant of `get_user_role()` to authenticated role. |
| `20261011000000_scale_and_security.sql` | `09_scale_and_security.sql` | **Phase 1 Overhaul:** `guard_patient_privileges()` trigger (C1), `patients_user_id_key` unique index, slot double-booking index (H2), foreign key performance indexes (H9), and `processed_client_ops` idempotency table (C4). |

---

## 2. Action Required: Capturing Production Tables (`supabase db pull`)

> [!IMPORTANT]
> Some tables in production (`health_data`, `doctor_requests`, `offline_sync_log`) were created during previous development directly in the Supabase Dashboard SQL editor.
>
> To sync your local migrations with your live database schema, run the Supabase CLI command once:
> ```bash
> npx supabase login
> npx supabase link --project-ref boyzdmlvzvcplzolenef
> npx supabase db pull
> ```
> This automatically pulls the live schema and creates a clean migration capturing any uncommitted table structures.

---

## 3. Preserving Legacy Files

The root `supabase/*.sql` files are kept intact for backward compatibility with manual copy-paste execution in the Supabase web SQL Editor.
