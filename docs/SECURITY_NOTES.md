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

### 2.9 Phase 2: Concurrency & Cross-Tenant Isolation Verification
* **Automated Double-Booking Concurrency Proof (`tests/unit/appointments-and-auth.test.ts`):**
  - Simulated two concurrent HTTP `POST /api/appointments` requests dispatched simultaneously using `Promise.all` targeting the same healthcare provider and slot timestamp.
  - The PostgreSQL partial unique constraint `uq_provider_slot_scheduled ON public.appointments (provider_id, appointment_date) WHERE status = 'scheduled'` guarantees atomic isolation.
  - Verification: Exactly one request resolves with HTTP 201 Created, while the colliding concurrent request receives HTTP 409 Conflict with `{ "code": "SLOT_TAKEN", "error": "This time slot is already booked for this provider." }`.
* **Cross-Tenant Patient Data Isolation Suite (`tests/unit/patient-data-isolation.test.ts`):**
  - Validates complete cryptographic and tenant-level isolation across 9 automated security tests:
    1. Cross-patient medical record access: Patient B requesting Patient A's records receives empty arrays or 404, preventing unauthorized read access.
    2. Medical record tamper rejection: Patient B attempting to update or delete Patient A's records receives 404 or 403, preventing cross-tenant modifications.
    3. Impersonation prevention on creation: Patients attempting to create records under another patient ID are forced to their authenticated session ID.
    4. Teleconsultation session eavesdropping rejection: Unauthorized patients and unassigned third-party doctors attempting to enter another clinician's teleconsultation room receive HTTP 403 Forbidden.
    5. Teleconsultation time window gating: Valid participants attempting entry outside the 15-minute pre-session and 30-minute post-session window receive HTTP 403 `OUTSIDE_TIME_WINDOW`.
    6. Profile privilege escalation blocking: Calling `PUT /api/auth/profile` with `{ role: "admin" }` safely ignores or rejects the role change, keeping the user in the `patient` role.
    7. Doctor verification authorization: Non-admin users attempting to approve or reject doctor claims via `PATCH /api/doctor-requests` receive HTTP 403.
### 2.10 Phase 3: Client Offline Outbox & Network Resilience Verification
* **Automated Offline Outbox Lifecycle (`tests/unit/client-offline-resilience.test.ts`):**
  - Jittered Exponential Backoff: Validates backoff algorithm (`calculateBackoff`) scaling from base 1,000 ms to a hard upper bound of 30,000 ms (+ 1,000 ms randomization jitter) to prevent thundering herd when rural cell towers reconnect.
  - Storage Quota Telemetry: Proves that `checkStorageQuota` calculates storage utilization against `navigator.storage.estimate` and triggers `warning: true` when usage reaches or exceeds 80%.
  - Outbox Queue Bounding: Proves that the IndexedDB queue enforces a hard cap of 500 operations, protecting low-memory mobile browsers from unbounded storage growth.
  - Failure Transition & Auto-trip: Operations failing 5 consecutive times transition to `status: "failed"` with captured error messages, preventing infinite network loops on permanently invalid mutations.
  - User Control: Verifies that users can manually retry or discard stalled outbox operations.
  - Legacy Data Migration: Verifies atomic migration of legacy `localStorage` outbox items into IndexedDB with key deletion.

### 2.11 Phase 4: Deployment Readiness & Liveness Probe Hardening
* **Operational Health Probes (`app/api/health/route.ts` & `tests/unit/probes-and-benchmarks.test.ts`):**
  - Database Probe Correction: Updated `/api/health` to query the canonical public table `healthcare_facilities` rather than unaliased tables, providing truthful health status.
  - Degraded State Resilience: Returns HTTP 200 with `status: "ok"` when database is healthy; gracefully returns HTTP 503 with sanitized `status: "degraded"` or `"unavailable"` without leaking internal stack traces or connection strings.
  - Edge Cache Prohibition: Hardened `Cache-Control: no-store, no-cache, must-revalidate` prevents stale health telemetry in container orchestrators.
  - Readiness Probe: `/api/ready` provides sub-10ms deterministic health check for uptime monitors and deployment gates.

### 2.12 Care Relationship Scoping & Medical Record Access Decision
* **Problem Addressed:** Previous database security rules allowed any authenticated clinician with role `'doctor'` to view all patient records across the entire platform. Furthermore, initial attempts to limit access conflated `appointments.provider_id` (a `healthcare_providers.id` foreign key) directly with `auth.uid()`, and failed because `healthcare_providers` lacked a `user_id` column.
* **Architecture & Clinical Retention Decision:**
  1. **Provider Mapping:** Added `healthcare_providers.user_id` referencing `auth.users(id)` and revoked client-side write permissions to prevent arbitrary claiming. Linking is strictly performed by administrative claim verification via `getAdminClient()`.
  2. **Status Scoping (`scheduled` and `completed`):** Treating physicians require access to clinical history prior to an appointment (`scheduled`) and during post-consultation management, prescription authoring, and follow-up care (`completed`).
  3. **Exclusion of Cancelled Appointments:** Appointments with status `'cancelled'` do NOT constitute an active care relationship and grant zero read or write access to patient medical records.
