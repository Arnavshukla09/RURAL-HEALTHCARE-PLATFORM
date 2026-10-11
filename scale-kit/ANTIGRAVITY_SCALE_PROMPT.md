# ANTIGRAVITY PROMPT: security, PWA and scalability overhaul

> Put this file and the `scale-kit/` folder in the project root, then tell the agent:
> **"Read ANTIGRAVITY_SCALE_PROMPT.md and scale-kit/AUDIT_AND_SYSTEM_DESIGN.md completely. Post an implementation plan for all phases and wait for my 'approved'. Then execute phase by phase and obey every STOP FOR HUMAN marker."**

## Context

Next.js 15 App Router, React 18, TypeScript, Supabase (Postgres + RLS + Auth), Vercel, a PWA for rural India (English/Hindi, slow networks). `scale-kit/AUDIT_AND_SYSTEM_DESIGN.md` lists every finding (C1-C5, H1-H10, M1-M7) with file evidence and the target architecture. **Treat it as the spec.** Where the code differs from the audit, trust the code and note it.

## Hard rules

1. Branch `scale-overhaul`; one commit per phase; never force-push or rewrite history.
2. Never open, print or modify `.env*` files or secret values. Use `process.env.X` only.
3. Never run network calls to real Supabase, Gemini or Vercel. Mock in tests.
4. Do not run SQL. Write migrations as files; I run them. Migrations must be idempotent.
5. Medical content is out of scope. Do not change medical text.
6. After every phase run `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run test:unit`; fix before continuing. If a command can't run, say so.
7. New dependencies allowed: `idb`, `@serwist/next` + `serwist` (only in Phase 3), `sharp` (dev, for icon generation), `@types/*`. Ask before anything else.
8. Keep the UI design language. Everything user-facing stays bilingual (en/hi).
9. Prefer small typed modules; no dead code; no debug logs.
10. Ambiguity: choose the safest option, record it in `docs/CHANGELOG.md`, continue.

---

## PHASE 0: Recon
Read `docs/*`, `.agents/AGENTS.md`, `middleware.ts`, `lib/rate-limit.ts`, `lib/supabase/*`, every `app/api/**/route.ts`, `lib/offline/*`, `lib/hooks/useOffline*.ts`, `next.config.mjs`, `public/manifest.json`, `supabase/*.sql`, `scale-kit/*`. Create branch. Post the plan. **Wait for "approved".**

## PHASE 1: Critical security (C1, C2, C5, H3, H5)

1. **Auth module** `lib/auth/guard.ts` (server-only): `requireUser()`, `requireRole(roles)`, `getPatientId()`; one cached lookup per request; returns typed errors that map to 401/403. Use it in every route.
2. **`PATCH /api/appointments`** (C2): require auth; Zod body `{id: uuid, status: enum matching the DB CHECK}`; rules: patient may only set `cancelled` on their own appointment; doctor only on appointments of their own provider; admin any; 404 (not 403) when not visible; rate limit; use the **user-scoped client** so RLS also applies. Return 409 when the appointment is already completed/cancelled.
3. **Service-role audit** (H3): list every `createAdminClient()` use. Replace with the user-scoped client wherever RLS already allows it. Keep service role only for: creating notifications for other users, admin operations, `ensure-patient`. Put each remaining use behind `requireRole`/ownership checks and a comment explaining why.
4. **Booking** (H2): in `POST /api/appointments` resolve the provider from **one** table (inspect which one the FKs use; if `providers` vs `healthcare_providers` is inconsistent, write a migration note rather than guessing). Remove the "first provider" default: require `provider_id`, or choose the least-loaded verified provider for that slot. Persist `consultation_type` if the column exists (add it in a migration otherwise). Map Postgres error `23505` to HTTP 409 `{code:"SLOT_TAKEN"}`. Never return raw DB error text.
5. **Teleconsult** (C5): room id = `crypto.randomUUID()` (generate server-side at booking); enable lobby; remove `recording` and `livestream` from toolbar buttons; allow joining only for the appointment's patient/provider within a time window (start − 15 min to end + 30 min). Add `NEXT_PUBLIC_JITSI_DOMAIN` docs and a TODO note for JWT/JaaS.
6. **Middleware** (H5, H7): narrow the matcher to routes that need auth or redirect logic; add role gates for `/admin/*` (admin) and `/doctor/*` (doctor, admin) server-side; unprotect public `/camps`; skip the Supabase `getUser()` call for public routes. Keep behaviour for `/dashboard`, `/consultation`, `/records`, `/appointments`.
7. Add `docs/SECURITY_NOTES.md` summarising what changed.

