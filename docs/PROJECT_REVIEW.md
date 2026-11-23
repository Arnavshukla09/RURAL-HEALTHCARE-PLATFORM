# Project review — 22 November 2026

> Historical review snapshot. Findings and line references below describe the review at its recorded date. For the current 23 November 2026 state and resolved findings, use [FINAL_AUDIT.md](FINAL_AUDIT.md), [ARCHITECTURE.md](ARCHITECTURE.md) and [MODEL_FALLBACK_AND_OPERATIONS.md](MODEL_FALLBACK_AND_OPERATIONS.md).

This is the source-review snapshot before the voice-assistant implementation. Appointment/consultation acknowledgments, server authorization, clinical urgency floors, private-cache cleanup and offline replay have since been changed. See [VOICE_ASSISTANT_SETUP.md](VOICE_ASSISTANT_SETUP.md) and its evidence links for the current implementation; the findings below preserve the original review context.

## Overall assessment

The repository contains a substantial, modular Next.js healthcare application, with patient, doctor, and administrator screens; emergency assistance; provider and facility discovery; deterministic clinical rules; Gemini assistance; offline mutation queues; and FHIR document generation. The application builds successfully and its existing local quality gates pass.

Those passing checks do not establish production readiness. Several implemented flows bypass or fail to use the documented security controls, and some screens report successful healthcare operations without a successful database write. The most urgent work is appointment authorization, teleconsultation entry, clinical safety enforcement, personal-data cache isolation, and truthful booking confirmation.

This review inspected the project inventory, principal application and service flows, database migrations and policies, test configuration and coverage, datasets, scripts, CI workflows, and documentation. Generated dependency/build trees were treated as outputs, rather than application source. This is a source and local-verification review, not a penetration test or certification of the deployed service. No production database queries, migrations, seed scripts, messages, or load tests were executed. Secret values from `.env.local` were not displayed.

## Folder map and technology

Counts below describe the source inventory before this report, excluding dependencies, build output, and temporary verification fixtures.

| Area | Contents and responsibility |
|---|---|
| `app/` | 59 files, including 28 pages and 22 API route handlers; App Router layouts, auth callback, service worker, and public/patient/doctor/admin routes. |
| `components/` | 173 files; feature packages with `index.tsx`, `parts/`, hooks, and types, plus Radix/Tailwind UI primitives. Several top-level components are compatibility re-exports. |
| `lib/` | 68 files; authorization, Supabase clients, service logic, AI routing, emergency tools, clinical protocols, offline queues, geographic data, schemes, and FHIR builders. |
| `tests/` | 29 unit test files, one database integration suite and its safety guard, five Playwright journeys, and chat-routing fixtures. |
| `supabase/` | 23 sealed SQL migrations, seed fixtures, local configuration, schema contract, snapshots/checksums, and rollback material. |
| `scripts/` | 16 scripts for CI gates, migration verification, schema checks, dataset generation/ingestion, and provider reconciliation. |
| `public/` | PWA manifest/icons, hero artwork, a security contact file, and five district facility packs. |
| `docs/` | Architecture, API/database references, deployment and testing guidance, clinical safety, dataset provenance, and historical incident/performance reports. |
| `loadtest/` | k6 scenarios, synthetic staging seed/cleanup SQL, token tooling, simulations, and capacity estimates. |
| `.github/workflows/` | Quality/build, local database and E2E testing; keep-alive; staging load smoke; manual deployment cleanup. |
| Root CSV files | Ignored raw hospital/PM-JAY/Practo source datasets. They are inputs, not proof of deployed database contents. |
| `.next/`, `node_modules/`, `test-results/` | Generated local output/dependencies. `.env.local` is ignored local configuration. |

The stack is Next.js 15.5.28, React 18.3.1, TypeScript 5.7.3, Tailwind 3, Supabase Auth/PostgreSQL/PostGIS, Serwist, IndexedDB (`idb`), Leaflet, Gemini, Jitsi, and optional Upstash Redis. Verification uses Vitest, Playwright, ESLint, Knip, and migration SHA-256 checks. The review ran on Node 24.14.0/npm 11.9.0; CI targets Node 22. The application has an MIT license.

## How the application works

