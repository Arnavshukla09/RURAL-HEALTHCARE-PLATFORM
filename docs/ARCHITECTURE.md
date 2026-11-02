# Architecture Document: Rural Healthcare Platform

This document details the software architecture, design patterns, security controls, and infrastructure posture for the **Rural Healthcare Platform**. It is written to serve as an in-depth, authoritative architectural guide for any engineer working on the system.

---

## 1. High-Level System Architecture

The platform employs a **Backend-For-Frontend (BFF)** Serverless architecture designed specifically for low-bandwidth, spotty-connectivity rural environments while operating strictly within **100% Free-Tier quotas ($0 spend)** across all infrastructure providers.

```mermaid
architecture-beta
    group client(Client Layer - Mobile PWA)
    service browser(Serwist PWA & IndexedDB) in client

    group edge(Edge & Routing Layer)
    service edge_mw(Edge Middleware) in edge
    service isr(ISR Static Pages) in edge

    group nextjs(Next.js App Router Backend)
    service api(Serverless API Handlers) in nextjs
    service ratelimit(Rate Limiter & Circuit Breaker) in nextjs
    service logger(Structured Logger) in nextjs

    group supabase(Supabase BaaS)
    service auth(Supabase Auth) in supabase
    service db(PostgreSQL 15 + PostGIS) in supabase
    service storage(Encrypted Storage) in supabase

    group external(External Services)
    service gemini(Google Gemini AI) in external
    service jitsi(Jitsi WebRTC Meet) in external
    service upstash(Upstash Redis) in external

    browser:R -- L:edge_mw
    edge_mw:R -- L:isr
    edge_mw:B -- T:api
    api:R -- L:ratelimit
    ratelimit:R -- L:upstash
    api:B -- T:db
    api:B -- T:auth
    api:B -- T:storage
    api:R -- L:gemini
    browser:T -- B:jitsi
```

---

## 2. Frontend & Rendering Architecture

### 2.1 Server Components & Incremental Static Regeneration (ISR)
All 9 public routes (`/`, `/campaigns`, `/camps`, `/directory`, `/emergency`, `/health-info`, `/health-info/schemes`, `/locations`, `/symptom-checker`) are **Server Components** configured with:
```typescript
export const revalidate = 3600 // Cached at Edge CDN for 1 hour
```
- **Zero Database Load on Navigation:** Page loads for public visitors do not invoke Supabase or execute serverless functions.
- **Client Interactive Islands:** Dynamic state (search filters, tab toggles, accordion expansion) is isolated in client components (`components/public-pages/`).
- **Elimination of SSR Redirect Hazards:** Protected dashboard routes use client-side `useEffect` wrappers for redirection, preventing server-side `location is not defined` errors during static generation.

### 2.2 First-Load JS Optimization & Code Splitting
- Heavy vendor libraries are dynamically imported with SSR disabled:
  * Leaflet maps: `next/dynamic(() => import("@/components/MapView"), { ssr: false })`
  * Floating AI assistant: `components/FloatingChatClient.tsx` dynamically imported in `app/layout.tsx`.
- First-load shared JavaScript payload was reduced from **607 kB uncompressed to 103 kB**, ensuring rapid first paint over 2G/3G rural networks.

### 2.3 PWA Architecture (Serwist Service Worker)
- **Engine:** Configured via `@serwist/next` with custom worker in `app/sw.ts`.
- **Runtime Caching Strategy:**
  * **Static Assets & Fonts:** CacheFirst with 30-day expiration.
  * **Public Cached APIs (`/api/facilities/nearby`, `/api/providers`):** StaleWhileRevalidate.
  * **Private Patient APIs (`/api/appointments`, `/api/medical-records`, `/api/notifications`, `/api/offline-sync`):** `NetworkOnly`. **Never cached** on disk, preventing medical data leakage on shared village smartphones.
- **Offline Fallback:** Standalone bilingual `/offline` page cached during service worker installation.

