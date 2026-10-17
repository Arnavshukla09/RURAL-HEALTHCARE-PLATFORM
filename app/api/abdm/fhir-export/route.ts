/**
 * app/api/abdm/fhir-export/route.ts
 *
 * Route handler for ABDM HL7 FHIR R4 Record Export.
 * Architecture: Delegates bundle assembly and validation to lib/services/fhir-export.service.ts
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireUser, authErrorResponse } from "@/lib/auth/guard"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { exportFhirRecordBundle } from "@/lib/services/fhir-export.service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get("record_id")

    if (!recordId) {
      return NextResponse.json(
        { error: "Missing required 'record_id' query parameter" },
        { status: 400 }
      )
    }

    return await exportFhirRecordBundle(supabase, user, recordId)
  } catch (error: any) {
    if (error?.message?.includes("auth") || error?.status === 401) {
      return authErrorResponse(error)
    }
    return NextResponse.json(
      { error: "Internal server error exporting FHIR bundle", detail: error?.message },
      { status: 500 }
    )
  }
}
