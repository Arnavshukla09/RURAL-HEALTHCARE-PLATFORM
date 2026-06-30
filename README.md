# RuralHealth Platform

> Bridging healthcare gaps in rural India through technology.

**Live:** [rural-healthcare-platform.vercel.app](https://rural-healthcare-platform.vercel.app)

A full-stack healthcare platform built for rural Indian communities, providing AI-powered health assistance, teleconsultation, medical record management, and access to nearby healthcare facilities — all in English and Hindi.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | Supabase (PostgreSQL + Auth + Storage + RLS) |
| **AI** | Google Gemini 1.5 Flash |
| **Teleconsultation** | Jitsi Meet (embedded iframe) |
| **Maps** | OpenStreetMap via Leaflet |
| **Deployment** | Vercel (auto-deploy from GitHub) |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    VERCEL (Frontend + API)            │
│                                                      │
│  app/page.tsx ─── Single Page Application            │
│       │                                              │
│       ├── components/Authentication.tsx               │
│       ├── components/Dashboard.tsx                    │
│       ├── components/SymptomChecker.tsx               │
│       ├── components/HealthInfoHub.tsx                │
│       ├── components/ConsultationPortal.tsx           │
│       ├── components/AppointmentManager.tsx           │
│       ├── components/PatientRecords.tsx               │
│       ├── components/Directory.tsx                    │
│       ├── components/EmergencyModule.tsx              │
│       ├── components/CampLocations.tsx                │
│       ├── components/MapView.tsx                      │
│       ├── components/FloatingChat.tsx  ── Gemini AI   │
│       └── components/JitsiMeeting.tsx                │
│                                                      │
│  app/api/ ─── Server-side API Routes                 │
│       ├── ai-chat/          → Gemini health chat     │
│       ├── appointments/     → CRUD appointments      │
│       ├── auth/ensure-patient/ → Patient auto-create │
│       ├── auth/profile/     → User profile           │
│       ├── health-data/      → Vitals & metrics       │
│       ├── medical-records/  → Records CRUD           │
│       ├── notifications/    → User notifications     │
│       ├── providers/        → Healthcare providers   │
│       ├── symptom-analyze/  → AI symptom analysis    │
│       └── teleconsult/room/ → Jitsi room management  │
│                                                      │
│  app/auth/callback/ ─── OAuth code exchange          │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│                  SUPABASE (Backend)                   │
│                                                      │
│  PostgreSQL Tables:                                  │
│    patients, healthcare_providers, appointments,     │
│    medical_records, health_data, notifications,      │
│    health_campaigns, offline_sync_queue              │
│                                                      │
│  Auth: Email/Password + Google OAuth                 │
│  Storage: medical-records bucket (prescriptions)     │
│  RLS: Row-level security on all tables               │
└──────────────────────────────────────────────────────┘
```

---

## Features

### 1. Authentication
- **Email/Password** signup and login with email confirmation
- **Google OAuth** sign-in with automatic patient profile creation
- **Forgot Password** with email reset link
- OAuth callback route (`/auth/callback`) handles code exchange server-side

### 2. AI-Powered Symptom Checker
- 4-step guided flow: select body area → choose symptoms → AI analysis → personalized results
- 12 body regions with symptom mapping
- Powered by Gemini 1.5 Flash via `/api/symptom-analyze`
- Urgency classification: Low / Medium / High / Emergency
- Results link to relevant disease information in HealthInfoHub

### 3. Floating AI Health Assistant
- Gemini-powered chatbot accessible from every page (bottom-right button)
- Health-only conversation mode — refuses non-health questions
- Conversational memory (last 8 messages)
- Quick action buttons: "Check my symptoms", "Find nearest hospital", etc.
- Bilingual (English/Hindi)
- Server-side API (`/api/ai-chat`) keeps API key private

### 4. Health Information Hub
- **Gated access** — only accessible after completing symptom checker
- Auto-filters diseases relevant to the user's symptoms
- 25+ diseases common in rural India (Malaria, Dengue, TB, Typhoid, etc.)
- Vaccination schedules (children + adults)
- Each disease card: causes, symptoms, treatment, prevention

### 5. Consultation Booking
- Three types: Video, Audio, Chat consultation (all free)
- Provider selection from real database (healthcare_providers table)
- Appointment stored in DB with teleconsult room ID
- Jitsi Meet integration for video calls

### 6. Appointment Management
- View upcoming and past appointments
- Book new appointments with doctor selection, date/time
- Join video call directly from appointment card
- Patient ID securely derived from session (never from client)

### 7. Medical Records
- **First-time user CTA** — prominent upload/add prompt for new users
- **Manual entry** — select record type (Prescription, Lab Report, Diagnosis, Vaccination) + notes
- **File upload** — JPG, PNG, PDF upload to Supabase Storage
- Latest vitals display: BP, Temperature, Pulse, Blood Sugar, SpO₂, Weight
- Records fetched via secure server API

### 8. Healthcare Directory
- Browse verified healthcare providers
- Filter by specialization, location, availability
- Contact information and facility details
- Data from `healthcare_providers` table (seeded with real Indian facilities)

### 9. Emergency Module
- One-tap emergency numbers (108 ambulance, 112 police)
- Nearest hospital finder
- First aid quick reference
- Emergency contact management

### 10. Health Camps & Campaigns
- Upcoming vaccination drives, checkup camps, blood donation events
- Filter by type (vaccination, checkup, blood donation)
- Location and schedule details
- Map view integration

### 11. Map View
- OpenStreetMap-based facility finder
- Healthcare providers, hospitals, PHCs plotted on map
- Click markers for details and directions

### 12. Teleconsultation (Jitsi)
- Embedded Jitsi Meet video calls
- Room IDs auto-generated per appointment
- Camera/microphone permissions configured via CSP

---

## Project Structure

```
├── app/
│   ├── page.tsx                    # Main SPA entry point (routing, state, auth)
│   ├── layout.tsx                  # Root layout with metadata
│   ├── globals.css                 # Global styles and CSS variables
│   ├── api/
│   │   ├── ai-chat/route.ts       # Gemini floating chat (server-side)
│   │   ├── appointments/route.ts  # GET/POST appointments
│   │   ├── auth/
│   │   │   ├── ensure-patient/route.ts  # Patient auto-create (bypasses RLS)
│   │   │   └── profile/route.ts         # GET/PUT user profile
│   │   ├── health-data/route.ts   # Vitals & health metrics
│   │   ├── medical-records/route.ts # Records CRUD
│   │   ├── notifications/route.ts # User notifications
│   │   ├── offline-sync/route.ts  # Offline data sync
│   │   ├── providers/route.ts     # Healthcare providers
│   │   ├── symptom-analyze/route.ts # AI symptom analysis
│   │   └── teleconsult/room/route.ts # Jitsi room management
│   └── auth/
│       └── callback/route.ts      # OAuth code exchange
│
├── components/
│   ├── Authentication.tsx         # Login, signup, Google OAuth, forgot password
│   ├── Dashboard.tsx              # Patient dashboard with stats & quick actions
│   ├── SymptomChecker.tsx         # 4-step AI symptom analysis flow
│   ├── HealthInfoHub.tsx          # Diseases & vaccination encyclopedia
│   ├── ConsultationPortal.tsx     # Book video/audio/chat consultations
│   ├── AppointmentManager.tsx     # View/manage/book appointments
│   ├── PatientRecords.tsx         # Medical records + upload + manual add
│   ├── Directory.tsx              # Healthcare provider directory
│   ├── EmergencyModule.tsx        # Emergency contacts & first aid
│   ├── CampLocations.tsx          # Health camps & campaigns
│   ├── MapView.tsx                # OpenStreetMap facility finder
│   ├── FloatingChat.tsx           # Gemini AI chat widget
│   ├── JitsiMeeting.tsx           # Jitsi video call embed
│   ├── Header.tsx                 # Top navigation bar
│   ├── Footer.tsx                 # Site footer
│   ├── LandingPage.tsx            # Public landing page
│   ├── AccessibilityBar.tsx       # Language toggle & accessibility
│   ├── theme-provider.tsx         # Dark/light theme context
│   └── ui/                        # shadcn/ui base components
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser-side Supabase client
│   │   ├── server.ts              # Server-side Supabase client
│   │   └── middleware.ts          # Supabase session middleware
│   ├── rate-limit.ts              # In-memory rate limiter for APIs
│   └── utils.ts                   # Utility functions
│
├── scripts/
│   ├── 001_create_tables.sql      # Core database schema
│   ├── 002_create_trigger.sql     # Auto-timestamp triggers
│   ├── 003_create_helper_functions.sql # DB helper functions
│   ├── 006_seed_real_data.sql     # Seed data (50 providers, 200 patients, etc.)
│   ├── 007_security_hardening.sql # Admin RLS policies & indexes
│   └── 008_oauth_patient_rls.sql  # Patient self-service RLS policies
│
├── middleware.ts                   # Next.js middleware (Supabase session refresh)
├── next.config.mjs                # Security headers, CSP, image config
├── tailwind.config.js             # Tailwind theme customization
└── package.json                   # Dependencies
```

---

## Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `patients` | User profiles | `user_id`, `first_name`, `last_name`, `email`, `phone`, `role` |
| `healthcare_providers` | Doctors & facilities | `name`, `specialization`, `facility_name`, `district`, `is_verified` |
| `appointments` | Booked consultations | `patient_id`, `provider_id`, `appointment_date`, `status`, `teleconsult_room_id` |
| `medical_records` | Prescriptions, lab reports | `patient_id`, `record_type`, `content`, `file_url` |
| `health_data` | Vitals & metrics | `patient_id`, `blood_pressure`, `temperature`, `pulse_rate`, `spo2` |
| `notifications` | User notifications | `user_id`, `message`, `type`, `is_read` |
| `health_campaigns` | Vaccination drives, camps | `name`, `type`, `location`, `start_date`, `end_date` |

### Row-Level Security (RLS)
- Patients can only read/write their own data
- Patient auto-creation via server-side API (bypasses RLS)
- Healthcare providers readable by all authenticated users

---

## Security

| Measure | Implementation |
|---------|---------------|
| **Content Security Policy** | Strict CSP allowing only known domains (Supabase, Jitsi, Google Fonts, OpenStreetMap) |
| **HSTS** | 1-year max-age with includeSubDomains |
| **X-Frame-Options** | SAMEORIGIN (prevents clickjacking) |
| **X-Content-Type-Options** | nosniff |
| **Rate Limiting** | In-memory rate limiter on all API routes |
| **Input Validation** | Zod schemas on appointments, medical records, profiles |
| **Session Security** | Supabase middleware refreshes tokens on every request |
| **API Key Protection** | Gemini API key is server-side only (`GEMINI_API_KEY`) |
| **Patient ID Security** | All APIs derive patient_id from authenticated session, never from request body |
| **Permissions Policy** | Camera/mic restricted to self + Jitsi domain only |

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase admin key (for server operations) |
| `GEMINI_API_KEY` | Server only | Google Gemini API key (for AI chat & symptom analysis) |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Client | Gemini key for client-side symptom checker |

---

## API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/ai-chat` | POST | Gemini health chat | Public (rate-limited) |
| `/api/symptom-analyze` | POST | AI symptom analysis | Public (rate-limited) |
| `/api/appointments` | GET, POST | List/create appointments | Required |
| `/api/auth/ensure-patient` | POST | Create patient row if missing | Required |
| `/api/auth/profile` | GET, PUT | Read/update user profile | Required |
| `/api/medical-records` | GET, POST | List/create medical records | Required |
| `/api/health-data` | GET, POST | Read/write vitals | Required |
| `/api/notifications` | GET, PUT | Read/mark notifications | Required |
| `/api/providers` | GET | List healthcare providers | Required |
| `/api/teleconsult/room` | POST | Create Jitsi room | Required |
| `/api/offline-sync` | POST | Sync offline data | Required |
| `/auth/callback` | GET | OAuth code exchange | Supabase redirect |

---

## User Flow

```
Landing Page
  │
  ├── Sign Up (Email) or Google OAuth
  │         │
  │         ▼
  │   /auth/callback → exchangeCodeForSession → ensure-patient → Dashboard
  │
  ▼
Dashboard
  ├── Symptom Checker → AI Analysis → Health Info Hub (filtered by symptoms)
  ├── Book Consultation → Select Doctor → Date/Time → Confirm → Jitsi Call
  ├── My Records → Add Manual / Upload Prescription → View History
  ├── Appointments → Upcoming / Past → Join Video Call
  ├── Emergency → Call 108 / Find Hospital / First Aid
  ├── Hospitals → Map View / Directory
  └── Floating AI Chat → Ask health questions anytime
```

---

## Bilingual Support

The entire platform supports **English** and **Hindi**. Every component renders text based on the `language` state (`"en"` or `"hi"`), toggled via the Accessibility Bar at the top.

---

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npx next build

# The app runs at http://localhost:3000
```

---

## Deployment

The project auto-deploys to Vercel on every push to `main`.

**Required Vercel Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_GEMINI_API_KEY`

**Required Supabase Configuration:**
- Authentication → URL Configuration → Redirect URLs must include:
  - `https://rural-healthcare-platform.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

---

## License

MIT

---

*Built for rural India 🇮🇳 — Quality healthcare for everyone.*
