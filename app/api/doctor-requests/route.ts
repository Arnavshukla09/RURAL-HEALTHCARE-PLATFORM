import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { z } from "zod"

import { requireUser, getPatientProfile, authErrorResponse } from "@/lib/auth/guard"
import { parsePaginationParams, paginateResults } from "@/lib/pagination"
import { getAdminClient } from "@/lib/supabase/admin"
import { logAuditEvent } from "@/lib/audit"

// GET — admin fetches all pending requests (with pagination)
export async function GET(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const patient = await getPatientProfile(user.id)
    if (!patient) {
      return NextResponse.json({ error: "Profile not found", code: "NOT_FOUND" }, { status: 404 })
    }

    // Non-admins can only see their own request
    if (patient.role !== "admin") {
      const { data, error } = await supabase
        .from("doctor_requests")
        .select("id, user_id, full_name, email, phone, specialization, license_number, qualification, experience_years, hospital_affiliation, status, notes, created_at")
        .eq("user_id", user.id)
        .single()

      if (error) return NextResponse.json({ data: null, request: null })
      return NextResponse.json({ data, request: data })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || "pending"
    const { limit, cursor } = parsePaginationParams(searchParams, 20, 100)

    // Admin pagination with explicit column list (H8)
    let query = supabase
      .from("doctor_requests")
      .select("id, user_id, full_name, email, phone, specialization, license_number, qualification, experience_years, hospital_affiliation, status, notes, created_at")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1)

    if (cursor) {
      query = query.lt("created_at", cursor.createdAt)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: "Failed to fetch doctor requests", code: "DB_ERROR" }, { status: 500 })

    const paginated = paginateResults((data ?? []) as any, limit)
    return NextResponse.json({
      data: paginated.data,
      requests: paginated.data,
      nextCursor: paginated.nextCursor,
    })
  } catch (err) {
    return authErrorResponse(err)
  }
}

// POST — doctor submits registration request
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, "write")
  if (!rl.success) return rateLimitResponse(rl)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 })

  // Check if request already exists
  const { data: existing } = await supabase
    .from("doctor_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .single()

  if (existing) {
    return NextResponse.json({
      error: `A request already exists with status: ${existing.status}`,
      existing,
    }, { status: 409 })
  }

  const Schema = z.object({
    full_name: z.string().min(2).max(100),
    email: z.string().email(),
    specialization: z.string().min(2).max(100).optional(),
    license_number: z.string().min(3).max(50),
    hospital_affiliation: z.string().max(200).optional(),
    experience_years: z.coerce.number().int().min(0).max(60).optional(),
  })

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("doctor_requests")
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: data, message: "Request submitted successfully" }, { status: 201 })
}

// PATCH — admin approves or rejects a request
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verify admin role
  const { data: admin } = await supabase
    .from("patients")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (admin?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const Schema = z.object({
    request_id: z.string().uuid(),
    action: z.enum(["approved", "rejected"]),
    admin_notes: z.string().max(500).optional(),
  })

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { request_id, action, admin_notes } = parsed.data

  // Get the request to find user_id and clinician details
  const { data: request } = await supabase
    .from("doctor_requests")
    .select("user_id, email, full_name, specialization, license_number, hospital_affiliation, experience_years")
    .eq("id", request_id)
    .single()

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 })
  }

  // Update request status
  const { error: updateError } = await supabase
    .from("doctor_requests")
    .update({
      status: action,
      reviewed_at: new Date().toISOString(),
      admin_notes: admin_notes || null,
    })
    .eq("id", request_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // If approved — update the patient's role to doctor and link healthcare_providers entry
  if (action === "approved") {
    let adminClient: any
    try {
      adminClient = getAdminClient()
    } catch {
      adminClient = supabase
    }

    const { error: roleError } = await adminClient
      .from("patients")
      .update({ role: "doctor" })
      .eq("user_id", request.user_id)

    if (roleError) {
      return NextResponse.json({
        error: "Request approved but role update failed: " + roleError.message,
      }, { status: 500 })
    }

    // Link or create healthcare_providers entry for the approved doctor
    try {
      let existingProvider = null
      if (request.user_id) {
        const { data: byUser } = await adminClient
          .from("healthcare_providers")
          .select("id, user_id, email")
          .eq("user_id", request.user_id)
          .maybeSingle()
        existingProvider = byUser
      }

      if (!existingProvider && request.email) {
        const { data: byEmail } = await adminClient
          .from("healthcare_providers")
          .select("id, user_id, email")
          .eq("email", request.email)
          .maybeSingle()
        existingProvider = byEmail
      }

      if (existingProvider) {
        await adminClient
          .from("healthcare_providers")
          .update({
            user_id: request.user_id,
            is_verified: true,
            ...(request.specialization ? { specialization: request.specialization } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProvider.id)
      } else {
        await adminClient
          .from("healthcare_providers")
          .insert({
            user_id: request.user_id,
            name: request.full_name || request.email,
            email: request.email,
            specialization: request.specialization || "General Medicine",
            is_verified: true,
          })
      }
    } catch (linkErr) {
      console.error("[doctor-requests] Non-blocking provider linking error:", linkErr)
    }

    await logAuditEvent({
      action: "doctor_request_approved",
      resourceType: "doctor_requests",
      resourceId: request_id,
      patientId: request.user_id,
      userId: user.id,
      userRole: "admin",
      details: { role_promoted_to: "doctor", email: request.email },
    })
  } else if (action === "rejected") {
    await logAuditEvent({
      action: "doctor_request_rejected",
      resourceType: "doctor_requests",
      resourceId: request_id,
      patientId: request.user_id,
      userId: user.id,
      userRole: "admin",
      details: { email: request.email, admin_notes: admin_notes || null },
    })
  }

  return NextResponse.json({
    message: `Request ${action} successfully`,
    user_id: request.user_id,
  })
}
