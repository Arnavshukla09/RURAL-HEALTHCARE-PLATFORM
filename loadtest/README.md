# Load-test kit: how far can the platform go?

This kit generates **synthetic users and traffic** and finds the **breakpoint** of your platform (the load at which latency or errors become unacceptable).

| Piece | File |
|---|---|
| Synthetic data (10k users, 50k appointments, 100k records…) | `seed/seed_staging.sql` |
| Remove all synthetic data | `seed/cleanup_staging.sql` |
| Log the seeded users in once, save sessions | `tools/mint_tokens.mjs` |
| Traffic generator: smoke / load / stress / spike / soak / breakpoint | `k6/rural_health_mixed.js` (+ `k6/lib.js`) |
| Turn results into users + monthly-quota numbers | `tools/capacity_model.mjs` |
| Staging-only switch (skip rate limiter, stub Gemini) | `patches/loadtest-mode.md` |

> **Honesty note:** I wrote and syntax-checked these, but I could not run k6, Postgres or your app from my sandbox. Run the **smoke test first** and read "Troubleshooting" if anything is off. The numbers in the capacity model's example output are illustrations, not measurements of your app.

---

## Rules (please read)

1. **Never run this against production** (`rural-healthcare-platform.vercel.app`). The script refuses unless you pass `-e ALLOW_PROD=yes`. Don't.
2. **Never run load against real Gemini.** The patch stubs it in staging.
3. **Use a separate staging Supabase project** (the free plan allows 2 active projects). The seed writes into `auth.users`.
4. **Check the vendors' rules first.** Vercel and Supabase both have fair-use / load-testing guidance; heavy synthetic load can get throttled or flagged. Keep tests short, tell them if you go big.
5. **Use a staging Vercel project/deployment** with its own environment variables.

---

## Step by step

### 1. Create staging (once)

1. **Supabase:** create a second project. In the SQL editor run, in order: `01_schema.sql`, `02_functions_triggers.sql`, `03_rls.sql`, `05_chat_cache.sql`, `05_security_patch.sql`, `06_security_warnings_final.sql`, `08_fix_permissions.sql` (it is saved as UTF-16: open it, copy the one line `GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;` and run that), then **`09_scale_and_security.sql`**.
   - Your production database also has tables that are **not in the repo** (`health_data`, `doctor_requests`, `offline_sync_log`, others). Copy the real schema instead of guessing: `supabase db dump --schema public -f schema.sql` against production (schema only, **no data**), run that on staging first, then the files above.
   - Authentication → Providers → Email: turn **off** "Confirm email" on staging.
2. **Vercel:** create a new project from the same repo (or use a Preview deployment of a branch) with **staging** values: staging Supabase URL/keys, `GEMINI_API_KEY` unset (stub is used), no Upstash vars, plus `LOADTEST_ENABLED=1` and `LOADTEST_KEY=<long random string>`.
3. Apply `patches/loadtest-mode.md` in the code and deploy.

### 2. Seed synthetic data

Open `seed/seed_staging.sql`, set `v_i_am_on_staging := true`. **Start with `v_users := 1000`** to confirm it works, then raise it. Run it in the staging SQL editor, then check the counts printed at the bottom.

Log in **one** seeded user by hand in the staging site (`loadtest+000001@loadtest.example.com` / `LoadTest#2026`). If that works, the seed is good.

### 3. Mint sessions

```powershell
cd loadtest
$env:SUPABASE_URL="https://STAGING-REF.supabase.co"
$env:SUPABASE_ANON_KEY="staging publishable/anon key"
node tools/mint_tokens.mjs --count 300 --doctors 5 --out tokens.json
```

Add `tokens.json` to `.gitignore` (it contains live sessions).

### 4. Install k6

Windows: `winget install k6` (or `choco install k6`). Or Docker: `docker run --rm -i grafana/k6 run - <script`.

### 5. Smoke test (always first)

```powershell
cd k6
k6 run -e TEST_TYPE=smoke -e BASE_URL=https://YOUR-STAGING.vercel.app -e SUPABASE_URL=https://STAGING-REF.supabase.co -e LOADTEST_KEY=YOUR_KEY -e TOKENS_FILE=C:\full\path\to\loadtest\tokens.json rural_health_mixed.js
```

All checks should pass, including `SMOKE: auth cookie accepted (profile 200)`.

### 6. The real tests (in this order)

Replace the common flags with the ones above (`$F` below stands for them).

