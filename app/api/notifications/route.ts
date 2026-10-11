import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, getPatientProfile, authErrorResponse } from "@/lib/auth/guard"
import { parsePaginationParams, paginateResults } from "@/lib/pagination"

// Canonical schema matching 01_schema.sql
const NotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(["info", "warning", "success", "emergency"]).default("info"),
  recipient_type: z.enum(["all", "role", "individual"]).default("all"),
  recipient_role: z.enum(["patient", "doctor", "admin"]).optional().nullable(),
  recipient_id: z.string().uuid().optional().nullable(),
})

const UpdateNotificationSchema = z.object({
  notificationId: z.string().uuid(),
  is_read: z.boolean(),
})

export async function GET(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const patient = await getPatientProfile(user.id)
    if (!patient) {
      return NextResponse.json({ error: "Profile not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const { limit, cursor } = parsePaginationParams(searchParams, 20, 100)

    // Explicit column selection (H8)
    let query = supabase
      .from("notifications")
      .select("id, title, message, type, recipient_type, recipient_role, recipient_id, is_read, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1)

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    if (cursor) {
      query = query.lt("created_at", cursor.createdAt)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch notifications", code: "DB_ERROR" }, { status: 500 })
    }

    const paginated = paginateResults((data ?? []) as any, limit)
    return NextResponse.json(paginated)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const patient = await getPatientProfile(user.id)
    if (!patient || patient.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only admins may create notifications", code: "FORBIDDEN" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = NotificationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert([parsed.data])
      .select("id, title, message, type, recipient_type, recipient_role, recipient_id, is_read, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create notification", code: "DB_ERROR" }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const patient = await getPatientProfile(user.id)
    if (!patient) {
      return NextResponse.json({ error: "Profile not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateNotificationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    const { notificationId, is_read } = parsed.data

    // H1 FIX: compare recipient_id with patient.id (patients table PK), NOT auth user.id!
    let updateQuery = supabase
      .from("notifications")
      .update({ is_read })
      .eq("id", notificationId)

    if (patient.role !== "admin") {
      updateQuery = updateQuery
        .eq("recipient_type", "individual")
        .eq("recipient_id", patient.id)
    }

    const { data, error } = await updateQuery
      .select("id, title, message, type, is_read, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: "Notification not found or access denied", code: "NOT_FOUND" }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return authErrorResponse(error)
  }
}