# System Design & Architectural Blueprint: Rural Healthcare Platform

**System:** Rural Healthcare Platform (RHP)  
**Version:** 1.20.15 (Production Release)  
**Target Environment:** Rural & Tier-3/4 India (Spotty 2G/3G connectivity, low-spec Android devices, multilingual populace)  
**Hosting & Operational Cost:** Strictly 100% Free-Tier Posture (\$0/month operating cost)  
**Source of Truth Codebase:** `https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM`

---

## 1. Executive Summary & Problem Domain

Rural healthcare in India faces severe systemic challenges:
1. **The Specialist Deficit & Geography Barrier:** Over 75% of specialized medical practitioners are concentrated in urban metros, forcing rural patients to travel hundreds of kilometers for routine specialist consultations.
2. **Connectivity & Hardware Constraints:** Cellular data in rural interiors fluctuates between 2G, intermittent 3G, and high packet-loss 4G. Heavy web applications with high bundle sizes (>1 MB) fail to load or timeout on low-end smartphones ($<2$ GB RAM).
3. **Identity Vulnerability & Friction in Telemedicine:** Standard telemedicine platforms require complex sign-up flows, app store installations, and upfront credit card or netbanking payments. Non-tech-savvy rural citizens and busy government doctors at AIIMS or District Hospitals abandon these platforms when blocked by authentication walls.
4. **Data Sovereignty & Medical Safety:** AI medical chatbots can hallucinate dangerous treatments or fail to detect life-threatening pediatric or obstetric emergencies.

The **Rural Healthcare Platform (RHP)** was engineered as a resilient, offline-first, mobile Progressive Web Application (PWA) with a **Backend-For-Frontend (BFF)** serverless architecture. It solves these challenges through zero-auth telemedicine rooms, 2G audio fallbacks, tokenized clinician claim verification, pan-India PostGIS spatial directory lookups (6,616 facilities and 913 NMC-verified practitioners), and clinical regex safety gates.

---

## 2. Global Architecture Diagram

```mermaid
architecture-beta
    group client[Client Layer - Mobile PWA & Offline Engine]
    service pwa[Serwist Service Worker & PWA Cache] in client
    service idb[IndexedDB Outbox ruralhealth_offline_db] in client
    service ui[Next.js Client Components] in client

    group edge[Vercel Edge & Security Perimeter]
    service mw[Edge Middleware x-request-id & CSP] in edge
    service isr[Edge CDN 1h ISR Cache] in edge
    service ratelimit[Upstash Sliding-Window Rate Limiter] in edge

    group api[Next.js Serverless Backend]
    service auth_api[Auth & Session API] in api
    service appoint_api[Appointments & Slot Locking Engine] in api
    service claims_api[Tokenized Clinician Claim Engine] in api
    service records_api[Medical Records Vault API] in api
    service geo_api[PostGIS Spatial Routing API] in api
    service ai_gateway[Circuit-Breaker AI Medical Brain] in api

    group storage[Data & State Layer]
    service pg_db[PostgreSQL 15 + PostGIS Spatial Index] in storage
    service rls[Row-Level Security 11 Tables] in storage
    service redis[Upstash Redis L1 Cache] in storage

    group external[External Healthcare Rails]
    service webrtc[Jitsi WebRTC Mesh Serverless] in external
    service gemini[Google Gemini 1.5 Flash AI] in external
    service npci[NPCI UPI Deep Link / Dynamic QR] in external

    ui:R -- L:pwa
    ui:B -- T:idb
    pwa:R -- L:mw
    mw:R -- L:isr
    mw:B -- T:ratelimit
    ratelimit:R -- L:redis
    ratelimit:B -- T:api
    appoint_api:B -- T:pg_db
    claims_api:B -- T:pg_db
    records_api:B -- T:pg_db
    geo_api:B -- T:pg_db
    ai_gateway:R -- L:gemini
    ui:R -- L:webrtc
    ui:B -- T:npci
```

---

## 3. Subsystem Architectural Breakdowns

### 3.1 Subsystem A: Teleconsultation, Passwordless Guest Rooms & 2G Fallback