### 2.13 Security Audit Policy & Expiring Dependency Allowlist
* **Zero Critical Vulnerabilities:** Automated CI workflows strictly gate builds on `npm audit --audit-level=critical` (0 critical vulnerabilities allowed).
* **High Severity Policy with Expiring Allowlist:**
  - Automated gate via `scripts/ci/audit_allowlist.mjs` enforces zero high-severity vulnerabilities unless explicitly authorized in `audit-allowlist.json`.
  - Every allowlisted item requires a technical justification explaining why runtime exploitability is absent, paired with a mandatory hard expiration date.
  - If an allowlist entry expires, CI fails immediately to prevent stale security exceptions.

| Package | Advisory | Severity | Expiration | Risk Assessment & Justification |
| :--- | :--- | :--- | :--- | :--- |
| `braces` | GHSA-vfj7-8cjw-p6xm | High | 2026-12-31 | Transitive build-time dependency bundled inside `@ducanh2912/next-pwa` -> `workbox-build` -> `fast-glob` -> `micromatch`. Only invoked during Next.js service worker compilation; never processes user-controlled regex patterns at runtime. |
| `micromatch` | via `braces` | High | 2026-12-31 | Transitive dependency inside `workbox-build` via `fast-glob`; build-time service worker generation only. |
| `fast-glob` | via `micromatch` | High | 2026-12-31 | Transitive dependency inside `workbox-build`; build-time service worker asset globbing only. |
| `@ducanh2912/next-pwa` | via `workbox-build` | High | 2026-12-31 | Next.js PWA generation plugin. Vulnerability is in upstream Google Workbox build toolchain, which has not yet published an updated major release. |
| `postcss` | GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849 | High | 2026-12-31 | CSS `sourceMappingURL` parsing vulnerability bundled in Next.js build-time pipeline. Build-time compilation only; no arbitrary CSS or source maps from untrusted users are processed at runtime. |
| `serialize-javascript` | GHSA-5c6j-r48x-rmvq | High | 2026-12-31 | Transitive dependency in `workbox-build` and `terser` used during webpack service-worker minification. Only runs on static application code during `npm run build`. |

### 2.15 Edge Middleware HTTP Method Guard & CORS Policy
* **HTTP Method Restriction:**
  - `middleware.ts` rejects insecure or diagnostic HTTP methods (`TRACE`, `TRACK`, `CONNECT`) with HTTP 405 Method Not Allowed and explicit `Allow: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD` headers.
  - Prevents Cross-Site Tracing (XST) attacks that attempt to reflect authorization headers and cookies.
* **CORS & Origin Gating for API Routes:**
  - Explicit OPTIONS preflight handling for all `/api/*` routes.
  - Verifies `Origin` header against allowed domains: exact host match, `NEXT_PUBLIC_APP_URL`, official production/preview domains (`rural-healthcare-platform.vercel.app`, `*.vercel.app`), and local development environments (`localhost`, `127.0.0.1`).
  - Cross-origin requests from unauthorized origins are rejected with HTTP 403 Forbidden (`Cross-origin request blocked`).
* **Fast-Path Edge Exemption:**
  - Public routes (`/`, `/camps`, `/directory`, `/emergency`, `/health-info`, `/locations`, `/symptom-checker`) and public unauthenticated API routes bypass Supabase `getUser()` network calls entirely, eliminating latency penalties while preserving strict server-side role gating on `/admin/*` and `/doctor/*`.

### 2.16 Supabase Storage Bucket & PHI Document Security
* **Bucket Privacy Posture:**
  - The `medical-records` bucket is configured strictly with `public = false` (private bucket in migration `20260705000000_security_patch.sql`).
  - Direct public URL resolution is forbidden by Supabase Storage object access rules.
* **Storage RLS & Ownership Verification:**
  - Storage objects are segmented by user UUID folders: `<auth.uid()>/<filename>`.
  - Storage RLS enforces that `auth.uid()` must match the folder path `(storage.foldername(name))[1] = auth.uid()::text` for both `SELECT` and `INSERT`.
* **Signed URL Generation:**
  - Access to patient attachments and lab reports requires short-lived, cryptographically signed URLs generated via `createSignedUrl()`, ensuring that unauthenticated third parties cannot enumerate or access sensitive medical files.

### 2.17 October 16, 2026 Audit Remediations & Migration Harmonization
* **Migration Baseline Harmonization:**
  - Resolved `supabase db reset` failure (`ERROR: relation "public.health_data" does not exist (SQLSTATE 42P01)`) by declaring `health_data` in initial baseline migration `20260701000000_core_schema.sql`.
  - Added schema-aligned columns: `consultation_type` on `appointments` and `metadata JSONB` on `medical_records`.
