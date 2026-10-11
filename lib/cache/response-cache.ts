/**
 * lib/cache/response-cache.ts
 *
 * Server-side AI response cache backed by Upstash Redis.
 *
 * Strategy:
 *  - Keys are SHA-256 hashes of the normalized query string.
 *  - TTL is 24 hours — medical advice doesn't change frequently and this
 *    dramatically reduces Gemini API calls for repeated questions.
 *  - If Redis is not configured (UPSTASH_REDIS_REST_URL absent), falls back
 *    to a no-op so the platform degrades gracefully.
 *  - Only Tier 3 (Gemini) responses are cached — emergency and clinical-brain
 *    responses are already sub-millisecond and don't need caching.
 *
 * Cache invalidation:
 *  - 24h TTL automatic expiry via Redis.
 *  - Manual flush: call clearResponseCache() from an admin API route.
 */

import { createHash } from "crypto"

export interface CachedAIResponse {
  replyEn: string
  replyHi: string
  cachedAt: number
  model?: string
}

// Lazy-init Redis client — only constructed when actually needed
let _redis: any = null

async function getRedis(): Promise<any | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (_redis) return _redis
  try {
    const { Redis } = await import("@upstash/redis")
    _redis = Redis.fromEnv()
    return _redis
  } catch {
    return null
  }
}

/**
 * Build a deterministic cache key from a normalized query string.
 * The prefix 'rhp:ai:v1:' namespaces keys to prevent collisions
 * with other Upstash databases and allows bulk-deleting all AI cache entries.
 */
export function buildCacheKey(normalizedQuery: string, lang: "en" | "hi" = "en"): string {
  const hash = createHash("sha256")
    .update(`${lang}:${normalizedQuery.toLowerCase().trim()}`)
    .digest("hex")
    .slice(0, 16) // 16 hex chars = 64-bit collision resistance, keeps keys short
  return `rhp:ai:v1:${hash}`
}

/**
 * Look up a cached bilingual response.
 * Returns null on cache miss, Redis unavailability, or parse errors.
 */
export async function getCachedResponse(
  normalizedQuery: string
): Promise<CachedAIResponse | null> {
  const redis = await getRedis()
  if (!redis) return null

  try {
    const key = buildCacheKey(normalizedQuery)
    const raw = await redis.get(key)
    if (!raw) return null

    const parsed: CachedAIResponse =
      typeof raw === "string" ? JSON.parse(raw) : (raw as CachedAIResponse)
    return parsed
  } catch {
    return null
  }
}

/**
 * Store a bilingual AI response in the cache with a 24-hour TTL.
 * Silently no-ops if Redis is unavailable.
 */
export async function setCachedResponse(
  normalizedQuery: string,
  response: CachedAIResponse,
  ttlSeconds = 86400 // 24 hours
): Promise<void> {
  const redis = await getRedis()
  if (!redis) return

  try {
    const key = buildCacheKey(normalizedQuery)
    await redis.set(key, JSON.stringify(response), { ex: ttlSeconds })
  } catch {
    // Silently fail — cache is best-effort
  }
}

/**
 * Facilities cache: cache the result of the nearby_facilities PostGIS RPC
 * for a given lat/lon grid bucket to avoid repeated spatial queries.
 *
 * Grid bucketing: rounds lat/lon to 0.1 degree (~11 km grid cells) so
 * nearby users share the same cache entry.
 */
export function buildFacilitiesCacheKey(
  lat: number,
  lon: number,
  type: string | null,
  radiusKm: number
): string {
  // Round to 0.1 degree buckets (~11km) so nearby users share cache
  const latBucket = Math.round(lat * 10) / 10
  const lonBucket = Math.round(lon * 10) / 10
  return `rhp:fac:v1:${latBucket}:${lonBucket}:${type ?? "all"}:${radiusKm}`
}

export async function getCachedFacilities(key: string): Promise<any[] | null> {
  const redis = await getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get(key)
    if (!raw) return null
    return typeof raw === "string" ? JSON.parse(raw) : (raw as any[])
  } catch {
    return null
  }
}

export async function setCachedFacilities(
  key: string,
  facilities: any[],
  ttlSeconds = 3600 // 1 hour
): Promise<void> {
  const redis = await getRedis()
  if (!redis) return
  try {
    await redis.set(key, JSON.stringify(facilities), { ex: ttlSeconds })
  } catch {}
}