Nine public pages use one-hour revalidation. Most interactions run in client components. `AppProvider` restores an application profile from local storage, validates the Supabase session, and manages language and symptom state. Middleware checks protected patient, doctor, and administrator routes; API handlers perform their own authentication checks and usually delegate business logic to `lib/services/`.

The database distinguishes authentication user IDs, patient-profile IDs, and healthcare-provider IDs. That distinction matters: appointments reference patient and provider rows, while healthcare providers link back to authentication users. The latest security reconciliation derives roles from `patients.role`, creates care-scoped doctor policies, and restricts administrative clinical-record access. Historical migrations still contain superseded policies; the final applied migration sequence, rather than an isolated historical file, determines database behavior.

Public discovery uses a bundled practitioner/contact directory, local district packs, and a PostGIS nearby-facilities RPC. AI chat checks emergency rules and a local knowledge engine before model dispatch, with exact/semantic response caching and quota/circuit-breaker helpers. The symptom-analysis API has a separate pipeline. Offline mutations go into a browser IndexedDB outbox, are posted in batches of up to 50, and use a database operation ledger for replay tracking. FHIR export builds local document bundles and checks internal references; official national-gateway verification is not implemented.

## Verification performed

| Check | Observed result | Practical limit |
|---|---|---|
| `npm run test:unit` | **210 passed across 29 files** | Mocked/pure-function/source-contract tests do not cover every real user flow. |
| `npm run lint` | Passed, no warnings/errors | `next lint` is deprecated for the next major Next.js version. |
| `npm run check:components` | Passed | Includes TypeScript, lint, unit tests, Knip, import/export checks, migration checks, and file-size limits. Knip disables unused-export/type checks and ignores selected dependencies. |
| `npm run check:migrations` | **23 migrations verified** | Proves files match their sealed manifest, not that a running database applied them. |
| `npm run build` | Passed; 52 static generation entries | The first sandbox attempt failed with an `.next` directory permission error; the approved retry succeeded. Supabase URL/key settings were overridden with placeholders for the build. |
| `npm run report:dataset` | Passed | Validates local formatting, bounds and coverage; does not independently verify medical licenses or production ingestion. |
| `npm run benchmark:integration` | **21/21 checks passed** | An offline simulation with replicated algorithms and a mock booking engine, not a live database/load benchmark. |
| `npm run test:integration` | **3 passed, 20 skipped** | Database target deliberately cleared. Docker and Supabase CLI were unavailable; live RLS and concurrency were not verified here. |
| Dependency audit allowlist gate | Passed after approved network retry; five high-severity package entries allowed until **31 December 2026** | Initial registry lookup failed and the script still exited successfully; see finding 13. Passing this gate does not mean zero vulnerabilities. |
| Six isolated review checks | **6/6 reproduced the described current behavior** | Network/model/storage/database seams were mocked. These were observations of defects, not six assertions that the product is correct. |

Playwright, deployed-site testing, official HL7/NHA validation, real video sessions, and load testing were not run. The CI file defines local-stack database and E2E jobs, but a workflow definition alone is not evidence that the latest remote run passed.

The build reports **105 kB shared first-load JavaScript**, **191 kB for the home page**, **271 kB for the directory**, and **276 kB for consultation**. The shared chunk size should not be presented as the total initial page payload or as a measured compressed transfer size.

## Dataset findings

- The bundled directory has **456 records: 31 clinicians and 425 facility nodal contacts**. All audited identifiers were unique and all audited phone formats/coordinates passed their local checks.
- The raw PM-JAY CSV contains **42,321 facility rows**, all within the audit's geographic bounds, but only **7,982** have a phone contact satisfying its length check.
- The bundled geographic reference contains **36 states/UTs and 725 districts**. Only **five district facility packs** are present; district-name coverage does not imply facility coverage in every district.
- Raw input sizes are approximately 10.34 MB for `data_hospital_directory.csv`, 6.99 MB for `pmjay_facilities_contacts.csv`, and 1.06 MB for `practo_reviews.csv`.
- Source-confirmed facility contacts should continue to be clearly separated from independently verified individual clinicians. Local provenance labels and formatting checks are not an independent credential-verification service.

## Priority findings

P1 means a security, clinical-safety, or core-workflow issue that should be resolved before relying on the affected flow for real care. P2 means an important correctness or operational defect. Items marked source inspection have not been demonstrated against a live database/browser.

