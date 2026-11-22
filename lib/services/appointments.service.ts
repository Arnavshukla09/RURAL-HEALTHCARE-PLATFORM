import { NextResponse } from "next/server"
import { z } from "zod"
import { getPatientProfile } from "@/lib/auth/guard"
import { getAdminClient } from "@/lib/supabase/admin"
import { parsePaginationParams, paginateResults } from "@/lib/pagination"

export const CreateAppointmentSchema = z.object({
  provider_id: z.string().uuid(),
  appointment_date: z.string().datetime(),
  consultation_type: z.enum(["video", "audio", "chat"]).default("video"),
  notes: z.string().max(500).optional(),
})

export const PatchAppointmentSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
})

const appointmentFields = "id, patient_id, provider_id, appointment_date, duration_minutes, consultation_type, status, notes, teleconsult_room_id, created_at, patients(first_name, last_name, email, phone)"

/** Keep appointment reads inside the caller's RLS scope and exact provider links. */
export async function handleGetAppointments(supabase: any, user: any, searchParams: URLSearchParams) {
  const patient = await getPatientProfile(user.id)
  if (!patient) return NextResponse.json({ error: "Patient profile not found", code: "NOT_FOUND" }, { status: 404 })

  const { limit, cursor } = parsePaginationParams(searchParams, 20, 100)
  let providerIds: string[] = []
  if (patient.role === "doctor") {
    const { data: providers, error } = await supabase.from("healthcare_providers")
      .select("id").eq("user_id", user.id).eq("is_verified", true)
    if (error) return NextResponse.json({ error: "Failed to resolve provider", code: "DB_ERROR" }, { status: 500 })
    providerIds = (providers ?? []).map((provider: any) => provider.id)
    if (providerIds.length === 0) return NextResponse.json({ data: [], appointments: [], nextCursor: null })
  }

  let query = supabase.from("appointments").select(appointmentFields)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1)
  if (patient.role === "patient") query = query.eq("patient_id", patient.id)
  if (patient.role === "doctor") query = query.in("provider_id", providerIds)
  if (cursor) {
    const validCursor = z.object({ createdAt: z.string().datetime(), id: z.string().uuid() }).safeParse(cursor)
    if (!validCursor.success) return NextResponse.json({ error: "Invalid cursor", code: "VALIDATION_ERROR" }, { status: 400 })
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`)
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: "Failed to fetch appointments", code: "DB_ERROR" }, { status: 500 })
  const paginated = paginateResults((data ?? []) as any, limit)
  return NextResponse.json({ data: paginated.data, appointments: paginated.data, nextCursor: paginated.nextCursor }, {
    headers: { "Cache-Control": "private, no-store" },
  })
}

/** A directory name or missing mapping must never select another clinician. */
export async function handleCreateAppointment(supabase: any, user: any, body: any, internal?: { entityId: string }) {
  const parsed = CreateAppointmentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" }, { status: 400 })
  const patient = await getPatientProfile(user.id)
  if (!patient) return NextResponse.json({ error: "Patient profile required", code: "PROFILE_REQUIRED" }, { status: 404 })
  if (new Date(parsed.data.appointment_date).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Choose a future appointment time", code: "INVALID_APPOINTMENT_TIME" }, { status: 400 })
  }
  const { data: provider, error: providerError } = await supabase.from("healthcare_providers")
    .select("id").eq("id", parsed.data.provider_id).eq("is_verified", true).maybeSingle()
  if (providerError) return NextResponse.json({ error: "Failed to resolve provider", code: "DB_ERROR" }, { status: 500 })
  if (!provider) return NextResponse.json({ error: "The selected verified provider is unavailable", code: "PROVIDER_UNAVAILABLE" }, { status: 404 })

  const { data, error } = await supabase.from("appointments").insert({
    ...(internal ? { id: z.string().uuid().parse(internal.entityId) } : {}),
    patient_id: patient.id,
    provider_id: provider.id,
    appointment_date: parsed.data.appointment_date,
    consultation_type: parsed.data.consultation_type,
    notes: parsed.data.notes || null,
    status: "scheduled",
    teleconsult_room_id: crypto.randomUUID(),
  }).select().single()
  if (error) {
    if (error.code === "23505" && internal) {
      const { data: prior } = await supabase.from("appointments").select("*").eq("id", internal.entityId).eq("patient_id", patient.id).maybeSingle()
      if (prior) return NextResponse.json({ appointment: prior, duplicate: true }, { status: prior.status === "scheduled" ? 200 : 409, headers: { "Cache-Control": "private, no-store" } })
    }
    if (error.code === "23505") return NextResponse.json({ error: "This time slot is already booked for this provider.", code: "SLOT_TAKEN" }, { status: 409 })
    return NextResponse.json({ error: "Failed to book appointment", code: "INSERT_ERROR" }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: "Booking was not acknowledged", code: "INSERT_ERROR" }, { status: 500 })
  try {
    await getAdminClient().from("notifications").insert([{ recipient_id: patient.id, recipient_type: "individual", title: "Appointment Requested", message: `You requested a ${parsed.data.consultation_type} consultation.`, type: "info" }])
  } catch (error) {
    console.warn("[appointments:POST] Notification insert skipped:", error)
  }
  return NextResponse.json({ appointment: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } })
}

export async function handlePatchAppointment(supabase: any, user: any, body: any) {
  const patient = await getPatientProfile(user.id)
  if (!patient) return NextResponse.json({ error: "Profile not found", code: "NOT_FOUND" }, { status: 404 })
  if (patient.role === "admin" && user.email?.toLowerCase().trim() === "admin@ruralhealth.demo") {
    return NextResponse.json({ error: "Demo accounts cannot modify appointments", code: "DEMO_MODE_RESTRICTED" }, { status: 403 })
  }
  const parsed = PatchAppointmentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten(), code: "VALIDATION_ERROR" }, { status: 400 })
  const { id, status: newStatus } = parsed.data
  const { data: existingAppt, error: fetchError } = await supabase.from("appointments")
    .select("id, patient_id, provider_id, status, appointment_date").eq("id", id).single()
  if (fetchError || !existingAppt) return NextResponse.json({ error: "Appointment not found", code: "NOT_FOUND" }, { status: 404 })
  if (existingAppt.status !== "scheduled") return NextResponse.json({ error: "Appointment can no longer be modified", code: "APPOINTMENT_TERMINAL" }, { status: 409 })
  if (patient.role === "patient") {
    if (existingAppt.patient_id !== patient.id) return NextResponse.json({ error: "Appointment not found", code: "NOT_FOUND" }, { status: 404 })
    if (newStatus !== "cancelled") return NextResponse.json({ error: "Patients may only cancel appointments.", code: "ACTION_NOT_PERMITTED" }, { status: 403 })
  }
  if (patient.role === "doctor") {
    const { data: doctorProvider } = await supabase.from("healthcare_providers")
      .select("id").eq("user_id", user.id).eq("is_verified", true).single()
    if (!doctorProvider || existingAppt.provider_id !== doctorProvider.id) return NextResponse.json({ error: "Appointment not found", code: "NOT_FOUND" }, { status: 404 })
  }
  const { data: appointment, error } = await supabase.from("appointments")
    .update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "scheduled").select().single()
  if (error || !appointment) return NextResponse.json({ error: "Appointment changed or could not be updated", code: error?.code === "PGRST116" ? "APPOINTMENT_TERMINAL" : "UPDATE_ERROR" }, { status: error?.code === "PGRST116" ? 409 : 500 })
  try {
    await getAdminClient().from("notifications").insert([{ recipient_id: existingAppt.patient_id, recipient_type: "individual", title: `Appointment ${newStatus}`, message: `Your appointment status has been updated to ${newStatus}.`, type: newStatus === "cancelled" ? "warning" : "info" }])
  } catch (error) {
    console.warn("[appointments:PATCH] Notification insert skipped:", error)
  }
  return NextResponse.json({ appointment }, { headers: { "Cache-Control": "private, no-store" } })
}