### 2.4 Pan-India Annual Health Campaigns & Outreach Hub
- **Curated Dataset (`lib/data/annual-campaigns.ts`):** Verified, authentic recurring public health programs under MoHFW, NHM, UIP, NTEP, NPCBVI, and Red Cross (PMSMA, AAM Wellness Day, Pulse Polio NID, NDD, Nikshay TB, Eye Screening, Poshan Maah, Blood Donation Month, and state-level outreach drives).
- **Hierarchical Geographic Filtering:** Matches Doctor Directory with pan-India LGD State & District selectors. National programs remain permanently visible to all citizens; state selections surface state-specific drives.
- **Scrollable Filter Row:** Reusable component (`components/ui/scrollable-filter-row.tsx`) providing explicit chevron arrow heads and smooth horizontal scrolling across category pills.
- **Patient Registration & Medical Records:** 1-tap registration stores camp schedule, venue, and helpline into patient medical records for offline tracking.

---

## 3. Data Ingress & Offline Outbox Architecture

To ensure uninterrupted operation when internet connectivity drops in remote villages:

```mermaid
stateDiagram-v2
    [*] --> Online
    Online --> Offline : Connection Lost
    
    state Offline {
        [*] --> QueueAction
        QueueAction --> GenerateUUID
        GenerateUUID --> SaveToIndexedDBOutbox
    }
    
    Offline --> Online : Connection Restored
    
    state Online {
        [*] --> CheckOutbox
        CheckOutbox --> BatchPostOfflineSync : Operations Exist
        BatchPostOfflineSync --> CheckServerIdempotency
        CheckServerIdempotency --> MarkProcessedClientOps
        MarkProcessedClientOps --> ClearLocalOutbox
    }
```

### 3.1 Idempotent Outbox Mechanics
1. **Client Generation:** Operations created offline (prescriptions, camp registrations, vitals) are assigned a cryptographically random UUID (`client_op_id`) and persisted to IndexedDB (`rhcp_offline_db`).
2. **Server Verification:** `POST /api/offline-sync` checks the incoming batch against table `processed_client_ops`.
3. **At-Most-Once Execution:** If an operation was already recorded, the server returns status `"already_processed"` with HTTP 200 without executing duplicate insertions.
4. **Column Sanitization:** Client payloads are filtered against strict whitelists, discarding client-assigned IDs or privileged fields.

### 3.2 Edge-Preassigned Relational UUIDs (Intelehealth Edge Architecture)
To eliminate foreign key dependency deadlocks during offline data capture:
- **Client-Preassigned Primary Keys:** The edge client generates an RFC4122 v4 UUID (`createClientEntityId()`) for parent entities (e.g., `clinical_encounters`, `appointments`).
- **Relational Graph Preserved Offline:** Child records created while offline (e.g., vital sign observations, e-prescriptions) reference the parent's pre-assigned `entity_id` directly in their local payload.
- **Atomic Replay:** When flushed via `POST /api/offline-sync`, the server inserts the parent encounter and child observations with preserved relational integrity, preventing orphan records or duplicate insertion races.

### 3.3 Client-Side Clinical Media Compression Pipeline (`lib/media/compressor.ts`)
To overcome 2G/3G mobile uplink bottlenecks when uploading clinical photographs (dermatology rashes, wounds, eye exams):
- **Hardware-Accelerated In-Browser Compression:** Employs `createImageBitmap` and `HTMLCanvasElement` (with `OffscreenCanvas` support) to downscale 12MP smartphone photos to a maximum dimension of 1280px while preserving clinical diagnostic fidelity.
- **Bandwidth Optimization:** Encodes images into progressive WebP (with JPEG fallback) at 70% quality, reducing file sizes from ~4MB–8MB down to 100KB–250KB (an **85%–95% payload reduction**).
- **Cellular Transfer Estimation:** Includes `estimateTransferTimeSecs()` modeling uplink durations across rural Indian cellular standards (2G GPRS: ~30s, 2G EDGE: ~10s, 3G: ~1s).

---

## 4. API Gateway, Rate Limiting & Abuse Prevention

### 4.1 Tiered Rate Limiting
Implemented via `@upstash/ratelimit` with Redis and an in-memory sliding-window fallback:
- **Public Read (60 req/min):** Spatial directory and provider endpoints.
- **Auth Read (120 req/min):** Patient records and appointments.
- **Mutations (30 req/min):** Booking, medical record creation, outbox sync.
- **AI & Heavy Compute (15 req/min, 200 daily quota):** Symptom checker and chat triage.
- **Notifications Polling (120 req/min):** Periodic notification updates.