### 1. P1 — Doctor appointment reads bypass care scoping and can reassign appointments

**Evidence:** `lib/services/appointments.service.ts:37`, `:46`, `:70`, `:82`, `:100` (source inspection).

The doctor GET path uses the service-role client, broadens provider matching to authentication/patient IDs and a demo alias, and ORs that filter with a doctor-name substring in patient-controlled notes. Consequently an appointment assigned to another doctor can appear with patient contact information and notes. The same GET handler asynchronously rewrites mismatched provider IDs when notes contain the doctor's name. Since care relationships depend on provider assignment, this can change later access to medical records. It also promotes linked verified users to the doctor role during a read, outside the dedicated onboarding flow.

**Recommended correction:** Use the authenticated client and authoritative linked provider IDs for reads. Remove name-based access and mutation from GET. Perform legacy reconciliation through an explicit audited administrative operation.

### 2. P1 — The teleconsultation screen bypasses the room authorization endpoint

**Evidence:** `app/teleconsult/room/page.tsx:32`, `:34`, `:337`; `components/AppointmentManager.tsx:106`; `components/DoctorDashboard.tsx:69`; `app/api/teleconsult/room/route.ts` (source inspection).

The room page takes the room and role from URL parameters and renders Jitsi directly. The normal navigation links lead to that page rather than obtaining access through the API that verifies appointment ownership and time windows. No JWT is passed to Jitsi from this page. The default public Jitsi mode allows direct room entry; configured mandatory-token mode blocks this UI because it never retrieves a token. A URL role also controls doctor presentation and prescription defaults.

**Recommended correction:** Authenticate the page, resolve an appointment ID on the server, obtain the authorized room/token response, and derive participant role from the authenticated profile. Conferencing-provider enforcement must support the intended access model.

### 3. P1 — Personalized AI answers enter a shared cache

**Evidence:** `lib/services/ai-chat.service.ts:157` and `:245` (reproduced with a mocked model/cache).

Cache reads are skipped when clinical pretext is present, but cache writes only check for an empty history. A first response personalized to allergies, medication, or chronic disease is written under the shared message key. A later person asking the same question without pretext can receive the earlier person's advice. Semantic caching can broaden reuse.

**Recommended correction:** Apply the same personalization exclusion to writes and reads, and review existing exact/semantic entries for safe invalidation. Do not share patient-specific advice or identifying content between users.

### 4. P1 — Symptom analysis can accept an unsafe model urgency downgrade

**Evidence:** `app/api/symptom-analyze/route.ts:76`, `:95`, `:96`, `:104` (reproduced with a model returning `urgency: low` for chest pain/breathing difficulty).

Unlike chat, symptom analysis does not enforce an emergency gate before model dispatch. Any parseable model JSON is returned without schema validation or a deterministic severity floor. Deterministic triage only runs after model failure. The catch-all fallback also discards symptoms and evaluates an empty list.

**Recommended correction:** Evaluate red flags first, prevent model output from lowering their severity, validate the response schema, and preserve validated intake for error fallback. Add tests at this API boundary.

### 5. P1 — Booking confirmation is independent of server success and uses a different room ID

**Evidence:** `components/consultation-portal/index.tsx:223`; `lib/services/appointments.service.ts:16` and `:210` (source inspection).

The booking UI does not inspect the response status or body, catches fetch failures, reserves the slot locally, issues local notification logic, and displays success. A 401, validation failure, slot conflict, timeout, or database failure can therefore look like a confirmed consultation. The UI generates and sends a room ID that the server schema strips; the server creates its own room ID, while the confirmation continues using the client ID. A selected directory doctor without a provider mapping can also fall back to the first available verified provider on the server.

**Recommended correction:** Confirm only after a 201 response, consume its appointment/provider/room IDs, require explicit provider mapping, surface 409 conflicts, and represent an offline request as queued until acknowledged.

### 6. P1 — Doctor invitation and claim approval are browser-local mechanisms

**Evidence:** `lib/doctor-claims.ts:41`, `:66`, `:82`, `:115`, `:135`; `app/doctor/claim/page.tsx:73`, `:134`; `components/admin-user-management/index.tsx:126` (constant bypass reproduced).