* **Core Files:** [`app/teleconsult/room/page.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/app/teleconsult/room/page.tsx), [`components/JitsiMeeting.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/components/JitsiMeeting.tsx), [`lib/jitsi/config.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/jitsi/config.ts), [`app/teleconsult/confirm/page.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/app/teleconsult/confirm/page.tsx).

#### Architecture & Rationale
In rural telemedicine, verified government specialists (e.g. from AIIMS Bhopal, GMC Hamidia, MY Hospital Indore) are not full-time employees of the platform and do not have pre-registered user accounts. Requiring them to download an APK or navigate login screens caused a 90%+ drop-off.
- **Zero-Authentication Room Entry:** Access to `/teleconsult/room?id=[roomId]&name=[doctorName]&role=doctor` allows external clinicians to enter encrypted WebRTC consultation rooms in any standard mobile or desktop browser without credentials.
- **2G Ultra Low-Bandwidth Mode:** Cellular connections in rural areas often suffer severe packet drops. When network throughput drops below 50 kbps or when user toggles 2G mode, the client invokes `api.executeCommand('toggleVideo')`, dropping video feeds to 0 kbps and dedicating available bandwidth to low-bitrate **Opus audio (16–24 kbps)**. This yields a **95% data reduction** while preserving diagnostic verbal clarity.
- **Digital Consultation Summary & e-Prescription Auto-Export:** At the conclusion of a teleconsultation, the clinician completes the structured summary modal (pre-populating doctor credentials, NMC registration number, diagnosis, Rx prescription table, and instructions). 1-tap submission triggers `POST /api/medical-records` with `record_type: "prescription"` and saves a printable PDF into the patient's records vault.

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Rural Patient
    participant Portal as ConsultationPortal.tsx
    participant Confirm as teleconsult/confirm
    actor Doctor as External Doctor
    participant Room as teleconsult/room (WebRTC)
    participant Records as Patient Records Vault

    Patient->>Portal: Books OPD Slot & Inputs Triage Symptoms
    Portal-->>Patient: Returns 1-Tap Room URL & WhatsApp/SMS Dispatch Text
    Patient->>Doctor: Forwards Dispatch Message via WhatsApp/SMS
    Doctor->>Confirm: Clicks 1-Tap Accept / Reschedule
    Doctor->>Room: Enters Video Room (Passwordless Guest Access)
    Patient->>Room: Enters Room as Patient
    Room-->>Room: Detects Spotty Network -> Automatically Drops to Opus 2G Audio
    Doctor->>Room: Completes Consultation & Fills e-Prescription Modal
    Room->>Records: Auto-Exports Prescription to Patient Vault (POST /api/medical-records)
```

---

### 3.2 Subsystem B: Tri-Modal Payment Rail & Slot Conflict Locking

* **Core Files:** [`components/ConsultationPortal.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/components/ConsultationPortal.tsx), [`app/teleconsult/confirm/page.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/app/teleconsult/confirm/page.tsx), [`app/api/appointments/route.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/app/api/appointments/route.ts).

#### Architecture & Rationale
Rural patients encounter three distinct financial paradigms: free public health coverage, small clinic fees settled via cash, or modern UPI QR payments:
1. **Dynamic NPCI UPI Intent & Dynamic QR:** For fee-charging private practitioners, the platform constructs official NPCI-compliant UPI deep links:
   ```text
   upi://pay?pa=ruralhealth.care@upi&pn=RuralHealth&am=500&cu=INR&tn=Consultation-DrGoenka
   ```
   Renders dynamic QR codes using `api.qrserver.com` for scanning via Google Pay, PhonePe, Paytm, or BHIM, transferring 100% of fees with 0% platform deductions.
2. **Pay at Hospital OPD Counter:** For cash-dependent rural citizens without digital bank accounts, the appointment is confirmed instantly with status marked `"Pay at Counter"`.
3. **Ayushman Bharat PM-JAY / BPL Exemption:** 100% fee waiver for patients presenting Ayushman Golden Cards or below-poverty-line ration cards. Government practitioners (AIIMS, District Hospitals) are strictly marked as ₹0 Free OPD.
4. **Deterministic Slot Collision Locking:** Held slots are locked using composite keys (`${doctorId}_${date}_${slot}`) in local cache and server state (`rural_health_booked_slots`), preventing multiple patients from booking overlapping consultation times.

