# Project Study Guide

Updated 24 November 2026. This guide follows the current code, not the removed placement playbook. It covers the same core topics plus the voice controller, atomic offline replay, model installation and newer security boundaries. Read the source and reproduce an experiment before treating an explanation as your own understanding.

## Learning Order

Start with JavaScript/TypeScript, React and HTTP. Then learn the database and authorization boundaries before changing booking, records or assistant actions. Voice, offline and healthcare formats build on those foundations.

| Priority | Topic | You should be able to explain |
|---|---|---|
| 1 | TypeScript and asynchronous JavaScript | Narrowing, unions, validation, promises, cancellation and effect cleanup |
| 1 | React and Next.js App Router | Server/client boundaries, route composition, context and rendering lifecycle |
| 1 | HTTP and API design | Methods, cookies, validation, error codes, idempotency and authorization |
| 1 | PostgreSQL/Supabase | Keys, indexes, transactions, Auth identity, RLS and trusted role sources |
| 2 | Booking and offline replay | Database concurrency, operation IDs, partial batch outcomes and receipts |
| 2 | Security and testing | IDOR, privilege escalation, origins, secrets, mutation proofs and test limits |
| 2 | Accessible multilingual interaction | Deterministic commands, modal scope, confirmations, speech and device limits |
| 3 | Spatial data and healthcare formats | Coordinate order, provenance, PostGIS, FHIR references and certification limits |
| 3 | Operations and inference | CI, deployment drift, dependency maintenance, pinned models and recovery |

## 1. TypeScript, React and Module Boundaries

**Read:** [types](../types/index.ts), [AppProvider](../components/providers/AppProvider.tsx), [layout](../app/layout.tsx), [directory feature](../components/directory/index.tsx), [facility discovery hook](../components/map-view/hooks/use-facility-discovery.ts).

Study structural typing, optional values, discriminated unions, `unknown` versus `any`, generics and runtime validation. A TypeScript annotation disappears at runtime; API input still needs a parser such as Zod. Learn closures, promise rejection, `AbortController`, `useEffect` dependencies and cleanup when a component unmounts or a request is replaced.

The repository separates route composition, feature state, presentational `parts/`, hooks and shared logic. A small file such as [MapView.tsx](../components/MapView.tsx) is a compatibility export, not a duplicate implementation. Its explicit `index` target also avoids case-insensitive path collisions on Windows.

**Practice:** Trace `/locations` to the map, identify which code runs on the server and which needs browser APIs, and draw the data flow. In a local branch, add a pure formatting helper with tests, then intentionally break an import and confirm `npm run check:source` fails.

**Checkpoint:** Explain why React state does not immediately change inside the current callback, how stale responses can overwrite newer state, and why moving a browser-only module into a server import can fail during build.

## 2. Next.js, HTTP and the BFF

**Read:** [appointments handler](../app/api/appointments/route.ts), [appointments service](../lib/services/appointments.service.ts), [middleware](../middleware.ts), [API reference](API_REFERENCE.md), [HTTP inventory](CURRENT_ENDPOINTS.md).

Learn route handlers, cookies, request bodies, query parameters, cache headers and HTTP status semantics. The BFF is a server layer in the same repository as the UI; most business logic belongs in services, not the route file. Public page revalidation caches a shell, but client components can still call APIs after load.

Distinguish authentication (who is calling), authorization (which actions/rows are allowed), validation (is the input well formed) and business rules (is the requested transition valid). A hidden button or client redirect is not access control.

**Practice:** Write a sequence diagram for a booking request from UI through handler, service and database. Using mocked unit inputs, compare malformed input, missing session, wrong role, unavailable provider and slot conflict. Record the actual statuses rather than assuming every endpoint uses the same conventions.

**Checkpoint:** Explain `400`, `401`, `403`, `404`, `409`, `429` and `503`, and where each response is produced in the chosen flow.

## 3. Supabase Identity, Roles and RLS

