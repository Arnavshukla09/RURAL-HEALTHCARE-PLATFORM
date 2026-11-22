import { NextResponse } from "next/server"
import { getPatientProfile } from "@/lib/auth/guard"
import { generateJitsiToken } from "@/lib/jitsi/jwt"

/** Resolve room credentials from an authenticated appointment, never a URL role. */
export async function authorizeTeleconsultRoom(supabase: any, user: any, appointmentId: string) {
  const profile = await getPatientProfile(user.id)
  if (!profile) return NextResponse.json({ error: "Profile not found", code: "NOT_FOUND" }, { status: 404 })
  const { data: appointment, error } = await supabase.from("appointments")
    .select("id, patient_id, provider_id, appointment_date, duration_minutes, status, teleconsult_room_id")
    .eq("id", appointmentId).single()
  if (error || !appointment) return NextResponse.json({ error: "Appointment not found", code: "NOT_FOUND" }, { status: 404 })

  let participantRole: "patient" | "doctor" = "patient"
  let participantName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Participant"
  let authorized = appointment.patient_id === profile.id
  if (!authorized && profile.role === "doctor") {
    const { data: provider } = await supabase.from("healthcare_providers")
      .select("id, name").eq("user_id", user.id).eq("is_verified", true).single()
    authorized = Boolean(provider && appointment.provider_id === provider.id)
    if (authorized) {
      participantRole = "doctor"
      participantName = provider.name || participantName
    }
  }
  if (!authorized) return NextResponse.json({ error: "You are not authorized to enter this consultation room.", code: "FORBIDDEN" }, { status: 403 })
  if (appointment.status !== "scheduled") return NextResponse.json({ error: "This appointment is no longer scheduled", code: "APPOINTMENT_TERMINAL" }, { status: 409 })

  const start = Date.parse(appointment.appointment_date)
  const duration = appointment.duration_minutes ?? 30
  if (!Number.isFinite(start) || !Number.isInteger(duration) || duration < 5 || duration > 180) {
    return NextResponse.json({ error: "Invalid appointment schedule", code: "INVALID_APPOINTMENT" }, { status: 500 })
  }
  const windowStart = start - 15 * 60000
  const windowEnd = start + (duration + 30) * 60000
  const now = Date.now()
  if (now < windowStart || now > windowEnd) return NextResponse.json({ error: "The room is available from 15 minutes before until 30 minutes after the consultation", code: "OUTSIDE_TIME_WINDOW" }, { status: 403 })

  let roomId = appointment.teleconsult_room_id
  if (roomId == null) {
    const candidate = `rhcp_${crypto.randomUUID()}`
    // Compare-and-set ensures simultaneous participants receive the same legacy room.
    const { data: assigned } = await supabase.from("appointments").update({ teleconsult_room_id: candidate })
      .eq("id", appointmentId).eq("status", "scheduled").is("teleconsult_room_id", null).select("teleconsult_room_id").single()
    if (assigned?.teleconsult_room_id) roomId = assigned.teleconsult_room_id
    else {
      const { data: winner } = await supabase.from("appointments").select("teleconsult_room_id")
        .eq("id", appointmentId).eq("status", "scheduled").single()
      roomId = winner?.teleconsult_room_id
    }
  }
  if (typeof roomId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(roomId)) {
    return NextResponse.json({ error: "Room credentials could not be resolved", code: "ROOM_UNAVAILABLE" }, { status: 503 })
  }
  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si"
  if (!/^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(domain)) {
    return NextResponse.json({ error: "Invalid conference domain configuration", code: "ROOM_UNAVAILABLE" }, { status: 503 })
  }
  const { token, requiresToken } = generateJitsiToken({
    roomName: roomId, userId: user.id, userName: participantName, role: participantRole,
    durationSeconds: Math.max(1, Math.min(3600, Math.floor((windowEnd - now) / 1000))),
  })
  const { data: clinician } = await supabase.from("healthcare_providers").select("id, name, location").eq("id", appointment.provider_id).maybeSingle()
  const { data: targetPatient } = await supabase.from("patients").select("first_name, last_name").eq("id", appointment.patient_id).maybeSingle()
  const patientName = appointment.patient_id === profile.id ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : `${targetPatient?.first_name || ""} ${targetPatient?.last_name || ""}`.trim()
  return NextResponse.json({ appointmentId, patientId: appointment.patient_id, providerId: appointment.provider_id, doctorName: clinician?.name || "", patientName, facilityName: clinician?.location || "", participantRole, participantName, roomId, token, domain, requiresToken }, {
    headers: { "Cache-Control": "private, no-store" },
  })
}
