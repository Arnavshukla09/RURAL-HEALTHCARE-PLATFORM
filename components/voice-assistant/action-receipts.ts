import { z } from "zod"
import { assistantAction, type PreparedAction } from "@/lib/assistant/client-actions"
import { validateBookedAppointmentReceipt } from "@/components/consultation-portal/booking-client"

const uuid = z.string().uuid()
const mode = z.enum(["video", "audio", "chat"])
const bookingDraft = z.object({ providerId: uuid, providerName: z.string().min(1), appointmentDate: z.string().datetime(), consultationType: mode, notes: z.string().max(500).optional() })
const cancellationDraft = z.object({ appointmentId: uuid, providerId: uuid, appointmentDate: z.string().datetime(), providerName: z.string() })
const bookingConfirmation = z.object({ action: z.literal("appointments.book"), userId: uuid, operationId: uuid, draft: bookingDraft })
const cancellationConfirmation = z.object({ action: z.literal("appointments.cancel"), userId: uuid, draft: cancellationDraft })
const cancellationReceipt = z.object({ appointment: z.object({ id: uuid, provider_id: uuid, appointment_date: z.string().datetime({ offset: true }), status: z.literal("cancelled") }), error: z.unknown().optional() })

/** Read expected IDs only; signature/expiration authorization remains on the server. */
function confirmationContents(prepared: PreparedAction): unknown {
  const parts = prepared.confirmationToken?.split(".")
  if (!parts || parts.length !== 2 || prepared.confirmationToken.length > 5000) throw new Error("Invalid action confirmation")
  try {
    const encoded = parts[0].replace(/-/g, "+").replace(/_/g, "/")
    const bytes = Uint8Array.from(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")), (character) => character.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch { throw new Error("Invalid action confirmation") }
}
export interface ExpectedVoiceBooking { userId: string; providerId: string; appointmentDate: string; consultationType: "video" | "audio" | "chat" }

export async function performConfirmedVoiceBooking(prepared: PreparedAction, expected: ExpectedVoiceBooking) {
  const draft = bookingDraft.safeParse(prepared.draft)
  const confirmation = bookingConfirmation.safeParse(confirmationContents(prepared))
  if (!draft.success || !confirmation.success || confirmation.data.userId !== expected.userId || draft.data.providerId !== expected.providerId || draft.data.appointmentDate !== expected.appointmentDate || draft.data.consultationType !== expected.consultationType || confirmation.data.draft.providerId !== draft.data.providerId || confirmation.data.draft.appointmentDate !== draft.data.appointmentDate || confirmation.data.draft.consultationType !== draft.data.consultationType) throw new Error("Confirmation does not match the selected appointment")
  const body = await assistantAction<unknown>("appointments.book", { confirmationToken: prepared.confirmationToken, confirmed: true })
  return validateBookedAppointmentReceipt(body, { provider_id: draft.data.providerId, appointment_date: draft.data.appointmentDate, consultation_type: draft.data.consultationType, notes: draft.data.notes }, confirmation.data.operationId)
}

export async function performConfirmedVoiceCancellation(prepared: PreparedAction, userId: string) {
  const draft = cancellationDraft.safeParse(prepared.draft)
  const confirmation = cancellationConfirmation.safeParse(confirmationContents(prepared))
  if (!draft.success || !confirmation.success || confirmation.data.userId !== userId || confirmation.data.draft.appointmentId !== draft.data.appointmentId || confirmation.data.draft.providerId !== draft.data.providerId || confirmation.data.draft.appointmentDate !== draft.data.appointmentDate) throw new Error("Confirmation does not match the selected cancellation")
  const response = await assistantAction<unknown>("appointments.cancel", { confirmationToken: prepared.confirmationToken, confirmed: true })
  const receipt = cancellationReceipt.safeParse(response)
  if (!receipt.success || receipt.data.error || receipt.data.appointment.id !== draft.data.appointmentId || receipt.data.appointment.provider_id !== draft.data.providerId || new Date(receipt.data.appointment.appointment_date).toISOString() !== draft.data.appointmentDate) throw new Error("The server did not acknowledge this cancellation")
  return receipt.data.appointment
}
