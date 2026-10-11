# Changelog

All notable changes to the Rural Healthcare Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres roughly to chronological feature milestones.

## [v1.7.0] - 2026-10-11 — Phase 4: Offline Sync Rewrite, IndexedDB Outbox & Idempotency (Audit C4, §2.4)

### Offline Data & Synchronization
- **IndexedDB Outbox Engine (`lib/offline/outbox.ts`)**:
  - Replaced flaky `localStorage` operation queue with persistent `idb` store `rhcp_offline_db` (`outbox` store).
  - Strongly typed schema `{ client_op_id (uuid v4), table, type, payload, created_at, attempts, status, last_error }`.
  - Operations implemented: `enqueue`, `listPending`, `listAll`, `markSent`, `deleteOps`, `markFailed`, `retryOp`, `discardOp`, `purgeSent`.
  - Hard cap of 500 operations to prevent unbounded storage bloat on low-end devices.
  - Storage quota monitor (`checkStorageQuota`) surfacing 80% usage alerts.
  - One-time migration `migrateLegacyLocalStorage()` transferring any legacy `rhcp_offline_operations` entries into IndexedDB before cleanup.
- **Server-Side Offline Sync Endpoint Rewrite (`POST /api/offline-sync`)**:
  - Mandatory session authentication via `requireUser()` and patient verification via `getPatientProfile()`.
  - **Strict Batch Cap**: Accepts at most 50 operations per batch (`SyncBatchSchema`).
  - **Strict Column Whitelists**: Dedicated non-passthrough Zod schemas for `appointments`, `medical_records`, `health_data`, and `notifications`. Eliminates arbitrary column injection or privilege tampering.
  - **Enforced Session Scoping**: Automatically binds server-verified `patient_id` or `user_id` from the authenticated session, overriding any client-supplied IDs.
  - **Idempotency Protection**: Checks incoming `client_op_id`s against `processed_client_ops`. Skips duplicate operations cleanly with `{ status: "duplicate" }` instead of failing or creating duplicates.
  - **Partial Failure Resilience**: Returns HTTP 200 with per-operation status array (`ok`, `duplicate`, `rejected`) so individual invalid operations never abort valid ones in the batch.
  - Audit logging recorded best-effort in `offline_sync_log`.
- **Client Sync Orchestrator & Triggers (`lib/offline/sync.ts`)**:
  - Triggers on `online`, `visibilitychange` (when document returns to view), and Background Sync (`sync` event in Service Worker `app/sw.ts`).
  - Implements jittered exponential backoff for network retries.
  - Deletes only `ok` and `duplicate` items from the IndexedDB outbox; marks rejected operations as `failed` with error details so user data is never silently dropped.
  - Dispatches `rhcp:outbox-updated` events for real-time UI synchronization.
- **Bilingual Queue Inspector UI (`components/OfflineSyncBadge.tsx` & `components/Header.tsx`)**:
  - Header pill showing live count of waiting or failed offline actions ("N waiting" / "N প্রতীक्षारत", "N failed" / "N विफल").
  - Outbox inspector dialog displaying per-item table, operation type, timestamp, attempts (up to 5), and failure reasons.
  - Interactive "Retry" and "Discard" actions for failed items, and one-tap "Sync Now".
  - Storage quota warning banner when device storage exceeds 80%.
- **Automated Verification (`tests/unit/offline-sync.test.ts`)**:
  - Added unit test suite covering authentication requirement, batch size capping, idempotent replay, column whitelist enforcement, and partial failure handling.

---

## [v1.6.0] - 2026-10-11 — Phase 3: PWA Modernization, Serwist Migration, Offline Fallback & Privacy Hardening (Audit §2, C3)

### PWA & Offline Experience
- **Real PNG & Maskable Icons**: Generated standard-compliant PNG icons via `scripts/make_icons.mjs` using `sharp`:
  - `public/icons/icon-192.png` & `public/icons/icon-512.png`
  - `public/icons/maskable-192.png` & `public/icons/maskable-512.png` (80% safe zone with padded borders)
  - `public/apple-touch-icon.png` (180x180)
  - Resized and converted hero banner to `public/hero.webp` (120 KB vs 898 KB — 86.6% bandwidth saving).
  - Purged obsolete 1024px JPEG-as-PNG placeholder icons.
