import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const MedicalRecordSchema = z.object({
  record_type: z.enum(['diagnosis', 'prescription', 'lab_result', 'vaccination', 'other']),
  content: z.string().min(1),
  file_url: z.string().url().optional(),
})

// Helper: get or create patient row for current user
async function getOrCreatePatient(supabase: any, user: any) {
  let { data: patient } = await supabase
    .from("patients")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!patient?.id) {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User"
    try {
      const adminSupabase = createAdminClient()
      const { data: created, error } = await adminSupabase
        .from("patients")
        .upsert(
          { user_id: user.id, first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" ") || "", email: user.email, role: "patient", phone: "" },
          { onConflict: "user_id" }
        )
        .select("id")
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
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!(await rateLimit(ip))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json([])
    }

    const { data, error } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!(await rateLimit(ip))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = MedicalRecordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // SECURITY: Always derive patient_id from authenticated session
    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json({ error: "Could not resolve patient profile" }, { status: 404 })
    }

    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from("medical_records")
      .insert([{ patient_id: patient.id, ...parsed.data }])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!(await rateLimit(ip))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json({ error: "Could not resolve patient profile" }, { status: 404 })
    }

    const adminSupabase = createAdminClient()
    let query = adminSupabase.from("medical_records").delete().eq("id", id)
    
    // Only restrict to patient_id if not admin
    if (patient.role !== "admin") {
      query = query.eq("patient_id", patient.id)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!(await rateLimit(ip))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const parsed = MedicalRecordSchema.safeParse(updateData)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const patient = await getOrCreatePatient(supabase, user)
    if (!patient?.id) {
      return NextResponse.json({ error: "Could not resolve patient profile" }, { status: 404 })
    }

    const adminSupabase = createAdminClient()
    let query = adminSupabase
      .from("medical_records")
      .update(parsed.data)
      .eq("id", id)

    if (patient.role !== "admin") {
      query = query.eq("patient_id", patient.id)
    }

    const { data, error } = await query.select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}