* **Function Permissions & Search Path Integrity:**
  - Enforced `SET search_path = public` across `get_user_role()`, `get_current_user_role()`, and `handle_new_user()`.
  - Granted `EXECUTE` on `get_user_role()` and `get_current_user_role()` to `authenticated, service_role`, ensuring Postgres RLS policies evaluate caller role without permission errors.
* **Provider Profile Gating & Elimination of Self-Service Elevation:**
  - Dropped self-service insert policy (`providers_insert_own`) on `healthcare_providers`.
  - Restricted provider profile creation strictly to administrators (`providers_admin_insert`), preventing unverified accounts from creating clinician profiles to gain moderation or clinical access.
* **Chat Cache Moderation Lockdown:**
  - Purged editable user metadata (`auth.jwt() -> 'user_metadata' ->> 'role'`) and unverified provider row conditions from `chat_cache` RLS policies.
  - Moderation is strictly gated by verified role: `(SELECT public.get_user_role()) IN ('admin', 'doctor')`.
* **Scoped Doctor Access via Care Relationship:**
  - Scoped doctor appointment access to assigned appointments (`doctor_read_assigned_appointments` & `doctor_update_assigned_appointments`).
  - Scoped `health_data` access to active care relationship via `public.has_care_relationship(patient_id)`.
* **RLS InitPlan Optimization:**
  - Replaced bare `auth.uid()` and `get_user_role()` with scalar subqueries `(SELECT auth.uid())` and `(SELECT public.get_user_role())`, enabling single-execution InitPlan optimization across row evaluations.
* **Foreign Key Covering Indexes:**
  - Created covering indexes on `appointments(patient_id)`, `appointments(provider_id)`, `medical_records(patient_id)`, `medical_records(provider_id)`, and `notifications(recipient_id)`.
* **Western Gujarat Geographic Bounds:**
  - Widened `MIN_LON` bound to `68.0` in `lib/geo/facility-provenance.ts`, ensuring 100% density across Western Gujarat (Kachchh 68.58°E).
* **Offline Sync Robustness & Status Guard:**
  - Surfaced database errors during idempotency queries in `processed_client_ops`.
  - Supported dual EAV and wide vitals format.
  - Prevented non-clinician roles from transitioning appointment status to `"completed"` offline.
* **CI Node.js Modernization:**
  - Bumped CI runtime from Node 20 to Node 22 across all workflow jobs (`test-and-build`, `db-tests`, `e2e`).

### 2.18 October 17–18, 2026: Replacement of Moderation Hack with Audited Erasure Function
* **Flaw Identified:**
  - An earlier patch attempted to satisfy PostgreSQL's delete visibility invariant by creating an `admin_select_moderation_medical_records` policy allowing admins to read rows where `record_type IN ('lab_report', 'other', 'moderation')` or where content matched keywords like "erasure" or "disposable".
  - This broke the core clinical privacy invariant ("administrators must have zero read access to medical records"). Furthermore, relying on content string matches or record types created an insecure bypass vector and fragile test-tuned policies.
* **Remediation & Final Architecture:**
  1. **Zero Direct RLS Access:** Completely purged `admin_select_moderation_medical_records` and `admin_delete_medical_records` from `public.medical_records`. Under PostgreSQL RLS, administrators have **zero `SELECT`, `INSERT`, `UPDATE`, or `DELETE` policies** on `medical_records`. Administrative queries (`select * from medical_records`) return `[]`.
  2. **Audited Security-Definer Erasure Function (`public.admin_erase_medical_record`):**
     - Right-to-erasure and regulatory content moderation are executed strictly through `public.admin_erase_medical_record(p_record_id uuid, p_reason text)`.
     - Function is defined with `SECURITY DEFINER` and `SET search_path = public`.
     - Strictly enforces caller authorization: `public.get_user_role() = 'admin'`, verified directly against `public.patients.role`. Non-admin or doctor execution raises SQLSTATE `42501`.
     - Deletes the targeted row and atomically records an immutable entry into `public.access_audit_log` (logging actor UUID, role `'admin'`, action `'ERASE_MEDICAL_RECORD'`, resource ID, patient ID, reason, and UTC timestamp).
     - Permissions: `REVOKE ALL FROM PUBLIC, anon; GRANT EXECUTE TO authenticated;`.
  3. **Admin API Endpoint (`POST /api/admin/erase-record`):**
     - Accepts `{ record_id, reason }`.
     - Authenticates user session and validates administrator role.
     - Executes `admin_erase_medical_record` RPC via the **user-scoped client session** (never bypassing via service role).
     - Protected by Demo Admin preview mode guard (`admin@ruralhealth.demo` cannot erase).

---

## 3. Verification & Safety Verification

| Test | Status | Result |
|---|---|---|
| `npx tsc --noEmit` | Passed | 0 TypeScript errors |
| `npm run lint` | Passed | 0 ESLint warnings or errors |
| `npm run test:unit` | Passed | 176 unit tests passing across 21 test suites |
| `npx playwright test` | Passed | 5/5 browser user persona end-to-end tests passing |
| `npm run build` | Passed | All routes cleanly compiled |

