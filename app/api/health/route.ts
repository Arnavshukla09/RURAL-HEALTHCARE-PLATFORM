import { NextResponse } from "next/server"

/**
 * GET /api/health
 *
 * Health check endpoint for uptime monitoring, load balancers,
 * and Vercel deployment verification.
 *
 * Returns 200 OK with a JSON body so monitors can verify response content.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "rural-healthcare-platform",
      ts: new Date().toISOString(),
      uptime: process.uptime ? Math.round(process.uptime()) : null,
    },
    {
      status: 200,
      headers: {
        // Allow UptimeRobot, Pingdom etc. to cache for a short window
        "Cache-Control": "no-store",
      },
    }
  )
}
