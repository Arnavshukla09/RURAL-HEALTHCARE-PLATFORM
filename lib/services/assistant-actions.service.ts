import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getPatientProfile } from "@/lib/auth/guard"
import { getAdminClient } from "@/lib/supabase/admin"
import { handleCreateAppointment, handleGetAppointments, handlePatchAppointment } from "./appointments.service"

const uuid = z.string().uuid()
const mode = z.enum(["video", "audio", "chat"])
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const time = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value
}, "Invalid calendar date")
const BookingDraft = z.object({
  providerId: uuid, providerName: z.string().min(1).max(200),
  appointmentDate: z.string().datetime(), consultationType: mode,
  notes: z.string().max(500).default(""),
}).strict()
const CancellationDraft = z.object({
  appointmentId: uuid, providerId: uuid, providerName: z.string().max(200), appointmentDate: z.string().datetime(),
}).strict()
const ConfirmationPayload = z.discriminatedUnion("action", [
  z.object({ action: z.literal("appointments.book"), userId: uuid, operationId: uuid, expiresAt: z.number().int(), draft: BookingDraft }).strict(),
  z.object({ action: z.literal("appointments.cancel"), userId: uuid, expiresAt: z.number().int(), draft: CancellationDraft }).strict(),
])
const Confirm = { confirmationToken: z.string().min(20).max(5000), confirmed: z.literal(true) }
const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("providers.list"), specialization: z.string().max(100).optional() }).strict(),
  z.object({ action: z.literal("appointments.slots"), providerId: uuid, date }).strict(),
  z.object({ action: z.literal("appointments.prepare"), providerId: uuid, appointmentDate: z.string().datetime({ offset: true }), consultationType: mode.default("video"), notes: z.string().max(500).default("") }).strict(),
  z.object({ action: z.literal("appointments.book"), ...Confirm }).strict(),
  z.object({ action: z.literal("appointments.list"), limit: z.number().int().min(1).max(100).optional(), cursor: z.string().max(1000).optional() }).strict(),
  z.object({ action: z.literal("appointments.cancel.prepare"), appointmentId: uuid }).strict(),
  z.object({ action: z.literal("appointments.cancel"), ...Confirm }).strict(),
])

class ActionError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}
function confirmationKey() {
  const secret = process.env.ASSISTANT_CONFIRMATION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new ActionError(503, "CONFIRMATION_UNAVAILABLE", "Appointment confirmation is not configured")
  return createHash("sha256").update(`rural-health-assistant-confirmation-v1:${secret}`).digest()
}
function prepareConfirmation(payload: z.infer<typeof ConfirmationPayload>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = createHmac("sha256", confirmationKey()).update(encoded).digest("base64url")
  return { draft: payload.draft, confirmationToken: `${encoded}.${signature}`, expiresAt: new Date(payload.expiresAt).toISOString() }
}
function verifyConfirmation(token: string, userId: string, action: "appointments.book" | "appointments.cancel") {
  const parts = token.split(".")
  if (parts.length !== 2) throw new ActionError(403, "INVALID_CONFIRMATION", "Please review and confirm the action again")
  const expected = createHmac("sha256", confirmationKey()).update(parts[0]).digest()
  const actual = Buffer.from(parts[1], "base64url")
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new ActionError(403, "INVALID_CONFIRMATION", "Confirmation could not be verified")
  let raw: unknown
  try { raw = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) } catch {
    throw new ActionError(403, "INVALID_CONFIRMATION", "Confirmation could not be verified")
  }
  const parsed = ConfirmationPayload.safeParse(raw)
  if (!parsed.success || parsed.data.userId !== userId || parsed.data.action !== action) throw new ActionError(403, "INVALID_CONFIRMATION", "Confirmation does not match this user and action")
  if (parsed.data.expiresAt <= Date.now()) throw new ActionError(409, "CONFIRMATION_EXPIRED", "Please review and confirm the action again")
  return parsed.data
}

async function verifiedProvider(supabase: any, providerId: string) {
  const { data: provider, error } = await supabase.from("healthcare_providers")
    .select("id, name, specialization, location").eq("id", providerId).eq("is_verified", true).maybeSingle()
  if (error) throw new ActionError(500, "DB_ERROR", "Unable to retrieve the selected provider")
  if (!provider) throw new ActionError(404, "PROVIDER_UNAVAILABLE", "The selected verified provider is unavailable")
  return provider
}
function slotDate(appointmentDate: string) {
  const ms = Date.parse(appointmentDate)
  const local = new Date(ms + 330 * 60000)
  if (!Number.isFinite(ms) || ms <= Date.now() || local.getUTCHours() < 9 || local.getUTCHours() >= 17 || ![0, 30].includes(local.getUTCMinutes()) || local.getUTCSeconds() !== 0 || local.getUTCMilliseconds() !== 0) {
    throw new ActionError(400, "INVALID_APPOINTMENT_TIME", "Choose a future half-hour slot between 09:00 and 17:00 India time")
  }
  return local.toISOString().slice(0, 10)
}
async function listSlots(supabase: any, providerId: string, day: string) {
  const provider = await verifiedProvider(supabase, providerId)
  const start = new Date(`${day}T00:00:00+05:30`).getTime()
  const end = start + 24 * 60 * 60000
  // Scoped service-role read exposes only time/duration, never patient identity or notes.
  const { data: occupied, error } = await getAdminClient().from("appointments")
    .select("appointment_date, duration_minutes").eq("provider_id", providerId).eq("status", "scheduled")
    .gte("appointment_date", new Date(start).toISOString()).lt("appointment_date", new Date(end).toISOString()).limit(500)
  if (error || occupied?.length >= 500) throw new ActionError(503, "AVAILABILITY_UNAVAILABLE", "Unable to check appointment availability")
  const slots = Array.from({ length: 16 }, (_, index) => {
    const time = start + (9 * 60 + index * 30) * 60000
    const available = time > Date.now() && !(occupied ?? []).some((booking: any) => {
      const from = Date.parse(booking.appointment_date)
      const duration = Number(booking.duration_minutes) || 30
      return time < from + duration * 60000 && time + 30 * 60000 > from
    })
    return { appointmentDate: new Date(time).toISOString(), available }
  }).filter((slot) => Date.parse(slot.appointmentDate) > Date.now())
  return { slots, provider, date: day }
}

