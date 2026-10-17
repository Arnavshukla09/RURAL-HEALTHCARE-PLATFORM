/**
 * app/api/admin/doctor-provider-link/route.ts
 *
 * Route handler for Doctor-Provider Directory Linking & Auditing.
 * Architecture: Delegates database operations to lib/services/doctor-provider-link.service.ts
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import {
  getDoctorProviderLinkStatus,
  linkDoctorToProvider,
} from "@/lib/services/doctor-provider-link.service"

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, "read")
  if (!rl.success) return rateLimitResponse(rl)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return await getDoctorProviderLinkStatus(supabase, user)
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, "write")
  if (!rl.success) return rateLimitResponse(rl)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  return await linkDoctorToProvider(supabase, user, body)
}