| Goal | Command (add `$F`) | What it does |
|---|---|---|
| Expected peak | `-e TEST_TYPE=load -e TARGET_RPS=10` | Holds 10 interactions/s for 10 min |
| Find the cliff | `-e TEST_TYPE=stress -e TARGET_RPS=10` | Steps 25% → 300% of 10/s |
| Sudden surge | `-e TEST_TYPE=spike -e TARGET_RPS=10` | Jumps to 4× in 30 s (SMS blast, camp announcement) |
| **Maximum** | `-e TEST_TYPE=breakpoint -e MAX_RPS=200 -e MAX_VUS=800` | Ramps until it fails, then aborts and reports the rate |
| Leaks / slow decay | `-e TEST_TYPE=soak -e TARGET_RPS=10` | 5 interactions/s for 60 min |

"Interaction" = one persona flow (e.g. home page + public page + providers + facilities, or a patient session of 5 API calls). Persona mix defaults to 60% anonymous browsing, 12% chat, 5% symptom check, 20% patient session, 3% doctor session (`-e W_ANON=…` etc. to change).

Between runs: wait 2–3 minutes, and run `ANALYZE;` if you changed data.

### 7. Watch these while it runs

- **Vercel:** project → Observability / Logs / Usage (function errors, duration, invocation count).
- **Supabase:** Reports → Database (CPU, memory, connections), API, Realtime, Egress; Database → Query Performance (slowest queries).
- **Your own machine:** CPU and network. If the generator is saturated you are measuring your laptop (`dropped_iterations > 0` is the sign).

### 8. Read the result

| You see | It means | Usual fix |
|---|---|---|
| `app_rate_limited > 0` | The limiter, not capacity (patch missing or key wrong) | Check `x-loadtest-key` and `LOADTEST_ENABLED` |
| `auth_failures > 0` | Cookie rejected or token expired | See troubleshooting |
| p95 climbs smoothly while 5xx stay 0 | DB/CPU saturating | Indexes, caching, pagination, bigger compute |
| `server_errors` jump suddenly | Timeouts or pool/connection exhaustion | Supabase pooler, query limits |
| Slow only on `GET /api/appointments (doctor)` | Unbounded list query | Pagination |
| Slow on `GET /` and pages, API fine | Auth in middleware / no caching | Narrow middleware, ISR, CDN cache |
| `dropped_iterations > 0` | Generator or `MAX_VUS` too small | Raise `MAX_VUS`, use a stronger machine |
| 429 from Vercel/Supabase themselves | You reached the plan's own limits | That is your platform ceiling, note it |

### 9. Turn it into planning numbers

```powershell
node tools/capacity_model.mjs --breakpoint-rps 35 --response-s 1.8 --fn-per-interaction 3 --client-kb 300 --supabase-kb 60 --mau 20000
```

Use *your* breakpoint, `iteration_duration` avg, `http_reqs/iterations`, `data_received/iterations`. For `--supabase-kb`: after a known number of interactions, read Supabase → Reports → Egress and divide. On free plans the **monthly quotas** (Vercel invocations/bandwidth, Supabase egress) usually run out long before the CPU does; the model shows which one is first.

### 10. Clean up

Run `seed/cleanup_staging.sql`, delete `tokens.json`, rotate `LOADTEST_KEY` (or remove the variable).

---

## Troubleshooting auth cookies

The authenticated personas send a cookie shaped the way `@supabase/ssr` 0.6.x writes it: `sb-<ref>-auth-token = "base64-" + base64url(session)`, split in 3180-character chunks `.0`, `.1` when long. If the smoke test shows `auth_failures`:

1. Log in on the staging site in a browser → DevTools → Application → Cookies → copy the names/values of the `sb-…-auth-token*` cookies.
2. Compare the **format** (prefix `base64-`? chunk suffixes?) with what `authCookies()` in `k6/lib.js` produces. If your installed `@supabase/ssr` version differs, change `authCookies()` to match.
3. Check the `ref` in the cookie name equals the staging project ref (`-e SUPABASE_URL` must be the **staging** URL).
4. Tokens expire in about an hour: re-run `mint_tokens.mjs`.

## What I expect to find (hypotheses to confirm, not results)

Reading the code, I expect this order of pain: (1) the doctor/admin appointments query returning every row, (2) per-navigation auth calls in middleware, (3) zero caching on public data, (4) the single-bucket limiter, (5) unfiltered realtime subscriptions once you have 200 logged-in tabs. The breakpoint run tells you whether I am right.
