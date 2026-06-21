import { createClient } from "@/lib/supabase/server"
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
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!patient?.id) {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User"
    const { data: created } = await supabase
      .from("patients")
      .upsert(
        { user_id: user.id, first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" ") || "", email: user.email, role: "patient", phone: "" },
        { onConflict: "user_id" }
      )
      .select("id")
      .single()
    patient = created
  }
  return patient
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!rateLimit(ip)) {
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
    if (!rateLimit(ip)) {
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

    const { data, error } = await supabase
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