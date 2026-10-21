import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, getPatientProfile, authErrorResponse } from "@/lib/auth/guard"
import { generateJitsiToken } from "@/lib/jitsi/jwt"

const TeleconsultSchema = z.object({
  appointmentId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const patient = await getPatientProfile(user.id)
    if (!patient) {
      return NextResponse.json({ error: "Profile not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = TeleconsultSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid appointmentId", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    const { appointmentId } = parsed.data

    // Fetch appointment details
    const { data: appointment, error: fetchErr } = await supabase
      .from("appointments")
      .select("id, patient_id, provider_id, appointment_date, duration_minutes, status, teleconsult_room_id")
      .eq("id", appointmentId)
      .single()

    if (fetchErr || !appointment) {
      return NextResponse.json({ error: "Appointment not found", code: "NOT_FOUND" }, { status: 404 })
    }

    // Role and ownership verification (C5)
    let isAuthorized = false

    if (patient.role === "admin") {
      isAuthorized = true
    } else if (patient.role === "patient" && appointment.patient_id === patient.id) {
      isAuthorized = true
    } else if (patient.role === "doctor") {
      // Check if this doctor is assigned to the provider record
      const { data: providerRecord } = await supabase
        .from("healthcare_providers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (providerRecord && appointment.provider_id === providerRecord.id) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "You are not authorized to enter this consultation room.", code: "FORBIDDEN" },
        { status: 403 }
      )
    }

    // Consultation status check
    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "This appointment has been cancelled.", code: "APPOINTMENT_CANCELLED" },
        { status: 409 }
      )
    }

    // Time window gating: start − 15 min to end + 30 min
    const apptDate = new Date(appointment.appointment_date).getTime()
    const durationMs = (appointment.duration_minutes || 30) * 60 * 1000
    const windowStart = apptDate - 15 * 60 * 1000 // 15 mins before
    const windowEnd = apptDate + durationMs + 30 * 60 * 1000 // 30 mins after end
    const now = Date.now()

    if (now < windowStart || now > windowEnd) {
      const minutesUntil = Math.round((windowStart - now) / 60000)
      return NextResponse.json(
        {
          error:
            now < windowStart
              ? `The teleconsultation room opens 15 minutes before the scheduled time (in ~${minutesUntil} minutes).`
              : "This teleconsultation window has expired.",
          code: "OUTSIDE_TIME_WINDOW",
        },
        { status: 403 }
      )
    }

    // Room ID: use existing or generate a cryptographically random UUID
    let roomId = appointment.teleconsult_room_id
    if (!roomId) {
      roomId = `rhcp_${crypto.randomUUID()}`
      await supabase
        .from("appointments")
        .update({ teleconsult_room_id: roomId })
        .eq("id", appointmentId)
    }

    // Phase 3 Cryptographic JWT Generation (Zero-Cost posture: returns token if secret configured, null otherwise)
    const { token, requiresToken } = generateJitsiToken({
      roomName: roomId,
      userId: user.id,
      userName: `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || user.email || "Participant",
      role: patient.role as "patient" | "doctor" | "admin",
      durationSeconds: 3600,
    })

    return NextResponse.json({
      roomId,
      token,
      domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si",
      requiresToken,
    })
  } catch (err) {
    return authErrorResponse(err)
  }
}