import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { z } from "zod"

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
  if (!(await rateLimit(ip, 30, 60000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: patient } = await supabase
    .from("patients")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })

  let query = supabase
    .from("appointments")
    .select("*, patients(first_name, last_name, email)")
    .order("appointment_date", { ascending: true })

  // Patients see only their own; doctors & admins see everything
  if (patient.role === "patient") {
    query = query.eq("patient_id", patient.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointments: data ?? [] })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
  if (!(await rateLimit(ip, 10, 60000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 })

  // Always derive patient_id from session — never trust client body
  let { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single()

  // Auto-create profile if somehow missing (edge case for OAuth users)
  if (!patient) {
    const { data: newPatient, error: createError } = await supabase
      .from("patients")
      .insert({
        user_id: user.id,
        first_name: user.user_metadata?.full_name?.split(" ")[0] || "New",
        last_name: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "User",
        email: user.email || "",
        role: "patient",
      })
      .select("id")
      .single()

    if (createError) {
      return NextResponse.json(
        { error: "Could not create patient profile. Please try again." },
        { status: 500 }
      )
    }
    patient = newPatient
  }

  if (!patient) {
    return NextResponse.json({ error: "Patient profile error. Please contact support." }, { status: 500 })
  }

  const body = await req.json()

  const AppointmentSchema = z.object({
    provider_id: z.string().uuid().optional().nullable(),
    appointment_date: z.string().datetime(),
    consultation_type: z.enum(["video", "audio", "chat"]).default("video"),
    notes: z.string().max(500).optional(),
  })

  const parsed = AppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { createAdminClient } = await import("@/lib/supabase/admin")
  const adminSupabase = createAdminClient()

  const roomId = `ruralhealth-consult-${Date.now().toString(16)}`

  let finalProviderId = parsed.data.provider_id || null;
  if (!finalProviderId) {
    const { data: defaultProvider } = await adminSupabase.from("providers").select("id").limit(1).single()
    if (defaultProvider) {
      finalProviderId = defaultProvider.id
    } else {
      return NextResponse.json({ error: "No doctors available in the system." }, { status: 400 })
    }
  }

  const { data, error } = await adminSupabase
    .from("appointments")
    .insert({
      patient_id: patient.id,
      provider_id: finalProviderId,
      appointment_date: parsed.data.appointment_date,
      notes: parsed.data.notes || null,
      status: "scheduled",
      teleconsult_room_id: roomId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  // Insert notification for patient
  await adminSupabase.from("notifications").insert([
    { user_id: user.id, title: "Appointment Requested", message: `You requested a ${parsed.data.consultation_type} consultation.`, type: "info" }
  ])

  return NextResponse.json({ appointment: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 })
  }

  const { createAdminClient } = await import("@/lib/supabase/admin")
  const adminSupabase = createAdminClient()

  const { data, error } = await adminSupabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data?.patient_id) {
    const { data: pt } = await adminSupabase.from("patients").select("user_id").eq("id", data.patient_id).single()
    if (pt?.user_id && pt.user_id !== user.id) {
      await adminSupabase.from("notifications").insert([
        { user_id: pt.user_id, title: `Appointment ${status}`, message: `Your appointment status is now ${status}.`, type: status === 'cancelled' ? 'alert' : 'info' }
      ])
    }
  }

  return NextResponse.json({ appointment: data })
}