**Read:** [auth guards](../lib/auth/guard.ts), [server client](../lib/supabase/server.ts), [admin client](../lib/supabase/admin.ts), [database reference](DATABASE.md), [care relationship tests](../tests/integration/rls-care-relationship.test.ts), [role incident](history/INCIDENT_ROLE_TRUST.md).

Understand `auth.users.id`, `patients.user_id` and `patients.id`; an Auth user ID and a patient-row ID are not interchangeable. The authoritative application role is `public.patients.role`. Client-writable metadata must not grant doctor/admin privileges. Learn primary/foreign keys, `auth.uid()`, `USING` versus `WITH CHECK`, recursive policies and care-relationship restrictions.

A service-role client can bypass RLS. Therefore RLS is not a universal shield around every query: privileged services need explicit authorization and narrow field selection. Learn `SECURITY DEFINER`, restricted function grants and safe search paths by reading the latest applicable migrations in chronological order.

**Practice:** Use only a disposable local Supabase stack. Create two synthetic patients and one assigned/unassigned doctor relationship. Demonstrate permitted and denied record access; change request IDs and metadata to verify those do not widen access. Never run these exercises against the deployed project.

**Checkpoint:** Explain why admins do not have general confidential clinical read access, why doctor reads are scoped, and why signup must assign the patient role unconditionally.

## 4. Appointment Concurrency and Lifecycle

**Read:** [booking service](../lib/services/appointments.service.ts), [booking client](../components/consultation-portal/booking-client.ts), [appointment tests](../tests/unit/appointments-and-auth.test.ts), [lifecycle tests](../tests/unit/doctor-claim-and-booking-lifecycle.test.ts), [concurrency postmortem](history/POSTMORTEM_CONCURRENCY_DOUBLE_BOOKING.md).

Learn the time-of-check/time-of-use race in `SELECT` followed by `INSERT`. Process-local locks cannot coordinate separate serverless instances. The scheduled-slot partial unique index `uq_provider_slot_scheduled` protects `(provider_id, appointment_date)`; PostgreSQL unique violation `23505` is mapped to a conflict response. Read the actual migration predicate rather than copying the obsolete playbook's three-column index.

Separate booking, cancellation, completion and expiry. Learn date parsing, UTC storage, India-time slot rules and the difference between an elapsed scheduled appointment and a completed consultation. A database uniqueness rule handles one invariant, not every lifecycle rule.

**Practice:** Run the disposable database concurrency test and inspect its exact assertion. Compare it with a mocked `Promise.all` unit test and the algorithmic benchmark: only the database test exercises real competing database writes.

**Checkpoint:** Explain what happens when a successful insert's HTTP response is lost, and why the UI needs an authoritative matching receipt before displaying completion.

## 5. PWA, Private Storage and Atomic Offline Replay

**Read:** [service worker](../app/sw.ts), [outbox](../lib/offline/outbox.ts), [executor](../lib/offline/executor.ts), [sync service](../lib/services/offline-sync.service.ts), [atomic RPC migration](../supabase/migrations/20261122000200_atomic_offline_sync.sql), [expiry guard](../supabase/migrations/20261122000300_offline_booking_expiry_guard.sql), [rollout guide](OFFLINE_SYNC_ROLLOUT.md).

Learn Cache Storage versus IndexedDB versus localStorage; request strategies; service-worker updates; browser quota, eviction and suspension. NetworkOnly private APIs do not mean private information is absent from the browser. Account-owned queues, logout cleanup, stale sessions and shared-device recovery must be considered separately.

Replay is atomic per operation: the authorized mutation and replay ledger commit in one database function. A batch can contain different outcomes; it is not necessarily one all-or-nothing transaction. Stable client operation IDs help recognize a retry, and reused IDs for a different request must fail. Supported operations are allowlisted and validated; offline support is not a generic API replay engine.