- **Manifest Standardization (`public/manifest.json`)**:
  - Aligned theme color to `#0ea5e9` matching `<meta theme-color>` and Tailwind UI palette.
  - Corrected app shortcuts pointing directly to valid client routes (`/emergency` and `/symptom-checker`).
  - Added `id: "/"`, `start_url: "/?source=pwa"`, and distinct `"any"` vs `"maskable"` icon definitions.
- **Serwist Service Worker Migration (`app/sw.ts` & `next.config.mjs`)**:
  - Replaced legacy `@ducanh2912/next-pwa` with `@serwist/next` and hand-written `app/sw.ts`.
  - **Strict NetworkOnly Isolation (C3)**: Ensured private medical APIs (`/api/appointments`, `/api/medical-records`, `/api/notifications`, `/api/health-data`, `/api/doctor-requests`, `/api/chat-cache`, `/api/offline-sync`, `/api/auth/*`) never enter Cache Storage.
  - **StaleWhileRevalidate**: Applied to public read-only JSON (`/api/providers`, `/api/facilities/*`, `/api/health`) with 2-hour TTL and 50-entry cap.
  - **Low-Bandwidth Navigation Optimization**: 3-second network timeout on navigations for rural 2G/3G connections, falling back to cached pages or `/offline`.
  - **Safe Connectivity Behavior**: Eliminated `reloadOnOnline` to prevent losing in-progress patient symptom descriptions or chats.
- **Bilingual Offline Fallback Page (`app/offline/page.tsx`)**:
  - Emergency hotline one-tap dialers (108 Ambulance, 112 Emergency, Tele-MANAS 14416, 104 Health Helpline).
  - Direct offline links to built-in rule-based symptom checker and visual first-aid triage.
  - Connection status monitoring and reconnect trigger.
- **Sign-Out Privacy & Cache Wipe (`lib/offline/cache-cleaner.ts`)**:
  - On user logout, sends `{ type: "CLEAR_CACHES" }` to Serwist service worker to purge all runtime caches, deletes `window.caches`, and clears IndexedDB and offline queues.
- **PWA Lifecycle UX (`components/PwaUpdaterAndInstaller.tsx`)**:
  - Controlled update prompt with Reload button using deferred `SKIP_WAITING` activation.
  - Dismissible bilingual install banner on 2nd visit, with iOS Safari "Add to Home Screen" instructions.
- **Testing & Verification (`tests/unit/pwa-strategy.test.ts`)**:
  - Unit tests verifying manifest properties, physical icon files, and NetworkOnly routing classifications for all sensitive endpoints.

---

## [v1.5.0] - 2026-10-11 — Phase 2: Data Layer, Cursor Pagination, Schema Alignment & RLS Performance (H1, H8, H9, M2)

### Data Layer & Scalability
- **Cursor Pagination Engine (`lib/pagination.ts`)**: Base64-encoded composite cursor (`created_at` + `id`) with robust decoding, validation, and deterministic pagination helpers.
- **API Endpoints Paginated & Bounded**:
  - `GET /api/appointments`: Cursor-paginated (default limit 20, max 100) with explicit column projections, patient relation phone join, and dual response shape `{ data, appointments, nextCursor }`.
  - `GET /api/medical-records`: Cursor-paginated with explicit column selections.
  - `GET /api/notifications`: Cursor-paginated, filtered by patient profile ownership.
  - `GET /api/health-data`: Cursor-paginated with explicit column selections.
  - `GET /api/doctor-requests`: Cursor-paginated with explicit column selections.
- **Frontend On-Demand Pagination**:
  - Integrated "Load more" / "और देखें" bilingual pagination in `AppointmentManager`, `PatientRecords`, `NotificationBell`, `DoctorDashboard`, `DoctorAppointmentRequests`, `AdminAppointments`, and `AdminNotifications`.
  - Bounded queries with `.limit(50)` and explicit columns in `AdminUserManagement` and `DoctorPatients`.
