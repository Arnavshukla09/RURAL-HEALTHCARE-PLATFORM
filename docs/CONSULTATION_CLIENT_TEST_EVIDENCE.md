# Consultation client and record-binding evidence — 22 November 2026

The frontend now uses server-acknowledged appointments and authorized room credentials. New behavioral client tests reject failed/mismatched booking responses, block denied room responses, require valid room tokens where configured, bind saved records to their actual appointment/patient/provider, preserve patient notes as patient-provided records, and print input through text nodes rather than HTML interpolation.

The record API tests exercise authentication, patient/admin prescription restrictions, exact assigned-clinician ownership, mismatched target rejection, authoritative identity metadata, and compatibility with standalone patient-provided uploads.

## Isolated mutation proofs

To avoid disrupting another agent's integrated build, the actual implementations were copied and transpiled to temporary modules. Exactly one guard was removed per case, and the existing behavioral test was run through a temporary Vitest module alias. The main checkout implementations and test assertions were unchanged. Temporary modules/configuration were deleted in a `finally` block. Both mutants failed with exit code 1.

### Denied room response accepted

Source implementation: `app/teleconsult/room/room-client.ts`.

```text
FAIL  tests/unit/consultation-client-integrity.test.ts > Acknowledged booking and authorized consultation clients > blocks denied room access and invalid tokens before returning any Jitsi settings
AssertionError: promise resolved "{ …(12) }" instead of rejecting

- Expected
+ Received

- Error {
-   "message": "rejected promise",
+ {
+   "appointmentId": "11111111-1111-4111-8111-111111111111",
+   "doctorName": "Dr. Registered",
+   "domain": "meet.jit.si",
+   "facilityName": "Clinic",
+   "participantName": "Dr. Registered",
+   "participantRole": "doctor",
+   "patientId": "33333333-3333-4333-8333-333333333333",
+   "patientName": "Patient One",
+   "providerId": "22222222-2222-4222-8222-222222222222",
+   "requiresToken": true,
+   "roomId": "actual_server_room",
+   "token": "signed-token",
  }

 ❯ tests/unit/consultation-client-integrity.test.ts:45:52
     43|   it("blocks denied room access and invalid tokens before returning an…
     44|     fetcher.mockResolvedValueOnce(json({ ...room, error: "Access denie…
     45|     await expect(loadAuthorizedRoom(appointmentId)).rejects.toThrow("A…
       |                                                    ^
     46|     fetcher.mockResolvedValueOnce(json({ ...room, token: null }))
     47|     await expect(loadAuthorizedRoom(appointmentId)).rejects.toThrow("c…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
```

### Patient consultation prescription allowed

Source implementation: `lib/services/appointment-records.service.ts`.

```text
FAIL  tests/unit/appointment-records-binding.test.ts > Appointment-bound clinical record ownership > requires authentication and prevents patient/admin prescription authorship
AssertionError: expected 201 to be 403 // Object.is equality

- Expected
+ Received

- 403
+ 201

 ❯ tests/unit/appointment-records-binding.test.ts:39:73
     37|     for (const role of ["patient", "admin"]) {
     38|       const db = database(role, true); mocks.auth.mockResolvedValue({ …
     39|       expect((await POST(request({ ...data, role: "doctor" }))).status…
       |                                                                         ^
     40|       expect(db.inserts).toHaveLength(0)
     41|     }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
```

## Current implementation verification

```text
Test Files  2 passed (2)
Tests       9 passed (9)
```

An additional three-file targeted run including assistant room/authorization tests passed all 21 cases. TypeScript and ESLint passed for the completed frontend/service edits. These are local mocked API tests; real browser layouts, a local Supabase database, and a real conference session require independent verification. No production database query or external message was performed.
