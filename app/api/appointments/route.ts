/**
 * app/api/appointments/route.ts
 *
 * Route handler for Teleconsultation & Clinic Appointments API.
 * Architecture: Delegates business logic to lib/services/appointments.service.ts
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 */

import { type NextRequest } from "next/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, authErrorResponse } from "@/lib/auth/guard"
import {
  handleGetAppointments,
  handleCreateAppointment,
  handlePatchAppointment,
} from "@/lib/services/appointments.service"

export async function GET(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const { searchParams } = new URL(req.url)
    return await handleGetAppointments(supabase, user, searchParams)
  } catch (err) {
    return authErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const body = await req.json()
    return await handleCreateAppointment(supabase, user, body)
  } catch (err) {
    return authErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const body = await req.json()
    return await handlePatchAppointment(supabase, user, body)
  } catch (err) {
    return authErrorResponse(err)
  }
}
