# Assistant backend security mutation evidence — 22 November 2026

These are local behavioral unit/API tests using synthetic profiles, a query-filtering database double, and mocked Gemini/Jitsi seams. No production database or external service was used. Each guard was temporarily removed from its actual implementation, the focused behavioral assertion failed with exit code 1, and the guard was restored in a `finally` block. Focused `-t` runs report unrelated cases as skipped; the restored three-file run executes all 30 cases with no skips.

## Doctor provider scope removed

Implementation: `lib/services/appointments.service.ts`. Mutation test exit code: **1**.

```text
FAIL  tests/unit/assistant-actions-security.test.ts > Assistant action authorization and acknowledgment > reads doctor appointments by exact linked provider with no admin or GET mutation
AssertionError: expected [ …(2) ] to deeply equal [ Array(1) ]

- Expected
+ Received

  [
    "55555555-5555-4555-8555-555555555555",
+   "66666666-6666-4666-8666-666666666666",
  ]

 ❯ tests/unit/assistant-actions-security.test.ts:96:74
     94|     ])
     95|     const result = await handleGetAppointments(db.client, doctor, new …
     96|     expect((await result.json()).appointments.map((row: any) => row.id…
       |                                                                          ^
     97|     expect(mocks.admin).not.toHaveBeenCalled()
     98|     expect(db.queries.every((query) => !query.update.mock.calls.length…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 7 skipped (8)
   Start at  16:50:29
   Duration  592ms (import 71%, transform 24%, tests 3%, worker 2%)
```

## Personalized cache write exclusion removed

Implementation: `lib/services/ai-chat.service.ts`. Mutation test exit code: **1**.

```text
FAIL  tests/unit/assistant-clinical-safety.test.ts > Clinical API safety and personalized-cache isolation > does not write a personalized first-turn answer into either shared cache
AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times

Received:

  1st vi.fn() call:

    Array [
      "Explain my care plan",
      Object {
        "cachedAt": 1795346435357,
        "model": undefined,
        "replyEn": "Personal allergy advice",
        "replyHi": "व्यक्तिगत सलाह",
      },
    ]


Number of calls: 1

 ❯ tests/unit/assistant-clinical-safety.test.ts:60:118


⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 6 skipped (7)
   Start at  16:50:34
   Duration  724ms (import 63%, transform 33%, tests 3%, worker 1%)
```

## Deterministic severity floor removed

Implementation: `app/api/symptom-analyze/route.ts`. Mutation test exit code: **1**.

```text
FAIL  tests/unit/assistant-clinical-safety.test.ts > Clinical API safety and personalized-cache isolation > never lowers the deterministic severity or substitutes unsafe model action text
AssertionError: expected 'low' to be 'medium' // Object.is equality

Expected: "medium"
Received: "low"

 ❯ tests/unit/assistant-clinical-safety.test.ts:43:26
     41|     const result = await POST(request({ symptoms: ["nausea"], intensit…
     42|     const data = await result.json()
     43|     expect(data.urgency).toBe("medium")
       |                          ^
     44|     expect(JSON.stringify(data)).not.toContain("Ignore symptoms")
     45|     expect(data.whenToGoToHospital).not.toBe("Never")

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 6 skipped (7)
   Start at  16:50:40
   Duration  719ms (import 63%, transform 32%, tests 3%, worker 1%)
```

## Confirmation signature verification removed

Implementation: `lib/services/assistant-actions.service.ts`. Mutation test exit code: **1**.

```text
FAIL  tests/unit/assistant-actions-security.test.ts > Assistant action authorization and acknowledgment > prepares a server-bound draft, rejects tampering/user changes/expiry, then acknowledges booking
AssertionError: expected 201 to be 403 // Object.is equality

- Expected
+ Received

- 403
+ 201

 ❯ tests/unit/assistant-actions-security.test.ts:148:147
    146|     const changed = JSON.parse(Buffer.from(encoded, "base64url").toStr…
    147|     const tampered = `${Buffer.from(JSON.stringify(changed)).toString(…
    148|     expect((await executeAssistantAction(db.client, user, { action: "a…
       |                                                                                                                                                   ^
    149|     expect((await executeAssistantAction(db.client, { ...user, id: "99…
    150|     vi.advanceTimersByTime(5 * 60000)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 11 skipped (12)
   Start at  16:55:11
   Duration  591ms (import 67%, transform 27%, tests 5%, worker 1%)
```

## Teleconsultation participant authorization removed

Implementation: `lib/services/teleconsult-room.service.ts`. Mutation test exit code: **1**.

```text
FAIL  tests/unit/assistant-actions-security.test.ts > Assistant action authorization and acknowledgment > allows only the patient or exact verified doctor and derives participant role on the server
AssertionError: expected 200 to be 403 // Object.is equality

- Expected
+ Received

- 403
+ 200

 ❯ tests/unit/assistant-actions-security.test.ts:192:150
    190|     expect((await authorizedDoctor.json()).participantRole).toBe("doct…
    191|     expect(mocks.jitsi).toHaveBeenLastCalledWith(expect.objectContaini…
    192|     expect((await authorizeTeleconsultRoom(database([booking], { ...pr…
       |                                                                                                                                                      ^
    193|     mocks.patient.mockResolvedValue({ ...patient, id: "66666666-6666-4…
    194|     expect((await authorizeTeleconsultRoom(database([booking]).client,…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 11 skipped (12)
   Start at  16:55:16
   Duration  579ms (import 68%, transform 26%, tests 4%, worker 2%)
```

## Restored validation

```text
Test Files  3 passed (3)
Tests       30 passed (30)
```

Additional cases cover authenticated action routing, strict argument allowlisting, verified provider mapping, user/action-bound expiring confirmations, stable booking operation IDs and replay after cancellation, patient-only cancellation ownership, exact doctor-provider scope, India-time slot filtering without patient details, server-derived conference role/identity, expired/completed sessions, compare-and-set legacy room allocation, malformed model output, all 13 native emergency requests, and exclusion of personalized/non-English-Hindi answers from bilingual caches. Real RLS/concurrency verification against a disposable local Supabase instance is a separate required deployment check.
