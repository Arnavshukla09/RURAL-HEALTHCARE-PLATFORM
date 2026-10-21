/**
 * app/api/medical-records/route.ts
 *
 * Route handler for Medical Records API endpoints.
 * Architecture: Delegates business logic to lib/services/medical-records.service.ts
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 */

import { type NextRequest } from "next/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, authErrorResponse } from "@/lib/auth/guard"
import {
  handleGetMedicalRecords,
  handleCreateMedicalRecord,
  handleDeleteMedicalRecord,
  handleUpdateMedicalRecord,
} from "@/lib/services/medical-records.service"

export async function GET(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const { searchParams } = new URL(request.url)
    return await handleGetMedicalRecords(supabase, user, searchParams)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const body = await request.json()
    return await handleCreateMedicalRecord(supabase, user, body)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const { searchParams } = new URL(request.url)
    return await handleDeleteMedicalRecord(supabase, user, searchParams)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const body = await request.json()
    return await handleUpdateMedicalRecord(supabase, user, body)
  } catch (error) {
    return authErrorResponse(error)
  }
}