/** Typed app actions; model-provided roles, SQL, URLs and arbitrary fields are rejected. */
export async function executeAssistantAction(supabase: any, user: any, raw: unknown) {
  try {
    const parsed = ActionSchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: "Invalid assistant action", code: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 })
    const action = parsed.data
    if (action.action === "providers.list") {
      let query = supabase.from("healthcare_providers").select("id, name, specialization, location").eq("is_verified", true).order("name").limit(30)
      if (action.specialization) query = query.eq("specialization", action.specialization)
      const { data: providers, error } = await query
      if (error) throw new ActionError(500, "DB_ERROR", "Unable to retrieve providers")
      return NextResponse.json({ providers: providers ?? [] })
    }
    if (action.action === "appointments.slots") return NextResponse.json(await listSlots(supabase, action.providerId, action.date))
    if (action.action === "appointments.list") {
      const params = new URLSearchParams({ limit: String(action.limit ?? 20) })
      if (action.cursor) params.set("cursor", action.cursor)
      return handleGetAppointments(supabase, user, params)
    }
    const patient = await getPatientProfile(user.id)
    if (!patient) throw new ActionError(404, "PROFILE_REQUIRED", "Patient profile required")
    if (action.action === "appointments.prepare") {
      const canonicalDate = new Date(action.appointmentDate).toISOString()
      const day = slotDate(canonicalDate)
      const { slots, provider } = await listSlots(supabase, action.providerId, day)
      if (!slots.some((slot) => slot.appointmentDate === canonicalDate && slot.available)) throw new ActionError(409, "SLOT_TAKEN", "This appointment slot is unavailable")
      return NextResponse.json(prepareConfirmation({ action: "appointments.book", userId: user.id, operationId: crypto.randomUUID(), expiresAt: Date.now() + 5 * 60000, draft: { providerId: provider.id, providerName: provider.name, appointmentDate: canonicalDate, consultationType: action.consultationType, notes: action.notes } }))
    }
    if (action.action === "appointments.book") {
      const confirmed = verifyConfirmation(action.confirmationToken, user.id, "appointments.book")
      if (confirmed.action !== "appointments.book") throw new ActionError(403, "INVALID_CONFIRMATION", "Invalid action confirmation")
      const { data: prior, error: priorError } = await supabase.from("appointments").select("*").eq("id", confirmed.operationId).eq("patient_id", patient.id).maybeSingle()
      if (priorError) throw new ActionError(500, "DB_ERROR", "Unable to check the prior action result")
      if (prior) {
        if (prior.status !== "scheduled") throw new ActionError(409, "CONFIRMATION_ALREADY_USED", "This confirmation already created an appointment; review a new request to book again")
        return NextResponse.json({ appointment: prior, duplicate: true })
      }
      slotDate(confirmed.draft.appointmentDate)
      const current = await listSlots(supabase, confirmed.draft.providerId, slotDate(confirmed.draft.appointmentDate))
      if (!current.slots.some((slot) => slot.appointmentDate === confirmed.draft.appointmentDate && slot.available)) throw new ActionError(409, "SLOT_TAKEN", "This appointment slot is unavailable")
      return handleCreateAppointment(supabase, user, { provider_id: confirmed.draft.providerId, appointment_date: confirmed.draft.appointmentDate, consultation_type: confirmed.draft.consultationType, notes: confirmed.draft.notes }, { entityId: confirmed.operationId })
    }
    if (action.action === "appointments.cancel.prepare") {
      const { data: appointment, error } = await supabase.from("appointments")
        .select("id, patient_id, provider_id, appointment_date, status").eq("id", action.appointmentId).eq("patient_id", patient.id).single()
      if (error || !appointment) throw new ActionError(404, "NOT_FOUND", "Appointment not found")
      if (appointment.status !== "scheduled") throw new ActionError(409, "APPOINTMENT_TERMINAL", "This appointment can no longer be cancelled")
      const { data: provider } = await supabase.from("healthcare_providers").select("name").eq("id", appointment.provider_id).maybeSingle()
      return NextResponse.json(prepareConfirmation({ action: "appointments.cancel", userId: user.id, expiresAt: Date.now() + 5 * 60000, draft: { appointmentId: appointment.id, providerId: appointment.provider_id, providerName: provider?.name || "Healthcare provider", appointmentDate: new Date(appointment.appointment_date).toISOString() } }))
    }
    const confirmed = verifyConfirmation(action.confirmationToken, user.id, "appointments.cancel")
    if (confirmed.action !== "appointments.cancel") throw new ActionError(403, "INVALID_CONFIRMATION", "Invalid action confirmation")
    // Ownership is rechecked at execution, including for doctor/admin sessions.
    const { data: owned } = await supabase.from("appointments").select("*").eq("id", confirmed.draft.appointmentId).eq("patient_id", patient.id).maybeSingle()
    if (!owned) throw new ActionError(404, "NOT_FOUND", "Appointment not found")
    if (owned.status === "cancelled") return NextResponse.json({ appointment: owned, duplicate: true })
    return handlePatchAppointment(supabase, user, { id: confirmed.draft.appointmentId, status: "cancelled" })
  } catch (error) {
    if (error instanceof ActionError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    throw error
  }
}