The token uses a deterministic 32-bit hash rather than the documented HMAC. A constant bypass token is accepted. This module is imported into client components, where the non-public server secret is unavailable and the known fallback is used. Submission and approval live in local storage, so separate doctor/admin browsers do not share the claims. Approval updates a local claimed profile, not the authoritative database role/provider link. The separate `/api/doctor-requests` workflow does perform server-side provisioning, but it is not the same claim queue.

**Recommended correction:** Move invitation creation/verification and claim persistence to the server, remove the constant bypass, use signed expiring invitations, and connect review to audited database provisioning. This finding does not establish that local claim approval alone elevates a real Supabase role.

### 7. P1 — Logout cleanup leaves medical information and outbox ownership is missing

**Evidence:** `lib/offline/cache-cleaner.ts:22`, `:27`, `:31`; `lib/offline/outbox.ts:13`; `lib/offline/sync.ts:76`, `:93`; `components/header/index.tsx` (storage residue reproduced; ownership risk from source inspection).

The cleaner removes one legacy local-storage key. User-scoped record caches, local prescriptions, emergency profile/pretext, and other medical content remain. Its database-name filter misses `ruralhealth_ai` and `ruralhealth_blackbox_db`; deletion requests are not awaited and may be blocked by open connections. Header logout starts cleanup without awaiting it before navigation. The outbox has no originating user ID and submits all pending operations under whichever session is current. If cleanup is interrupted or accounts change without effective cleanup, another account's operations can be attributed to the current patient.

**Recommended correction:** Define explicit storage ownership/retention, scope operations to the originating user, close and clear database connections reliably, await cleanup, and handle authentication-state changes as well as the logout button.

### 8. P1 — Offline idempotency is not atomic

**Evidence:** `lib/services/offline-sync.service.ts` idempotency lookup, mutation loop, and final ledger insert (duplicate-in-batch and failed-ledger acknowledgment reproduced).

Mutation writes occur before operation-ledger insertion. If ledger insertion fails, successful operations still return `ok`. Replays after that failure can insert duplicate records. Concurrent requests can both miss the ledger, and repeated operation IDs within one batch execute twice because the lookup set is not updated during processing. Only clinical entities currently support stable client-assigned IDs consistently.

**Recommended correction:** Atomically claim the operation ID, perform its mutation, and commit its result through a transaction/RPC. Reject or deduplicate repeated IDs within a batch and test response-loss and concurrent-replay cases against a disposable database.

## Other concrete defects and limits

| Priority | Issue | Evidence and correction |
|---|---|---|
| P2 | Health-data POST omits ownership | `app/api/health-data/route.ts:93` inserts parsed fields without `patient_id`; the schema requires a non-null patient ID and no reviewed trigger fills it. Resolve the authenticated profile and set ownership server-side. |
| P2 | Patient record edit/delete endpoints disagree with RLS | `lib/services/medical-records.service.ts` attempts patient UPDATE/DELETE, while the final record policies allow SELECT/INSERT only. DELETE can return success for zero deleted rows. Align API/UI behavior with the chosen record immutability policy. |
| P2 | Private uploads get public URLs and upload failure can appear saved | `components/patient-records/index.tsx:159` uses `getPublicUrl` despite the private bucket. Its upload-failure path saves filename text and can show success without storing the file. Keep the bucket private, store object paths, and issue authorized downloads/signed URLs. |
| P2 | Prescription save is not bound to the consultation patient | `app/teleconsult/room/page.tsx:93` sends neither appointment nor target patient, ignores the API response status, and shows success even after failure. Defaults contain fictional clinician/facility details and prefilled treatment. Bind the record to a verified consultation and clinician-entered content. |
| P2 | Print template interpolates unescaped text | `app/teleconsult/room/page.tsx:147`–`:207` inserts URL/form-derived names and clinical text into `document.write`. Use text-safe DOM construction or a React print view. This is a source-identified injection path, not a browser exploit demonstrated here. |
| P2 | Pagination can omit rows | Services encode `(created_at,id)` but filter only `created_at < cursor.createdAt`, skipping ties. Health data orders by `recorded_at` while filtering by `created_at`. Use matching composite ordering and cursor predicates. |
| P2 | ABHA format validation is labeled live verification | `lib/abdm/client.ts` sets `mode: live` and `verified: true` merely when credentials exist and local format passes; there is no gateway request. Reproduced without any fetch. Distinguish valid format from verified identity and implement the gateway separately. |
| P2 | Security audit fails open | `scripts/ci/audit_allowlist.mjs:56`–`:76` accepts empty output or a report without `vulnerabilities` as clean. Observed `ENOTFOUND` followed by exit 0. Reject network/error/malformed reports. Match allowed advisory IDs and affected versions, not only package names. |
| P2 | Observations are not bound to the same patient as their encounter | The November clinical migration separately references `encounter_id` and `patient_id`; insert RLS checks only observation ownership. Add a composite constraint or checked transaction enforcing matching patient identity. Live database reproduction remains outstanding. |
| P2 | Broad preview-origin allowance | `middleware.ts:39` accepts any `*.vercel.app` origin. Replace that suffix-wide allowance with explicit deployments owned by the project; test disallowed preview origins. Exploitability depends on cookie/browser behavior and was not demonstrated. |
| P2 | Nearby-facility cache shares results across approximately 11 km cells | `lib/cache/response-cache.ts:161` buckets coordinates to 0.1 degrees while the RPC uses finer coordinates. Cached radius membership, distances, and ordering can be wrong for a second location. Align query coordinates with the cache model or recalculate for each requester. |
| P2 | Cache purge misses semantic entries | `/api/cache-status` deletes `rhp:ai:v1:*`, while semantic responses use `rhp:sem:v1:*` plus process memory. Add coherent invalidation across all stores. |
| P2 | Jitsi cleanup is not registered with React | `components/JitsiMeeting.tsx:143` returns a disposer from an async initializer, but the effect calls it without returning a cleanup function. Dispose on unmount and bandwidth-mode changes; validate with a real conference. |

