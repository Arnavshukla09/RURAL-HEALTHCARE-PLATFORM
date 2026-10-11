import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Redis } from "@upstash/redis"
import { getAiGatewayStatus } from "@/lib/ai/gateway"

/**
 * GET /api/health
 *
 * Comprehensive liveness & dependency health check (Audit M6, Phase 5).
 * Probes database responsiveness and cache connectivity.
 * STRICT PRIVACY: NEVER reveals secrets, connection strings, or error traces.
 */
export async function GET() {
  const start = Date.now()
  let dbStatus = "unknown"
  let cacheStatus = "memory_fallback"

  // 1. Database check: trivial 1-row query
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("facilities").select("id").limit(1)
    dbStatus = error ? "degraded" : "connected"
  } catch {
    dbStatus = "unavailable"
  }

  // 2. Cache check: Redis ping if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = Redis.fromEnv()
      const ping = await redis.ping()
      cacheStatus = ping === "PONG" ? "connected" : "degraded"
    } catch {
      cacheStatus = "degraded"
    }
  }

  // 3. AI Gateway circuit breaker state
  const aiStatus = getAiGatewayStatus()

  const isHealthy = dbStatus === "connected"
  const statusCode = isHealthy ? 200 : 503

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      service: "rural-healthcare-platform",
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
      database: dbStatus,
      cache: cacheStatus,
      ai_circuit: aiStatus.circuitState,
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  )
}
