import { NextResponse } from "next/server"
import { z } from "zod"
import { getPatientProfile } from "@/lib/auth/guard"
import {
  AppointmentDataSchema, MedicalRecordDataSchema, HealthDataSchema,
  ClinicalEncounterDataSchema, ClinicalObservationDataSchema, SyncBatchSchema,
  type SyncResult,
} from "./offline-sync.schemas"
export * from "./offline-sync.schemas"

function sanitizeOperation(op: z.infer<typeof SyncBatchSchema>["operations"][number], patient: { id: string; role: string }) {
  const preassignedId = op.entity_id || op.id
  let data: Record<string, unknown>
  if (op.type === "INSERT") {
    const schema = {
      appointments: AppointmentDataSchema, medical_records: MedicalRecordDataSchema,
      health_data: HealthDataSchema, clinical_encounters: ClinicalEncounterDataSchema,
      clinical_observations: ClinicalObservationDataSchema,
    }[op.table as Exclude<typeof op.table, "notifications">]
    if (!schema) throw new Error("INSERT not permitted offline for notifications")
    const checked = schema.safeParse(op.data)
    if (!checked.success) throw new Error("Schema error: " + JSON.stringify(checked.error.flatten().fieldErrors))
    data = { ...checked.data, patient_id: patient.id }
    const dataId = (data as any).id
    data.id = preassignedId || dataId || op.client_op_id
    if (op.table === "appointments") data.status = "scheduled"
    if (op.table === "clinical_encounters") {
      data.encounter_type ||= "triage"
      data.status ||= "queued"
    }
  } else if (op.type === "UPDATE") {
    if (!op.id) throw new Error("Update requires operation 'id'")
    if (op.table === "appointments") {
      const checked = z.object({ status: z.enum(["scheduled", "cancelled", "completed"]).optional(), notes: z.string().max(1000).optional() }).strict().safeParse(op.data)
      if (!checked.success) throw new Error("Invalid update data")
      if (checked.data.status === "completed" && patient.role !== "doctor" && patient.role !== "admin") throw new Error("Patients are not authorized to mark appointments as completed")
      if (patient.role === "patient" && checked.data.status === "scheduled") throw new Error("Patients may only cancel appointments or update notes")
      data = checked.data
    } else if (op.table === "notifications") {
      const checked = z.object({ is_read: z.boolean() }).strict().safeParse(op.data)
      if (!checked.success) throw new Error("Invalid update data")
      data = checked.data
    } else throw new Error("UPDATE not permitted offline for table " + op.table)
  } else {
    if (!op.id) throw new Error("Delete requires operation 'id'")
    if (op.table !== "health_data") throw new Error("DELETE not permitted offline for table " + op.table)
    data = {}
  }
  return { data, entityId: String(data.id || op.id || preassignedId || op.client_op_id) }
}

/** Each authorized mutation and its replay ledger commit together inside the database RPC. */
export async function processOfflineSyncBatch(supabase: any, user: any, body: any) {
  const patient = await getPatientProfile(user.id)
  if (!patient) return NextResponse.json({ error: "Patient profile required for offline sync", code: "PROFILE_REQUIRED" }, { status: 403 })
  const parsed = SyncBatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" }, { status: 400 })
  if (parsed.data.owner_user_id && parsed.data.owner_user_id !== user.id) return NextResponse.json({ error: "Offline requests belong to another account", code: "OWNER_MISMATCH" }, { status: 403 })
  if (typeof supabase.rpc !== "function") return NextResponse.json({ error: "Atomic offline synchronization migration is required", code: "MIGRATION_REQUIRED" }, { status: 503 })

  const results: SyncResult[] = []
  const seen = new Map<string, { fingerprint: string; result: SyncResult }>()
  for (const op of parsed.data.operations) {
    const fingerprint = JSON.stringify({ table: op.table, type: op.type, id: op.id, entity_id: op.entity_id, data: op.data })
    const existing = seen.get(op.client_op_id)
    if (existing) {
      results.push(existing.fingerprint === fingerprint && existing.result.status !== "rejected"
        ? { client_op_id: op.client_op_id, status: "duplicate" }
        : { client_op_id: op.client_op_id, status: "rejected", error: "Operation ID reused for a different or rejected request" })
      continue
    }
    let result: SyncResult
    try {
      const { data: payload, entityId } = sanitizeOperation(op, patient)
      const { data, error } = await supabase.rpc("apply_offline_operation", {
        p_client_op_id: op.client_op_id, p_table: op.table, p_operation: op.type,
        p_entity_id: entityId, p_payload: payload,
      })
      if (error) {
        if (error.code === "PGRST202" || error.code === "42883") return NextResponse.json({ error: "Apply the atomic offline synchronization migration before replay", code: "MIGRATION_REQUIRED" }, { status: 503 })
        throw new Error(error.message || "Atomic synchronization failed")
      }
      if (!data || !["ok", "duplicate"].includes(data.status)) throw new Error("Database did not acknowledge the atomic operation")
      result = { client_op_id: op.client_op_id, status: data.status }
    } catch (error) {
      result = { client_op_id: op.client_op_id, status: "rejected", error: error instanceof Error ? error.message : "Operation failed" }
    }
    results.push(result)
    seen.set(op.client_op_id, { fingerprint, result })
  }
  return NextResponse.json({ results, owner_user_id: user.id }, { status: 200 })
}
