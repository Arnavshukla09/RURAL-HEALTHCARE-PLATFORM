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

### 🤖 AI-Powered Health Triage
- **Symptom Checker:** A guided triage flow leveraging **Google Gemini Flash Lite** to analyze symptoms, categorize urgency, and suggest immediate next steps before a human doctor is available.
- **Persistent Health Assistant:** A context-aware chatbot available globally across the application for immediate Q&A and guidance.

### 🗺️ Geographical Mapping (PostGIS)
- **Interactive Map:** Built with React-Leaflet and OpenStreetMap.
- **Proximity Search:** Finds the nearest hospitals, clinics, and pharmacies. The database utilizes **PostGIS geography data** to calculate precise, real-time spherical distances.

### 📹 Teleconsultation
- **Secure Video Calls:** Embedded video conferencing using the **Jitsi Meet API** for seamless remote doctor-patient visits without requiring external software.

---

## 🛠️ Architecture & Technology Stack

The platform employs a modern, serverless architecture optimized for performance and security.

| Layer | Technology |
|----------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| **Backend & Database**| Supabase, PostgreSQL, PostGIS |
| **Authentication** | Supabase Auth (Email/Password, Google OAuth) |
| **AI Integration** | Google Gemini API |
| **Mapping** | Leaflet, React-Leaflet |
| **Testing** | Playwright (E2E) |
| **Deployment** | Vercel |

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

## 🗄️ Database Architecture

The backend relies on a normalized **PostgreSQL** database managed through Supabase.

- **`patients`**: Stores core user profiles linked 1-to-1 with Supabase Auth users.
- **`medical_records`**: Secure ledger of diagnoses, prescriptions, and historical data.
- **`appointments`**: Tracks consultation scheduling, statuses, and Jitsi room allocations.
- **`facilities` & `health_camps`**: Spatially indexed tables leveraging the PostGIS `geography` type for fast radius queries (`ST_DWithin`).

*Initialization scripts are available in the `supabase/` directory, broken down by schema definition, functions, RLS policies, and seed data.*

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

# Google Gemini API keys
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Database Setup
Execute the SQL files located in the `supabase/` directory within your Supabase project's SQL editor in sequential order (`01_schema.sql` through `04_seed_data.sql`).

### 5. Run the Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### 6. Run E2E Tests
```bash
npx playwright test
```

---

## 📄 License
Copyright (c) 2025. This project is licensed under the MIT License - see the LICENSE file for details.

---

*Built with passion to bring quality healthcare to rural communities globally. 🌍*
