/**
 * GET  /api/cache-status  — returns cache health stats (admin only)
 * POST /api/cache-status  — purge AI response cache (admin only)
 */
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only admins can view cache stats
  const { data: patient } = await supabase
    .from("patients")
    .select("role")
    .eq("user_id", user.id)
    .single()
  if (patient?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const redisConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )

  return NextResponse.json({
    redis: redisConfigured ? "configured" : "not-configured (in-memory rate-limit only)",
    ai_cache_ttl_hours: 24,
    facilities_cache_ttl_hours: 1,
    note: redisConfigured
      ? "Server-side cache is active. AI and facilities responses are being cached."
      : "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN not set in Vercel env. Add them to enable distributed rate limiting and response caching.",
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: patient } = await supabase
    .from("patients")
    .select("role")
    .eq("user_id", user.id)
    .single()
  if (patient?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return NextResponse.json({ error: "Redis not configured" }, { status: 503 })
  }

  try {
    const { Redis } = await import("@upstash/redis")
    const redis = Redis.fromEnv()

    // Scan and delete all keys with our prefix
    let cursor = 0
    let deleted = 0
    do {
      const result = await redis.scan(cursor, { match: "rhp:ai:v1:*", count: 100 })
      cursor = result[0] as unknown as number
      const keys = result[1] as string[]
      if (keys.length > 0) {
        await redis.del(...keys)
        deleted += keys.length
      }
    } while (cursor !== 0)

    return NextResponse.json({ success: true, deleted, message: `Purged ${deleted} cached AI responses` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