**STOP FOR HUMAN #1:** tell me to run `scale-kit/supabase/09_scale_and_security.sql` on **staging**, test login/sign-up/booking, then production. Wait for "done".

## PHASE 2: Data layer and API quality (H1, H8, H9, M2)

1. **Notifications** (H1): decide the canonical schema from `01_schema.sql` (`recipient_type`, `recipient_role`, `recipient_id`, `is_read`, type CHECK). Fix every insert (appointments POST/PATCH, any other) to use it with valid `type` values. Fix `PATCH /api/notifications` to compare `recipient_id` with the **patients.id** of the session user. Write `supabase/10_notifications_alignment.sql` only if a column/constraint change is truly needed.
2. **Pagination**: add cursor pagination (`created_at` + `id`, default limit 20, max 100) to `GET /api/appointments`, `/api/medical-records`, `/api/notifications`, `/api/health-data`, `/api/doctor-requests`; replace `select("*")` with explicit column lists; update the components that call them (`AppointmentManager`, `PatientRecords`, `NotificationBell`, `DoctorDashboard`, admin pages) to load more on demand ("Load more" button, bilingual).
3. **Response shape**: consistent `{ data, nextCursor }` / `{ error: { code, message } }`. Update callers.
4. **Migrations** (M2): create `supabase/migrations/` with timestamped files that reproduce the current schema in order (`01`–`09`, de-duplicating the overlapping security files; convert `08_fix_permissions.sql` from UTF-16 to UTF-8). Do not delete the old files; add a README explaining the new folder. Add a note telling me to run `supabase db pull` once to capture tables that exist only in production (`health_data`, `doctor_requests`, `offline_sync_log`).
5. **RLS performance**: write `supabase/11_rls_initplan.sql` that recreates the hot policies using `(select auth.uid())` and `(select public.get_user_role())`. Introspect names from the existing SQL; if names are ambiguous, produce the file with `DROP POLICY IF EXISTS` for both naming variants. Do not run it.

## PHASE 3: PWA (all items in audit §2)

1. **Icons**: script `scripts/make_icons.mjs` (uses `sharp`) producing real PNGs `public/icons/icon-192.png`, `icon-512.png`, `maskable-192.png`, `maskable-512.png` (maskable = logo within the central 80% safe zone on a solid background), `apple-touch-icon.png` (180), from `public/icon.svg` or `public/icon-512x512.png`. Also produce a resized `public/hero.webp` (max 1200 px wide, quality ~75) and use it. Remove the 1024 px JPEG-as-PNG files once nothing references them.
2. **Manifest**: replace with the corrected manifest from the audit (§2.2); real shortcut URLs; one theme colour used in manifest, `viewport.themeColor` and CSS; add `metadata.appleWebApp` and `icons.apple`; `<html lang>` follows the stored language.
3. **Service worker**: migrate from `@ducanh2912/next-pwa` to **Serwist** with a hand-written `app/sw.ts` following the strategy table in audit §2.3: precache shell + `/offline`; SWR for public pages and public JSON; CacheFirst for images; **NetworkOnly for all private/auth `/api/*`**; navigation network timeout 3 s with offline fallback to `/offline`. No `reloadOnOnline`, no aggressive navigation caching.
4. **Offline page** `app/offline/page.tsx` (bilingual): emergency numbers (108, 112, Tele-MANAS 14416), a link to the offline symptom checker and cached FAQ.
5. **Sign-out cache wipe**: on sign-out call a helper that posts `{type:"CLEAR_CACHES"}` to the SW (delete all runtime caches) and clears the IndexedDB outbox.
6. **Update flow**: "New version available" toast with a Reload button (use `skipWaiting` only after the user confirms).
7. **Install UX**: capture `beforeinstallprompt`, show a dismissible bilingual "Install app" banner after the 2nd visit; iOS hint for "Add to Home Screen".
8. `.gitignore`: add `public/sw.js`, `public/swe-worker-*.js`, `public/workbox-*.js`, generated Serwist output; `git rm --cached` any tracked ones.
9. Tests: unit-test the strategy/route matchers where feasible; add a Playwright test that goes offline after first load and still shows `/offline` and the emergency page, and asserts that `/api/appointments` is **not** present in any Cache Storage cache after a logged-in visit.

