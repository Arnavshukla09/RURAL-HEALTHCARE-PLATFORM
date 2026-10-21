/**
 * app/api/doctor-requests/route.ts
 *
 * Route handler for Doctor Onboarding & Verification Requests.
 * Architecture: Delegates business logic to lib/services/doctor-requests.service.ts
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, authErrorResponse } from "@/lib/auth/guard"
import {
  handleGetDoctorRequests,
  handleCreateDoctorRequest,
  handleReviewDoctorRequest,
} from "@/lib/services/doctor-requests.service"

export async function GET(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const { searchParams } = new URL(req.url)
    return await handleGetDoctorRequests(supabase, user, searchParams)
  } catch (err) {
    return authErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, "write")
  if (!rl.success) return rateLimitResponse(rl)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 })

  const body = await req.json()
  return await handleCreateDoctorRequest(supabase, user, body)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  return await handleReviewDoctorRequest(supabase, user, body)
}