- **Notifications Schema Canonicalization (H1)**:
  - Canonical schema strictly aligned with `01_schema.sql` (`recipient_type`, `recipient_role`, `recipient_id`, `is_read`, with `type` CHECK `info|warning|success|emergency`).
  - Fixed `PATCH /api/notifications` to compare `recipient_id` with session user's `patients.id` instead of auth user UUID.
- **Postgres Migrations Alignment (M2)**:
  - Created timestamped sequential migrations under `supabase/migrations/` (`20260701` through `20261011`).
  - Converted `supabase/08_fix_permissions.sql` from corrupted UTF-16LE to clean UTF-8.
  - Added `supabase/migrations/README.md` documenting schema versioning and local CLI workflow.
- **RLS InitPlan Optimization (`supabase/11_rls_initplan.sql`)**:
  - Recreates hot RLS policies wrapping `auth.uid()` in `(select auth.uid())` and `(select public.get_user_role())` to ensure PostgreSQL executes auth lookups once per statement (InitPlan) rather than re-evaluating per scanned row (SubPlan).
- **OAuth Callback Error Diagnostics**:
  - Hardened `app/auth/callback/route.ts` and `components/Authentication.tsx` with error parameter capture and user-friendly toast notifications for OAuth configuration mismatches.

---

## [v1.4.0] - 2026-10-11 — Phase 1: Critical Security Overhaul & Access Control

### Security & Hardening
- **Auth Guard Framework (`lib/auth/guard.ts`)**: Server-only authorization module with `requireUser()`, `requireRole()`, and memoized `getPatientProfile()`, mapping typed authentication failures cleanly to HTTP 401/403.
- **Appointment Authorization Lockdown (`app/api/appointments/route.ts`)**:
  - `PATCH` endpoints restricted with role matrix: patients can strictly cancel their own appointments; doctors only update appointments assigned to their clinic/provider; terminal states (`completed`, `cancelled`) return HTTP 409 (`APPOINTMENT_TERMINAL`).
  - Switched from admin service-role client to user-scoped client so Postgres RLS policies are strictly enforced.
  - Returns 404 (not 403) when records are not found or not visible to prevent ID enumeration.
  - Mapped PostgreSQL error code `23505` (slot double-booking) to HTTP 409 (`SLOT_TAKEN`).
  - Provider resolution canonicalized to `healthcare_providers` matching foreign key constraints.
- **Teleconsultation Hardening (`lib/jitsi/config.ts` & `app/api/teleconsult/room/route.ts`)**:
  - Switched video room IDs to cryptographically secure `crypto.randomUUID()`.
  - Enabled Jitsi lobby mode by default (`enableLobbyMode: true`).
  - Stripped recording and livestreaming buttons from toolbar interfaces to safeguard patient privacy.
  - Gated room access to valid consultation time window (15 minutes prior to scheduled start until 30 minutes post-session).
- **Service-Role Client Lockdown**:
  - Replaced service role client with user-scoped client across `app/api/medical-records/route.ts` and `app/api/appointments/route.ts`.
  - Audited and isolated remaining service-role uses to cross-user notification delivery and initial OAuth patient bootstrapping.
- **Edge Middleware Hardening (`middleware.ts`)**:
  - Narrowed route matcher exclusively to protected and auth-redirect routes. Public pages no longer invoke `getUser()`, saving Supabase Auth network latency and egress quota.
  - Server-side role gating: `/admin/*` requires admin role; `/doctor/*` requires doctor or admin role.
  - Unprotected `/camps` for public access.

---

## [v1.3.0] - 2026-10-10 — Master Chatbot Architecture Overhaul (Tiers 0–3)

