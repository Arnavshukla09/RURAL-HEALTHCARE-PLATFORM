import { NextResponse } from "next/server"

/**
 * GET /api/ready
 *
 * Deployment readiness probe for Kubernetes / container schedulers / reverse proxies.
 * Verifies that the Next.js App Router application is fully booted and accepting traffic.
 */
export async function GET() {
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
