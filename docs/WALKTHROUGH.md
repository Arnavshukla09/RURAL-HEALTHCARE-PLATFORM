# Rural Healthcare Platform — Walkthrough

Welcome to the Rural Healthcare Platform. This document outlines the key workflows and functionality of the application across its three primary user roles: **Patients**, **Doctors**, and **Admins**.

**Live Demo:** [rural-healthcare-platform.vercel.app](https://rural-healthcare-platform.vercel.app)

**Demo Credentials:**
| Role | Email | Password |
|---|---|---|
| Patient | `patient@demo.com` | `Patient@123` |
| Doctor | `doctor@demo.com` | `Doctor@123` |
| Admin | `admin@demo.com` | `Admin@123` |

---

## 1. The Patient Journey

### 1.1 Authentication & Onboarding
When a patient signs up (either via Email/Password or Google OAuth), the system automatically provisions a secure patient profile using a backend database trigger (`handle_new_user`).
- **Email/Password:** Standard registration form. Supabase sends a confirmation email.
- **Google OAuth:** Single click sign-in. The `/api/auth/ensure-patient` route guarantees a `patients` table row is created even when the trigger is bypassed by OAuth.
- **First Login:** The patient is prompted with a "Complete Your Medical Profile" banner to enter height, weight, blood type, and chronic conditions.

### 1.2 Patient Dashboard
After login, the patient lands on `/dashboard`, which displays:
- **Upcoming Appointments** — fetched live from the `appointments` table.
- **Registered Health Camps** — camps the patient has signed up for.
- **AI Symptom Checker shortcut** — quick entry to the triage flow.
- **Notification Bell** — real-time unread notification count (powered by Supabase Realtime).

### 1.3 AI Symptom Checker
Located at `/symptom-checker`:
- **4-Step Guided Flow:** The patient selects a body area (e.g., Head, Chest), picks localized symptoms, and answers severity questions.
- **Gemini Triage:** Google Gemini Flash Lite analyzes the inputs and returns an urgency level (Low / Medium / High / Emergency) with immediate next steps.
- **Handoff to Chat:** The AI seamlessly passes the symptom context to the persistent floating chatbot so the patient can ask follow-up questions without repeating symptoms.

### 1.4 Finding Healthcare (Map)
Located at `/locations`:
- **PostGIS Proximity Search:** The map auto-detects the user's location via the browser Geolocation API and queries the `healthcare_facilities` table using `ST_DWithin` for facilities within a 25km radius.
- **Draggable Pin:** The user can drag the map pin to any rural location to recalculate the nearest facilities in real time.
- **Facility Types:** Filters for hospitals, clinics, pharmacies, labs, and health posts.

### 1.5 Teleconsultation Booking
Located at `/consultation`:
- **Book a Slot:** The patient selects a doctor from the `healthcare_providers` directory, picks a date/time, and submits.
- **Video Call:** At the scheduled time, the patient clicks "Join Call" on their appointment card. A unique **Jitsi Meet** room is generated instantly inside the browser — no app installation required.

### 1.6 Medical Records
Located at `/records`:
- **View Records:** Patients see doctor-uploaded prescriptions, lab results, and diagnoses.
- **Upload Records:** Patients can manually upload past prescriptions (PDF/JPG) directly into Supabase Storage.
- **Vitals Logging:** Patients can log daily health metrics (blood pressure, glucose, etc.) via the health-data API.

### 1.7 Health Information Hub
Located at `/health-info`:
- Browse curated articles on common rural health conditions, government health schemes, and preventive care tips.
- Available without requiring a symptom check first.

### 1.8 Emergency Module
Located at `/emergency`:
- Displays first-aid cards for common emergencies (snake bite, drowning, burns, etc.).
- **"Share Location"** button pings the Geolocation API and generates a shareable Google Maps link.
- Quick-dial buttons for emergency services (108 Ambulance).

---

## 2. The Doctor Journey

### 2.1 Login & Dashboard
Doctors log in with their credentials and are routed to `/doctor/dashboard`. The middleware (`middleware.ts`) validates their session at the Edge before rendering.

### 2.2 Appointment Requests
Located at `/doctor/requests`:
- Doctors see all pending consultation requests submitted by patients.
- They can review the patient's self-reported symptoms before approving or rejecting.

### 2.3 Patient Management
Located at `/doctor/patients`:
- Doctors have read access to all patient profiles and their full medical record history.
- Records are scoped by the `doctor_read_all_medical_records` RLS policy.

### 2.4 Teleconsultation
- At the appointment time, the doctor clicks "Join Call" and is taken directly into the unique Jitsi room — same URL as the patient's.
- Post-consultation, the doctor navigates to the patient's record to issue a Digital Prescription or Diagnosis which is immediately visible to the patient.

### 2.5 Doctor Verification Workflow
New users wishing to register as doctors submit a request via `/api/doctor-requests` (POST), providing their license number, specialization, and hospital affiliation. Admins review and approve/reject these requests, which automatically updates the user's role in the `patients` table to `doctor`.

---

## 3. The Admin Journey

### 3.1 System Dashboard
Located at `/admin/dashboard`:
- High-level counts of registered users, pending doctor requests, active health camps, and total medical records.

### 3.2 User Management
Located at `/admin/users`:
- Admins view all registered patients.
- Can verify new doctor registrations by approving `doctor_requests` entries.

### 3.3 Medical Records Management
Located at `/admin/records`:
- Full view of all medical records across all patients.
- Inline **Edit** and **Delete** capabilities secured by role-checked API endpoints.

### 3.4 Appointments Overview
Located at `/admin/appointments`:
- View and manage all appointments system-wide regardless of the doctor or patient involved.

### 3.5 Health Camp Management
Located at `/admin/campaigns`:
- Create, edit, and schedule Health Camps (e.g., Polio Drops, TB Screening, Eye Check-ups).
- Camps are immediately visible on the public `/camps` page and are listed in patient dashboards.

### 3.6 Notifications
Located at `/admin/notifications`:
- Broadcast notifications to all users, a specific role (all doctors, all patients), or an individual patient.
- Notifications appear in real time via Supabase Realtime in the patient's notification bell.

---

## 4. Bilingual Support
At any point, any user can click the `A/अ` toggle in the top navigation bar. The entire interface — including the AI Chatbot responses and Symptom Checker — instantly switches between **English** and **Hindi**, ensuring accessibility for non-English speakers in rural communities.

---

## 5. Offline / PWA Support
The platform is a Progressive Web App (PWA) powered by `@ducanh2912/next-pwa`. When connectivity is lost:
- The service worker (`public/sw.js`) caches critical routes.
- Pending data mutations (appointments, health-data entries) are queued locally and synced to the database via `/api/offline-sync` when connectivity is restored.

---

## 6. Security Architecture

### Edge-Level Protection
All requests to protected routes (`/dashboard`, `/records`, `/admin/*`, `/doctor/*`, etc.) pass through `middleware.ts`, which runs at the **Vercel Edge** before any page component renders. If no valid Supabase session cookie is found, the request is redirected to `/login` immediately.

### Database-Level Protection (RLS)
Every database table has **Row Level Security** enabled with scoped policies:

| Table | Patient | Doctor | Admin |
|---|---|---|---|
| `patients` | Own row only | All rows (read) | All rows (read) |
| `medical_records` | Own records | All records (read/write) | All records (read/write/delete) |
| `appointments` | Own appointments | All appointments (read) | All appointments (read) |
| `notifications` | Own + broadcast | — | Create/delete all |
| `camps` / `healthcare_facilities` | Public read | Public read | Full write |
| `doctor_requests` | Own request | — | Full control |

### API-Level Protection
- Every API route validates the session via `supabase.auth.getUser()` before processing.
- All API request bodies are validated with **Zod schemas** to prevent malformed or malicious input.
- **Rate limiting** on all endpoints via Upstash Redis (`@upstash/ratelimit`) prevents abuse and brute-force attacks.

---

## 7. Automated Testing
The project includes a Playwright E2E test suite in `tests/e2e.spec.ts`.

**Latest results (July 21, 2026):**
| Test | Result | Duration |
|---|---|---|
| Public Pages Load Successfully | ✅ Pass | 3.3s |
| Security: Unauthenticated Access Prevented | ✅ Pass | 3.3s |
| Patient Flow: Login + Dashboard + Symptom Checker | ✅ Pass | 8.5s |
| Doctor Flow: Login + Doctor Dashboard | ✅ Pass | 11.8s |
| Admin Flow: Login + Admin Controls | ✅ Pass | 9.3s |

📄 **[Full QA Report →](QA_REPORT.md)**