### Security
- **Eliminated Exposed Endpoints**: Deleted `app/api/fix-db/route.ts` and `app/api/admin/seed-demo/route.ts`. Removed direct `pg` TCP dependency.
- **Scrubbed Sensitive Files**: Cleaned uncommitted scratch credential artifacts and fortified `.gitignore` against tracking secrets.
- **Server-Only Gemini Key**: Completely removed all references to `NEXT_PUBLIC_GEMINI_API_KEY`. API keys are passed strictly through the `x-goog-api-key` header on the server.

### Architecture & Features
- **Tier 0 Red-Flag Emergency Gate (`lib/chat/emergency.ts`)**: Instant rule-based detection for cardiac, stroke, poison, snakebite, and mental health crises. Delivers **108 Ambulance** or **Tele-MANAS 14416** with zero LLM calls.
- **Tier 1 Structured Symptom Composition (`lib/symptoms/`)**: Deterministic composition of clinical advice based on anatomical systems, intensity, duration, and age group (with automatic escalation for infants and elders).
- **Tier 2 Live Suggestions (`lib/chat/suggestions.ts`)**: Debounced prefix suggestions powered by `fuse.js` over 31 rural diseases, catalog symptoms, and common clinical FAQs.
- **Tier 2 Curated Knowledge Engine (`lib/ai/medical-brain.ts`)**: Priority-scored matching with word boundary regexes and GI context gating.
- **Tier 2b IndexedDB Cache (`lib/ai/query-learner.ts`)**: Language-isolated token matching with threshold gates (`>=0.75` direct, `0.50–0.75` suggestions, `<0.50` Tier 3 fallback).
- **Tier 3 Resilient Gemini Layer (`lib/ai/gemini.ts`)**: Server-side fallback cascade (`gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`) with 12s timeout and zero-500 fallback.
- **Tier 3 Governance & Human Review (`supabase/05_chat_cache.sql` & `app/admin/chat-review/`)**: PII-filtered review queue allowing doctors and admins to promote approved responses to Tier 2.

### Testing & Reliability
- **Automated Vitest Test Suite**: Added 15 unit tests across emergency gates, medical brain regressions, symptom composition rules, and a 40-case golden routing suite (`tests/chat-routing.cases.json`). 100% pass rate.

---

## [v1.2.0] - 2026-10-10 — Clinical Medical Brain, Multi-Model Resilient AI & Offline PWA
 
### Added
- **Clinical Decision Knowledge Engine (`lib/ai/medical-brain.ts`):** High-precision clinical decision engine designed for rural medical triage. Resolves nuanced follow-up questions regarding diet (capsaicin/spicy food restriction, soluble vs. insoluble fiber, temporary lactose intolerance during gastroenteritis), hydration (ORS, coconut water, rice starch), and emergency red flags.
- **Multi-Model LLM Resilience (`app/api/ai-chat/route.ts` & `app/api/symptom-analyze/route.ts`):** Cascading candidate fallback loop through `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash-8b`, `gemini-2.0-flash-lite`, and `gemini-1.5-pro` to prevent 404/502 errors if any single Google API endpoint is deprecated or rate-limited.
- **Self-Improving Query Learning Engine (`lib/ai/query-learner.ts`):** Client-side TF-IDF similarity cache backed by browser IndexedDB (`ruralhealth_ai`). Repeated queries load with 0ms server latency, reducing API consumption. Features user feedback weighting (Thumbs Up / Down).
- **Offline Medical FAQ & Triage Engine (`lib/offline/offline-ai.ts`):** Curated static medical triage rules based on NHP/WHO India guidelines. Runs 100% offline in Airplane Mode.
- **Multilingual Speech System (`lib/ai/speech.ts`):** Voice recognition and text-to-speech audio with Hinglish transliteration for Indian English and Hindi speakers.
- **Auto-Submission Symptom Triage Flow:** Step 4 of `SymptomChecker.tsx` now automatically submits the clinical summary to the assistant, removing the need for a manual click on the send button.

### Fixed
- **Vercel Build Compilation Errors:** Fixed duplicate identifier in `symptom-analyze/route.ts` and resolved TypeScript typing on `cachedHit.response` in `SymptomChecker.tsx`.
- **Eliminated Generic Chat Disconnects:** Replaced generic emergency warning loops with context-aware clinical diet and triage answering.

