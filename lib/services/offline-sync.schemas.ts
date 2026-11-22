import { z } from "zod"

export const AppointmentDataSchema = z
  .object({
    provider_id: z.string().uuid(),
    appointment_date: z.string().min(10),
    duration_minutes: z.number().int().min(5).max(180).optional(),
    notes: z.string().max(1000).optional(),
    consultation_type: z.enum(["video", "audio", "chat"]).optional(),
    teleconsult_room_id: z.string().max(255).optional(),
    status: z.enum(["scheduled", "cancelled", "completed"]).optional(),
  })
  .strict()

export const MedicalRecordDataSchema = z
  .object({
    record_type: z.enum(["prescription", "lab_result", "diagnosis", "vaccination", "other"]),
    content: z.string().min(1).max(5000),
    file_url: z.string().url().max(1000).optional(),
    provider_id: z.string().uuid().optional(),
  })
  .strict()

export const HealthDataSchema = z
  .object({
    data_type: z.string().min(1).optional(),
    value: z.number().optional(),
    unit: z.string().max(50).optional(),
    notes: z.string().max(500).optional(),
    blood_pressure: z.string().max(20).optional(),
    temperature: z.number().min(80).max(115).optional(),
    pulse_rate: z.number().int().min(30).max(250).optional(),
    blood_sugar: z.number().min(20).max(800).optional(),
    spo2: z.number().min(40).max(100).optional(),
    weight: z.number().min(1).max(300).optional(),
    recorded_at: z.string().optional(),
  })
  .strict()

export const NotificationDataSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    message: z.string().min(1).max(1000).optional(),
    type: z.enum(["info", "warning", "success", "emergency"]).optional(),
    recipient_type: z.enum(["all", "role", "individual"]).optional(),
    recipient_role: z.enum(["patient", "doctor", "admin"]).optional(),
    recipient_id: z.string().uuid().optional(),
    is_read: z.boolean().optional(),
  })
  .strict()

export const ClinicalEncounterDataSchema = z
  .object({
    id: z.string().uuid().optional(),
    provider_id: z.string().uuid().optional(),
    encounter_type: z.enum(["screening", "triage", "teleconsult", "followup"]).optional(),
    status: z.enum(["draft", "queued", "in_progress", "completed", "cancelled"]).optional(),
    chief_complaint: z.string().max(1000).optional(),
    clinical_notes: z.string().max(5000).optional(),
    media_urls: z.array(z.string().max(2000)).max(10).optional(),
    audio_note_url: z.string().max(1000).optional(),
  })
  .strict()

export const ClinicalObservationDataSchema = z
  .object({
    id: z.string().uuid().optional(),
    encounter_id: z.string().uuid(),
    code: z.string().min(1).max(50),
    code_system: z.string().max(50).optional(),
    display: z.string().min(1).max(200),
    value_numeric: z.number().optional(),
    value_text: z.string().max(1000).optional(),
    unit: z.string().max(50).optional(),
    interpretation: z.enum(["normal", "low", "high", "critical"]).optional(),
  })
  .strict()

export const OperationSchema = z.object({
  client_op_id: z.string().uuid(),
  table: z.enum([
    "appointments",
    "health_data",
    "medical_records",
    "notifications",
    "clinical_encounters",
    "clinical_observations",
  ]),
  type: z.enum(["INSERT", "UPDATE", "DELETE"]),
  id: z.string().uuid().optional(),
  entity_id: z.string().uuid().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
})

export const SyncBatchSchema = z.object({
  operations: z.array(OperationSchema).min(1).max(50),
  owner_user_id: z.string().uuid().optional(),
})

export type SyncResult = {
  client_op_id: string
  status: "ok" | "duplicate" | "rejected"
  error?: string
}