Additional boundaries: the backoff formula is unit tested but the client sync loop never uses it to schedule failed operations; background sync wakes open window clients rather than executing the outbox when no client is open. Completed/cancelled appointment terminal guards exist in the normal PATCH service but are not shared by offline updates or enforced as database transitions. Medical record creation drops structured metadata needed for complete FHIR export. The admin record-metadata query uses a client that is intentionally denied SELECT, so redaction alone cannot make that overview useful.

The global Google Translate integration runs on private pages too. Its DOM translation, medical terminology accuracy, and handling of sensitive text warrant explicit privacy/clinical review; this examination did not measure outbound patient-text transmission. Regional navigation also forces full reloads and the layout patches browser DOM/history APIs, increasing fragility. CSP is report-only with inline/eval allowances, so it is not an enforced injection barrier. In-memory rate limiting is local to a serverless instance, and forwarded-IP trust needs to match the deployment proxy contract.

## Documentation and evidence accuracy

Documentation is extensive and useful, but several claims need correction: secure HMAC invitations, connected claim approval, universal offline booking behavior, room authorization/time gating in the UI, live ABDM requests, comprehensive logout wiping, and retry backoff are not supported by the implemented paths above. Older documents also reference outdated file paths, dataset totals, test counts, and PostgreSQL versions: the local Supabase configuration specifies PostgreSQL 15, while the README advertises 17. Some load-test instructions name SQL files that no longer exist.

The existing suite is strong at local algorithms and selected invariants, but its doctor-claim “end-to-end” test operates entirely against mocked local storage. The five Playwright journeys are mostly navigation/login smoke checks, with credential-dependent skips and a conditional symptom-navigation assertion. The six additional isolated checks reproduced flaws while all 210 existing unit tests remained green. Security regression coverage should therefore exercise the actual API/UI integration boundaries, not only helper outputs or source-string contracts.

## Suggested order of work

1. Restore authoritative doctor appointment access; remove GET mutations; route consultation entry through verified appointment authorization.
2. Enforce deterministic clinical severity, isolate personalized AI data, and make booking/prescription confirmations reflect acknowledged writes.
3. Replace local doctor claims with persisted server-side invitations and review; enforce account ownership and reliable cleanup of offline data.
4. Make offline replay transactional, align medical-record/vitals APIs with RLS and storage rules, and fix pagination and encounter relationships through new forward migrations.
5. Fix audit error handling, cache invalidation, conference cleanup, and documentation. Run full local-stack RLS/concurrency tests and meaningful browser flows before a deployment decision.

No application source or historical migration was changed by this review. The review produced this report, temporary isolated fixtures, and ignored build/benchmark artifacts.