### 4.2 AI Circuit Breaker (`lib/rate-limit.ts`)
Protects against upstream Gemini API outages and token exhaustion:
- Tracks consecutive downstream failures.
- **Tripping Threshold:** 5 consecutive failures trips the breaker into `OPEN` state.
- **Cooldown Window:** 60 seconds where incoming requests are immediately served localized fallback triage data without waiting for network timeouts.
- **Half-Open Probe:** After 60s, a single request probes the Gemini API to verify health before closing the breaker.

---

## 5. Realtime & Notification Architecture

### 5.1 Elimination of Realtime WebSockets
Supabase Free tier enforces a hard limit of **200 concurrent Realtime connections**. The previous unfiltered `postgres_changes` subscription on the notification bell exhausted this connection pool under minimal concurrent traffic.

### 5.2 Visibility-Aware Polling Engine & Viewport Portal (`components/notification-bell/`)
- Replaced websockets with HTTP polling against `GET /api/notifications?since=<timestamp>`.
- **Interval:** Polls every 60 seconds **only** while `document.visibilityState === 'visible'`.
- **Background Suspension:** Completely halts polling when the browser tab is hidden or minimized.
- **Immediate Refresh:** Fires immediately upon tab focus (`window.addEventListener('focus')`).
- **Backoff:** Implements exponential backoff on server errors.
- **Dual Presentation & Stacking Isolation (`NotificationPanel.tsx`):** On desktop, renders as an inline positioned popover anchored below the bell icon. On mobile/PWA viewports, renders via React Portal (`createPortal`) directly into `document.body` with a `z-[90]` backdrop overlay and `z-[100]` card, preventing clipping from `<header>` stacking contexts and floating accessibility controls.

---

## 6. Clinical Decision Support & Context Intelligence

### 6.1 Frontline Protocol Engine (`lib/clinical/protocol-engine.ts`)
- Offline-executable clinical decision trees (Ayu-inspired CDSS) for NCD cardiovascular/diabetes staging and high-risk ANC screening.
- Maps frontline observations to standardized LOINC concepts and provides bilingual clinical triage guidelines.

### 6.2 Patient Clinical Pretext Subsystem (`lib/clinical/patient-context.ts`)
- **Baseline Extraction:** Synthesizes structured clinical parameters (chronic conditions, known allergies, current medications, baseline blood pressure/sugar) from patient profiles and clinical intake history.
- **Edge Caching:** Caches sanitized clinical baselines locally in `localStorage` (`rhcp_patient_clinical_pretext`) to enable instant prefilling across assessment sessions without duplicate entry.
- **PII Scrubbing & Prompt Injection Mitigation:** Automatically redacts phone numbers, emails, and prompt-injection keywords (`ignore previous instructions`, `system prompt`) before compiling prompt blocks.
- **Downstream Triage Augmentation:** Formats a concise ($\le 600$ char) clinical preamble injected into Gemini AI Chat (`/api/ai-chat`) during Step 4 of the Symptom Checker, providing personalized clinical awareness for home care recommendations.

---

## 7. Observability & Security Perimeter

### 6.1 Structured JSON Logging (`lib/logger.ts`)
- Standardized log levels (`logInfo`, `logWarn`, `logError`).
- Formats logs as JSON containing `timestamp`, `level`, `message`, `requestId`, `path`, `method`, and `status`.
- **PII Protection:** Patient user IDs are never logged in plain text. All user identifiers are hashed using SHA-256 and truncated to 12 hex characters (`hashUserId()`).

### 6.2 Edge Middleware Hardening (`middleware.ts`)
- Path matcher ignores all static assets (`/_next`, `/icons/`, `/manifest.webmanifest`, `/favicon.ico`, `/images/`).
- Stretches and attaches `x-request-id` header for end-to-end request tracing.
- Only protected role paths (`/dashboard`, `/doctor`, `/admin`) invoke Supabase Auth session refresh.

### 6.3 Content Security Policy (CSP)
Configured via `next.config.mjs` with `Content-Security-Policy-Report-Only`:
- Restricts script and iframe execution to `self`, Jitsi (`meet.jit.si`), CartoCDN tiles, and Google Fonts.
- Prevents XSS and malicious script injection while allowing observability during initial deployment.

---

## 7. 100% Free-Tier Posture & Quota Management

The entire architecture is designed to remain permanently within free tiers ($0 operating cost):

