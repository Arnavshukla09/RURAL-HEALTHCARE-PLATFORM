# Rural Healthcare Platform

[![CI](https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM/actions/workflows/ci.yml/badge.svg)](https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM/actions/workflows/ci.yml)

A mobile Next.js PWA for rural healthcare navigation, facility discovery, appointment requests, medical records, emergency guidance and teleconsultation. The floating assistant adds voice navigation, pictorial choices and shared accessibility controls. Updated **23 November 2026** against the current source.

## Current working features

| Feature | Implemented behavior | Practical boundary |
|---|---|---|
| Floating assistant | Separate Chat and Actions panels; settings, replay, Stop, Cancel and emergency controls | Active while the page is open; browser/OS suspension stops listening |
| Website voice controller | Page options, five choices per batch, numbered/name selection, non-secret field editing, navigation and reviewed actions | Source-approved controls only; secure/device and unreviewed legacy operations require a handoff |
| Accessibility | Shared font size, contrast, page reading, speech speed and reset controls | Reading private content asks for consent; actual disability usability needs user testing |
| Task switching | New request/question and cancel task invalidate stale dialogue, reads and confirmations | Already submitted writes still require their authoritative result to be checked |
| Languages | Native assistant catalogs for English, Hindi, Marathi, Bengali, Telugu, Tamil, Gujarati, Kannada, Punjabi, Odia, Malayalam, Assamese and Urdu | Speech needs a matching engine; many legacy page labels depend on online DOM translation |
| Facilities and maps | Location/search → service filters → GPS/radius/Nearest; contextual results and map pan/zoom/recenter | External map tiles and fresh searches require connectivity; saved coverage is bounded |
| Appointments | Authenticated guided drafts, signed confirmations, server-validated booking/cancellation receipts | Offline requests remain queued until acknowledged; provider listings do not prove clinic availability |
| Offline resilience | Cached public assets, checksum-verified language packs, account-owned outbox and atomic replay | Private browser storage exists; no guarantee against cache eviction or background suspension |
| Teleconsultation | Authorized room entry and first-party conferencing controls | Requires network, permissions and a compatible conferencing provider |
| Clinical helpers | Deterministic symptom/emergency rules with optional model assistance | Decision support, not diagnosis, prescription, dispatch or clinical certification |
| FHIR/ABDM | Local FHIR R4 bundle generation and ABHA format checks | National identity verification, consent exchange and gateway integration remain unimplemented |

The controller inventory contains **509 registered source templates**, **499 reachable candidates**, **28 page entries** and **24 API routes**. These are source measurements, not proof that every live page state is independently hands-free. See the [implementation and operating steps](docs/HANDS_FREE_IMPLEMENTATION.md) and [per-control inventory](docs/HANDS_FREE_CONTROL_INVENTORY.md).

## How to use the assistant

1. Open the website/PWA, choose a language and activate voice. Grant microphone permission through the device.
2. Say **page options**, **select one**, or **more options**. Open a menu or tab and ask again for its current options.
3. Select a non-secret field and dictate its value. Use **next field**, **clear field**, or **new question …**.
4. Use **increase font size**, **high contrast on**, **read page**, **speak slower**, **open chat**, **show actions**, or **open settings**. Native equivalents ship in all 13 catalogs.
5. Say **cancel task** or **new request …** at any point. Supported native recognition also accepts a wake-prefixed interruption during speech after activation.
6. Review consequential actions before saying yes. **Requested** and **queued** do not mean completed. Check the actual page/server receipt.
7. Prepare offline packs while connected. Reopen/reactivate after the device suspends the app. A missing speech engine leaves text, pictorial, keyboard and switch-accessible controls available.

## Stable model setup and fallback

The core controller and emergency rules need no language model. Optional owned inference uses fixed protocol v1 and port **8765**; Next.js keeps port **3000**. Initial installation records immutable revisions for IndicConformer, Whisper tiny and optional Qwen3 0.6B. Runtime never downloads or resolves newer models. New locks record per-file SHA-256 digests; missing optional snapshots leave other models usable.

