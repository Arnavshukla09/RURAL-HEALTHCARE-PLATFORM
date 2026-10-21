import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { logAuditEvent } from "@/lib/audit"
import { z } from "zod"

const EraseRecordSchema = z.object({
  record_id: z.string().uuid("Invalid record UUID format"),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "write")
    if (!rl.success) return rateLimitResponse(rl)

    // User-scoped Supabase client (NOT service role)
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required", code: "UNAUTHORIZED" }, { status: 401 })
    }

    // Verify admin role strictly from patients table
    const { data: patient, error: patientErr } = await supabase
      .from("patients")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (patientErr || patient?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Administrator role required", code: "FORBIDDEN" },
        { status: 403 }
      )
    }

    // Demo admin protection
    if (user.email?.toLowerCase().trim() === "admin@ruralhealth.demo") {
      return NextResponse.json(
        {
          error: "Forbidden: Demo accounts are restricted to preview mode. Erasure is disabled.",
          code: "DEMO_MODE_RESTRICTED",
        },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = EraseRecordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    const { record_id, reason } = parsed.data
    const erasureReason = reason || "Administrative right-to-erasure / moderation"

    // Execute audited SECURITY DEFINER database function with caller's authenticated session
    const { error: rpcError } = await supabase.rpc("admin_erase_medical_record", {
      p_record_id: record_id,
      p_reason: erasureReason,
    })

    if (rpcError) {
      const isNotFound = rpcError.code === "P0002" || rpcError.message.includes("not found")
      const isForbidden = rpcError.code === "42501" || rpcError.message.includes("Access denied")
      return NextResponse.json(
        { error: rpcError.message, code: isNotFound ? "NOT_FOUND" : isForbidden ? "FORBIDDEN" : "RPC_ERROR" },
        { status: isNotFound ? 404 : isForbidden ? 403 : 500 }
      )
    }

    // Application audit log
    await logAuditEvent({
      action: "medical_records_erasure_admin",
      resourceType: "medical_records",
      resourceId: record_id,
      userId: user.id,
      userRole: "admin",
      details: { reason: erasureReason },
    })

    return NextResponse.json({
      success: true,
      record_id,
      message: "Medical record successfully erased per administrative policy.",
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}