## PHASE 4: Offline sync rewrite (C4)

1. `lib/offline/outbox.ts` using `idb`: store `{client_op_id (uuid v4), table, type, payload, created_at, attempts, status, last_error}`; operations `enqueue`, `listPending`, `markSent`, `markFailed`, `purgeSent`; storage-quota helper with 80% warning; max queue length.
2. Migrate/replace `lib/offline/storage.ts` + `sync.ts` + `useOfflineData.ts` callers; one-time migration of any existing `rhcp_offline_operations` localStorage items into the outbox, then delete the key.
3. Sync triggers: `online` event, `visibilitychange`, and Background Sync (`sync` event in the service worker) where supported. Exponential backoff with jitter; stop after N attempts and show "failed" with Retry/Discard.
4. **Rewrite `POST /api/offline-sync`**: require auth; Zod: `operations` array **max 50**; each op `{client_op_id: uuid, table: enum, type: enum, id?: uuid, data?: strict object per table}` with a **column whitelist per table** (no `.passthrough()`, no `z.any()`); force `patient_id`/`user_id` from the session; skip ops already in `processed_client_ops` (return `"duplicate"`); group inserts per table (batch); use the user-scoped client; record the audit log best-effort; return `{ results: [{client_op_id, status: "ok"|"duplicate"|"rejected", error?}] }`. HTTP 200 with per-op results even when some fail.
5. Client deletes only `ok`/`duplicate` ops. UI: header badge "N changes waiting", per-item status, bilingual.
6. Unit tests: idempotent replay, partial failure, batch cap, whitelist rejects unknown columns, auth required.

## PHASE 5: Rate limiting and abuse (H4, M4)

1. Replace `lib/rate-limit.ts` with a factory: `limiter({ name, limit, window })` (Upstash sliding window, `prefix` per route class) and helper `clientKey(request, userId?)` = `user:<id>` or the **first** `x-forwarded-for` hop. Route classes: `auth`, `read`, `write`, `ai`, `public`. Fix the ignored `max/windowMs` bug. Local-dev fallback: bounded Map with TTL eviction. Return `Retry-After` and `X-RateLimit-*` headers on 429.
2. Apply to all routes (including `chat-cache`, `PATCH appointments`).
3. **AI gateway** `lib/ai/gateway.ts`: per-user (or per-IP) daily Gemini quota, circuit breaker (open after 5 consecutive failures for 60 s, then half-open), total timeout; used by `ai-chat` and `symptom-analyze`.
4. **Load-test mode**: apply `scale-kit/loadtest/patches/loadtest-mode.md` exactly (`lib/loadtest.ts`, skip limiter, stub Gemini after the emergency check). It must be inert unless `LOADTEST_ENABLED=1` **and** the secret header matches.
5. `GET /api/health` (checks DB with a trivial query and cache ping; no secrets in the response) and `GET /api/ready`.

## PHASE 6: Caching and rendering (H6, M5)

