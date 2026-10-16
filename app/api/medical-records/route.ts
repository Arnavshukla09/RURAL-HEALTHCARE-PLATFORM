import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, getPatientProfile, authErrorResponse } from "@/lib/auth/guard"
import { logAuditEvent } from "@/lib/audit"

const MedicalRecordSchema = z.object({
  record_type: z.enum(['diagnosis', 'prescription', 'lab_result', 'vaccination', 'other']),
  content: z.string().min(1),
  file_url: z.string().url().optional(),
})

// Helper: get or create patient row for current user
// AUDITED SERVICE-ROLE USE: New OAuth users need their initial patient row inserted
// via service role if not created at signup.
async function getOrCreatePatient(supabase: any, user: any) {
  let { data: patient } = await supabase
    .from("patients")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!patient?.id) {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User"
    try {
      const admin = getAdminClient()
      const { data: created, error } = await admin
        .from("patients")
        .upsert(
          { user_id: user.id, first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" ") || "", email: user.email, role: "patient", phone: "" },
          { onConflict: "user_id" }
        )
        .select("id, role")
        .single()
      
      if (error) console.error("Admin patient upsert error:", error)
      patient = created
    } catch (err) {
      console.error("Admin client failed:", err)
    }
  }
  return patient
}

import { parsePaginationParams, paginateResults } from "@/lib/pagination"

