# Current architecture

Updated 23 November 2026; source behavior, not a production infrastructure attestation.

## Request and authority flow

~~~mermaid
flowchart LR
  UI[Next.js PWA and floating assistant] --> MW[Exact-origin middleware]
  UI --> Local[Registered controls and offline packs]
  MW --> API[Lean API handlers]
  API --> Services[Server business services]
  Services --> DB[Supabase Auth and PostgreSQL RLS]
  API --> Voice[Optional owned inference proxy]
  Voice --> Host[Pinned local Python snapshots]
  UI --> External[Map tiles, translation and conferencing]
~~~

The app uses Next.js 15 App Router, React 18, Serwist, IndexedDB, Supabase and Leaflet. Local database configuration uses PostgreSQL 15/PostGIS; the deployed database version is not established by this audit. Public page shells may be statically revalidated, but client components still fetch runtime data and APIs. Public navigation is not guaranteed to produce zero database or network requests.

Middleware handles method/origin validation and protected page gates. Public/API fast paths avoid a middleware auth roundtrip; each protected API still performs its own authentication/role checks. Role authority is public.patients.role, not client metadata. RLS and service checks enforce care-scoped medical data. Patient/doctor/admin UI visibility alone is never authorization.

## Assistant and control lifecycle

The avatar is mounted in the root layout through FloatingChatClient. Separate Chat/Actions panels use shared accessibility and language state. lib/assistant contains catalogs, registered controls, matching, page-scope checks, offline packs and fallback policy. components/voice-assistant owns dialogue/task generations, audio lifecycle and guided workflows. lib/services owns private configuration, proxy validation, confirmations and server actions.

Only first-party registered controls are enumerated; the current modal/page scope is refreshed at execution. Stored target identity and field fingerprints block stale selection. Secure inputs/device prompts and unreviewed legacy writes are explicit handoffs. Model text cannot supply executable selectors, arbitrary URLs, table names or scripts. Generic clicks acknowledge a request; guided mutations require signed prepared drafts and validated receipts.

New requests revoke old dialogue/reads and prepared confirmations. Cancelling cannot undo a submitted transaction. Receipt reconciliation remains separate from conversation ownership. Hidden pages, meetings and emergency speech stop assistant microphone ownership. Real-device interruption remains a release test.

## Caching and offline storage

app/sw.ts precaches application assets, uses NetworkOnly for private/mutation APIs and StaleWhileRevalidate for selected public GETs. A district pack can satisfy a saved offline lookup. Image/font caches have bounded expiration. The offline fallback is the app's /offline page; selected assistant packs contain native data in 13 languages, not a complete native translation of every legacy page.

NetworkOnly prevents private HTTP responses entering service-worker Cache Storage. It does not mean no private local data exists: account-owned outboxes, record/encounter stores and legacy local profiles can reside in browser storage. Account transition cleanup, ownership checks, quarantine and explicit clearing reduce shared-device risk. Cache eviction, device loss, browser suspension and local-storage confidentiality need operational testing.

Each offline operation has an owner, client operation ID and preassigned entity identity. The authenticated apply_offline_operation RPC commits the replay ledger and mutation atomically. Duplicate committed requests acknowledge; mismatched payloads and unauthorized operations reject. Atomicity is per operation, not the entire batch. Required sealed migrations add atomic replay and expired-new-booking guards. Missing RPC returns MIGRATION_REQUIRED and does not fall back to direct writes.

## External inference and resource bounds

The optional owned service uses port 8765/v1, immutable approved snapshots and no runtime downloads. Missing optional models preserve other capabilities. New snapshot digests fail closed at load. Device/owned speech and deterministic conversation fallbacks are specified in [MODEL_FALLBACK_AND_OPERATIONS.md](MODEL_FALLBACK_AND_OPERATIONS.md).

The existing Gemini path is separate optional external assistance: configurable candidates, 12-second per-candidate timeout and a 25-second gateway envelope where used, 30 daily requests per identity, circuit breaker after five failures with a 60-second cooldown. Provider model names can be retired; core guided navigation does not depend on them. Responses are JSON, not a streaming transport.

Rate classes per minute are auth 10, read 60, write 20, AI 10, public 60 and voice 30. Redis provides shared limiting when configured; fallback memory is per process and cannot provide a fleet-wide limit. Voice requests/body streams, JSON replies and WAV output are bounded; redirects and raw internal failures are rejected/sanitized. See [API_REFERENCE.md](API_REFERENCE.md).

## Security and operations boundaries

Public routes/configuration are necessary browser surfaces; internal service origins, model download credentials and signing/service tokens remain server-only. Client import and publication gates check those boundaries. The logger drops sensitive/nested payloads and redacts recognized patterns; static messages are still required because arbitrary prose cannot be guaranteed free of PII.

CSP remains report-only. FHIR generation and ABHA format checks do not constitute national gateway integration. Legacy browser-local doctor claims are disabled in production and never provision database roles. Conferencing, maps, translation, hosted authentication and Redis have separate availability/cost obligations. No production changes were executed. See [FINAL_AUDIT.md](FINAL_AUDIT.md) for evidence and release gates.
