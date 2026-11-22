import { NextResponse } from "next/server"
import { z } from "zod"

export const ClinicalMetadataSchema = z.object({
  diagnosis: z.string().max(1000).optional(), medicines: z.string().max(4000).optional(),
  instructions: z.string().max(2000).optional(), follow_up: z.string().max(500).optional(),
  doctor_name: z.string().max(200).optional(), doctor_registration_number: z.string().max(100).optional(),
  facility_name: z.string().max(200).optional(), patient_name: z.string().max(200).optional(),
  medications: z.array(z.object({ medicineName: z.string().min(1).max(200), dosage: z.string().min(1).max(100), frequency: z.string().min(1).max(100), duration: z.string().min(1).max(100), route: z.string().max(50).optional() }).strict()).max(30).optional(),
}).strict()

/** Derive consultation ownership and authorship through the caller's RLS client. */
export async function bindAppointmentRecord(supabase: any, user: any, patient: { id: string; role: string }, input: any): Promise<Record<string, any> | NextResponse> {
  const { patient_id, provider_id, appointment_id, metadata = {}, ...record } = input
  if (!appointment_id) {
    if ((patient_id && patient_id !== patient.id) || provider_id) return NextResponse.json({ error: "A consultation appointment is required for clinician attribution", code: "APPOINTMENT_REQUIRED" }, { status: 400 })
    return { ...record, patient_id: patient.id, metadata: { diagnosis: metadata.diagnosis, medicines: metadata.medicines, instructions: metadata.instructions, follow_up: metadata.follow_up, source: "patient-provided", authored_by_user_id: user.id } }
  }
  const { data: appointment, error } = await supabase.from("appointments")
    .select("id, patient_id, provider_id, status").eq("id", appointment_id).single()
  if (error || !appointment) return NextResponse.json({ error: "Consultation appointment not found", code: "NOT_FOUND" }, { status: 404 })
  if (!["scheduled", "completed"].includes(appointment.status)) return NextResponse.json({ error: "This appointment cannot receive a clinical record", code: "APPOINTMENT_TERMINAL" }, { status: 409 })
  if ((patient_id && patient_id !== appointment.patient_id) || (provider_id && provider_id !== appointment.provider_id)) return NextResponse.json({ error: "Record identity does not match the consultation", code: "FORBIDDEN" }, { status: 403 })
  const { data: provider } = await supabase.from("healthcare_providers")
    .select("id, name, location, user_id, is_verified").eq("id", appointment.provider_id).single()
  const clinician = patient.role === "doctor" && provider?.is_verified === true && provider.user_id === user.id
  if (!clinician && appointment.patient_id !== patient.id) return NextResponse.json({ error: "This consultation is not under your care", code: "FORBIDDEN" }, { status: 403 })
  if (!clinician && record.record_type === "prescription") return NextResponse.json({ error: "Only the assigned clinician may author a consultation prescription", code: "ACTION_NOT_PERMITTED" }, { status: 403 })
  const { data: target } = await supabase.from("patients").select("first_name, last_name").eq("id", appointment.patient_id).single()
  return {
    ...record, patient_id: appointment.patient_id, provider_id: appointment.provider_id, appointment_id: appointment.id,
    metadata: {
      ...metadata, doctor_name: provider?.name || "", facility_name: provider?.location || "",
      doctor_registration_number: "", patient_name: `${target?.first_name || ""} ${target?.last_name || ""}`.trim(),
      source: clinician ? "clinician-authored" : "patient-provided", authored_by_user_id: user.id,
    },
  }
}
