# Documentation accuracy against code — 22 November 2026

> Historical review snapshot. Findings and line references below describe the review at its recorded date. For the current 23 November 2026 state and resolved findings, use [FINAL_AUDIT.md](FINAL_AUDIT.md), [ARCHITECTURE.md](ARCHITECTURE.md) and [MODEL_FALLBACK_AND_OPERATIONS.md](MODEL_FALLBACK_AND_OPERATIONS.md).

This is the audit snapshot **before** the voice-assistant implementation. Several identified issues have since been corrected; see [VOICE_ASSISTANT_SETUP.md](VOICE_ASSISTANT_SETUP.md) and the backend/consultation/offline evidence documents for the resulting implementation. Remaining vendor/model/device limitations are explicitly retained.

## Verdict

Current documentation is partly accurate. Architecture, module boundaries, migration sealing and the existence of many features are documented usefully. Complete language coverage, offline speech, autonomous actions, connected security workflows and permanent zero operating cost are overstated. This audit checks implementations, not the live deployment or vendor entitlements. Historical reports are historical evidence and should not be treated as the current specification.

No implementation or existing documentation was modified. References below identify the current claims that need correction.

| Claim / document | Code evidence | Correct description |
|---|---|---|
| 13 selectable languages — README:173; ARCHITECTURE:174 | `lib/i18n/detect-language.ts:24` | Accurate: English, Hindi, Marathi, Bengali, Telugu, Tamil, Gujarati, Kannada, Punjabi, Odia, Malayalam, Assamese, Urdu. Selection alone is not complete speech/clinical support. |
| Static translations cover 13 — translations file header; ARCHITECTURE:184 describes only English/Hindi | `lib/i18n/translations.ts:91`, `:689` | There are eight native dictionaries: en, hi, te, mr, bn, ta, gu, kn. pa, or, ml, as, ur fall back to English. Both descriptions are stale. Google DOM translation supplies additional online display translation. |
| Offline page has English plus 12 regional languages — ARCHITECTURE:72 | `app/offline/page.tsx:10`, `:16` | Only English/Hindi are implemented directly. |
| Speech works offline on Android Chrome and any browser; language auto-detection — `lib/ai/speech.ts` header | `lib/ai/speech.ts:107`, `:120`, `:222` | Generic browser APIs are used. Recognition uses a selected locale; no automatic language detection or verified offline language-pack handling exists. Local speech depends on device/browser/installed voices. |
| Voice supports every selected language | `lib/ai/speech.ts:14`, `:43` | Twelve mappings exist; Assamese falls back to English. Language tags are not proof that recognition and synthesis work. |
| Symptom interaction follows selected language | `components/symptom-checker/hooks/useSymptomChat.ts:43`, `:136`; `app/api/symptom-analyze/route.ts:32`; `lib/symptoms/compose.ts:38` | Several paths collapse to English/Hindi. Inline recognition uses Hindi for every non-English language. |
| Complete multilingual AI/fallback | `lib/services/ai-chat.service.ts:28`, `:73`, `:157`; `lib/chat/router.ts:65` | Model prompts name 13 languages, but cache-hit selection is English/Hindi and only ten server fallback texts exist. Malayalam, Assamese and Urdu fall back to English; most offline knowledge is bilingual. |
| Clinical protocols emit 13-language guidance — ARCHITECTURE:166, :255 | `lib/clinical/protocol-engine.ts` | Some bilingual labels/summaries exist; recommended actions are English strings. There is no complete 13-language clinical-output controller. |
| Floating assistant can continuously interact and complete tasks | `components/floating-chat/index.tsx:83`, `:97`, `:186`, `:248`; `components/floating-chat/types.ts:27` | Speech fills a text box; Send and read-aloud are manual. It opens pages using English/Hindi keywords; it does not execute appointment workflows. It is hidden on emergency pages. |
| AI limits: 15/minute and 200/day — ARCHITECTURE:135 | `lib/rate-limit.ts` AI limiter; `lib/ai/gateway.ts` daily quota | Code enforces 10/minute and 30/day per client key. Vendor limits are separate and changeable. |
| Operational exponential backoff — README:169; ARCHITECTURE offline section | `lib/offline/sync.ts:37`, `:212` | A formula exists, but retries do not use it; periodic retry is 45 seconds. |
| Atomic, at-most-once offline replay — ARCHITECTURE:111, :118 | `lib/services/offline-sync.service.ts:217`, `:300`, `:305` | Mutation and operation-ledger writes are separate. Ledger failure only logs; duplicate IDs within a batch are not added to the lookup set. Atomic replay is not implemented. Response status is `duplicate`, not documented `already_processed`. |
| Service-role appointment reads removed — SECURITY_NOTES:56 | `lib/services/appointments.service.ts:37`, `:70`, `:82`, `:100` | Doctor GET still uses service role, names in notes, and asynchronous reassignment. This contradicts the scoped-read claim. |
| Lobby/time/access controls integrated — SECURITY_NOTES:38; DEPLOY:13 | `app/api/teleconsult/room/route.ts`; `app/teleconsult/room/page.tsx:32`, `:337`; `components/JitsiMeeting.tsx` | The API implements checks, but the normal room UI does not call it. It takes room/role from the URL; no configured lobby activation was found. Referenced `lib/jitsi/config.ts` does not exist. |
| HMAC invitations and persisted admin doctor claims — DEPLOY:29; testing descriptions | `lib/doctor-claims.ts:66`, `:82`, `:115`, `:135` | A 32-bit deterministic hash and constant bypass exist. Claims/approval are local-storage state; server doctor requests are a separate workflow. |
| Credentials switch on live ABDM requests — ABDM_FHIR_INTEROPERABILITY:164 | `lib/abdm/client.ts` | Only local format validation occurs. Configured credentials change a label to live; there is no gateway request. FHIR generation is separate from national identity verification. |
| Logout wipes private client information | `lib/offline/cache-cleaner.ts:22`, `:30`; record/pretext/blackbox stores | Cleanup is incomplete and does not reliably clear all stored medical content or await database deletion. |
| Five E2E tests cover PWA, video, offline replay and RBAC — TESTING:14 | `tests/e2e.spec.ts` | Five journeys exist, principally public/login/navigation and unauthenticated redirect smoke tests. Actual booking, video and outbox workflows are not exercised. |
| PostgreSQL 17 baseline — README:6; DEPLOY:11 | `supabase/config.toml:41` | Local configuration specifies PostgreSQL 15. Deployed version is unverified. |
| Permanently $0 operating cost — ARCHITECTURE:216 | Hosted Gemini/Vercel/Supabase/Upstash/translation/Jitsi dependencies | No code or free tier grants permanent unlimited service. Describe the applicable quotas/terms and a local/no-paid-API fallback. |