---

## [v1.1.1] - 2026-08-11 — Security & RLS Hotfixes

### Security
- **PostGIS Security Lints:** Addressed Supabase Linter warnings regarding `spatial_ref_sys` by enabling Row Level Security (RLS) on it and applying a public `SELECT` policy, ensuring map features continue to work without exposing the table to malicious updates.
- **Patient RLS Expansion:** Added missing `UPDATE` and `DELETE` policies to `medical_records` and `appointments` for patients. This completely unlocks patient functionality (like cancelling appointments or updating self-submitted health records) that was previously restricted by strict DB-level security policies.

---

## [v1.1.0] - 2026-07-21 — Security Hardening & Final Release

### Added
- **Playwright E2E Test Suite:** Implemented `tests/e2e.spec.ts` with 5 automated test scenarios covering all three user roles (Patient, Doctor, Admin), public page rendering, and unauthorized route blocking. All 5 tests pass at 100%.
- **QA Test Report:** Created `docs/QA_REPORT.md` documenting the test environment, scenarios, pass rates, and security testing methodology.
- **Next.js Edge Middleware:** Added `middleware.ts` to intercept and redirect unauthenticated requests to protected routes at the Edge before any React component renders.
- **shadcn/ui Toast Notifications:** Integrated toast feedback on all authentication events (login success/failure, registration, OAuth errors).
- **Database Seeding Scripts:** Added `scripts/seed_e2e_users.js` and `scripts/fix_roles.js` to enable reproducible E2E test environments.
- **Modular Supabase SQL:** Restructured all database SQL into a sequential, numbered file set (`01_schema.sql` → `06_security_warnings_final.sql`) for clean, repeatable deployments.

### Security
- **RLS Enabled on All Tables:** Enabled Row Level Security on `providers`, `healthcare_providers`, `health_data`, `offline_sync_log`, `doctor_requests`, `notifications` — all previously missing policies.
- **Full CRUD Policies:** Wrote complete INSERT, UPDATE, DELETE, and SELECT RLS policies for every table, scoped by role (patient/doctor/admin).
- **Dropped Over-Permissive Policy:** Removed `patients_service_insert` policy which had `USING(true) WITH CHECK(true)` — effectively bypassing RLS entirely.
- **Function `search_path` Locked:** Applied `SET search_path = public` to all custom `SECURITY DEFINER` functions to prevent search path injection attacks.
- **SECURITY DEFINER REVOKE:** Revoked `EXECUTE` from `anon` and `authenticated` roles on `audit_medical_records`, `get_current_user_role`, `get_tables`, and all 3 overloads of `st_estimatedextent`.
- **Storage Bucket Locked:** Changed `medical-records` Supabase Storage bucket from `public: true` to `public: false` and added scoped RLS policies so users can only access files in their own `user_id/` folder.
- **PostGIS Public Exposure Mitigated:** Revoked `ALL` privileges from `anon` and `authenticated` on `spatial_ref_sys`, `geometry_columns`, and `geography_columns`.
- **TypeScript Build Fix:** Fixed a type error in `middleware.ts` where `request.cookies.delete()` was called with an incompatible object type — corrected to use `cookies.set({ name, value: '' })`.

### Documentation
- **README Rewritten:** Fully rewrote `README.md` to professional standard — covering architecture, security model, file structure, DB setup, testing, and license with copyright year 2025.
- **Removed Inaccurate Claims:** Deleted the "occupation-based smart pre-fill" feature claim that was not implemented.
- **Updated Copyright:** Added `Copyright (c) 2025` to the MIT License section.
- **Updated Tagline:** Changed "every corner of India" to "rural communities globally" for broader, accurate scope.
- **`PROJECT_CONTEXT.md` Sync:** Updated folder structure, last-updated date, and all documentation file references.