export async function GET(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json({ data: [], records: [], nextCursor: null })
    }

    const { searchParams } = new URL(request.url)
    const { limit, cursor } = parsePaginationParams(searchParams, 20, 100)

    // Admin Access: Doctor-Patient confidentiality protection
    // Administrators can see administrative metadata, but clinical text is redacted and file links are withheld
    if (patient.role === "admin") {
      const targetPatientId = searchParams.get("patient_id")
      let adminQuery = supabase
        .from("medical_records")
        .select("id, patient_id, provider_id, appointment_id, record_type, created_at, updated_at, file_url")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit + 1)

      if (targetPatientId) {
        adminQuery = adminQuery.eq("patient_id", targetPatientId)
      }

      if (cursor) {
        adminQuery = adminQuery.lt("created_at", cursor.createdAt)
      }

      const { data, error } = await adminQuery
      if (error) {
        return NextResponse.json({ error: "Failed to fetch medical records", code: "DB_ERROR" }, { status: 500 })
      }

      const redacted = (data ?? []).map((r: any) => ({
        id: r.id,
        patient_id: r.patient_id,
        provider_id: r.provider_id,
        appointment_id: r.appointment_id,
        record_type: r.record_type,
        created_at: r.created_at,
        updated_at: r.updated_at,
        has_file: Boolean(r.file_url),
        // Confidentiality redaction: file_url is omitted; content is masked
        content: "[Protected Health Information — Confidential Patient Record]",
      }))

      // Audit log: Admin metadata read (redacted view)
      await logAuditEvent({
        action: "medical_records_metadata_read_admin",
        resourceType: "medical_records",
        patientId: targetPatientId || null,
        userId: user.id,
        userRole: "admin",
        details: { count: redacted.length },
      })

      const paginated = paginateResults(redacted as any, limit)
      return NextResponse.json({
        data: paginated.data,
        records: paginated.data,
        nextCursor: paginated.nextCursor,
      })
    }

    // Doctor Access: Can view records for a specific patient under care (enforced by RLS)
    if (patient.role === "doctor") {
      const targetPatientId = searchParams.get("patient_id")
      let doctorQuery = supabase
        .from("medical_records")
        .select("id, patient_id, provider_id, appointment_id, record_type, content, file_url, created_at, updated_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit + 1)

      if (targetPatientId) {
        doctorQuery = doctorQuery.eq("patient_id", targetPatientId)
      }

      if (cursor) {
        doctorQuery = doctorQuery.lt("created_at", cursor.createdAt)
      }

      const { data, error } = await doctorQuery
      if (error) {
        return NextResponse.json({ error: "Failed to fetch medical records", code: "DB_ERROR" }, { status: 500 })
      }

      // Audit log: Doctor reading clinical records
      await logAuditEvent({
        action: "medical_records_read_doctor",
        resourceType: "medical_records",
        patientId: targetPatientId || null,
        userId: user.id,
        userRole: "doctor",
        details: { count: data?.length || 0 },
      })

      const paginated = paginateResults((data ?? []) as any, limit)
      return NextResponse.json({
        data: paginated.data,
        records: paginated.data,
        nextCursor: paginated.nextCursor,
      })
    }

    // Patient Access: RLS enforces querying own records
    let query = supabase
      .from("medical_records")
      .select("id, patient_id, provider_id, appointment_id, record_type, content, file_url, created_at, updated_at")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1)

    if (cursor) {
      query = query.lt("created_at", cursor.createdAt)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch medical records", code: "DB_ERROR" }, { status: 500 })
    }

    const paginated = paginateResults((data ?? []) as any, limit)
    return NextResponse.json({
      data: paginated.data,
      records: paginated.data,
      nextCursor: paginated.nextCursor,
    })
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
    const parsed = MedicalRecordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json({ error: "Could not resolve patient profile", code: "NOT_FOUND" }, { status: 404 })
    }

    // SECURITY: If doctor provides patient_id, use that patient_id; otherwise use authenticated session patient
    let targetPatientId = patient.id
    if (patient.role === "doctor" && body.patient_id) {
      targetPatientId = body.patient_id
    }

    // User-scoped client: RLS enforces insertion rules
    const { data, error } = await supabase
      .from("medical_records")
      .insert([{ patient_id: targetPatientId, ...parsed.data }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create medical record", code: "DB_ERROR" }, { status: 500 })
    }

    if (patient.role === "doctor") {
      await logAuditEvent({
        action: "medical_records_create_doctor",
        resourceType: "medical_records",
        resourceId: data?.id,
        patientId: targetPatientId,
        userId: user.id,
        userRole: "doctor",
        details: { record_type: parsed.data.record_type },
      })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()

    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json({ error: "Could not resolve patient profile", code: "NOT_FOUND" }, { status: 404 })
    }

    // DEMO ADMIN PROTECTION: Demo admin preview account cannot delete records
    if (patient.role === "admin" && user.email?.toLowerCase().trim() === "admin@ruralhealth.demo") {
      return NextResponse.json(
        { error: "Forbidden: Demo accounts are restricted to preview mode. Record deletion is disabled to prevent data loss.", code: "DEMO_MODE_RESTRICTED" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Missing record ID", code: "MISSING_ID" }, { status: 400 })
    }


    // Administrative moderation: Non-demo admin can delete files/records for storage/erasure without viewing them
    let query = supabase.from("medical_records").delete().eq("id", id)
    if (patient.role !== "admin") {
      query = query.eq("patient_id", patient.id)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to delete record", code: "DB_ERROR" }, { status: 500 })
    }

    if (patient.role === "admin") {
      await logAuditEvent({
        action: "medical_records_delete_admin",
        resourceType: "medical_records",
        resourceId: id,
        userId: user.id,
        userRole: "admin",
        details: { moderation: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()

    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json({ error: "Could not resolve patient profile", code: "NOT_FOUND" }, { status: 404 })
    }

    // DEMO ADMIN PROTECTION: Demo admin preview account cannot update records
    if (patient.role === "admin" && user.email?.toLowerCase().trim() === "admin@ruralhealth.demo") {
      return NextResponse.json(
        { error: "Forbidden: Demo accounts are restricted to preview mode. Record modification is disabled.", code: "DEMO_MODE_RESTRICTED" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Missing record ID", code: "MISSING_ID" }, { status: 400 })
    }

    const parsed = MedicalRecordSchema.safeParse(updateData)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" }, { status: 400 })
    }

    // Administrators cannot modify patient clinical notes (only patient or treating physician)
    if (patient.role === "admin") {
      return NextResponse.json(
        { error: "Forbidden: Administrators cannot modify patient clinical content.", code: "ACTION_NOT_PERMITTED" },
        { status: 403 }
      )
    }

    // User-scoped client: RLS enforces ownership
    const { data, error } = await supabase
      .from("medical_records")
      .update(parsed.data)
      .eq("id", id)
      .eq("patient_id", patient.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update record", code: "DB_ERROR" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}