**Practice:** With synthetic local data, lose connectivity before submission, after submission and before receipt processing. Confirm queued versus acknowledged state, retry behavior, duplicate replay, changed-account rejection and expiry handling. Read the actual retry scheduler and backoff values rather than quoting historical formulas.

**Checkpoint:** Explain why browser `online` does not prove the server is reachable, why background sync is not guaranteed, and why exactly-once network delivery is different from an idempotent committed effect.

## 6. Voice Controller, Accessibility and Multilingual State

**Read:** [assistant UI](../components/voice-assistant/index.tsx), [page controller](../components/voice-assistant/usePageController.ts), [workflow hook](../components/voice-assistant/useAssistantWorkflow.ts), [page controls](../lib/assistant/page-controls.ts), [action service](../lib/services/assistant-actions.service.ts), [action receipts](../components/voice-assistant/action-receipts.ts), [implementation guide](HANDS_FREE_IMPLEMENTATION.md).

Learn state machines, task lifetime, cancellation and ownership of callbacks/resources. The bounded controller uses registered first-party controls, current modal/page scope, enabled state and target fingerprints. Model text does not gain permission to invent scripts, selectors or action URLs.

Guided consequential actions use server-prepared, user/action-bound, expiring signed confirmations and validated receipts. HMAC provides integrity/authenticity, not encryption; do not place secrets in a token payload. Cancellation revokes pending work but cannot undo a write already dispatched.

Study accessible names, focus, keyboard/switch input, text/contrast scaling, pictorial choices and Urdu direction. Thirteen native catalogs do not guarantee all page text or working recognition/synthesis on every device. Browser/OS permission controls need a trusted user interaction or supported device assistance.

**Practice:** Run controller tests, open a modal after listing options and verify an old target is revoked. Replace a task while speech is active. Compare “requested,” “queued” and server-confirmed results. Test one real locale/device manually and document failures without equating mocked audio with real speech.

**Checkpoint:** Explain how microphone ownership changes during a meeting/emergency, why stale callbacks matter, and what remains usable without a speech engine or model host.

## 7. Clinical Rules, Optional Models and Safety Limits

**Read:** [clinical safety](../lib/ai/clinical-safety.ts), [protocol engine](../lib/clinical/protocol-engine.ts), [symptom rules](../lib/symptoms/rules.ts), [gateway](../lib/ai/gateway.ts), [clinical evaluation tests](../tests/unit/clinical-safety-eval.test.ts), [model operations](MODEL_FALLBACK_AND_OPERATIONS.md).

Study deterministic screening before optional generative output, negation scope, danger signs, contraindication handling, input bounds, cache behavior and circuit breakers. These are engineering safeguards, not proof that arbitrary clinical language is understood correctly. Passing a finite evaluation set does not establish universal sensitivity or clinical certification. Emergency guidance does not automatically dispatch an ambulance.

The optional Python service loads explicit pinned snapshots and checks installation manifests/hashes. Model availability is independent: one missing model should not disable all capabilities. ASR, dialogue and TTS are separate tasks with different hardware/licensing/runtime requirements. Snapshot pinning controls reproducibility but does not remove patch maintenance.

**Practice:** Run dependency-free Python contracts without downloading models. Test clinical examples with negation, ambiguous wording, injection attempts and model unavailability using synthetic inputs. Record which local guard executes and what it cannot establish.

**Checkpoint:** Explain why a regex gate is useful but cannot certify unrestricted diagnosis; distinguish model integrity, model compatibility, inference quality and deployment availability.

## 8. Spatial Data, Provenance and FHIR

**Read:** [facility provenance](../lib/geo/facility-provenance.ts), [nearby endpoint](../app/api/facilities/nearby/route.ts), [datasets](DATASETS.md), [FHIR builders](../lib/abdm/builders.ts), [FHIR validation](../lib/abdm/validation.ts), [FHIR guide](ABDM_FHIR_INTEROPERABILITY.md).

