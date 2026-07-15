# Project Roadmap: Rural Healthcare Platform

This document outlines the current state of the project, technical debt, and a prioritized roadmap for future development. It is categorized to provide clear direction for incoming contributors.

---

## 🟢 Completed
- **Authentication:** Full Supabase Auth integration (Email, Google OAuth, Guest Mode).
- **Core Database Architecture:** PostgreSQL schema mapping patients, providers, appointments, and records.
- **AI Symptom Checker:** Integration with Google Gemini for structured clinical triaging.
- **Teleconsultation Engine:** Dynamic Jitsi WebRTC room generation for low-bandwidth video calls.
- **Facility Mapping:** PostGIS spatial setup with `react-leaflet` to display nearby OpenStreetMap facilities.
- **API Layer:** Comprehensive Next.js serverless functions with strict Zod validation.
- **UI Framework:** Responsive, utility-first design via Tailwind CSS and `shadcn/ui`.
- **Next.js App Router:** Migrated from a single-page state (`setCurrentPage`) to native Next.js file-based routing (`app/dashboard`, etc.) to enable code splitting and URL linking.
- **Progressive Web App (PWA):** Configured with `next-pwa`, `manifest.json`, and an App Router compatible Service Worker for Android home screen installation and offline caching.
- **Global App Context:** Refactored heavily prop-drilled state into React Context API (`AppProvider`).
- **Distributed Rate Limiting:** Migrated in-memory rate limiting to a Redis store (`@upstash/ratelimit`) suitable for Edge/Serverless environments.
- **E2E Testing:** Configured Playwright end-to-end tests enforced by GitHub Actions CI/CD pipelines.

---

## 🟡 In Progress
- **Real-World Data Seeding:** Finalizing the script (`seed_mp_facilities.js`) to import real MP healthcare facilities from OpenStreetMap into the PostGIS database.
- **Offline Data Sync:** Basic IndexedDB queuing is active, but robust background syncing requires completion.

---

## 🔴 Pending
- **Provider Portal:** A dedicated, robust UI for doctors to manage schedules, view aggregated patient records, and emit digital prescriptions.
- **SMS/Email Notifications:** Integration with Twilio/Resend to notify users of upcoming appointments.

---

## 🛠 Technical Debt
- **React Query Integration:** Now that App Router is established, move data fetching out of manual `useEffect` into `react-query` or Next.js Server Components where appropriate.

---

## 🔒 Security Improvements
- **Storage Bucket RLS:** Ensure Supabase Storage buckets for `medical-records` have strict Row Level Security policies (currently only enforced at the PostgreSQL metadata level).
- **Rate Limit Hardening:** Move rate limiting to Edge Middleware rather than per-route execution to reject malicious requests faster.
- **Strict Content Security Policy (CSP):** Tighten iframe permissions (currently broad to support Jitsi) to prevent clickjacking.

---

## ⚡ Performance Improvements
- **React Query Integration:** Replace manual `useEffect` data fetching with TanStack Query to enable aggressive client-side caching, deduping, and background refetching.
- **Dynamic Imports:** Use `next/dynamic` to lazy-load heavy components (like Leaflet Maps and Jitsi) only when the user navigates to those specific tabs.
- **Database Partitioning:** Prepare the `health_data` table for time-based partitioning to maintain query speed as longitudinal IoT vital data grows.

---

## 🎨 UX Improvements
- **Form Persistence:** Save uncompleted Symptom Checker state to `localStorage` so users don't lose progress if the browser refreshes.
- **Micro-animations:** Implement Framer Motion for smoother transitions between the SPA tabs.
- **Granular Loading States:** Replace full-screen loading spinners with localized skeleton loaders (already started with `app/loading.tsx`).

---

## 🏗 Deployment Improvements
- **CI/CD Pipeline:** Implement GitHub Actions to run TypeScript type checking and linting on every Pull Request.
- **Database Branching:** Utilize Supabase Branching to automatically generate preview databases for Pull Requests.
- **Vercel Previews:** Enforce successful deployment checks before allowing merges into the `main` branch.

---

## 🧪 Testing Improvements
- **Unit Testing:** Introduce `Vitest` for testing isolated business logic (e.g., offline sync queue managers, Zod parsers).
- **Component Testing:** Utilize React Testing Library for verifying accessible interactions in `shadcn/ui` components.
- **E2E Testing:** Implement `Playwright` to test the critical user flow: Registration → AI Symptom Check → Book Consultation → View Map. (Current test coverage is 0%).

---

## 💡 Future Ideas
- **Voice-Based AI:** Implement Web Speech API (Speech-to-Text) allowing users to speak their symptoms in Hindi directly to the AI, bypassing keyboard entry.
- **IoT Wearable Integration:** Bluetooth integrations for automatic syncing of blood pressure cuffs and glucose monitors into the `health_data` API.
- **Pharmacy Inventory API:** Connect the facility map to real-time pharmacy inventory systems so users know if a prescribed drug is in stock nearby.

---

## 📉 Low Priority
- **Advanced Analytics Dashboard:** Admin panel for tracking regional disease outbreaks based on AI symptom queries.
- **Custom User Themes:** Allowing users to choose color accents (outside of the essential high-contrast accessibility mode).