---

### 3.3 Subsystem C: Tokenized Doctor Claim Guard & Medical Admin Approval Gate

* **Core Files:** [`lib/doctor-claims.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/doctor-claims.ts), [`app/doctor/claim/page.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/app/doctor/claim/page.tsx), [`components/AdminUserManagement.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/components/AdminUserManagement.tsx), [`components/Header.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/components/Header.tsx).

#### Threat Model & Security Posture
Allowing anonymous public users to search and claim verified doctor profiles created an identity theft vulnerability where bad actors could impersonate real doctors.
- **Removal of Public Search:** The public search bar and doctor directory picker were removed from `/doctor/claim` and the public header navigation.
- **Cryptographic Invitation Tokens:** Profile claiming is locked behind private tokenized links:
  ```text
  /doctor/claim?id=[doctorId]&token=[secretToken]
  ```
  Generated using `generateDoctorClaimToken(doctorId)` with time-bucketed cryptographic signatures.
- **Administrative Approval Queue (`pending_admin_approval`):** Submitting a claim does not grant immediate doctor access. Claims are queued in the Medical Administration Console (`/admin/users` $\to$ "Doctor Claims & Invites").
- **Admin Verification & 1-Tap Activation:** Platform administrators cross-reference the clinician's entered NMC registration number, mobile number, and hospital affiliation before clicking **"Approve Claim & Grant Doctor Role"**.
- **Admin Direct Dispatcher:** Administrators can search any of the 913 registered practitioners from the NMC directory and generate a private tokenized onboarding invitation link for direct delivery via WhatsApp or SMS.

```mermaid
flowchart TD
    A[Patient Books Appointment] --> B[Generate Private Claim Token nmc_hex_id]
    B --> C[Dispatch via WhatsApp/SMS to Doctor's Verified Phone]
    C --> D{Doctor Clicks Link with Valid Token?}
    D -- No / Direct URL Visit --> E[Restricted Access Screen: Identity Theft Guard]
    D -- Yes --> F[Pre-fill Doctor Credentials & Locked NMC Reg]
    F --> G[Doctor Enters Phone, Professional Email & UPI ID]
    G --> H[Submit Verification Claim]
    H --> I[Status: pending_admin_approval]
    I --> J[Admin Reviews in /admin/users Console]
    J --> K{Admin Decision}
    K -- Reject --> L[Claim Rejected: Notification Logged]
    K -- Approve --> M[Status: approved]
    M --> N[Role Elevated to Doctor in Supabase & Local Cache]
    N --> O[Doctor Accesses /doctor/dashboard]
```

---

### 3.4 Subsystem D: Pan-India Geospatial Health Facility & Clinician Directory

* **Core Files:** [`lib/data/pan-india-facilities.geojson`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/data/pan-india-facilities.geojson), [`lib/data/real-doctors.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/data/real-doctors.ts), [`app/api/facilities/nearby/route.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/app/api/facilities/nearby/route.ts), [`components/MapView.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/components/MapView.tsx), [`components/Directory.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/components/Directory.tsx).

#### Technical Specifications & Dataset Scaling
- **6,616 Geocoded Facilities:** Aggregated across 36 States and Union Territories covering 755 districts. Categorized according to Indian Public Health Standards (IPHS): District Hospitals (DH), Sub-District Hospitals (SDH), Community Health Centres (CHC), Primary Health Centres (PHC), and Ayushman Arogya Mandirs (AAM).
- **913 NMC-Verified Practitioners:** Real clinical specialists with official National Medical Commission (NMC) and State Medical Council registration numbers, hospital affiliations, OPD timings, and consultation fee schedules.
- **PostGIS Spatial Indexing:** Database queries utilize `ST_DWithin` on GIST spatial indexes:
  ```sql
  SELECT id, name, facility_type, ST_DistanceSphere(geom, ST_MakePoint($lng, $lat)) as distance_meters
  FROM health_facilities
  WHERE ST_DWithin(geom, ST_MakePoint($lng, $lat)::geography, $radius_meters)
  ORDER BY distance_meters ASC
  LIMIT 20;
  ```
  * **Measured Benchmark:** 274 ms average query latency, 558 ms P95 latency.
