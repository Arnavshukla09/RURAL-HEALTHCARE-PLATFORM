# Changelog

All notable changes to the Rural Healthcare Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres roughly to chronological feature milestones.

---

## [Unreleased] - Current Sprint

### Added
- **Master Documentation Suite:** Generated production-grade documentation across `docs/` (`PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `API_REFERENCE.md`, `DATABASE.md`, `COMPONENTS.md`, `ROADMAP.md`).
- **Agent Rules:** Created `.agents/AGENTS.md` to strictly govern AI coding assistant behavior regarding project documentation integrity.

### Fixed
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