Learn latitude/longitude order, GeoJSON's longitude-first coordinates, WGS84/SRID 4326, geography distance units, spatial indexes and bounded pagination. Bounding-box validation catches some bad data but does not verify a hospital's existence or current phone number. Directory rows, real clinician credentials and facility nodal contacts are distinct concepts.

For FHIR R4, study document `Bundle`, first-entry `Composition`, `Patient`, `Practitioner`, `Observation`, `DiagnosticReport`, `MedicationRequest`, `fullUrl` references, LOINC and UCUM. Local structural checks and NRCES-modelled output are not official ABDM certification, identity verification, consent exchange or national gateway connectivity.

**Practice:** Test a swapped coordinate and duplicate source record. Generate a synthetic FHIR bundle, remove a referenced resource and confirm validation fails. Explain the difference between straight-line map distance and road travel distance.

**Checkpoint:** Explain what provenance can establish, what needs human/source revalidation, and why accepted local FHIR output is not proof of external gateway acceptance.

## 9. Tests, CI and Production Operations

**Read:** [CI workflow](../.github/workflows/ci.yml), [source checker](../scripts/ci/component-checks.mjs), [database safety guard](../tests/integration/db-safety-guard.ts), [integration report gate](../scripts/ci/verify_integration_tests.mjs), [testing](TESTING.md), [deployment](DEPLOY.md), [audit](FINAL_AUDIT.md).

Study unit mocks, database integration, browser journeys, dependency-free Python contracts and simulations as different evidence classes. A mutation proof deliberately introduces a vulnerability and verifies a specific test catches it before restoration. Skipped tests and success on an older commit cannot attest a new deployment.

Learn environment separation, client/server secret boundaries, exact-origin checks, rate limiting, log sanitization, backups, migration ordering and dependency advisories. Redis limits can coordinate instances; memory fallback is process-local. The optional Python host is a separate process and is not automatically hosted by Vercel.

**Practice:** Run the safe local checklist below. Inspect a GitHub run's commit and each job before claiming success. Draft an owner-controlled rollout plan with rollback/recovery checks; do not push, deploy or apply production SQL as a study exercise.

```bash
npm run check:components
npm run check:docs
npm run check:boundaries
npm run check:publication
npm run build
python -m unittest discover -s services/voice/tests -v
```

Database and authenticated E2E exercises require disposable local Supabase and synthetic accounts. Follow [TESTING.md](TESTING.md); never point them at production. Real-device speech, clinical review, external conferencing and deployed configuration remain separate verification.

## Suggested Four-Week Schedule

| Week | Focus | Deliverable |
|---|---|---|
| 1 | Sections 1-3 | Route/module map, one HTTP sequence diagram, identity/role explanation and a safe local test setup |
| 2 | Sections 4-5 | Concurrency experiment, offline failure timeline and a storage/account-boundary diagram |
| 3 | Sections 6-8 | Controller state diagram, clinical safeguard limits, coordinate/FHIR negative tests |
| 4 | Section 9 and revision | Reproduced verification notes, deployment checklist and a five-minute project walkthrough |

## Interview Self-Check

Answer in your own words, with a current file reference and one verified limitation:

1. Why use a BFF and what still runs in the browser?
2. How do Auth IDs, patient IDs and roles relate?
3. When does RLS protect a query, and when does a privileged client bypass it?
4. What exact database invariant prevents a scheduled-slot collision?
5. How does a lost HTTP response differ from a rejected database write?
6. What is atomic in offline replay, and what is not?
7. Why are signed confirmations and matching receipts both needed?
8. How are stale voice targets and callbacks revoked?
9. What is genuinely offline, and what depends on a device or external service?
10. Why do clinical tests, FHIR validation and language catalogs not prove certification?
11. Which checks exercise real infrastructure, and which use mocks or simulations?
12. How would you establish that the deployed revision and database schema match the repository?

Avoid claims of guaranteed zero cost, universal emergency accuracy, unlimited hosting, fully autonomous device control or national healthcare certification. Use measured, scoped evidence and describe the work you actually understand and performed.
