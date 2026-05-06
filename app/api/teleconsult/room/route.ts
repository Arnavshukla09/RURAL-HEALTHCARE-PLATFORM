import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"   // ✅ ADD

// ✅ Schema
const TeleconsultSchema = z.object({
  appointmentId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // ✅ VALIDATE
    const parsed = TeleconsultSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { appointmentId } = parsed.data

    // 🔒 OPTIONAL BUT IMPORTANT: check ownership
    const { data: appointment } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single()

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // 👉 ensure user is part of this appointment
    if (
      appointment.patient_id !== user.id &&
      appointment.provider_id !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // ✅ Generate room ID (better version)
    const roomId = `rhcp_${Date.now()}_${crypto.randomUUID()}`

    // ✅ Update DB
    const { error } = await supabase
      .from("appointments")
      .update({ teleconsult_room_id: roomId })
      .eq("id", appointmentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ roomId })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}