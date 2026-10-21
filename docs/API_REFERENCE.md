# API Reference: Rural Healthcare Platform

This document is the complete reference for all backend HTTP endpoints exposed by the Rural Healthcare Platform (`/app/api/*`). It details authentication requirements, route classification, rate limiting, request validation, response payloads, cursor pagination, and error codes.

---

## 1. Global Standards & Protocols

### 1.1 Base URL & Content Negotiation
- Base path: `/api`
- All JSON requests must send `Content-Type: application/json`.
- All responses return JSON with standard HTTP status codes.

### 1.2 Request Tracing & Correlation
Every incoming request is tagged by `middleware.ts` with a unique UUID `x-request-id`. This header is reflected back in the response headers and stamped on all structured server logs.

### 1.3 Rate Limiting & Abuse Prevention
Endpoints are protected by classified rate limit tiers enforced via Upstash Redis (falling back to an in-memory sliding window):
- **Tier 1 (Public Read):** 60 requests/minute (e.g., `/api/facilities/nearby`, `/api/providers`)
- **Tier 2 (Authenticated Read):** 120 requests/minute (e.g., `/api/appointments`, `/api/medical-records`)
- **Tier 3 (Mutations / Writes):** 30 requests/minute (e.g., `POST /api/appointments`, `POST /api/offline-sync`)
- **Tier 4 (AI / Compute):** 15 requests/minute, daily quota of 200 reqs/IP (e.g., `/api/ai-chat`, `/api/symptom-analyze`)
- **Tier 5 (Notifications Polling):** 120 requests/minute (e.g., `/api/notifications`)

**Rate Limit Response Headers:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1728645000
```
On `429 Too Many Requests`:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 42
Content-Type: application/json

{
  "error": "Rate limit exceeded. Please wait 42 seconds before retrying.",
  "code": "RATE_LIMITED",
  "retryAfter": 42
}
```

### 1.4 Cursor-Based Pagination
All paginated collection endpoints use cursor pagination (`limit` + `cursor`) instead of offset pagination to eliminate $O(N)$ database scans and ensure consistency across insertions:
- **`limit`**: Number of items to return (1 to 100, default 20). Clamped automatically.
- **`cursor`**: Base64URL-encoded pointer `{ id, createdAt }`.
- **Response Format**:
  ```json
  {
    "data": [ ... ],
    "nextCursor": "eyBpZCI6ICJhYmMiLCBjcmVhdGVkQXQiOiAiMjAyNi0xMC0xMVQxMjo..."
  }
  ```
  When `nextCursor` is `null`, there are no more records.

---

## 2. Teleconsultation & Appointments

### 2.1 `GET /api/appointments`
Returns a cursor-paginated list of appointments for the authenticated caller.
- **Auth:** Required (Patient, Doctor, Admin)
- **Rate Limit:** Tier 2 (120/min)
- **Query Parameters:**
  - `limit` (optional, integer, default `20`, max `50`)
  - `cursor` (optional, string, base64-encoded pagination cursor)
  - `status` (optional, `scheduled` | `in_progress` | `completed` | `cancelled`)
- **Response (200 OK):**
  ```json
  {
    "appointments": [
      {
        "id": "7b09d3b8-6447-4952-ba53-61b659cbe719",
        "appointment_date": "2026-10-15T10:00:00.000Z",
        "duration_minutes": 30,
        "status": "scheduled",
        "teleconsult_room_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "notes": "Follow-up consultation",
        "healthcare_providers": {
          "id": "e83921b7-90c2-485a-8723-f75c5df3df96",
          "specialization": "Cardiology",
          "clinic_address": "AIIMS Bhopal",
          "patients": { "first_name": "Dr. Ajay", "last_name": "Goenka" }
        }
      }
    ],
    "nextCursor": "eyBpZCI6ICI3YjA5ZDNiOC02NDQ3LTQ5NTItYmE1My02MWI2NTljYmU3MTkiLCAiY3JlYXRlZEF0IjogIjIwMjYtMTAtMTVUMTA6MDA6MDAuMDAwWiIgfQ=="
  }
  ```