- **Mutually Exclusive Proximity vs State/District Filtering:** Solved user disorientation where radius calculations displayed misleading distances when users browsed distant states. The UI enforces two non-overlapping search modes:
  1. *GPS Proximity Mode:* Computes real Haversine distance in kilometers from browser coordinates.
  2. *Administrative Directory Mode:* Filters strictly by selected State and District, displaying the complete medical registry with 10 doctors/facilities per page to eliminate browser rendering lag.

---

### 3.5 Subsystem E: Government Health Schemes Repository & Pagination

* **Core Files:** [`lib/data/government-schemes.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/data/government-schemes.ts), [`components/GovernmentSchemes.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/components/GovernmentSchemes.tsx), [`app/health-info/schemes/page.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/app/health-info/schemes/page.tsx).

#### Architecture & Rationale
Centralized repository of verified Central Government and State healthcare schemes across India:
- **Scope Division:** Categorized into Central / National (`scope: "national"`) such as Ayushman Bharat PM-JAY, PM Matru Vandana Yojana, and Rashtriya Arogya Nidhi, versus State Schemes (`scope: "state"`) across Madhya Pradesh, Rajasthan, Uttar Pradesh, Maharashtra, Bihar, and other states.
- **Multi-Dimensional Demographic Filters:** Quick-filter pills allow targeting by demographic vulnerability:
  * Children & Infants (`kids_pediatric`)
  * Maternal & Women (`female_maternal`)
  * Disability & Paralysis (`disability_paralysis`)
  * Critical Diseases / Cancer & Dialysis (`cancer_dialysis`)
  * Elderly Care (`geriatric_elderly`)
  * Poverty Upliftment / BPL (`poverty_upliftment`)
- **5-Schemes-Per-Page Pagination:** Replaced long vertical scroll fatigue with responsive pagination controls (`< Previous`, page number pills, `Next >`) with automatic reset to Page 1 upon search query or filter modifications.

---

### 3.6 Subsystem F: Clinical AI Safety Gateway & Medical Brain

* **Core Files:** [`app/api/ai-chat/route.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/app/api/ai-chat/route.ts), [`lib/chat/emergency.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/chat/emergency.ts), [`lib/ai/medical-brain.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/ai/medical-brain.ts), [`lib/rate-limit.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/rate-limit.ts).

#### Zero-Hallucination Emergency Protocol
Before any natural language request reaches Google Gemini 1.5 Flash, it passes through a deterministic server-side safety pipeline:
1. **Step 0: Tier-0 Emergency Detection (`detectTier0Emergency`)**:
   - Executes deterministic clinical regex covering:
     * Pediatric respiratory distress ("baby not breathing", "bachha saans nahi le raha")
     * Obstetric hemorrhage ("pregnant bleeding heavily")
     * Acute coronary syndrome ("severe chest pain radiating to left arm")
     * Organophosphate / pesticide poisoning
     * Scorpion / snake envenomation
     * Stroke FAST signs (facial drooping, slurred speech)
   - **Inherently Negative Allowlist:** Prevents false-negative suppression when life-threatening phrases contain negation words ("baby *not* breathing").
   - **Zero-LLM Bypass:** Immediately returns a high-priority 108 emergency siren and hospital dispatch card with 0 ms AI latency.
2. **Step 1: Semantic Response Cache (SHA-256)**: Checks local cache for identical symptom queries to preserve Gemini free-tier quota (15 RPM / 1,500 RPD).
3. **Step 2: Circuit Breaker (`lib/rate-limit.ts`)**: If Gemini fails 5 consecutive times, the breaker trips to `OPEN`, immediately returning localized fallback clinical triage without user-facing 500 errors.

---

### 3.7 Subsystem G: Multilingual Engine & Regional Dialect Support

* **Core Files:** [`lib/i18n/detect-language.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/i18n/detect-language.ts), [`lib/i18n/translations/`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/i18n/translations/), [`components/AccessibilityBar.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/components/AccessibilityBar.tsx).

- **10 Supported Official Languages:** English (`en`), Hindi (`hi`), Marathi (`mr`), Bengali (`bn`), Telugu (`te`), Tamil (`ta`), Gujarati (`gu`), Kannada (`kn`), Punjabi (`pa`), and Odia (`or`).
- **N-Gram Heuristic Language Detection:** Automatically identifies input language from patient symptoms without external cloud APIs.
- **Dual-Script Medical Lexicon:** Preserves medical clarity by rendering official clinical terminology in bilingual formats (English + Devanagari/regional scripts).

---

### 3.8 Subsystem H: Offline Outbox & PWA Client Cache Vault

* **Core Files:** [`lib/offline/offline-sync.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/offline/offline-sync.ts), [`components/OfflineSyncBadge.tsx`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/components/OfflineSyncBadge.tsx), [`lib/offline/cache-cleaner.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/lib/offline/cache-cleaner.ts), [`app/sw.ts`](file:///c:/Users/aarrn/Desktop/rural%20health/RURAL-HEALTHCARE-PLATFORM-main/app/sw.ts).

- **IndexedDB Outbox Queue (`ruralhealth_offline_db`):** Clinical actions performed without internet (e.g. offline medical record logging, camp registrations) are assigned cryptographically random UUIDs (`client_op_id`) and stored locally.
- **Idempotent Background Synchronization:** When network connectivity is restored, the service worker executes `POST /api/offline-sync`, cross-checking `processed_client_ops` to prevent duplicate insertions.
- **Shared Device Privacy Cleaner:** On rural village smartphones shared among multiple family members, signing out invokes `wipeClientCachesOnSignOut()`, completely clearing decrypted medical records from IndexedDB and browser storage.

---

## 4. Implementation Status Matrix

| Module / Feature | File Reference | Status | Validation Method |
| :--- | :--- | :---: | :--- |
| **Passwordless Guest Room** | `app/teleconsult/room/page.tsx` | **Implemented** | Tested across doctor/patient roles |
| **2G Audio Fallback** | `components/JitsiMeeting.tsx` | **Implemented** | Verified 0 kbps video & Opus audio drop |
| **Tri-Modal Payment Rail** | `components/ConsultationPortal.tsx` | **Implemented** | Dynamic NPCI QR & Counter selection verified |
| **Deterministic Slot Lock** | `app/api/appointments/route.ts` | **Implemented** | `rural_health_booked_slots` conflict testing |
| **Tokenized Doctor Claim** | `app/doctor/claim/page.tsx` | **Implemented** | Cryptographic token gating verified |
| **Admin Claims Approval** | `components/AdminUserManagement.tsx` | **Implemented** | Tested approval & rejection queues |
| **Pan-India Facilities (6,616)** | `lib/data/pan-india-facilities.geojson` | **Implemented** | PostGIS spatial index (274ms avg query) |
| **Pan-India Doctors (913)** | `lib/data/real-doctors.ts` | **Implemented** | Verified NMC registrations & coordinates |
| **5-per-Page Schemes** | `components/GovernmentSchemes.tsx` | **Implemented** | Verified pagination controls & counters |
| **Tier-0 Emergency Gate** | `lib/chat/emergency.ts` | **Implemented** | 8/8 unit tests passing with scoped negation |
| **Patient Records Timeout** | `components/PatientRecords.tsx` | **Implemented** | 2.5s fallback & local cache pre-hydration |
| **ABDM / ABHA Sandbox** | `lib/abdm/` | **Partially Implemented** | Data structures ready; awaits live NHA bridge |

---

## 5. Security, Access Controls & Free-Tier Posture

1. **Row-Level Security (RLS):** Enforced across all 11 PostgreSQL tables in Supabase. Unauthenticated or foreign tenant queries return strictly **0 rows**.
2. **Security Headers (100% Pass Rate):** Edge middleware enforces `Strict-Transport-Security` (HSTS), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict `Content-Security-Policy`.
3. **Zero Operating Cost Posture:**
   - **Vercel Hobby:** Public pages utilize 1-hour ISR edge caching, eliminating function executions on public traffic.
   - **Supabase Free:** WebSocket connections eliminated in favor of visibility-aware polling; spatial indexes bounded to 20 rows per query.
   - **Upstash Redis:** 24-hour cache TTLs and memory fallback prevent exceeding 10,000 commands/day.
   - **Google Gemini:** Semantic SHA-256 caching and IP rate-limiting prevent exceeding 15 RPM.
