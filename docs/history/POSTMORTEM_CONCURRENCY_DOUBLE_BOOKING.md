# Engineering Postmortem: Concurrent Appointment Double-Booking & Health Probe Table Name Discrepancy

**Incident ID:** INC-2026-10-01  
**Date:** October 2026  
**Status:** Resolved & Verified in CI  
**Severity:** P1 (High)  
**Authors / Engineers:** Engineering Partner & Core Maintainer  
**Affected Subsystems:**
- `app/api/appointments/route.ts` (OPD Booking Mutation API)
- `app/api/health/route.ts` (Readiness & Liveness Probe)
- `tests/unit/appointments-and-auth.test.ts` (Concurrency Regression Suite)
- `tests/unit/probes-and-benchmarks.test.ts` (Probe Verification Suite)

---

## 1. Executive Summary

During an architectural audit of the platform's backend transactional integrity, two significant correctness defects were identified:
1. **Appointment Concurrency Race Condition:** Two patients submitting booking requests for the exact same doctor and time slot simultaneously could both receive `201 Created` confirmations due to a classic Time-of-Check to Time-of-Use (TOCTOU) race condition.
2. **Health Check Canonical Table Discrepancy:** The container liveness probe (`app/api/health/route.ts`) queried a legacy table named `facilities` instead of the canonical PostGIS table `healthcare_facilities`, causing false `503 Degraded` status reports in production monitoring.

Both issues have been remediated, verified with automated unit tests (`Promise.all` concurrency collision and liveness probe mocking), and merged with zero downtime.

---

## 2. Timeline of Events

| Timestamp | Phase | Action / Event |
| :--- | :--- | :--- |
| **T0 (Audit)** | Identification | Independent architecture review flagged that appointment uniqueness was checked via a pre-insert `SELECT` rather than database-level constraints. |
| **T+1h** | Reproduction | Simulated simultaneous requests using Vitest `Promise.all()`. Confirmed that concurrent promises bypassed client-side checks and resulted in double-booking. |
| **T+2h** | Identification | Health check endpoint inspection revealed `supabase.from("facilities")` failed because migration `20260701000000_core_schema.sql` created `healthcare_facilities`. |
| **T+3h** | Fix Implementation | Hardened `app/api/appointments/route.ts` with serialized slot conflict checking and transactional 409 Conflict response. Fixed table name in `app/api/health/route.ts`. |
| **T+4h** | Test Verification | Added deterministic concurrency regression tests in `tests/unit/appointments-and-auth.test.ts` and probe tests in `tests/unit/probes-and-benchmarks.test.ts`. |
| **T+5h** | Closure | Both fixes committed and pushed to `main`; 100% test pass rate verified in automated CI pipeline. |

---

## 3. Root Cause Analysis (5 Whys)

### Issue A: Double-Booking Race Condition
1. **Why could two patients book the same slot?**  
   Both requests queried the database before either request had committed an insert.
2. **Why was the second request not blocked?**  
   The application relied on a sequential read-then-write pattern (`SELECT existing -> if none, INSERT`) inside a standard route handler without transaction locks or database exclusion constraints.
3. **Why did the database permit the second insert?**  
   The `appointments` table lacked a composite unique index on `(provider_id, appointment_date, time_slot)` where `status != 'cancelled'`.
4. **Why was this not caught in hackathon testing?**  
   Testing was conducted manually via browser clicks with seconds between requests; sub-millisecond concurrent network arrivals were never simulated.
5. **Root Cause:**  
   Concurrency guarantees were assumed from frontend state and non-atomic application-level validation rather than enforced at the database storage engine level.

---

## 4. Technical Resolution & Architecture Changes

### 4.1 Appointment Concurrency Enforcement
Updated `app/api/appointments/route.ts` and database schema definitions:
* **Database Unique Exclusion Constraint:** Added composite unique constraint enforcing that only one active appointment can exist for a given `(provider_id, appointment_date, time_slot)`:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS idx_active_appointment_slot
    ON public.appointments (provider_id, appointment_date, time_slot)
    WHERE status != 'cancelled';
  ```
* **Atomic Conflict Handling (HTTP 409):** The API handler catches unique constraint violations (`code === "23505"`) and immediately responds with `HTTP 409 Conflict`:
  ```typescript
  if (insertError?.code === "23505" || conflictDetected) {
    return NextResponse.json(
      { error: "This appointment slot has already been reserved by another patient. Please select a different time." },
      { status: 409 }
    )
  }
  ```

### 4.2 Health Check Canonical Table Correction
Updated line 21 in `app/api/health/route.ts`:
```typescript
// BEFORE (Bug):
const { error } = await supabase.from("facilities").select("id").limit(1)

// AFTER (Fix):
const { error } = await supabase.from("healthcare_facilities").select("id").limit(1)
```

---

## 5. Verification & Test Evidence

### Concurrency Collision Test (`tests/unit/appointments-and-auth.test.ts`)
```typescript
it("handles simultaneous concurrent booking requests without double-booking", async () => {
  // Fire two concurrent requests for the exact same slot simultaneously
  const [res1, res2] = await Promise.all([
    POST(req1),
    POST(req2),
  ])

  const statuses = [res1.status, res2.status].sort()
  // Exactly one request MUST succeed (201), and the conflicting request MUST be rejected (409)
  expect(statuses).toEqual([201, 409])
})
```

### Probe Verification Test (`tests/unit/probes-and-benchmarks.test.ts`)
* `GET /api/ready`: Returns `HTTP 200`, `ready: true`, `Cache-Control: no-store`.
* `GET /api/health`: Returns `HTTP 200`, `status: "ok"`, `database: "connected"`, and measured `durationMs`.
* Degraded Query Error: Returns `HTTP 503`, `status: "degraded"`.
* Connection Refused: Returns `HTTP 503`, `database: "unavailable"`.

---

## 6. Lessons Learned & Preventative Measures

1. **Database is the Source of Truth:** Application-level validation in Node.js serverless functions is fundamentally susceptible to race conditions under concurrent load. Uniqueness and consistency must always be enforced by PostgreSQL indexes and constraints.
2. **Simulate Concurrency in CI:** Every state-mutating endpoint must be tested with `Promise.all()` to simulate parallel execution before merging.
3. **Strict Table Naming Alignment:** Centralize table names into canonical constants to prevent discrepancies between migrations, APIs, and health probes.
4. **No Synthetic Fillers:** Health check probes must touch canonical production tables to provide genuine operational signals.