Owned recognition failure falls back to supported device recognition when online or a verified local pack is available. Device synthesis failure can use reachable owned synthesis. Missing matching-language speech keeps the controls usable without substituting an English voice. Optional conversation failure returns deterministic assistance; model output cannot directly execute website actions.

See [one-time setup](docs/VOICE_ASSISTANT_SETUP.md) and [model fallback and operations](docs/MODEL_FALLBACK_AND_OPERATIONS.md). Hugging Face weights are installed on an owned Python host, not embedded in the browser. Model assets and real inference have not been installed or certified by this source audit.

## Local setup

Use Node.js 22 and npm. Docker and the Supabase CLI are needed only for a disposable local database. Optional inference needs an isolated Python environment.

~~~bash
git clone https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM.git
cd RURAL-HEALTHCARE-PLATFORM
npm ci
cp .env.example .env.local
npm run dev
~~~

Configure only the services you use. Open http://localhost:3000. Placeholder credentials allow source/build checks but do not provide authentication or data. For database-backed development start the disposable local Supabase stack and reset **that local stack only**. Never run tests, resets or SQL against production. The owner applies the [sealed migration rollout](docs/OFFLINE_SYNC_ROLLOUT.md), including atomic replay and expired-booking protection.

## Verification and audit

~~~bash
npm run check:components
npm run check:migrations
npm run report:dataset
npm run benchmark:integration
node scripts/data/register_voice_controls.mjs
node scripts/ci/client_boundary_check.mjs
node scripts/ci/publication_safety.mjs
node scripts/ci/documentation_links.mjs
python -m unittest discover -s services/voice/tests -v
npm run build
npx playwright test
~~~

The final source suite has **323 unit cases**, **20 Python contracts**, **24 browser journeys** and **29 required database/safety cases**. Local browser evidence is 21 passed and three authenticated-role cases deferred to CI's disposable accounts. Browser audio is mocked. CI must pass the seeded browser and database jobs for the finishing commit; exact results are recorded in the [final audit](docs/FINAL_AUDIT.md) and [machine-readable reports](docs/reports/FINAL_VERIFICATION.json).

Security checks include exact-origin mutation checks, voice body/type/time limits, denied upstream redirects, server/client import boundaries, sanitized logging/errors, publication scanning, Gitleaks and behavioral vulnerability mutations. Public application paths and publishable client configuration are necessarily visible. Internal inference origins and service credentials remain server-only. No scan can prove that arbitrary future content will never contain a secret.

## Operations and remaining release gates

No required paid avatar or inference API was added. Owned hardware, electricity, bandwidth, hosting, model licenses and review have costs; hosted free quotas can change. Dependency pinning reduces surprise changes but cannot eliminate security maintenance. Five accepted high npm advisories currently expire **31 December 2026** and are enforced by CI; the audit does not claim zero advisories.

Before a production rollout, complete real-device speech tests, native-speaker review of all languages, clinical review, disability-usability sessions, every role/page/modal-state check, conferencing/device handoffs and recovery/hosting tests. Production deployment and database operations were not executed by this audit. Legacy browser-local doctor claim references are disabled in production and cannot provision a trusted doctor role.

## Project documentation

- [Architecture](docs/ARCHITECTURE.md), [source tree](docs/PROJECT_STRUCTURE.md), [components](docs/COMPONENTS.md)
- [API contract guide](docs/API_REFERENCE.md), [generated HTTP surface](docs/CURRENT_ENDPOINTS.md)
- [Deployment](docs/DEPLOY.md), [testing](docs/TESTING.md), [limitations](docs/LIMITATIONS.md)
- [Final audit](docs/FINAL_AUDIT.md), [clinical safety](docs/CLINICAL_SAFETY.md), [FHIR boundaries](docs/ABDM_FHIR_INTEROPERABILITY.md)
- [Hands-free release checklist](docs/ASSISTANT_RELEASE_CHECKLIST.md), [changelog](docs/CHANGELOG.md)

Author: [Arnav Shukla](https://github.com/Arnavshukla09). License: [MIT](LICENSE), with separate terms for external services, datasets, models and voices. Security disclosures: [security.txt](public/.well-known/security.txt).
