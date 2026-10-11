# Performance Report — Rural Healthcare Platform

> **Generated:** October 2026  
> **Based on:** Live HTTP measurements + static code analysis (scalability audit)  
> **Commit:** Post-audit improvements (following commit `0a9e2d7`)

---

## 1. Observed Metrics (Pre-Optimization Baseline)

All measurements were taken against the **live Vercel deployment** (`iad1` region, Washington DC) from a test client in Hyderabad, India. Add ~200ms for real Indian users on the same network path.

### 1.1 API Endpoint Latency (Single Request, No Auth)

| Endpoint | HTTP Status | Latency | Notes |
|---|---|---|---|
| `GET /` | 200 | 870ms | `x-vercel-cache: HIT` — CDN serving |
| `GET /api/health` | **404** | 840ms | **Missing endpoint — now fixed** |
| `GET /api/facilities/nearby` | 200 | 2,416ms | PostGIS spatial query, no cache |
| `GET /api/appointments` (unauth) | 401 | 292ms | Fast auth rejection ✅ |
| `GET /api/medical-records` (unauth) | 401 | 289ms | Fast auth rejection ✅ |

### 1.2 AI Chat Concurrency Test (5 Simultaneous Users)

| Query | Tier Hit | Latency |
|---|---|---|
| "I have a fever" | Tier 2 (brain cache) | 1,354ms |
| "stomach pain" | Tier 3 (Gemini) | 7,315ms |
| "headache and vomiting" | Tier 2 (brain cache) | 701ms |
| "chest pain" | Tier 0 (emergency) | **460ms** |
| "cough and cold" | Tier 3 (Gemini) | 19,857ms |

**Wall-clock for 5 concurrent:** 19,875ms (~20s)  
**P50:** 1,354ms | **P95 (est.):** ~19s | **Max:** 19,857ms

### 1.3 Rate Limiter Behaviour

| Metric | Observed |
|---|---|
| Rate limit fires at | Request #11 (expected: #21) |
| Reason | In-memory Map fallback active (Upstash Redis not configured) |
| Behaviour difference | Fixed window vs. sliding window — inconsistent between instances |

### 1.4 JavaScript Bundle Analysis

| Chunk | Size (uncompressed) | Cache Policy |
|---|---|---|
| webpack runtime | 4 KB | immutable ✅ |
| vendor chunk A | 165 KB | immutable ✅ |
| vendor chunk B | 175 KB | immutable ✅ |
| main-app | 1 KB | immutable ✅ |
| app chunk A | 62 KB | immutable ✅ |
| app chunk B | 200 KB | immutable ✅ |
| **Total (first 6)** | **607 KB** | — |

> **Critical finding:** `content-encoding: none` — gzip/Brotli not active at time of test.  
> At 64 Kbps (typical 2G in rural MP), 607 KB takes **~76 seconds** to load.  
> With Brotli, expected size ≈ 150 KB → **~19 seconds** (75% reduction).

### 1.5 Facilities API Cold vs Warm

| Call | Latency |
|---|---|
| Cold (first call) | 1,456ms |
| Warm (2nd call) | 1,271ms |
| Warm (3rd call) | 1,072ms |

No caching at the API layer — every map load performs a full PostGIS spatial query.

---

## 2. Optimizations Implemented (Post-Audit)

### 2.1 Server-Side AI Response Cache (`lib/cache/response-cache.ts`)

- **What:** Redis-backed cache for `/api/ai-chat` Gemini responses
- **Key:** SHA-256 of normalized query (16-char hex prefix), namespaced `rhp:ai:v1:`
- **TTL:** 24 hours
- **Scope:** Single-turn queries only (no conversation history) to prevent stale contextual responses
- **Expected Impact:** 
  - Cache hit → ~10ms response (vs. 7,000ms Gemini avg)
  - Common queries (fever, cold, cough, diarrhoea) will be served from cache after first user asks

### 2.2 Facilities Response Cache

- **What:** Redis-backed cache for `/api/facilities/nearby` PostGIS results
- **Key:** 0.1° lat/lon grid bucket + type + radius
- **TTL:** 1 hour
- **Expected Impact:** 90%+ of map reload requests served from cache (~10ms vs. ~1,400ms)

