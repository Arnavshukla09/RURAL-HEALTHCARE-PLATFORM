# Rural Health Care Platform

> **Bridging the healthcare gap in rural India through technology.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FArnavshukla09%2FRURAL-HEALTHCARE-PLATFORM)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

**Live Demo:** [rural-healthcare-platform.vercel.app](https://rural-healthcare-platform.vercel.app)

A comprehensive, bilingual (English & Hindi) full-stack healthcare platform designed specifically for rural communities. It provides AI-powered health assistance, teleconsultations, geographical facility mapping, secure medical records, and offline-capable data synchronization.

---

## 🎯 Problem Statement
In rural India, access to quality healthcare is limited by geography, lack of specialists, and poor medical record keeping. This platform solves these issues by bringing the clinic to the patient's smartphone, connecting them to regional doctors, and providing immediate AI triage.

---

## 🚀 Key Features

### 👨‍⚕️ Multi-Role Portals
- **Patients:** Can book appointments, manage their medical history, check symptoms via AI, and join teleconsultations.
- **Doctors:** Access a dedicated dashboard to review patient histories, approve consultation requests, and conduct video calls.
- **Admins:** Oversee the entire system, manage medical records, verify doctors, and organize regional health camps.

### 🤖 AI-Powered Health Triage
- **Symptom Checker:** A 4-step guided flow that uses Google Gemini Flash Lite to analyze symptoms, categorize urgency, and suggest immediate next steps.
- **Floating Health Assistant:** A context-aware chatbot available on every screen. It remembers conversation history and seamlessly hands off from the symptom checker for deeper Q&A.

### 🗺️ PostGIS Spatial Mapping
- **Interactive Map:** Built with React-Leaflet and OpenStreetMap.
- **Proximity Search:** Find the nearest hospitals, clinics, and pharmacies. The database uses PostGIS geography data to calculate real-time distances.
- **Draggable Pins:** Drop a pin anywhere to see facilities in a 25km radius.

### 📹 Teleconsultation
- **Jitsi Integration:** Secure, embedded video conferencing for remote doctor-patient visits.
- **Smart Booking:** "Occupation-based" smart pre-fill allows farmers, construction workers, etc., to quickly describe occupational health issues.

### 🛡️ Medical Records & Security
- **Role-Based Access Control (RBAC):** Powered by strict PostgreSQL Row-Level Security (RLS). Patients only see their data; doctors see their patients; admins see the aggregate.
- **One-Time Medical Profile:** Captures chronic conditions, blood type, height, and weight for new users.

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend Framework** | Next.js 14 (App Router), React 18 |
| **Language** | TypeScript |
| **Styling & UI** | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| **Backend / Database** | Supabase (PostgreSQL), PostGIS |
| **Authentication** | Supabase Auth (Email/Password, Google OAuth) |
| **AI Integration** | Google Gemini Flash Lite API |
| **Mapping** | Leaflet, React-Leaflet |
| **Video Calls** | Jitsi Meet API |
| **Deployment** | Vercel |

---

## 📦 Database Initialization

The database schema has been modularized for easy setup. To deploy your own instance, run the files in the `supabase/` directory in this order via the Supabase SQL Editor:

1. `01_schema.sql`: Sets up all tables (Patients, Providers, Records, Camps, Facilities) and enables PostGIS.
2. `02_functions_triggers.sql`: Installs helper functions, auth triggers, and the PostGIS auto-population trigger.
3. `03_rls.sql`: Applies strict Row-Level Security policies to all tables.
4. `04_seed_data.sql`: Seeds the database with real-world Indian rural health data (doctors, facilities, camps, and demo medical records).

---

## 💻 Local Development Setup

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

# Google Gemini API keys
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---

*Built with passion to bring quality healthcare to every corner of India. 🇮🇳*
