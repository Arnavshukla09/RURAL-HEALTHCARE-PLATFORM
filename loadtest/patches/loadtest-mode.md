# Staging-only "load test mode" patch

Two things would ruin a load test if left alone:

1. **Your rate limiter.** Every k6 request comes from one IP, so `rateLimit(ip)` would answer 429 after 20 requests and you would be measuring the limiter, not your capacity.
2. **Gemini.** Real calls would burn your quota (and possibly money) and measure Google, not you.

The fix is a switch that exists **only on the staging deployment**, needs a secret header, and does nothing anywhere else.

## 1. New file `lib/loadtest.ts`

```ts
import { timingSafeEqual } from "node:crypto"

/**
 * True only when ALL of these hold:
 *  - LOADTEST_ENABLED=1 is set on this deployment (set it on STAGING only, never on production)
 *  - LOADTEST_KEY is set
 *  - the request carries a matching x-loadtest-key header
 */
export function isLoadTest(req: Request): boolean {
  if (process.env.LOADTEST_ENABLED !== "1") return false
  const secret = process.env.LOADTEST_KEY
  const sent = req.headers.get("x-loadtest-key")
  if (!secret || !sent) return false
  const a = Buffer.from(secret)
  const b = Buffer.from(sent)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Simulated Gemini latency so the load test still exercises realistic response times. */
export const stubDelay = () =>
  new Promise<void>((r) => setTimeout(r, 400 + Math.random() * 800))
```

## 2. Skip the limiter (every route that calls `rateLimit`)

Before:

```ts
const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
if (!(await rateLimit(ip))) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 })
}
```

After:

```ts
import { isLoadTest } from "@/lib/loadtest"

const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0].trim()
if (!isLoadTest(request) && !(await rateLimit(ip))) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 })
}
```

Routes to change: `ai-chat`, `appointments` (GET, POST, PATCH), `auth/ensure-patient`, `auth/profile`, `chat-cache`, `doctor-requests`, `facilities/nearby`, `health-data`, `medical-records`, `notifications`, `offline-sync`, `providers`, `symptom-analyze`, `teleconsult/room`.

> Keep **one** separate test (k6 without the header) to prove the limiter returns 429 when it should. That is a feature check, not a capacity test.

## 3. Stub Gemini in `app/api/ai-chat/route.ts`

Put it **after** the emergency check and **before** the Gemini call, so the emergency path is still measured for real:

```ts
import { isLoadTest, stubDelay } from "@/lib/loadtest"

// ... after:  const emergency = detectEmergency(message, language) ... return ...
if (isLoadTest(request)) {
  await stubDelay()
  return NextResponse.json({ reply: "Load-test stub reply." })
}
```

## 4. Stub Gemini in `app/api/symptom-analyze/route.ts`

After input validation, before the Gemini call:

```ts
import { isLoadTest, stubDelay } from "@/lib/loadtest"

if (isLoadTest(request)) {
  await stubDelay()
  return NextResponse.json(buildFallback(safeSymptoms, language))
}
```

## 5. Staging environment variables (Vercel staging project only)

```
LOADTEST_ENABLED=1
LOADTEST_KEY=<a long random string; the same value you pass to k6 with -e LOADTEST_KEY=...>
```

Do **not** add these to the production project. Rotate `LOADTEST_KEY` after each test campaign.

## Why not just switch the limiter off in staging?

Because then staging would no longer behave like production. With the secret header, real users on staging (you, with a browser) still go through the real limiter, and only k6 skips it.
