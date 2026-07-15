import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Fallback in-memory map if Redis is not configured
const rateMap = new Map<string, { count: number; ts: number }>();

let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    analytics: true,
  });
}

export async function rateLimit(ip: string, max = 20, windowMs = 60000): Promise<boolean> {
  // If Redis is configured, use Upstash
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    return success;
  }

  // Fallback memory rate limiter
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.ts > windowMs) {
    rateMap.set(ip, { count: 1, ts: now });
    return true; // allowed
  }
  if (entry.count >= max) return false; // blocked
  entry.count++;
  return true;
}

// Usage in API Route:
// const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
// if (!(await rateLimit(ip))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
