import { type NextRequest, NextResponse } from "next/server"
import { requireUser, authErrorResponse } from "@/lib/auth/guard"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { executeAssistantAction } from "@/lib/services/assistant-actions.service"

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireUser()
    const limit = await checkRateLimit(request, "write", user.id)
    if (!limit.success) return rateLimitResponse(limit)
    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "Invalid JSON action", code: "VALIDATION_ERROR" }, { status: 400 })
    }
    const response = await executeAssistantAction(supabase, user, body)
    response.headers.set("Cache-Control", "private, no-store")
    return response
  } catch (error) {
    return authErrorResponse(error)
  }
}
