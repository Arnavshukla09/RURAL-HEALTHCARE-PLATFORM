import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

// Booking schema — patient_id is derived from session, NOT from request body
const AppointmentSchema = z.object({
  provider_id: z.string().uuid(),
  appointment_date: z.string().datetime(),
  duration_minutes: z.number().int().min(15).max(120).default(30),
  notes: z.string().max(1000).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Get the patient ID for this user
    const { data: patient } = await supabase
      .from("patients")
      .select("id, role")
      .eq("user_id", user.id)
      .single()

    let query = supabase.from("appointments").select("*").order("appointment_date", { ascending: false })

    // If doctor/admin, show all appointments; if patient, show only own
    if (patient?.role === "doctor" || patient?.role === "admin") {
      // Doctors and admins can see all appointments
    } else if (patient?.id) {
      query = query.eq("patient_id", patient.id)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

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
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = AppointmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // SECURITY: Always derive patient_id from the authenticated session
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!patient?.id) {
      return NextResponse.json(
        { error: "Patient profile not found" },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from("appointments")
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