### 2.2 `POST /api/appointments`
Books a new appointment. Automatically generates a cryptographically random UUID for `teleconsult_room_id` and enforces double-booking conflict detection.
- **Auth:** Required (Patient or Admin)
- **Rate Limit:** Tier 3 (30/min)
- **Request Body:**
  ```json
  {
    "provider_id": "e83921b7-90c2-485a-8723-f75c5df3df96",
    "appointment_date": "2026-10-15T10:00:00.000Z",
    "notes": "Persistent cough for 4 days",
    "consultation_type": "video"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "appointment": {
      "id": "7b09d3b8-6447-4952-ba53-61b659cbe719",
      "patient_id": "31f47ac1-0b29-4503-b09b-61b659cbe719",
      "provider_id": "e83921b7-90c2-485a-8723-f75c5df3df96",
      "appointment_date": "2026-10-15T10:00:00.000Z",
      "status": "scheduled",
      "teleconsult_room_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    }
  }
  ```
- **Error Codes:**
  - `400 VALIDATION_ERROR`: Missing or invalid fields.
  - `400 NO_PROVIDERS`: No verified healthcare providers available in the system.
  - `409 SLOT_TAKEN`: The requested time slot is already booked for this provider (`idx_appointments_provider_slot_active` violation).

### 2.3 `PATCH /api/appointments`
Updates the status or clinical notes of an existing appointment with strict role enforcement.
- **Auth:** Required
- **Rate Limit:** Tier 3 (30/min)
- **Authorization Matrix:**
  - `patient`: Can ONLY cancel their own appointment (`status: "cancelled"`). Cannot change notes or mark completed.
  - `doctor`: Can update their assigned appointments (`status: "in_progress" | "completed" | "cancelled"`, and update `notes`).
  - `admin`: Can update any appointment and any status.
- **Request Body:**
  ```json
  {
    "id": "7b09d3b8-6447-4952-ba53-61b659cbe719",
    "status": "completed",
    "notes": "Prescribed oral rehydration salts and paracetamol."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "appointment": { ... }
  }
  ```
- **Error Codes:**
  - `403 FORBIDDEN`: Attempted status transition unauthorized for caller's role.
  - `404 NOT_FOUND`: Appointment does not exist or does not belong to caller.
  - `409 CONFLICT`: Attempted update on an appointment that is already cancelled or completed.

---

## 3. Medical Records & Vitals

