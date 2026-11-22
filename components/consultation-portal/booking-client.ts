import { z } from "zod"

const BookingInput = z.object({
  provider_id: z.string().uuid(), appointment_date: z.string().datetime(),
  consultation_type: z.enum(["video", "audio", "chat"]), notes: z.string().max(500).optional(),
})
const AcknowledgedAppointment = z.object({
  id: z.string().uuid(), provider_id: z.string().uuid(), appointment_date: z.string().datetime({ offset: true }),
  consultation_type: z.enum(["video", "audio", "chat"]), status: z.literal("scheduled"),
  teleconsult_room_id: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
})

export function validateBookedAppointmentReceipt(body: unknown, input: z.infer<typeof BookingInput>, expectedId?: string) {
  const envelope = z.object({ appointment: AcknowledgedAppointment, error: z.unknown().optional() }).safeParse(body)
  const validated = BookingInput.safeParse(input)
  if (!envelope.success || !validated.success || envelope.data.error) throw new Error("The server did not acknowledge the selected appointment. Check My Appointments before retrying.")
  const appointment = envelope.data.appointment
  if (appointment.provider_id !== validated.data.provider_id || new Date(appointment.appointment_date).toISOString() !== validated.data.appointment_date || appointment.consultation_type !== validated.data.consultation_type || (expectedId && appointment.id !== expectedId)) {
    throw new Error("The server did not acknowledge the selected appointment. Check My Appointments before retrying.")
  }
  return appointment
}

/** No optimistic confirmation: consume only a matching server acknowledgment. */
export async function bookVerifiedConsultation(input: z.infer<typeof BookingInput>) {
  const validated = BookingInput.safeParse(input)
  if (!validated.success) throw new Error("Select a registered provider, valid time and notes under 500 characters")
  const response = await fetch("/api/appointments", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validated.data),
    signal: AbortSignal.timeout(15000),
  })
  const body = await response.json().catch(() => ({}))
  if (![200, 201].includes(response.status) || body.error) throw new Error(typeof body.error === "string" ? body.error : "The appointment was not confirmed. Check My Appointments before retrying.")
  return validateBookedAppointmentReceipt(body, validated.data)
}

export function consultationJoinPath(appointmentId: string, language: string) {
  return `/teleconsult/room?appointmentId=${encodeURIComponent(appointmentId)}&lang=${encodeURIComponent(language)}`
}
