import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"
import { isLoadTest } from "./loadtest"

export type RouteClass = "auth" | "read" | "write" | "ai" | "public"

export interface LimiterConfig {
  name: string
  limit: number
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // timestamp in ms when the window resets
  retryAfter: number // seconds to wait before retrying
}

// ── Bounded In-Memory Map with TTL Eviction (Audit H4) ────────────────────────
// Prevents memory leaks in serverless instances / local dev when Redis is absent
interface MemoryRecord {
  count: number
  resetAt: number
}

const MAX_MEMORY_ENTRIES = 5000
const memoryStore = new Map<string, MemoryRecord>()

function cleanupMemoryStore(now: number) {
  if (memoryStore.size < MAX_MEMORY_ENTRIES) return

  // 1. Evict expired entries
  for (const [key, val] of memoryStore.entries()) {
    if (val.resetAt <= now) {
      memoryStore.delete(key)
    }
  }

  // 2. If still at capacity, evict oldest entries (FIFO)
  if (memoryStore.size >= MAX_MEMORY_ENTRIES) {
    const keysToDelete = Array.from(memoryStore.keys()).slice(0, Math.floor(MAX_MEMORY_ENTRIES * 0.2))
    for (const key of keysToDelete) {
      memoryStore.delete(key)
    }
  }
}

// ── Redis Client Initialization (Single Instance) ────────────────────────────
let redisClient: Redis | null = null

function getRedis(): Redis | null {
  if (
    !redisClient &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      redisClient = Redis.fromEnv()
    } catch (err) {
      console.warn("[RateLimit] Upstash Redis initialization error:", err)
      redisClient = null
    }
  }
  return redisClient
}

// Cache of Upstash Ratelimit instances per route class
const upstashLimiters = new Map<string, Ratelimit>()

/**
 * Limiter factory creating per-route-class sliding window limiters (Audit H4)
 */
export function createLimiter(config: LimiterConfig) {
  const { name, limit, windowSeconds } = config

  return async function check(key: string): Promise<RateLimitResult> {
    const redis = getRedis()

    // 1. Upstash Redis sliding window path
    if (redis) {
      let instance = upstashLimiters.get(name)
      if (!instance) {
        instance = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
          prefix: `rhcp_rl_${name}`,
          analytics: true,
        })
        upstashLimiters.set(name, instance)
      }

      try {
        const res = await instance.limit(key)
        const now = Date.now()
        const retryAfterSeconds = res.success
          ? 0
          : Math.max(1, Math.ceil((res.reset - now) / 1000))

        return {
          success: res.success,
          limit: res.limit,
          remaining: res.remaining,
          reset: res.reset,
          retryAfter: retryAfterSeconds,
        }
      } catch (err) {
        console.warn(`[RateLimit] Upstash error on ${name}, falling back to memory:`, err)
      }
    }

    // 2. Bounded in-memory fallback
    const now = Date.now()
    cleanupMemoryStore(now)

    const mapKey = `${name}:${key}`
    const existing = memoryStore.get(mapKey)

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowSeconds * 1000
      memoryStore.set(mapKey, { count: 1, resetAt })
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: resetAt,
        retryAfter: 0,
      }
    }

    if (existing.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
      return {
        success: false,
        limit,
        remaining: 0,
        reset: existing.resetAt,
        retryAfter: retryAfterSeconds,
      }
    }

    existing.count += 1
    return {
      success: true,
      limit,
      remaining: limit - existing.count,
      reset: existing.resetAt,
      retryAfter: 0,
    }
  }
}

// ── Pre-configured Limiters by Route Class ────────────────────────────────────
export const routeLimiters: Record<RouteClass, (key: string) => Promise<RateLimitResult>> = {
  auth: createLimiter({ name: "auth", limit: 10, windowSeconds: 60 }),
  read: createLimiter({ name: "read", limit: 60, windowSeconds: 60 }),
  write: createLimiter({ name: "write", limit: 20, windowSeconds: 60 }),
  ai: createLimiter({ name: "ai", limit: 10, windowSeconds: 60 }),
  public: createLimiter({ name: "public", limit: 60, windowSeconds: 60 }),
}

/**
 * Derives client key: user:<id> when logged in, else the FIRST hop of x-forwarded-for (Audit H4)
 */
export function clientKey(request: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`
  }
  const xff = request.headers.get("x-forwarded-for")
  if (xff) {
    const firstHop = xff.split(",")[0].trim()
    if (firstHop) return `ip:${firstHop}`
  }
  return "ip:127.0.0.1"
}

/**
 * Universal rate limit check for Next.js route handlers
 */
export async function checkRateLimit(
  request: Request,
  routeClass: RouteClass = "public",
  userId?: string | null
): Promise<RateLimitResult> {
  // Staging load test bypass: k6 load tests skip rate limiter when secret header matches
  if (isLoadTest(request)) {
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + 60000,
      retryAfter: 0,
    }
  }

  const key = clientKey(request, userId)
  const limiter = routeLimiters[routeClass] || routeLimiters.public
  return limiter(key)
}

/**
 * Generate standard HTTP 429 response with Retry-After and X-RateLimit headers (Audit H4)
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests. Please wait before trying again.",
      code: "RATE_LIMITED",
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": result.retryAfter.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(result.reset / 1000).toString(),
      },
    }
  )
}

/**
 * Backward-compatible helper for legacy route invocations: rateLimit(ip, max, windowMs)
 */
export async function rateLimit(
  ipOrKey: string,
  max = 20,
  windowMs = 60000
): Promise<boolean> {
  const windowSeconds = Math.max(1, Math.round(windowMs / 1000))
  const key = ipOrKey.includes(":") ? ipOrKey : `ip:${ipOrKey}`
  const custom = createLimiter({
    name: `legacy_${max}_${windowSeconds}`,
    limit: max,
    windowSeconds,
  })
  const res = await custom(key)
  return res.success
}