## Claims supported by the inspected implementation

- Nine public routes declare one-hour revalidation.
- The language selector lists all 13 languages.
- The service worker routes listed private APIs through NetworkOnly. This does not imply medical information is never stored in localStorage/IndexedDB.
- Twenty-three migrations are sealed. The final role function derives authority from `patients.role`.
- The preceding review ran 210 unit tests across 29 files successfully, plus TypeScript/lint/build and migration checks. These results are local evidence, not live production verification.
- FHIR builders and local reference checks exist. The qualification “NRCES-modelled, not officially certified” is appropriate.
- CSP is accurately identified as report-only.

## Clinical safeguard nuance

`components/symptom-checker/index.tsx:140` already preserves a locally composed emergency urgency when merging model output. The symptom API itself lacks that deterministic gate, and model output can still lower other urgency levels or supply unsafe actions. Documentation should describe the scope of the actual protection precisely; it would be inaccurate to claim there is no emergency safeguard anywhere.

## Implications for a new voice/avatar assistant

Complete voice interaction requires separate evidence for speech input, understanding, actions and speech output in every language. DOM translation and a selectable language tag cannot establish that. The current floating widget and API/service modules are reusable starting points, but spoken prompts, speech adapters, workflow state, authenticated tool execution, confirmations, all-language safety and fallbacks still need implementation.
