# Deployment, Operations & Production Readiness Runbook

This document is the definitive deployment and operational runbook for the **Rural Healthcare Platform**. It covers environment provisioning, Vercel edge configuration, Supabase database migrations, OAuth redirect setups, verification SQL queries, and safe rollback protocols.

---

## 1. Architecture & Infrastructure Posture

The application runs on a serverless, 100% Free-Tier architecture:
* **Frontend & BFF:** Vercel Hobby (Next.js 15 App Router, Edge Middleware, ISR caching).
* **Database & BaaS:** Supabase Free Tier (PostgreSQL 17 + PostGIS, Supabase Auth, Storage).
* **Caching & Rate Limiting:** Upstash Redis (Sliding-window rate limiter, memory fallback).
* **Video Telemedicine:** Jitsi Meet WebRTC (`meet.jit.si`) with randomized cryptographic room tokens and lobby gating.
* **AI Clinical Decision Support:** Google Gemini API with circuit breaker and localized regex triage fallback.

---

## 2. Environment Variables Configuration

Configure the following variables in the **Vercel Dashboard &rarr; Project Settings &rarr; Environment Variables**:

| Variable Name | Environments | Required | Description |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Dev | **Yes** | Supabase Project URL (`https://<project-ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Dev | **Yes** | Client publishable key (`sb_publishable_...` or anon JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Dev | **Yes** | Secret server-only service-role key (Keep confidential) |
| `GEMINI_API_KEY` | Production, Preview, Dev | **Yes** | Google AI Studio Gemini API Key |
| `GEMINI_MODELS` | Production, Preview, Dev | **Yes** | Fallback cascade: `gemini-3.5-flash,gemini-3.1-flash-lite,gemini-2.5-flash` |
| `DOCTOR_CLAIM_SECRET` | Production, Preview, Dev | **Yes** | 64-character hex secret for doctor onboarding HMAC signatures |
| `NEXT_PUBLIC_APP_URL` | Production, Preview, Dev | **Yes** | Canonical URL (e.g. `https://rural-healthcare-platform.vercel.app`) |
| `UPSTASH_REDIS_REST_URL` | Production, Preview, Dev | Optional | Upstash Redis REST endpoint for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview, Dev | Optional | Upstash Redis authentication token |

---

## 3. Supabase Authentication & URL Configuration

To avoid OAuth redirect mismatches and security warnings:

1. **Supabase Dashboard &rarr; Authentication &rarr; URL Configuration**:
   - **Site URL**: `https://<your-project>.vercel.app`
   - **Redirect URLs**:
     - `https://<your-project>.vercel.app/**`
     - `https://*.vercel.app/**`
     - `http://localhost:3000/**`
2. **Google Cloud Console &rarr; OAuth 2.0 Client IDs**:
   - Authorized redirect URI: `https://<supabase-project-id>.supabase.co/auth/v1/callback`
   - *Never* place Vercel URLs directly in Google Cloud Console; all OAuth exchanges route through Supabase Auth Callback handler.

---

## 4. Database Migrations & Release Sequence

All database migrations are strictly **append-only** and tracked in `supabase/migrations/`. 

> [!CAUTION]
> Never run `supabase db reset` against a live production environment.
> Historical migrations (`20260701000000` through `20261018000200`) are locked by cryptographic SHA-256 manifest. All schema modifications must be applied via forward migrations.

### Migration Application Order:
1. `20260701000000_core_schema.sql` through `20260708000000_fix_permissions.sql` (Baseline tables, PostGIS facilities, camps, and doctor profiles).
2. `20261011000000_scale_and_security.sql` (Unique slot booking index `uq_provider_slot_scheduled`, pagination composite indexes).
3. `20261016000000_scope_doctor_access_and_audit.sql` (Access audit logging table `access_audit_log`).
4. `20261017000000_provider_user_link.sql` through `20261017000500_comprehensive_security_and_rls_reconciliation.sql` (Care relationship functions, provider linking).
5. `20261018000000_role_source_hotfix.sql` (Role authority restricted strictly to `public.patients.role`; client `user_metadata` trust removed).
6. `20261018000100_admin_erasure_function.sql` (Audited `public.admin_erase_medical_record` RPC).
7. `20261018000200_reconcile_security_state.sql` (Production policy reconciliation, purge of legacy permissive policies, drop of `public.get_tables()`).

---

## 5. Post-Deployment Verification Queries

Run the following SQL queries in the Supabase SQL Editor after deployment to verify production invariants:

```sql
-- 1. Confirm get_user_role() does NOT reference user_metadata
SELECT pg_get_functiondef('public.get_user_role()'::regprocedure);
-- Expected: Reads strictly from public.patients.role.

-- 2. Verify 0 RLS policies reference user_metadata
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual ILIKE '%user_metadata%' OR with_check ILIKE '%user_metadata%');
-- Expected: 0 rows returned.

-- 3. Confirm public.get_tables() is permanently dropped
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'get_tables';
-- Expected: 0 rows returned.

-- 4. Verify medical_records policy configuration
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'medical_records';
-- Expected: Exactly 4 policies (doctor_insert_care_records, doctor_read_care_records, medical_records_insert_patient, patients_read_own_records).
-- ZERO admin SELECT/UPDATE policies.

-- 5. Confirm admin_erase_medical_record exists and is restricted
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'admin_erase_medical_record';
-- Expected: SECURITY DEFINER present.
```

---

## 6. Safe Rollback Protocols

If an operational regression occurs, roll back the application layer via Vercel:
1. Navigate to **Vercel Dashboard &rarr; Deployments**.
2. Locate the previous stable production deployment.
3. Click **Instant Rollback**.

### Database Safe Rollback Rule
> [!IMPORTANT]
> Never restore vulnerable legacy RLS policies (such as trusting `user_metadata` or granting blanket doctor access) as a rollback strategy. Any database fix must preserve the core security invariants:
> 1. Role authority from `patients.role`.
> 2. No administrative direct `SELECT` on medical records.
> 3. Scoped doctor access via active care relationships.
