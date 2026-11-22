import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, authErrorResponse } from "@/lib/auth/guard"
import { authorizeTeleconsultRoom } from "@/lib/services/teleconsult-room.service"

const RoomSchema = z.object({ appointmentId: z.string().uuid() }).strict()

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireUser()
    const limit = await checkRateLimit(request, "read", user.id)
    if (!limit.success) return rateLimitResponse(limit)
    let raw: unknown
    try { raw = await request.json() } catch {
      return NextResponse.json({ error: "Invalid JSON request", code: "VALIDATION_ERROR" }, { status: 400 })
    }
    const parsed = RoomSchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: "Invalid appointment request", code: "VALIDATION_ERROR" }, { status: 400 })
    return await authorizeTeleconsultRoom(supabase, user, parsed.data.appointmentId)
  } catch (error) {
    return authErrorResponse(error)
  }
}
