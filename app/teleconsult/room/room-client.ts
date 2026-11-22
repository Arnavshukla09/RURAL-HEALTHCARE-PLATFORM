import { z } from "zod"
import type { RxData } from "./rx-modal"

const RoomSchema = z.object({
  appointmentId: z.string().uuid(), patientId: z.string().uuid(), providerId: z.string().uuid(),
  participantRole: z.enum(["patient", "doctor"]), participantName: z.string().min(1).max(200),
  doctorName: z.string().max(200), patientName: z.string().max(200), facilityName: z.string().max(200),
  roomId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/), domain: z.string().regex(/^[a-zA-Z0-9.-]+(?::\d{1,5})?$/),
  token: z.string().nullable(), requiresToken: z.boolean(),
})
export type AuthorizedRoom = z.infer<typeof RoomSchema>
export const EMPTY_RX: RxData = { doctorName: "", nmcRegNo: "", hospitalName: "", patientName: "", diagnosis: "", medicines: "", instructions: "", followUp: "" }

export async function loadAuthorizedRoom(appointmentId: string, signal?: AbortSignal): Promise<AuthorizedRoom> {
  if (!z.string().uuid().safeParse(appointmentId).success) throw new Error("Open a valid appointment link to join")
  const response = await fetch("/api/teleconsult/room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appointmentId }), signal })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || "This consultation could not be authorized")
  const parsed = RoomSchema.safeParse(body)
  if (!parsed.success || parsed.data.appointmentId !== appointmentId || (parsed.data.requiresToken && !parsed.data.token)) throw new Error("Room credentials could not be verified")
  return parsed.data
}

export function consultationRecordContent(room: AuthorizedRoom, rx: RxData) {
  const heading = room.participantRole === "doctor" ? "Clinician consultation record" : "Patient-provided consultation notes"
  return [heading, `Appointment: ${room.appointmentId}`, room.doctorName ? `Clinician: ${room.doctorName}` : "", room.facilityName ? `Facility: ${room.facilityName}` : "", room.patientName ? `Patient: ${room.patientName}` : "", rx.diagnosis ? `Assessment / notes: ${rx.diagnosis}` : "", rx.medicines ? `Medication notes: ${rx.medicines}` : "", rx.instructions ? `Instructions: ${rx.instructions}` : "", rx.followUp ? `Follow-up: ${rx.followUp}` : ""].filter(Boolean).join("\n\n")
}

export async function saveConsultationRecord(room: AuthorizedRoom, rx: RxData) {
  if (![rx.diagnosis, rx.medicines, rx.instructions].some((value) => value.trim())) throw new Error("Enter the consultation findings before saving")
  const recordType = room.participantRole === "doctor" ? "prescription" : "other"
  const response = await fetch("/api/medical-records", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      record_type: recordType, content: consultationRecordContent(room, rx),
      appointment_id: room.appointmentId, patient_id: room.patientId, provider_id: room.providerId,
      metadata: { diagnosis: rx.diagnosis, medicines: rx.medicines, instructions: rx.instructions, follow_up: rx.followUp },
    }), signal: AbortSignal.timeout(15000),
  })
  const body = await response.json().catch(() => ({}))
  if (response.status !== 201 || !z.string().uuid().safeParse(body.id).success || body.patient_id !== room.patientId || body.appointment_id !== room.appointmentId || body.provider_id !== room.providerId || body.record_type !== recordType) throw new Error(body.error || "The consultation record was not saved")
  return body
}

/** Create text nodes, never HTML from clinician/patient inputs. */
export function renderConsultationPrint(document: Document, room: AuthorizedRoom, rx: RxData) {
  document.title = "Consultation record"
  document.body.replaceChildren()
  document.body.style.cssText = "font-family:system-ui,sans-serif;padding:32px;max-width:760px;margin:auto;line-height:1.6;white-space:pre-wrap;color:#172b2b"
  const heading = document.createElement("h1")
  heading.textContent = room.participantRole === "doctor" ? "Consultation record" : "Patient consultation notes"
  const content = document.createElement("div")
  content.textContent = consultationRecordContent(room, rx)
  const footer = document.createElement("p")
  footer.textContent = "This document is not digitally signed. Review clinical details with the treating clinician."
  document.body.append(heading, content, footer)
}
