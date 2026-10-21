import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, authErrorResponse } from "@/lib/auth/guard"
import { logAuditEvent } from "@/lib/audit"

// Schema for profile update (strictly omits role to prevent tampering)
const ProfileSchema = z.object({
  profileType: z.enum(["patient", "provider"]),
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().max(50).optional(),
  phone: z.string().min(10).max(15).optional(),
  specialization: z.string().max(100).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "auth")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()

    const { data: patient } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const { data: provider } = await supabase
      .from("healthcare_providers")
      .select("*")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      patient,
      provider,
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const body = await request.json()

    // Validate input against strict schema
    const parsed = ProfileSchema.safeParse(body)
    if (!parsed.success) {
      if ((body as any)?.role) {
        await logAuditEvent({
          action: "profile_role_tamper_attempt",
          resourceType: "patients",
          userId: user.id,
          userRole: "patient",
          details: { attempted_role: (body as any).role },
        })
      }
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    if ((body as any)?.role) {
      await logAuditEvent({
        action: "profile_role_tamper_attempt",
        resourceType: "patients",
        userId: user.id,
        userRole: "patient",
        details: { attempted_role: (body as any).role },
      })
    }

    const { profileType, ...data } = parsed.data
    const table = profileType === "provider" ? "healthcare_providers" : "patients"

    const { data: updated, error } = await supabase
      .from(table)
      .update(data)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update profile", code: "DB_ERROR" }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    return authErrorResponse(error)
  }
}