/**
 * AI Gateway (Audit M4, Phase 5)
 * Guards upstream Gemini free-tier quota and availability:
 *  1. Circuit Breaker: trips open after 5 consecutive upstream failures for 60s, then half-open probe.
 *  2. Daily Quota: enforces per-user / per-IP daily limit (default 30) to prevent free-tier exhaustion.
 *  3. Timeout: strictly caps upstream Gemini request duration at 12s.
 */

import { Redis } from "@upstash/redis"

export class AiGatewayError extends Error {
  code: "CIRCUIT_OPEN" | "QUOTA_EXCEEDED" | "TIMEOUT" | "UPSTREAM_ERROR"

  constructor(code: "CIRCUIT_OPEN" | "QUOTA_EXCEEDED" | "TIMEOUT" | "UPSTREAM_ERROR", message: string) {
    super(message)
    this.name = "AiGatewayError"
    this.code = code
  }
}

// ── Circuit Breaker State ────────────────────────────────────────────────────
type CircuitState = "closed" | "open" | "half-open"

interface CircuitBreaker {
  state: CircuitState
  consecutiveFailures: number
  lastFailureTime: number
}

const FAILURE_THRESHOLD = 5
const OPEN_COOLDOWN_MS = 60000 // 60 seconds
const DEFAULT_TIMEOUT_MS = 12000 // 12 seconds
const DAILY_QUOTA_LIMIT = 30 // 30 queries per day per user/IP on free tier

const breaker: CircuitBreaker = {
  state: "closed",
  consecutiveFailures: 0,
  lastFailureTime: 0,
}

// In-memory daily quota store fallback
const memoryDailyQuota = new Map<string, { count: number; day: string }>()

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function getRedis(): Redis | null {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      return Redis.fromEnv()
    } catch {
      return null
    }
  }
  return null
}

/**
 * Check and increment daily quota for clientKey
 */
async function checkDailyQuota(clientKey: string): Promise<void> {
  const today = getTodayString()
  const redis = getRedis()

  if (redis) {
    try {
      const quotaKey = `rhcp_ai_quota:${today}:${clientKey}`
      const current = await redis.incr(quotaKey)
      if (current === 1) {
        // Set 24 hour TTL on first increment
        await redis.expire(quotaKey, 86400)
      }
      if (current > DAILY_QUOTA_LIMIT) {
        throw new AiGatewayError(
          "QUOTA_EXCEEDED",
          `Daily AI consultation quota (${DAILY_QUOTA_LIMIT}) exceeded for this session.`
        )
      }
      return
    } catch (err: any) {
      if (err instanceof AiGatewayError) throw err
      // If redis network failure, fall through to memory
    }
  }

  // Fallback memory quota
  const existing = memoryDailyQuota.get(clientKey)
  if (!existing || existing.day !== today) {
    memoryDailyQuota.set(clientKey, { count: 1, day: today })
    return
  }

  if (existing.count >= DAILY_QUOTA_LIMIT) {
    throw new AiGatewayError(
      "QUOTA_EXCEEDED",
      `Daily AI consultation quota (${DAILY_QUOTA_LIMIT}) exceeded for this session.`
    )
  }

  existing.count += 1
}

/**
 * Inspect circuit breaker state before executing
 */
function checkCircuitBreaker(): void {
  const now = Date.now()

  if (breaker.state === "open") {
    if (now - breaker.lastFailureTime >= OPEN_COOLDOWN_MS) {
      breaker.state = "half-open"
    } else {
      const remainingSeconds = Math.ceil((OPEN_COOLDOWN_MS - (now - breaker.lastFailureTime)) / 1000)
      throw new AiGatewayError(
        "CIRCUIT_OPEN",
        `AI service temporarily cooling down after upstream errors (${remainingSeconds}s remaining).`
      )
    }
  }
}

/**
 * Record successful completion of an upstream request
 */
function recordSuccess(): void {
  breaker.consecutiveFailures = 0
  breaker.state = "closed"
}

/**
 * Record failure of an upstream request
 */
function recordFailure(): void {
  const now = Date.now()
  breaker.consecutiveFailures += 1
  breaker.lastFailureTime = now

  if (breaker.consecutiveFailures >= FAILURE_THRESHOLD || breaker.state === "half-open") {
    breaker.state = "open"
  }
}

/**
 * Execute an upstream Gemini call through the AI Gateway
 */
export async function executeWithAiGateway<T>(
  clientKey: string,
  callFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  // 1. Quota check
  await checkDailyQuota(clientKey)

  // 2. Circuit breaker check
  checkCircuitBreaker()

  // 3. Strict timeout wrapper via Promise.race
  const controller = new AbortController()
  let timeoutId: NodeJS.Timeout

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(new AiGatewayError("TIMEOUT", `AI request timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([callFn(controller.signal), timeoutPromise])
    clearTimeout(timeoutId!)
    recordSuccess()
    return result
  } catch (err: any) {
    clearTimeout(timeoutId!)
    recordFailure()
    throw err
  }
}

/**
 * Current gateway status for health checks & observability
 */
export function getAiGatewayStatus() {
  return {
    circuitState: breaker.state,
    consecutiveFailures: breaker.consecutiveFailures,
    cooldownRemainingMs:
      breaker.state === "open"
        ? Math.max(0, OPEN_COOLDOWN_MS - (Date.now() - breaker.lastFailureTime))
        : 0,
  }
}

/**
 * Reset circuit breaker state (for testing / admin recovery)
 */
export function resetCircuitBreaker(): void {
  breaker.state = "closed"
  breaker.consecutiveFailures = 0
  breaker.lastFailureTime = 0
}