### Fixed
- **`doctor_requests` RLS Column:** Fixed RLS policies to use `user_id` instead of `patient_id` (table does not have a `patient_id` column).
- **`spatial_ref_sys` Permission Error:** Replaced `ALTER TABLE` (requires ownership) with `REVOKE ALL` on the PostGIS system table.
- **Playwright Config:** Fixed `playwright.config.ts` to target `localhost:3000` and manage the local dev server lifecycle.
- **`.gitignore`:** Added Playwright output folders (`test-results/`, `playwright-report/`, `blob-report/`) to prevent test artifacts from being committed.

---

## [v1.0.0-rc.2] - The "Polish & GIS" Update

### Added
- **Real-World GIS Mapping:** Integrated PostGIS with Supabase to store and calculate geographical data.
- **Leaflet Interactive Maps:** Added `components/MapView.tsx` pulling from the new `/api/facilities/nearby` endpoint to display hospitals near the user.
- **Global Loading State:** Added Next.js `app/loading.tsx` for a global skeleton UI.
- **Global Error Boundary:** Added Next.js `app/error.tsx` for graceful failure handling.

### Changed
- **Content Security Policy (CSP):** Relaxed CSP in `next.config.mjs` to properly allow OpenStreetMap tile fetching and Jitsi iframe embedding.

### Fixed
- **Leaflet React Errors:** Resolved the persistent "Map container already initialized" error.
- **Dead Buttons:** Connected every isolated `alert()` button in the Footer, Directory, and Camp Locations to actual application logic or external URLs (GitHub, WhatsApp, Emergency 108).
- **Dashboard Routing:** Fixed an invalid `setCurrentPage('campaigns')` hook reference, changing it to the valid `camps` key.
- **Location Sharing:** The "Share Location" emergency button now actively pings the browser Geolocation API and generates a Google Maps URL.

### Removed (Dead Code Cleanup)
- **Stale API Wrappers:** Deleted 5 unused files in `lib/api/` (`appointments.ts`, `providers.ts`, etc.) as the components fetch directly now.
- **Unused CSS:** Deleted `styles/globals.css` (duplicate of `app/globals.css`).
- **Unused Components:** Removed `theme-provider.tsx` and 15 excess boilerplate documents from earlier iterations.

---

## [v1.0.0-rc.1] - The "AI & Records" Update

### Added
- **Floating AI Assistant:** Integrated Google Gemini into a persistent `FloatingChat.tsx` component that follows the user across the SPA.
- **Medical Records Storage:** Implemented Supabase Storage for uploading and viewing PDFs/Images in `PatientRecords.tsx`.
- **OAuth Auto-Create:** Added server-side API `/api/auth/ensure-patient` to automatically create a `patients` table row when users log in via Google OAuth.

### Changed
- **Session Management:** Refactored Supabase auth middleware to handle timeouts and session errors smoothly.
- **Disease Data:** Refactored the `HealthInfoHub` to eliminate duplicate disease arrays and gated it behind the symptom checker.

### Fixed
- **Chat Connections:** Resolved connection and streaming errors in the Gemini AI Chat endpoint.
- **Row Level Security (RLS):** Fixed a critical bug where OAuth users couldn't create their own patient records due to strict RLS policies. Fixed via `008_oauth_patient_rls.sql` and server-side bypassing.

---

## [v0.9.0-beta] - The "Platform Overhaul" Update

### Added
- **AI Symptom Checker:** Built a 4-step wizard collecting 12 body parts and symptoms, feeding into a structured Gemini Analysis API.
- **Role-Based Auth:** Strictly isolated Patient vs Provider authentication paths.

### Changed
- **UX Redesign:** Removed all "Demo" mock-data buttons. Transitioned to a 2-item header nav with a "My Care" dropdown and a mobile bottom tab bar.
- **Real Database Wiring:** Ripped out hardcoded mock data arrays across the `Dashboard`, `Directory`, and `CampLocations`, wiring them up to Supabase.

### Fixed
- **Forgot Password Flow:** Fixed the Supabase password reset redirect URL to correctly point back to `/auth/callback`.