| Service | Free Tier Boundary | Architectural Defense |
|---|---|---|
| **Vercel Hobby** | 100 GB bandwidth, serverless invocations | Public routes use ISR (1-hour edge cache). JS bundle compressed to 103 kB. Static assets bypassed in middleware. |
| **Supabase Free** | 500 MB database, 5 GB egress, 200 realtime conns | Unfiltered websockets removed; cursor pagination limits row returns; coordinate rounding maximizes CDN cache; bounded query tables. |
| **Upstash Redis** | 10,000 commands/day | Cache keys TTL 24h; memory cache fallback when Redis is unconfigured or quota reached. |
| **Google Gemini** | 15 RPM, 1,500 RPD (Free tier) | Multi-model fallback cascade; SHA-256 response cache for identical queries; circuit breaker and IP daily quotas. |

---

## 8. ABDM & HL7 FHIR R4 Interoperability Subsystem

The platform implements an autonomous, zero-cost, pure TypeScript adapter for the **Ayushman Bharat Digital Mission (ABDM)** and **HL7 FHIR R4** standards:

### 8.1 National Standards Alignment
- **Profile Specification:** NRCES FHIR R4 Document Bundle (`https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle`).
- **Resource Composition:** Encapsulates clinical documents into structured bundles containing `Composition` (mandatory entry 0), `Patient`, `Practitioner`, `Organization`, and clinical payloads (`MedicationRequest`, `DiagnosticReport`, `Observation`, `Encounter`).
- **Standardized Coding Systems:**
  - LOINC for laboratory and clinical investigations (`11502-2` Lab report, `1558-6` Fasting blood glucose, `8480-6` Systolic BP).
  - UCUM (`http://unitsofmeasure.org`) for standardized units of measure (`mg/dL`, `mmHg`).
  - NDHM document types (`PRE` for Prescriptions, `DIAG` for Diagnostics, `ENC` for Encounters).

### 8.2 Architectural Seam & Zero-Cost Posture
- **Local Simulated Validation:** When sandbox credentials are not present in `.env`, the adapter executes local validation and bundle generation with $0 API expense and zero network egress.
- **Pluggable Live Gateway Seam:** Ready to connect directly to the NHA Sandbox Gateway (`https://dev.abdm.gov.in/gateway/v0.5`) upon provisioning `ABDM_CLIENT_ID` and `ABDM_CLIENT_SECRET`.
- **Integrity Verification:** Internal referential integrity is validated deterministically (`validateFhirBundle()`) to guarantee zero dangling URN references.
- **REST Export Endpoint:** `GET /api/abdm/fhir-export?record_id=<UUID>` enforces cross-tenant data isolation and emits `application/fhir+json` responses.

### 8.3 Standardized Clinical Encounter & Observation Hierarchy
To transition from monolithic record blobs to granular FHIR-native healthcare data:
- **`public.clinical_encounters`:** Represents clinical visit episodes (`screening`, `triage`, `teleconsult`, `followup`) with chief complaints, clinical notes, and media attachments.
- **`public.clinical_observations`:** Normalized atomic measurements mapped directly to LOINC concepts (e.g., `8480-6` Systolic BP, `8462-4` Diastolic BP, `2339-0` Glucose, `11884-4` Gestational age), numeric values, units, and qualitative interpretations.
- **Database-Enforced Security:** Both tables are protected by PostgreSQL RLS requiring `public.has_care_relationship(auth.uid(), patient_id)` for clinician access.

### 8.4 Frontline Decision Support Engine (Ayu-inspired CDSS)
Implements offline-executable clinical protocol decision trees in `lib/clinical/protocol-engine.ts`:
- **NCD Protocol:** Stages hypertension (Normal, Stage 1, Stage 2, Hypertensive Emergency) and detects hypoglycemia ($<70\text{ mg/dL}$) as a Tier 0 red-flag emergency.
- **High-Risk ANC Protocol:** Evaluates third-trimester risks, detecting pre-eclampsia danger signs (systolic $\ge 140$ with blurred vision/headache) and antepartum hemorrhage.
- **Bilingual Guidance:** Emits synchronized English and Hindi clinical instructions tailored for grassroots ASHA and ANM community workers.

For detailed sequence diagrams, milestone breakdowns, and technical standards compliance, refer to [`docs/ABDM_FHIR_INTEROPERABILITY.md`](ABDM_FHIR_INTEROPERABILITY.md).


