# API Reference: Rural Healthcare Platform

This document serves as the comprehensive guide to all backend endpoints available in the Rural Healthcare Platform. It details the purpose, required payloads, validation schemas, and responses for every Next.js API Route.

---

## Global API Rules

- **Base URL:** All API requests are relative to `/api` (e.g., `https://ruralhealth.in/api/...`)
- **Content-Type:** All POST/PUT requests must send `application/json` unless otherwise specified.
- **Authentication:** All routes automatically check for the Supabase HTTP-Only Auth Cookie attached to the request. Most routes require a valid session.
- **Rate Limiting:** IP-based in-memory rate limiting is applied globally to prevent abuse (via `lib/rate-limit.ts`).

---

## 1. AI & Analysis

### 1.1 Conversational Chat
**Route:** `/api/ai-chat`  
**Method:** `POST`  
**Description:** Streams a conversational response from Google Gemini AI, acting as a rural healthcare assistant.  
**Files:** `app/api/ai-chat/route.ts`  
**Authentication:** Required.  
**Validation:** Zod `z.object({ messages: z.array(z.any()) })`

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "मुझे बुखार है (I have a fever)" }
  ]
}
```

**Response (Streaming text):**
```text
आपको कितना तेज़ बुखार है? क्या आपको ठंड भी लग रही है?
```

### 1.2 Symptom Analysis
**Route:** `/api/symptom-analyze`  
**Method:** `POST`  
**Description:** Structural AI analysis of user symptoms returning a JSON triage response.  
**Files:** `app/api/symptom-analyze/route.ts`  
**Authentication:** Not Required (Accessible to Guests).  
**Validation:** Zod `z.object({ symptoms: z.array(z.string()), language: z.string() })`

**Request Body:**
```json
{
  "symptoms": ["chest pain", "shortness of breath"],
  "language": "en"
}
```

**Response (200 OK):**
```json
{
  "analysis": {
    "possibleConditions": ["Angina", "Myocardial Infarction"],
    "triageLevel": "critical",
    "recommendations": ["Seek immediate medical attention", "Call emergency hotline (108)"]
  }
}
```

---

## 2. Teleconsultation & Appointments

### 2.1 Appointments Management
**Route:** `/api/appointments`  
**Method:** `GET`, `POST`  
**Description:** Fetches upcoming/past appointments for the authenticated user, or books a new teleconsultation.  
**Files:** `app/api/appointments/route.ts`  
**Authentication:** Required.  

**POST Validation:** Zod
```typescript
z.object({
  provider_id: z.string().uuid(),
  appointment_date: z.string().datetime(),
  notes: z.string().optional()
})
```

**POST Body:**
```json
{
  "provider_id": "c9a632e8-...",
  "appointment_date": "2026-07-10T10:00:00Z",
  "notes": "Follow up for blood test"
}
```

**Response (200 OK):**
```json
{
  "id": "f47ac10b-...",
  "status": "scheduled"
}
```

### 2.2 Teleconsult Room Generation
**Route:** `/api/teleconsult/room`  
**Method:** `POST`  
**Description:** Verifies appointment ownership and generates a secure Jitsi Room ID.  
**Files:** `app/api/teleconsult/room/route.ts`  
**Authentication:** Required.  
**Validation:** Zod `z.object({ appointment_id: z.string().uuid() })`

**Response (200 OK):**
```json
{
  "roomId": "ruralhealth-c9a632e8-168910101010",
  "token": "..." // (Future JWT integration)
}
```

---

## 3. Profiles & Roles

### 3.1 Fetch / Update Profile
**Route:** `/api/auth/profile`  
**Method:** `GET`, `PUT`  
**Description:** Retrieves or updates the patient/provider profile linked to the Auth UUID.  
**Files:** `app/api/auth/profile/route.ts`  
**Authentication:** Required.  

**PUT Body:**
```json
{
  "first_name": "Ramesh",
  "last_name": "Kumar",
  "phone": "9876543210"
}
```

### 3.2 Ensure Patient Record
**Route:** `/api/auth/ensure-patient`  
**Method:** `POST`  
**Description:** Ensures a `patients` row exists for a newly signed-up Supabase Auth user. Acts as a safety fallback.  
**Files:** `app/api/auth/ensure-patient/route.ts`  
**Authentication:** Required.  

---

## 4. Facilities & Providers

### 4.1 Nearby Facilities
**Route:** `/api/facilities/nearby`  
**Method:** `GET`  
**Description:** Queries the PostGIS database via RPC to return facilities within a radius of the user's coordinates.  
**Files:** `app/api/facilities/nearby/route.ts`, `scripts/006_facilities_postgis.sql`  
**Authentication:** Not Required.  
**Validation:** Query Params `lat`, `lng`, `radius` (optional, defaults to 25km).

**GET Request:** `/api/facilities/nearby?lat=23.2599&lng=77.4126`

**Response (200 OK):**
```json
[
  {
    "id": "e9b632e8-...",
    "name": "District Hospital Bhopal",
    "type": "hospital",
    "distance_km": 4.2,
    "lat": 23.2100,
    "lon": 77.4000
  }
]
```

### 4.2 Fetch Providers
**Route:** `/api/providers`  
**Method:** `GET`  
**Description:** Fetches all verified doctors/providers for the directory.  
**Files:** `app/api/providers/route.ts`  
**Authentication:** Not Required.  

---

## 5. Medical Data

### 5.1 Health Data (Vitals)
**Route:** `/api/health-data`  
**Method:** `GET`, `POST`  
**Description:** Records continuous health vitals (Heart rate, BP, sugar).  
**Files:** `app/api/health-data/route.ts`  
**Authentication:** Required.  

**POST Body:**
```json
{
  "metric_type": "blood_pressure",
  "metric_value": "120/80",
  "unit": "mmHg"
}
```

### 5.2 Medical Records
**Route:** `/api/medical-records`  
**Method:** `GET`, `POST`  
**Description:** Manages uploaded prescriptions and lab reports.  
**Files:** `app/api/medical-records/route.ts`  
**Authentication:** Required.  

**POST Validation:** Zod
```typescript
z.object({
  record_type: z.enum(['diagnosis', 'prescription', 'lab_result', 'vaccination', 'other']),
  content: z.string().min(1),
  file_url: z.string().url().optional()
})
```

---

## 6. Offline & Sync

### 6.1 Offline Sync Queue
**Route:** `/api/offline-sync`  
**Method:** `POST`  
**Description:** Accepts a batched array of requests that the client queued in IndexedDB while offline.  
**Files:** `app/api/offline-sync/route.ts`  
**Authentication:** Required.  

**POST Body:**
```json
{
  "actions": [
    {
      "type": "SAVE_HEALTH_DATA",
      "payload": { "metric_type": "heart_rate", "metric_value": "72" },
      "timestamp": 1720000000
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "processed": 1,
  "failed": 0
}
```

---

## Error Handling

All API routes follow a standardized error response format.

**400 Bad Request (Zod Validation Failure):**
```json
{
  "error": "Validation failed",
  "details": [
    { "path": ["metric_type"], "message": "Required" }
  ]
}
```

**401 Unauthorized (No Session):**
```json
{
  "error": "Unauthorized"
}
```

**429 Too Many Requests:**
```json
{
  "error": "Too many requests. Please try again later."
}
```
