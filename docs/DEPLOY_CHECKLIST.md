# Deployment & Production Readiness Checklist

This document is the definitive deployment runbook for the **Rural Healthcare Platform**. It details every manual step required for staging environments, database migrations, security hardening, load testing, and production deployment on Vercel and Supabase.

---

## 1. Supabase Database Migrations

All SQL migrations must be run sequentially via the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) or Supabase CLI. **Never modify tables manually via Table Editor.**

### Migration Sequence:
1. `supabase/01_base_schema.sql` — Base tables (`patients`, `healthcare_providers`, `appointments`, `medical_records`, `notifications`).
2. `supabase/02_postgis_facilities.sql` — PostGIS extensions, `healthcare_facilities` spatial table, spatial index `idx_facilities_geom`, and `nearby_facilities` RPC.
3. `supabase/03_sample_camps.sql` — `camps` table and seed data for rural health camps.
4. `supabase/04_doctor_profiles.sql` — Doctor metadata and verification schema.
5. `supabase/05_chat_cache.sql` — AI response cache table and RLS policies.
6. `supabase/06_chat_cache_cleanup.sql` — Scheduled pg_cron cleanup for expired cache items.
7. `supabase/07_offline_sync_log.sql` — Offline sync queue logging.
8. `supabase/08_health_data_schema.sql` — IoT vitals tracking (`health_data`).
9. `supabase/09_scale_and_security.sql` — **Critical Security & Scalability Migration**:
   - Creates `processed_client_ops` table for atomic, idempotent offline sync with RLS.
   - Fixes `patients` table privilege escalation (patients can update profile info but cannot elevate `role`).
   - Adds unique constraint `idx_appointments_provider_slot_active` (`provider_id`, `appointment_date` WHERE `status = 'scheduled'`) to mathematically guarantee zero double-booking.
   - Adds composite indexes for cursor pagination:
     * `idx_appointments_patient_date` (`patient_id`, `appointment_date` DESC)
     * `idx_appointments_provider_date` (`provider_id`, `appointment_date` DESC)
     * `idx_records_patient_date` (`patient_id`, `record_date` DESC)
     * `idx_notifications_recipient_created` (`recipient_id`, `created_at` DESC)
     * `idx_notifications_unread` (`recipient_id`, `is_read`, `created_at` DESC)

---

## 2. Supabase Authentication & Google OAuth Configuration

To prevent `Unable to exchange external code` OAuth handshake errors:

1. **Supabase Dashboard &rarr; Authentication &rarr; URL Configuration**:
   - **Site URL**: `https://<your-project>.vercel.app` (e.g., `https://rural-healthcare-platform.vercel.app`)
   - **Redirect URLs**: Add all applicable wildcards:
     * `https://<your-project>.vercel.app/**`
     * `https://*.vercel.app/**`
     * `http://localhost:3000/**`
2. **Google Cloud Console &rarr; APIs & Services &rarr; Credentials &rarr; OAuth 2.0 Client IDs**:
   - Under **Authorized redirect URIs**, verify:
     * `https://<supabase-project-id>.supabase.co/auth/v1/callback`
   - *Never* put Vercel URLs directly in Google Cloud Console; all OAuth exchanges must route through Supabase Auth Callback handler.

---

## 3. Vercel Environment Variables

Set up environment variables in **Vercel Dashboard &rarr; Project Settings &rarr; Environment Variables**:

| Variable Name | Environment | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Dev | **Yes** | Supabase project URL (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Dev | **Yes** | Client publishable anon key (`sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Dev | **Yes** | Server-only secret key (`sb_secret_...`) |
| `GEMINI_API_KEY` | Production, Preview, Dev | **Yes** | Google AI Studio Gemini API key ($0 free tier supported) |
| `GEMINI_MODELS` | Production, Preview, Dev | **Yes** | Fallback cascade: `gemini-3.5-flash,gemini-3.1-flash-lite,gemini-2.5-flash` |
| `NEXT_PUBLIC_SITE_URL` | Production, Preview, Dev | Optional | Canonical site URL (defaults to `http://localhost:3000` in dev) |
| `UPSTASH_REDIS_REST_URL` | Production, Preview, Dev | Optional | Upstash Redis REST endpoint (distributed rate limiter & semantic cache; falls back to in-memory) |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview, Dev | Optional | Upstash Redis REST authentication token |
| `NEXT_PUBLIC_JITSI_DOMAIN` | Production, Preview, Dev | Optional | Jitsi domain (defaults to `meet.jit.si`) |
| `JITSI_APP_ID` | Production, Preview, Dev | Optional | Jitsi / JaaS App ID for JWT claims |
| `JITSI_APP_SECRET` / `JAAS_API_KEY` | Production, Preview, Dev | Optional | Signing key for cryptographic JWT room tokens; zero-cost fallback uses time-gating |
| `ABDM_CLIENT_ID` / `ABDM_CLIENT_SECRET` | Production, Preview, Dev | Optional | NHA Sandbox credentials; zero-cost fallback runs local simulated validation & FHIR bundle generator |
| `BHASHINI_API_KEY` / `BHASHINI_USER_ID` | Production, Preview, Dev | Optional | GoI ULCA Voice API credentials; zero-cost fallback uses browser Web Speech API |
| `LOADTEST_ENABLED` | **Staging Only** | **NO in Prod** | Must be `false` or unset in production. Set `true` only on staging. |
| `LOADTEST_KEY` | **Staging Only** | **NO in Prod** | Shared secret token passed in `x-loadtest-key` for staging k6 runs. |
| `NEXT_PUBLIC_GEMINI_API_KEY` | **DELETE** | **PROHIBITED** | **Must be completely deleted** to prevent client API key leaks. |

---

## 4. Content Security Policy (CSP) Rollout Plan

To ensure zero downtime or broken third-party integrations (Jitsi, CartoDB tiles, Google Fonts):

- **Phase 1 (Week 1 — Active Now):**
  - CSP is configured in `next.config.mjs` using `Content-Security-Policy-Report-Only`.
  - Violations are reported to the browser console and report URI without blocking traffic.
  - Inspect production browser telemetry for any unexpected script or frame blocked domains.
- **Phase 2 (Week 2 — Enforcement):**
  - Once 7 consecutive days pass with 0 unexpected CSP report violations, update `next.config.mjs`:
    ```javascript
    // Rename key from:
    { key: 'Content-Security-Policy-Report-Only', value: cspHeader }
    // To:
    { key: 'Content-Security-Policy', value: cspHeader }
    ```
  - Verify Jitsi iframe conferencing, Leaflet map tiles, and Google Fonts remain fully operational.

---

## 5. Load-Testing Verification (Staging Only)

**Strict Rule:** NEVER run k6 load tests against the production URL.

1. Deploy the staging branch to a separate Vercel preview or dedicated staging project.
2. In the staging environment, configure `LOADTEST_ENABLED=true` and `LOADTEST_KEY=<uuid>`.
3. In `loadtest/`, generate synthetic seed data if needed:
   ```bash
   node loadtest/seed/generate.js --scale=1000 --out=loadtest/seed/data.sql
   ```
4. Run the smoke test:
   ```bash
   npm run loadtest:smoke
   ```
   Or trigger the manual GitHub Actions workflow: `.github/workflows/loadtest-smoke.yml`.
   *The test runner automatically halts with an error if the target hostname matches production.*
5. Confirm SLO targets:
   - `GET /api/facilities/nearby` p95 < 200ms
   - `POST /api/appointments` p95 < 500ms
   - 0 unhandled 5xx errors.

---

## 6. PWA & Client Cache Invalidation

1. Whenever new service worker bundles or manifest icons are deployed:
   - Serwist registers the new revision in `public/sw.js`.
   - Private routes (`/api/appointments`, `/api/medical-records`, `/api/notifications`, `/api/offline-sync`) use `NetworkOnly` caching so sensitive patient data is never cached on shared devices.
2. If testing in development or staging:
   - DevTools &rarr; **Application** &rarr; **Storage** &rarr; **Clear site data**.
   - Reload to activate the new Serwist worker.

---

## 7. Medical Review Sign-off

- [ ] Share [`docs/MEDICAL_REVIEW_TODO.md`](docs/MEDICAL_REVIEW_TODO.md) with a certified medical officer or Primary Health Centre (PHC) advisor to approve clinical triage algorithms, dosage phrasing, and first-aid instructions.
