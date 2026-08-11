# Changelog

All notable changes to the Rural Healthcare Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres roughly to chronological feature milestones.

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
