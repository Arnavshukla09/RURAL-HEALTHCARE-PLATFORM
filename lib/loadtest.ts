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
