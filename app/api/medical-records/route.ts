import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"
import { requireUser, getPatientProfile, authErrorResponse } from "@/lib/auth/guard"

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

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(",")[0].trim() ?? '127.0.0.1'
    if (!(await rateLimit(ip, 30, 60000))) {
      return NextResponse.json({ error: 'Too many requests', code: "RATE_LIMITED" }, { status: 429 })
    }

    const { user, supabase } = await requireUser()
    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json([])
    }

    // User-scoped client: RLS enforced (patients see only their own; doctors/admins see all)
    const { data, error } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch medical records", code: "DB_ERROR" }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(",")[0].trim() ?? '127.0.0.1'
    if (!(await rateLimit(ip, 15, 60000))) {
      return NextResponse.json({ error: 'Too many requests', code: "RATE_LIMITED" }, { status: 429 })
    }

    const { user, supabase } = await requireUser()
    const body = await request.json()
    const parsed = MedicalRecordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    // SECURITY: Always derive patient_id from authenticated session
    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json({ error: "Could not resolve patient profile", code: "NOT_FOUND" }, { status: 404 })
    }

    // User-scoped client: RLS enforces insertion rules
    const { data, error } = await supabase
      .from("medical_records")
      .insert([{ patient_id: patient.id, ...parsed.data }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create medical record", code: "DB_ERROR" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(",")[0].trim() ?? '127.0.0.1'
    if (!(await rateLimit(ip, 10, 60000))) {
      return NextResponse.json({ error: 'Too many requests', code: "RATE_LIMITED" }, { status: 429 })
    }

    const { user, supabase } = await requireUser()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Missing record ID", code: "MISSING_ID" }, { status: 400 })
    }

    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json({ error: "Could not resolve patient profile", code: "NOT_FOUND" }, { status: 404 })
    }

    // User-scoped client: RLS enforces that patients can only delete their own
    let query = supabase.from("medical_records").delete().eq("id", id)
    if (patient.role !== "admin") {
      query = query.eq("patient_id", patient.id)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to delete record", code: "DB_ERROR" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(",")[0].trim() ?? '127.0.0.1'
    if (!(await rateLimit(ip, 15, 60000))) {
      return NextResponse.json({ error: 'Too many requests', code: "RATE_LIMITED" }, { status: 429 })
    }

    const { user, supabase } = await requireUser()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Missing record ID", code: "MISSING_ID" }, { status: 400 })
    }

    const parsed = MedicalRecordSchema.safeParse(updateData)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" }, { status: 400 })
    }

    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json({ error: "Could not resolve patient profile", code: "NOT_FOUND" }, { status: 404 })
    }

    // User-scoped client: RLS enforces ownership
    let query = supabase
      .from("medical_records")
      .update(parsed.data)
      .eq("id", id)

    if (patient.role !== "admin") {
      query = query.eq("patient_id", patient.id)
    }

    const { data, error } = await query.select().single()

    if (error) {
      return NextResponse.json({ error: "Failed to update record", code: "DB_ERROR" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return authErrorResponse(error)
  }
}