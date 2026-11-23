# Current API contract guide

Updated 23 November 2026. [CURRENT_ENDPOINTS.md](CURRENT_ENDPOINTS.md) is generated from exported handlers and lists all **24 routes and methods**. Public path names are part of the application contract; this guide contains no private deployment origins or credentials.

## Access and mutation contracts

| Surface | Purpose and protection |
|---|---|
| auth/login, auth/profile, auth/ensure-patient | Login and caller-owned profile operations; patient provisioning cannot assign a privileged role |
| appointments | Authenticated reads and validated create/update; atomic slot conflict returns 409; server-derived ownership |
| assistant/actions | Registered guided provider/slot/appointment actions; purpose-bound signed preparation before consequential execution; receipt verification |
| assistant/voice | Public bounded capability GET and rate-limited voice/chat POST via same-origin proxy; internal owned service authentication never returned |
| medical-records, health-data | Authenticated owner/care scope and role restrictions; doctors cannot alter historical clinical records; administrative confidentiality applies |
| offline-sync | Authenticated owner-bound strict batches; individually atomic apply_offline_operation RPC; no direct-write fallback |
| teleconsult/room | Authenticated appointment/care checks and room validity before credentials/entry |
| doctor-requests, admin/doctor-provider-link | Server role and verification/link workflow checks; mapped legacy page writes still require their separate release review |
| admin/erase-record | Privileged audited erasure path; no general administrative clinical read permission |
| abdm/fhir-export | Authenticated record export; owner or authorized care-scoped doctor, admin clinical export denied |
| providers, facilities/nearby, facilities/district | Public directory/geo data with rate/bounds checks; provider response uses explicit public fields and does not enrich private patient profiles |
| ai-chat, symptom-analyze | Validated optional model assistance with deterministic safety/failure paths; structured JSON response, no action authority |
| notifications | Authenticated scoped reads/status operations; endpoint existence does not establish OS push delivery |
| chat-cache, cache-status | Moderated cache submission/status operations and their existing access checks; raw database failures are not returned |
| health, ready | Bounded operational status; not an assurance that all dependencies or models are operational |

Refer to the handler/service source for exact request schema. Do not invent fields from a model prompt. Common errors are validation 400/415, missing auth 401, forbidden action 403, missing resource 404, slot conflict 409, oversized content 413, rate limit 429 and unavailable/missing infrastructure 503. Individual legacy handlers can retain their own status conventions.

## Voice wire limits

POST accepts strict JSON for speak/chat or multipart for transcribe. Canonical language codes are en, hi, mr, bn, te, ta, gu, kn, pa, or, ml, as and ur. Chat input is at most 800 characters, speech text 1200, recording 20 seconds and PCM WAV 2 MiB. Raw JSON and multipart envelopes are additionally bounded while reading. JSON upstream replies are capped at 16,000 bytes; WAV output at 4 MiB, with RIFF/WAVE signature and audio/wav checks. Transcripts are truncated to 2000 characters and dialogue replies to 1200.

Health returns only protocolVersion 1, sanitized availability and canonical ASR/TTS language arrays plus conversationAvailable. It does not forward model revisions, filesystem paths, upstream details or tokens. Configuration-invalid/unavailable states are generic. Capability GET timeout is two seconds; inference requests are bounded to 30 seconds. All upstream fetches reject redirects. Voice responses use private/no-store and nosniff; these flags do not turn public capability data into an authentication boundary.

## Rate limits and origin checks

| Class | Requests/minute |
|---|---:|
| auth | 10 |
| read | 60 |
| write | 20 |
| ai | 10 |
| public | 60 |
| voice | 30 |

These are the lib/rate-limit.ts classes; individual handlers choose a class, not every public route has the same budget. Redis enforces shared windows when configured; fallback memory is process-local. The existing AI gateway also applies 30 requests/day per user/IP and a circuit breaker. API mutations reject cross-site Fetch Metadata and foreign origins. The exact request origin or exact configured app/site origin is allowed; a foreign Vercel preview is not trusted merely because its domain ends in vercel.app. Development localhost exceptions are disabled in production. CORS is not a substitute for authorization.

## Publication and privacy

Responses use static failures for upstream/database exceptions. Validation details describe fields, not server credentials. Do not add raw exception detail/stack, upstream URL, patient payload or authorization header to API responses/logs. Public provider contact fields represent the configured directory record; consent and correctness of published directory content still need owner review. See [FINAL_AUDIT.md](FINAL_AUDIT.md) and [DEPLOY.md](DEPLOY.md).
