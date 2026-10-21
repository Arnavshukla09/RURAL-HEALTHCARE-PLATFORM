import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

/**
 * GET /api/ready
 *
 * Deployment readiness and liveness probe for reverse proxies and schedulers.
 * Returns an instant 200 payload verifying the Next.js process is active.
 * Protected by rate limiting (60 req/min).
 */
export async function GET(request: NextRequest) {
  if (request) {
    const rl = await checkRateLimit(request, "public")
    if (!rl.success) {
      return rateLimitResponse(rl)
    }
  }

  return NextResponse.json(
    {
      ready: true,
      service: "rural-healthcare-platform",
      version: "1.7.0",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