### 3.1 `GET /api/medical-records`
Retrieves cursor-paginated medical records for the authenticated patient or doctor.
- **Auth:** Required
- **Rate Limit:** Tier 2 (120/min)
- **Query Parameters:**
  - `limit` (optional, integer, default `20`)
  - `cursor` (optional, string)
  - `patient_id` (optional, required if doctor/admin reading a patient's records)
  - `record_type` (optional, `diagnosis` | `prescription` | `lab_result` | `vaccination` | `other`)
- **Response (200 OK):**
  ```json
  {
    "records": [ ... ],
    "nextCursor": "eyBpZCI6IC..."
  }
  ```

### 3.2 `POST /api/medical-records`
Creates a medical record entry.
- **Auth:** Required (Doctor, Admin, or Patient for self-records)
- **Rate Limit:** Tier 3 (30/min)
- **Request Body:**
  ```json
  {
    "patient_id": "31f47ac1-0b29-4503-b09b-61b659cbe719",
    "record_type": "prescription",
    "content": "Amoxicillin 500mg TDS for 5 days",
    "record_date": "2026-10-11T12:00:00.000Z"
  }
  ```

### 3.3 `GET /api/abdm/fhir-export`
Exports a medical record as a FHIR R4 structured document bundle modelled on ABDM NRCES profiles (not yet certified against the official validator).
- **Auth:** Required (Patient for own records, Doctor or Admin for any clinical record)
- **Rate Limit:** Tier 2 (120/min)
- **Headers:** `Content-Type: application/fhir+json; charset=utf-8`, `X-ABDM-Conformance: NRCES-FHIR-R4-M2`
- **Query Parameters:**
  - `record_id` (required, UUID): The ID of the target `medical_records` row.
- **Response (200 OK):**
  ```json
  {
    "resourceType": "Bundle",
    "id": "bundle-rx-rec-001",
    "meta": {
      "versionId": "1",
      "lastUpdated": "2026-10-16T12:00:00.000Z",
      "profile": [
        "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"
      ]
    },
    "type": "document",
    "entry": [
      {
        "fullUrl": "urn:uuid:comp-rec-001",
        "resource": {
          "resourceType": "Composition",
          "id": "comp-rec-001",
          "status": "final",
          "type": { "coding": [{ "system": "https://projectndhm.gov.in/document-types", "code": "PRE", "display": "Prescription" }] },
          "subject": { "reference": "urn:uuid:pat-rec-001" },
          "section": [{ "title": "OPD Prescription", "code": { "coding": [{ "system": "http://loinc.org", "code": "57833-6" }] } }]
        }
      },
      { "fullUrl": "urn:uuid:pat-rec-001", "resource": { "resourceType": "Patient", "id": "pat-rec-001", "name": [{ "text": "Rameshwar Prasad" }], "gender": "male" } },
      { "fullUrl": "urn:uuid:pract-rec-001", "resource": { "resourceType": "Practitioner", "id": "pract-rec-001", "name": [{ "text": "Dr. Ajay Goenka" }] } },
      { "fullUrl": "urn:uuid:org-rec-001", "resource": { "resourceType": "Organization", "id": "org-rec-001", "name": "District Hospital Sehore" } },
      { "fullUrl": "urn:uuid:med-req-rec-001-1", "resource": { "resourceType": "MedicationRequest", "id": "med-req-rec-001-1", "status": "active", "intent": "order", "medicationCodeableConcept": { "text": "Amoxicillin 500mg" } } }
    ]
  }
  ```
- **Error Codes:**
  - `400 BAD_REQUEST`: Missing required `record_id` query parameter.
  - `401 UNAUTHORIZED`: Authentication required.
  - `403 FORBIDDEN`: Attempted export of another patient's record without doctor or admin privileges.
  - `404 NOT_FOUND`: Requested medical record does not exist.
  - `500 INTERNAL_ERROR`: Generated bundle failed NRCES conformance validation.

---

## 4. Notifications (Polling-Optimized)

### 4.1 `GET /api/notifications`
Fetches user notifications. Optimized for visibility-aware polling with an incremental `since` timestamp filter.
- **Auth:** Required
- **Rate Limit:** Tier 5 (120/min)
- **Cache-Control:** `private, no-cache, no-store, must-revalidate`
- **Query Parameters:**
  - `since` (optional, ISO 8601 string, e.g. `2026-10-11T14:00:00.000Z`): Returns only notifications created after this timestamp.
  - `unread_only` (optional, boolean): If `true`, returns only unread notifications.
  - `limit` (optional, integer, default `20`, max `50`)
- **Response (200 OK):**
  ```json
  {
    "notifications": [ ... ],
    "unreadCount": 2,
    "serverTime": "2026-10-11T14:30:00.000Z"
  }
  ```

### 4.2 `PATCH /api/notifications`
Marks single or batch notifications as read.
- **Auth:** Required
- **Rate Limit:** Tier 3 (30/min)
- **Request Body (Single):**
  ```json
  { "notificationId": "8c593b4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" }
  ```
- **Request Body (Batch, max 100):**
  ```json
  { "notificationIds": ["8c593b4d...", "9a613c2e..."] }
  ```
- **Response (200 OK):**
  ```json
  { "success": true, "updatedCount": 2 }
  ```

---

## 5. Offline Sync Engine

### 5.1 `POST /api/offline-sync`
Processes a batch of offline-queued operations generated while disconnected. Strictly verifies client-generated UUIDs against `processed_client_ops` to guarantee idempotency.
- **Auth:** Required
- **Rate Limit:** Tier 3 (30/min)
- **Request Body:**
  ```json
  {
    "operations": [
      {
        "client_op_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "action": "create_record",
        "timestamp": 1728645000000,
        "payload": {
          "record_type": "other",
          "content": "Self-reported blood pressure 120/80"
        }
      }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "processed": 1,
    "skipped": 0,
    "failed": 0,
    "results": [
      { "client_op_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", "status": "processed" }
    ]
  }
  ```
  *If an operation with the same `client_op_id` was already processed, status is returned as `"already_processed"` with HTTP 200.*

---

## 6. Spatial Facilities & Directory

### 6.1 `GET /api/facilities/nearby`
Finds healthcare facilities within radius using PostGIS. Coordinates are rounded to ~1.1 km to maximize Edge CDN cache hits.
- **Auth:** Public
- **Rate Limit:** Tier 1 (60/min)
- **Cache-Control:** `public, s-maxage=3600, stale-while-revalidate=86400`
- **Query Parameters:**
  - `lat` (required, float)
  - `lng` (required, float)
  - `radius` (optional, float in km, default `50`, max `200`)
  - `type` (optional, `all` | `hospital` | `clinic` | `pharmacy` | `phc` | `chc`)
  - `limit` (optional, integer, default `50`, max `100`)
- **Response (200 OK):**
  ```json
  {
    "facilities": [
      {
        "id": "11111111-2222-3333-4444-555555555555",
        "name": "District Hospital Sehore",
        "type": "hospital",
        "address": "Civil Lines, Sehore",
        "phone": "+91 7562-224430",
        "lat": 23.2,
        "lon": 77.08,
        "distance_km": 1.4
      }
    ]
  }
  ```

### 6.2 `GET /api/providers`
Returns verified healthcare providers for directory and booking dropdowns.
- **Auth:** Public
- **Rate Limit:** Tier 1 (60/min)
- **Cache-Control:** `public, s-maxage=3600, stale-while-revalidate=86400`
- **Response (200 OK):**
  ```json
  {
    "providers": [ ... ]
  }
  ```

---

## 7. AI & Symptom Triage

### 7.1 `POST /api/ai-chat`
Streams conversational healthcare guidance via Gemini multi-model cascade (`gemini-2.5-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-3.5-flash`). Protected by 24h response cache and circuit breaker.
- **Auth:** Required
- **Rate Limit:** Tier 4 (15/min, daily quota 200)
- **Request Body:**
  ```json
  {
    "messages": [
      { "role": "user", "content": "मुझे पिछले तीन दिनों से बुखार और ठंड लग रही है।" }
    ]
  }
  ```

### 7.2 `POST /api/symptom-analyze`
Structured symptom evaluation returning triage classification (emergency, high, medium, low).
- **Auth:** Public
- **Rate Limit:** Tier 4 (15/min)
- **Request Body:**
  ```json
  {
    "symptoms": ["chest pain", "shortness of breath"],
    "language": "en"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "triageLevel": "emergency",
    "criticalAlert": true,
    "possibleConditions": ["Acute Coronary Syndrome", "Angina"],
    "recommendations": ["Call 108 Emergency immediately", "Do not exert yourself"]
  }
  ```

---

## 8. System & Observability

### 8.1 `GET /api/health`
Health check endpoint for uptime probes, container orchestrators, and Vercel monitors.
- **Auth:** Public
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "version": "1.13.0",
    "timestamp": "2026-10-11T14:30:00.000Z",
    "uptime": 12480
  }
  ```

### 8.2 `GET /api/cache-status` / `POST /api/cache-status`
Admin endpoint to monitor Redis hit/miss telemetry or purge stale AI response caches.
- **Auth:** Required (Admin only)