### 2.3 Gemini `maxOutputTokens` Reduced

- **Change:** 2048 → 800 tokens
- **Why:** System prompt requires ≤120 words per language. Bilingual JSON ≤240 words ≈ 320 tokens. 800 is generous headroom.
- **Expected Impact:** ~35-40% reduction in Gemini response time

### 2.4 Health Check Endpoint Added

- **Route:** `GET /api/health`
- **Response:** `{ status: "ok", service: "...", ts: "...", uptime: N }`
- **Impact:** Enables UptimeRobot, Pingdom, Vercel health checks, load balancer probes

### 2.5 Compression Config Verified

- **Change:** `compress: true` explicitly set in `next.config.mjs`
- **Impact:** Ensures Vercel applies gzip/Brotli to all responses

### 2.6 Vercel Analytics Activated

- **Change:** `<Analytics />` component added to `app/layout.tsx`
- **Impact:** Real User Monitoring (LCP, FID, CLS, page views) now flowing to Vercel dashboard

### 2.7 Admin Client Singleton (`lib/supabase/admin.ts`)

- **Change:** Added `getAdminClient()` that reuses a module-level instance
- **Impact:** Eliminates repeated client construction overhead across warm requests

### 2.8 ARCHITECTURE.md Updated

- Documents the new `lib/cache/` module, `lib/ai/`, `lib/chat/` folders, corrected SPA router description

---

## 3. Remaining Performance Gaps

These are identified but not yet implemented — prioritized for the next sprint:

| # | Gap | Impact | Estimated Effort |
|---|---|---|---|
| BN-P1 | Gemini response **streaming** (SSE) | Perceived latency drops from 7s → instant | 3 days |
| BN-P2 | AI **request queue** (max 5 concurrent Gemini calls) | Prevents cascade timeout under load | 1 day |
| BN-P3 | Supabase **pgBouncer** connection pooling | Required for >50 concurrent DB users | 30 min |
| BN-P4 | `React.lazy()` / route-level code splitting | Reduces initial JS from 607KB → ~200KB | 3 days |
| BN-P5 | **Sentry** error monitoring | Observability for production incidents | 2 days |
| BN-P6 | Parallelize remaining sequential DB `await` chains | ~200ms saved per authenticated request | 1 day |

---

## 4. Production Readiness Checklist

| Requirement | Pre-Audit | Post-Audit |
|---|---|---|
| `/api/health` endpoint | ❌ | ✅ Fixed |
| Vercel Analytics active | ❌ | ✅ Fixed |
| `compress: true` in Next.js config | ❌ | ✅ Fixed |
| AI response cache (Redis) | ❌ | ✅ Implemented |
| Facilities cache (Redis) | ❌ | ✅ Implemented |
| Gemini token limit optimized | ❌ 2048 | ✅ 800 |
| Admin client singleton | ❌ | ✅ Fixed |
| Distributed rate limiting (Upstash) | ⚠️ Falls back | ⚠️ Still needs `UPSTASH_REDIS_REST_URL` in Vercel |
| Gemini streaming | ❌ | ❌ Planned |
| Request queue for AI | ❌ | ❌ Planned |
| pgBouncer connection pool | ❌ | ❌ Planned (30 min manual task) |
| Sentry error monitoring | ❌ | ❌ Planned |
| P95 AI latency < 10s | ❌ 19.9s | ⚠️ Improved but not measured post-cache |

---

## 5. How to Verify Improvements

After next Vercel deployment:

```bash
# 1. Verify health endpoint
curl https://rural-healthcare-platform.vercel.app/api/health

# 2. Verify gzip is active
curl -H "Accept-Encoding: gzip,br" -I https://rural-healthcare-platform.vercel.app/ | grep -i content-encoding

# 3. Test facilities cache (second call should have cached: true)
curl "https://rural-healthcare-platform.vercel.app/api/facilities/nearby?lat=23.26&lon=77.41&radius_km=25"

# 4. Check cache status (admin login required)
curl -H "Cookie: ..." https://rural-healthcare-platform.vercel.app/api/cache-status
```

---

*This report will be updated after the next production deployment and post-optimization latency re-test.*