1. Convert public pages (`/`, `/camps`, `/health-info`, `/health-info/schemes`, `/directory`, `/emergency`, `/locations`, `/symptom-checker` shell) to **server components** that fetch public data on the server with `export const revalidate = 3600` (or `unstable_cache` with tags); keep interactive parts as small client components. Keep behaviour identical for logged-in users (the header/nav can stay client-side).
2. Public API caching: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` on `/api/providers`, `/api/facilities/nearby`; round `lat/lon` to 2 decimals (~1 km) **before** querying so cache keys collapse; cap results.
3. `next/dynamic` (ssr:false where needed) for `FloatingChat`, `MapView`, `CampLocations` map parts, recharts charts, `JitsiMeeting`, admin components.
4. `layout.tsx`: remove the duplicate Leaflet CSS (`import` **and** unpkg link; keep only the local import, and load it only on pages that use maps), drop unnecessary font preconnects (Inter comes from `next/font`).
5. `AppProvider`: do not block first paint on auth; render the shell immediately and hydrate user data after; avoid the redundant `ensure-patient` POST on every load (do it only when no patient row is returned).
6. Report the before/after bundle sizes from `next build` in `docs/PERFORMANCE_REPORT.md`.

## PHASE 7: Realtime and notifications (H10)

1. `NotificationBell`: remove the unfiltered `postgres_changes` subscription. Use `GET /api/notifications?since=<cursor>` polling every 60 s only while `document.visibilityState === "visible"`, with backoff on errors; fetch immediately on focus.
2. Broadcast notices (`recipient_type='all'`) are served from the same endpoint (cached 60 s), not via realtime.
3. Fix mark-as-read (uses the patient id; see Phase 2).
4. (Optional, ask first) Web Push scaffolding: VAPID keys via env, `push_subscriptions` migration file, subscribe UI, service-worker push handler; send reminders from a server route called by Vercel Cron.

## PHASE 8: Observability (M6) and CSP (M1)

1. Ask me before adding Sentry. If approved: client + server init, release tag, scrub PII, sample rate from env. Otherwise add structured JSON logging helper with request id.
2. `middleware`/route wrapper adds an `x-request-id`; logs include route, status, duration, user id hash (never raw PII).
3. CSP in **report-only** mode via headers, covering: self, Supabase (`https://*.supabase.co`, `wss://*.supabase.co`), Jitsi domain, Google Fonts, Carto/OSM tiles, Vercel analytics; document how to enforce after a week of clean reports.

## PHASE 9: Load-test integration

1. Keep `scale-kit/loadtest/` as `loadtest/` at the repo root; add `loadtest/.gitignore` (`tokens.json`, `summary-*.json`).
2. GitHub Actions workflow `.github/workflows/loadtest-smoke.yml` (manual `workflow_dispatch` only) running the k6 smoke test with `grafana/k6-action` against a staging URL stored in repo secrets (`STAGING_URL`, `STAGING_SUPABASE_URL`, `LOADTEST_KEY`); no production URL allowed.
3. Add `docs/LOAD_TESTING.md` linking the runbook and describing acceptance targets from audit §4.5.
4. Update the `keep-alive` workflow comment about the 60-day scheduled-workflow limit.

## PHASE 10: Tests, docs, final report

1. Unit tests for: auth guard, appointments PATCH matrix (patient/doctor/admin × own/other), booking 409, notifications fix, pagination cursors, rate-limit factory, AI gateway breaker/quota, offline-sync route, outbox.
2. Update `README.md`, `docs/ARCHITECTURE.md`, `docs/API_REFERENCE.md`, `docs/DATABASE.md`, `docs/DEPLOY_CHECKLIST.md`, `docs/CHANGELOG.md`, `.env.example` (add `LOADTEST_ENABLED`, `LOADTEST_KEY` documented as staging-only, VAPID if used).
3. Final report: per phase what changed, files created/changed/deleted, test results, assumptions, anything not done, and the list of actions only I can do. **No secret values anywhere.**

## Acceptance criteria

- A signed-in patient cannot become admin or change someone else's appointment (tests prove it).
- `/api/appointments` returns paginated data; doctor/admin lists are bounded.
- No private `/api/*` response appears in any Cache Storage; sign-out wipes caches and the outbox.
- Lighthouse "installable" passes: valid 192/512 PNG icons, maskable icon, working shortcuts, `/offline` page works offline.
- Offline queue: replaying the same batch twice creates no duplicates; a failed op is never silently dropped.
- Booking the same provider slot twice returns 409.
- Public pages and public JSON are served with cache headers; the facility search collapses to rounded coordinates.
- Every route uses the shared guard and a per-route-class rate limiter keyed by user id or first XFF hop.
- Type-check, lint, build and unit tests pass; docs match the code.
