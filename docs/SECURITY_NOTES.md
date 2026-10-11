# Security Notes & Hardening Changelog (Phase 1)

> **Document Version:** 1.0.0  
> **Date:** October 2026  
> **Phase:** 1 (Critical Security Remediations: C1, C2, C5, H2, H3, H5, H7)  
> **Branch:** `scale-overhaul`

---

## 1. Overview

This document records the security audits and remediations applied to the Rural Healthcare Platform in Phase 1 of the scaling overhaul. These changes eliminate critical vulnerabilities allowing privilege escalation, unauthorized appointment modification, guessable teleconsultation video rooms, unbounded service-role usage, and unauthenticated administrative access.

---

## 2. Remediated Vulnerabilities & Architecture Changes

### 2.1 C1: Privilege Escalation to Admin (`patients` table)
* **Risk:** The previous RLS policy `patients_update_own` (`user_id = auth.uid()`) had no column restrictions or `WITH CHECK` clauses. A signed-in user could execute `UPDATE patients SET role='admin'` on their own profile row. Furthermore, because `user_id` lacked a `UNIQUE` constraint, a user could insert an additional row with `role='admin'`. Every role check across the app trusted `patients.role`.
* **Remediation in `supabase/09_scale_and_security.sql`:**
  1. Created trigger function `public.guard_patient_privileges()` on `BEFORE INSERT OR UPDATE ON public.patients`.
  2. For end-user JWT callers (`auth.uid() IS NOT NULL`), if caller is not already an admin, role is forced to `'patient'`. Any attempt to modify `role` or `user_id` raises exception `42501` (`Only an admin can change a user role`).
  3. Added `CREATE UNIQUE INDEX patients_user_id_key ON public.patients (user_id)` to guarantee 1:1 relationship between auth users and patient rows.

### 2.2 C2: Authorization in `PATCH /api/appointments`
* **Risk:** The endpoint accepted `{ id, status }` from any signed-in user and ran updates through `createAdminClient()`. Any authenticated patient could arbitrarily cancel or complete any other user's or doctor's appointment.
* **Remediation in `app/api/appointments/route.ts`:**
  1. Enforced authentication via `requireUser()` and memoized profile lookup via `getPatientProfile()`.
  2. Implemented strict Zod schema validation: status restricted to `z.enum(["scheduled", "completed", "cancelled"])`.
  3. **Role authorization matrix:**
     - **Patient:** Can **ONLY** set status to `'cancelled'`, and **ONLY** on appointments where `appointment.patient_id === patient.id`.
     - **Doctor:** Can only update appointments where `appointment.provider_id` matches their own assigned `healthcare_providers` record.
     - **Admin:** Can update any appointment.
  4. Returns **404** (not 403) when an appointment does not exist or is not visible to the user, preventing appointment ID enumeration.
  5. Terminal state guard: If an appointment is already `'completed'` or `'cancelled'`, returns **409 Conflict** (`APPOINTMENT_TERMINAL`).
  6. Replaced service-role client with the **user-scoped Supabase client**, allowing Postgres RLS policies to apply.

### 2.3 C5: Teleconsultation Video Room Security (`meet.jit.si`)
* **Risk:** Teleconsultation rooms used predictable names formatted as `ruralhealth-consult-${Date.now().toString(16)}` with lobby mode turned off and recording/livestreaming controls exposed. Anyone could scan room names and enter private patient consultations.
* **Remediation in `lib/jitsi/config.ts` and `app/api/teleconsult/room/route.ts`:**
  1. Switched room ID generation to `crypto.randomUUID()` (`rhcp_${crypto.randomUUID()}`), rendering room names cryptographically unguessable.
  2. Enabled Jitsi Lobby mode (`enableLobbyMode: true`) in default config so doctors must explicitly admit participants into consultations.
  3. Removed `'recording'` and `'livestream'` from `toolbarButtons` to prevent unauthorized recording of medical consultations.
  4. **Access Control & Time Window:**
     - In `/api/teleconsult/room`, callers must be either the appointment's patient, assigned provider, or admin.
     - Enforced a valid session window: room access is permitted strictly from **15 minutes before scheduled start** until **30 minutes after end time**. Requests outside this window return **403 Forbidden** (`OUTSIDE_TIME_WINDOW`).

