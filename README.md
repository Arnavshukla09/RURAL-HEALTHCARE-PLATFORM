# Rural Health Care Platform

> **Bridging the healthcare gap through scalable technology, intelligent triage, and secure teleconsultation.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FArnavshukla09%2FRURAL-HEALTHCARE-PLATFORM)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

**Live Demo:** [rural-healthcare-platform.vercel.app](https://rural-healthcare-platform.vercel.app)

A comprehensive, full-stack healthcare platform designed specifically for rural communities. It provides AI-powered health assistance, secure teleconsultations, geographical facility mapping, secure medical records, and strict role-based access control (RBAC).

---

## 🎯 Overview

Access to quality healthcare in rural regions is heavily limited by geography, a lack of specialists, and poor medical record keeping. This platform solves these issues by bringing the clinic to the patient's smartphone, connecting them to regional doctors, providing immediate AI triage, and organizing local health camps.

---

## 🚀 Key Features

### 👨‍⚕️ Multi-Role Portals
- **Patients:** Book appointments, manage medical history, utilize the AI symptom checker, and join secure teleconsultations.
- **Doctors:** Access a dedicated dashboard to review patient histories, approve consultation requests, and conduct video calls.
- **Admins:** Oversee the entire ecosystem, manage medical records, verify doctors, and organize regional health camps.

### 🤖 Resilient Offline-First AI & Medical Brain
- **Tiered Multi-Model LLM Cascade:** Routes queries through an automatic fallback chain (`gemini-1.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash-8b` → `gemini-2.0-flash-lite` → `gemini-1.5-pro`) ensuring queries never return unhandled `502` or `500` errors.
- **Clinical Decision Knowledge Engine (`medical-brain.ts`):** Context-aware clinical decision engine resolving follow-ups on diet (spicy foods, soluble vs. insoluble fiber, milk/dairy), hydration formulas (ORS, coconut water), and warning signs before making remote calls.
- **Self-Improving Query Learning Engine (`query-learner.ts`):** Uses client-side **TF-IDF similarity** stored in IndexedDB (`ruralhealth_ai`). Repeated queries load with 0ms server latency and zero API consumption. Includes user feedback weighting (Thumbs Up / Down).
- **Zero-Failure Offline Symptom Triage (`offline-ai.ts`):** Evaluates selected symptom combinations, categorizes clinical urgency (Emergency, High, Medium, Low), and delivers rural-appropriate home care and PHC/CHC guidance without internet connectivity.
- **Multilingual Voice Recognition & Synthesis (`speech.ts`):** Voice input and text-to-speech audio with Hinglish transliteration for Indian English and Hindi speakers.

### 📱 Modern PWA & Offline Outbox Architecture
- **Serwist Service Worker:** Pre-caches static assets and the bilingual `/offline` fallback page with CacheFirst policies.
- **NetworkOnly Private API Defense:** Sensitive patient data (`/api/appointments`, `/api/medical-records`, `/api/notifications`, `/api/offline-sync`) is never written to disk, preventing data leakage on shared village smartphones.
- **Atomic Offline Outbox (`lib/offline/outbox.ts`):** Operations created while offline are queued in IndexedDB with client-generated UUIDs and replayed with at-most-once idempotency (`processed_client_ops`).
- **Live Sync Badge:** UI indicators inform users of pending outbox queue depth and synchronization status.

### 🗺️ Geographical Mapping (PostGIS)
- **Interactive Map:** Built with React-Leaflet and OpenStreetMap, dynamically imported with zero SSR overhead.
- **Proximity Search:** Finds the nearest hospitals, clinics, and pharmacies. The database utilizes **PostGIS geography data** with rounded coordinates to maximize Edge CDN caching.

### 📹 Secure Teleconsultation
- **Unguessable Cryptographic Rooms:** Embedded video conferencing using Jitsi Meet with randomized UUID rooms (`crypto.randomUUID()`) and enforced lobby screening to prevent room guessing.

---

## 🛠️ Architecture & Technology Stack

The platform employs a modern, serverless architecture optimized for low bandwidth, zero data leaks, and 100% Free-Tier sustainability ($0 spend).

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 14 (App Router, Server Components + ISR, React 18, TypeScript) |
| **PWA & Caching** | Serwist (`@serwist/next`), Service Worker API, IndexedDB |
| **Styling & UI** | Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons |
| **Backend & Database** | Supabase (PostgreSQL 15, PostGIS, Row Level Security) |
| **Authentication** | Supabase SSR Auth (HttpOnly cookies, Google OAuth, Email/Password) |
| **AI Integration** | Google Gemini API (Multi-model cascade: `gemini-2.5-flash`, `gemini-3.1-flash-lite`, `gemini-3.5-flash`) |
| **Rate Limiting & Cache** | Upstash Redis REST + in-memory fallback, circuit breaker |
| **Mapping** | Leaflet, React-Leaflet, CartoDB Positron tiles |
| **Testing** | Vitest (Unit tests), Playwright (E2E), k6 (Load testing) |
| **Deployment** | Vercel (Hobby Tier) |

---

## 🛡️ Security & Authentication

Security is deeply integrated at both the network and database layers to ensure the strict privacy of medical records.

- **Edge Middleware Protection:** Next.js Edge Middleware strictly intercepts unauthorized access to protected routes (`/dashboard`, `/records`, etc.), validating JWTs server-side before rendering any component.
- **Row-Level Security (RLS):** All database tables are fortified using PostgreSQL RLS policies.
  - *Patients* can strictly read/write only their own records.
  - *Doctors* are explicitly granted access to records of patients assigned to them.
  - *Admins* have restricted systemic access for administration.
- **Data Integrity:** Graceful error handling and robust toast notifications provide immediate feedback on authentication attempts, minimizing surface exposure to client-side vulnerabilities.

---

## 🗄️ Database Architecture & Request Routing

The platform employs a hybrid request routing model, strictly separating public client-side interactions from secure server-side operations against our normalized **PostgreSQL (Supabase)** database.

### 1. Data Models
- **`patients` & `healthcare_providers`**: Core profiles linked 1-to-1 with Supabase Auth identities.
- **`medical_records`**: A secure ledger for diagnoses and prescriptions, heavily restricted by RLS.
- **`appointments`**: Tracks scheduling and automatically allocates Jitsi teleconsultation rooms.
- **`healthcare_facilities` & `camps`**: Spatially indexed tables using **PostGIS `geography`** to enable lightning-fast `< 50km` radius searches.

### 2. Request Routing & Security Boundary
The application utilizes Next.js Server Components and API Routes to maintain a strict security perimeter:

- **Client-Side Requests (Direct DB Access):**
  - Frontend components query the database using the public `anon` key.
  - **Security:** Every request is strictly evaluated against PostgreSQL **Row Level Security (RLS)** policies. Users can only fetch and update their own assigned rows (`user_id = auth.uid()`).
  - *Example:* A patient reading their own appointments on the Dashboard.

- **Server-Side API Routes (Elevated Access):**
  - Next.js API Routes (e.g., `/api/medical-records`) execute securely on the backend using the `SUPABASE_SERVICE_ROLE_KEY`.
  - **Security:** These routes bypass RLS but enforce **custom server-side validation** (rate limiting, Zod schema validation, and role checking) before performing sensitive insertions or deletions.
  - *Example:* Uploading a new medical record document or fetching administrative reports.

*All initialization scripts, including schemas, RLS policies, and PostGIS triggers, are located in the `supabase/` directory and must be executed sequentially.*

---

## 📁 Project Structure

```text
├── app/                  # Next.js App Router (Pages, API routes, Layouts)
│   ├── api/              # Serverless API endpoints (Auth, AI, Supabase)
│   ├── (auth)/           # Authentication routes
│   └── (dashboards)/     # Protected role-specific dashboards
├── components/           # Reusable React components (shadcn/ui, custom)
├── docs/                 # Detailed documentation and QA Reports
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and Supabase clients
├── public/               # Static assets and PWA service workers
├── scripts/              # Database seeding and testing utility scripts
├── supabase/             # SQL schemas, RLS policies, and triggers
├── tests/                # Playwright End-to-End (E2E) test suites
└── middleware.ts         # Edge authentication guard
```

---

## 🧪 Quality Assurance & Testing

This project maintains a high standard of reliability through automated **Playwright End-to-End (E2E) testing**. 

The testing suite automatically spawns browser instances to verify:
- Complete end-to-end user journeys (Patient, Doctor, Admin).
- Role-based access control and dashboard routing.
- The integrity of the Edge Middleware security perimeter.

📄 **[View the detailed QA Test Report here](docs/QA_REPORT.md)**

---

## 💻 Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM.git
cd RURAL-HEALTHCARE-PLATFORM
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API key (Server-only)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODELS=gemini-3.5-flash,gemini-3.1-flash-lite
```

### 4. Database Setup
Execute the SQL files located in the `supabase/` directory within your Supabase SQL editor in sequential order (`01_base_schema.sql` through `09_scale_and_security.sql`).

### 5. Run the Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### 6. Automated Testing & Verification
```bash
# Run Vitest unit tests (50 tests across 10 suites)
npm run test:unit

# Type check and lint
npx tsc --noEmit
npm run lint

# Production build check
npm run build

# Run Playwright E2E tests
npx playwright test

# Staging Load-Test Smoke Check (Never run on production)
npm run loadtest:smoke
```

---

## 📄 License
Copyright (c) 2026. This project is licensed under the MIT License - see the LICENSE file for details.

---

