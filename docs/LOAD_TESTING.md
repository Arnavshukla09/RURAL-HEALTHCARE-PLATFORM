# Load Testing & Capacity Guide — Rural Healthcare Platform

> **Document Version:** 1.0.0  
> **Target Framework:** Grafana k6 + Synthetic Staging Harness  
> **Cost Guarantee:** $0.00 — Runs exclusively against isolated Staging with Gemini API stubs.

---

## 1. Safety Rules & Strict Boundaries

1. **NEVER load-test production (`rural-healthcare-platform.vercel.app`)**:
   - The k6 scripts enforce an automatic domain abort check against production URLs.
   - Load testing production wastes edge bandwidth, triggers anti-DDoS IP blocks, and pollutes live clinical data.
2. **Never consume real Gemini API quota during load runs**:
   - In staging mode (`LOADTEST_ENABLED=1`), incoming requests bearing `x-loadtest-key` bypass rate limiters and receive realistic 400–1200ms randomized Gemini stubs via `lib/loadtest.ts`.
3. **Use an isolated staging Supabase project**:
   - Supabase Free tier permits 2 active projects. Use the second project exclusively for staging.
4. **Never commit session tokens or test results**:
   - `loadtest/.gitignore` prevents `tokens.json` and `summary-*.json` from ever entering Git history.

---

## 2. Service Level Objectives (SLOs) & Acceptance Criteria

Derived from System Design Audit §4.5:

| Metric | Acceptance Target | Observation Note |
|---|---|---|
| **Standard API p95 Latency** | **< 800 ms** | Includes `/api/facilities/nearby`, `/api/providers`, `/api/appointments` |
| **AI Gateway p95 Latency** | **< 5,000 ms** | With Tier 0/1 deterministic bypass & Tier 3 stub |
| **Mobile LCP (4G / slow 3G)** | **< 2.5 s** | Accelerated by ISR (`revalidate = 3600`) and 103 kB First Load JS |
| **Total Error Rate (5xx + timeouts)** | **< 1.0%** | Measured under target peak RPS |
| **Platform Availability** | **≥ 99.5%** | Monthly uptime |
| **Emergency Fallback Availability** | **100% (Offline)** | Emergency hotline dialers function with zero network |
| **Offline Sync Data Loss** | **0 operations lost** | IndexedDB outbox retains all non-acknowledged mutations |

---

## 3. Step-by-Step Load Testing Runbook

### Step 1: Staging Environment Preparation
1. Create a dedicated Supabase project for staging.
2. Execute migration scripts in `supabase/` (`01_schema.sql` through `11_rls_initplan.sql`).
3. Under **Authentication → Providers → Email**, turn **OFF** "Confirm email" on the staging project to allow synthetic user creation.
4. Set up a Vercel Preview or Staging deployment with:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointing to staging.
   - `LOADTEST_ENABLED=1`
   - `LOADTEST_KEY=<secure-random-token>`

### Step 2: Seed Synthetic Data
Open `loadtest/seed/seed_staging.sql`, set `v_i_am_on_staging := true`, and run in the staging SQL editor:
- Generates 1,000 to 10,000 synthetic patients, 50,000 appointments, and 100,000 health records.
- Verifies database indexes and query plan execution under real table scale.

### Step 3: Mint Test Sessions
Generate authentication session cookies for k6 virtual users:

```powershell
cd loadtest
$env:SUPABASE_URL="https://STAGING-PROJECT.supabase.co"
$env:SUPABASE_ANON_KEY="staging-anon-key"
node tools/mint_tokens.mjs --count 300 --doctors 5 --out tokens.json
```

### Step 4: Run k6 Scenarios
Install k6 (`winget install k6` or `docker run --rm -i grafana/k6 run - <script`).

```powershell
cd loadtest/k6

# 1. Smoke test (always verify first)
k6 run -e TEST_TYPE=smoke -e BASE_URL=https://staging.vercel.app -e SUPABASE_URL=https://staging.supabase.co -e LOADTEST_KEY=secret -e TOKENS_FILE=../tokens.json rural_health_mixed.js

# 2. Peak load test (10 requests/s for 10 min)
k6 run -e TEST_TYPE=load -e TARGET_RPS=10 ... rural_health_mixed.js

# 3. Stress test (step from 25% to 300% of peak)
k6 run -e TEST_TYPE=stress -e TARGET_RPS=10 ... rural_health_mixed.js

# 4. Spike test (sudden 4x surge in 30 seconds)
k6 run -e TEST_TYPE=spike -e TARGET_RPS=10 ... rural_health_mixed.js

# 5. Breakpoint test (ramps until failure to find absolute platform ceiling)
k6 run -e TEST_TYPE=breakpoint -e MAX_RPS=200 -e MAX_VUS=800 ... rural_health_mixed.js
```

### Step 5: Capacity Modeling
Convert observed breakpoint numbers into concurrent patient capacities and monthly quota consumption:

```powershell
node loadtest/tools/capacity_model.mjs --breakpoint-rps 35 --response-s 1.8 --fn-per-interaction 3 --client-kb 300 --supabase-kb 60 --mau 20000
```

### Step 6: Post-Test Cleanup
Run `loadtest/seed/cleanup_staging.sql` in the staging Supabase project to purge all synthetic records.

---

## 4. GitHub Actions CI Smoke Workflow

A manual GitHub Actions workflow is provided at `.github/workflows/loadtest-smoke.yml`:
- **Trigger**: Manual `workflow_dispatch` only.
- **Repository Secrets Required**:
  - `STAGING_URL`: Your staging Vercel deployment URL.
  - `STAGING_SUPABASE_URL`: Your staging Supabase URL.
  - `LOADTEST_KEY`: The matching secret passed in `x-loadtest-key`.
- **Production Guard**: Aborts immediately if `STAGING_URL` points to production.