### 2.4 H2: Booking Table Resolution & Double-Booking Guard
* **Risk:** `appointments.provider_id` foreign key references `healthcare_providers(id)`, but `POST /api/appointments` queried the legacy `providers` table for fallback providers. Furthermore, concurrent booking requests could double-book the same provider slot.
* **Remediation in `app/api/appointments/route.ts` and `09_scale_and_security.sql`:**
  1. Resolved providers strictly against `healthcare_providers` (the canonical table matching foreign key schema).
  2. Added unique index in `09_scale_and_security.sql`: `uq_provider_slot_scheduled ON public.appointments (provider_id, appointment_date) WHERE status = 'scheduled'`.
  3. Mapped Postgres error `23505` to HTTP 409 `{ error: "This time slot is already booked for this provider.", code: "SLOT_TAKEN" }`.

### 2.5 H3: Service-Role Audit & Lockdown
* **Risk:** `createAdminClient()` was used indiscriminately across routes, bypassing all RLS policies.
* **Remediation:**
  1. Created `lib/auth/guard.ts` for unified user and role validation.
  2. `app/api/medical-records/route.ts`: Replaced admin client with user-scoped `supabase` client for `GET`, `POST`, `PATCH`, and `DELETE`.
  3. `app/api/appointments/route.ts`: Replaced admin client with user-scoped client for `GET`, `POST`, and `PATCH`.
  4. **Documented exceptions:** Service-role client (`getAdminClient()`) is retained strictly for:
     - Inserting notifications directed to other users (since notification policies restrict cross-user inserts).
     - Initial OAuth profile creation in `ensure-patient` when a user has no patient row yet.

### 2.6 H5 & H7: Edge Middleware Hardening
* **Risk:** The previous middleware matched every request and invoked `supabase.auth.getUser()` on all pages, wasting edge compute and Supabase Auth quota. Administrative pages (`/admin/*`) and doctor pages (`/doctor/*`) relied on client-side React checks rather than server-side gates.
* **Remediation in `middleware.ts`:**
  1. Narrowed `config.matcher` strictly to authenticated paths (`/dashboard/:path*`, `/consultation/:path*`, `/records/:path*`, `/appointments/:path*`, `/admin/:path*`, `/doctor/:path*`, `/login`, `/auth`).
  2. Public pages (`/`, `/camps`, `/directory`, `/emergency`, `/health-info`, `/locations`, `/symptom-checker`) no longer invoke `getUser()`, saving ~1 network hop and reducing Supabase egress.
  3. Unprotected `/camps` (public rural health camps).
  4. Enforced server-side role gating:
     - `/admin/*` redirects non-admins to `/dashboard`.
     - `/doctor/*` redirects users lacking doctor/admin role to `/dashboard`.
  5. Redirects authenticated users accessing `/login` or `/auth` directly to their respective role dashboard.

### 2.7 M1: Content Security Policy (Report-Only Mode)
* **Risk:** Arbitrary script injection or unmonitored external dependencies could compromise user session tokens or inject malicious frames.
* **Remediation in `next.config.mjs`:**
  1. Configured standard Content Security Policy in Report-Only mode (`Content-Security-Policy-Report-Only`):
     - `default-src 'self'`
     - `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://meet.jit.si https://8x8.vc`
     - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
     - `img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://unpkg.com`
     - `font-src 'self' data: https://fonts.gstatic.com`
     - `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://*.upstash.io https://meet.jit.si https://8x8.vc https://vitals.vercel-insights.com`
     - `frame-src 'self' https://meet.jit.si https://8x8.vc`
     - `worker-src 'self' blob:`
     - `object-src 'none'`
     - `base-uri 'self'`
  2. **Enforcement Procedure:**
     - Monitor browser violation reports for 7 days in staging/production to confirm no legitimate assets or external services trigger false positives.
     - To enforce blocking, rename the header key in `next.config.mjs` from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.

### 2.8 M6: Structured JSON Observability & PII Protection
* **Risk:** Raw console logs can leak sensitive patient health information, personal emails, or authentication tokens into serverless log aggregators.
* **Remediation in `lib/logger.ts` & `middleware.ts`:**
  1. Implemented structured JSON logger emitting single-line JSON entries with `timestamp`, `level`, `requestId`, `route`, `status`, `durationMs`, and `userIdHash`.
  2. Cryptographic pseudonymization: User IDs are hashed with SHA-256 (12-char hex prefix) before output. Emails, names, phone numbers, and clinical symptoms are strictly omitted from log streams.
  3. `x-request-id` header generated and propagated through middleware across all requests and responses for end-to-end request tracing.

---

## 3. Verification & Safety Verification

| Test | Status | Result |
|---|---|---|
| `npx tsc --noEmit` | ✅ Passed | 0 TypeScript errors |
| `npm run lint` | ✅ Passed | 0 ESLint warnings or errors |
| `npm run test:unit` | ✅ Passed | 40/40 unit tests passing |
| `npm run build` | ✅ Passed | All 45 routes cleanly compiled |

