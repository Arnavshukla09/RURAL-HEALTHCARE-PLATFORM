# Changelog

All notable changes to the Rural Healthcare Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres roughly to chronological feature milestones.

---

## [Unreleased] - Current Sprint

- **Next.js App Router Migration:** Fully transitioned from a React Single Page Application (SPA) state-based router to Next.js native `app/` directory routing, creating individual page files for 39 static routes.
- **Global Application Context:** Extracted user auth and UI state out of monolithic wrappers into a `components/providers/AppProvider.tsx` context wrapper.
- **Production Rate Limiting:** Installed `@upstash/ratelimit` and `@upstash/redis` to upgrade API rate-limiting across 13 routes from a localized memory-cache to a globally distributed Vercel-compatible Redis cache (with a graceful local-memory fallback).
- **Playwright E2E Testing:** Initialized an end-to-end testing suite with `@playwright/test` mapping critical flows (landing, login, symptom-checker).
- **GitHub Actions CI/CD:** Added a `.github/workflows/playwright.yml` automated pipeline to enforce testing on PRs and pushes to `main`.
- **Next-PWA Offline Support:** Validated the `@ducanh2912/next-pwa` integration to correctly cache React Server Components and App Router navigation fetches.
- **Dynamic Registered Camps:** Dashboard now actively fetches and displays the actual health camps the user has registered for, directly from the `medical_records` table.
- **Inline Symptom Chat:** Replaced the static symptom checker end screen with an interactive embedded AI chat for contextual follow-up questions.
- **Top-Level Health Hub:** Moved the Health Information Hub to the main Navbar and removed the symptom-check prerequisite gate, allowing free exploration of static medical data.
- **Draggable Map Pointer:** Made the user's location marker draggable in the Leaflet map, automatically refetching and re-centering nearby facilities upon dropping the pin.
- **Master Documentation Suite:** Generated production-grade documentation across `docs/` (`PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `API_REFERENCE.md`, `DATABASE.md`, `COMPONENTS.md`, `ROADMAP.md`).
- **Agent Rules:** Created `.agents/AGENTS.md` to strictly govern AI coding assistant behavior regarding project documentation integrity.
- **Admin Record Management:** Empowered Admins with inline Edit and Delete capabilities for all patient medical records, secured by role-checked REST API endpoints.
- **Patient Medical Profile:** Introduced a one-time onboarding form for new patients to establish foundational health metrics (Height, Weight, Blood Group, Chronic Conditions).
- **Database Security Hardening:** Executed a comprehensive database security review, revoking public execution rights for `SECURITY DEFINER` functions, neutralizing mutable search paths, and dropping excessively permissive RLS policies.

### Changed
- **Real MP Healthcare Data:** Stripped out generic mock data in the Directory and Hospitals tabs, replacing it with hardcoded real-world doctors and facilities from Madhya Pradesh (e.g., AIIMS Bhopal, MY Hospital Indore).
- **Camp Campaigns Overhaul:** Reworked the CampLocations component to use dynamic current-year dates with tentative labels, removed arbitrary distance/travel-time estimates, and fixed the text-based location search filter.

### Fixed
- **Patient Profile Creation RLS:** Fixed a Row-Level Security bug preventing manual records from saving by utilizing `createAdminClient()` (Service Role) to bypass RLS during patient auto-creation.
- **Medical Records API Insert RLS:** Bypassed RLS on the `/api/medical-records` POST route via service role to allow patients to successfully insert their own camp registrations without violating provider-only insert policies.
- **Infinite Recursion DB Error:** Fixed the recursive loop in `admin_read_all_patients` and related policies by introducing a `SECURITY DEFINER` function `public.get_user_role()` in a new SQL migration script.
- **Provider Optionality:** Dropped the `NOT NULL` constraint on `provider_id` in the `medical_records` table (via migration script) to support patient-uploaded records and camp registrations.
- **Gemini Context Sequence Bug:** Fixed a `400 Bad Request` API connection error by preventing sequential `user` messages in the Gemini chat history.
- **PostGIS Seeding Script:** Fixed `scripts/seed_mp_facilities.js` to correctly pass `lat`/`lon` to the database instead of manually passing `geom` and non-existent `source` columns.
- **SQL Migration Conflicts:** Updated `006_facilities_postgis.sql` to explicitly `DROP TABLE IF EXISTS` and `DROP FUNCTION IF EXISTS` to prevent schema mismatch errors during deployment on existing Supabase instances.

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
