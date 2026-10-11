import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, getPatientProfile, authErrorResponse } from "@/lib/auth/guard"

// ── Strict Column Whitelists Per Table (Audit C4, §2.4) ──────────────────────
// No .passthrough(), no z.any() — prevents arbitrary column poisoning

const AppointmentDataSchema = z
  .object({
    provider_id: z.string().uuid(),
    appointment_date: z.string().min(10),
    duration_minutes: z.number().int().min(5).max(180).optional(),
    notes: z.string().max(1000).optional(),
    consultation_type: z.enum(["video", "audio", "chat"]).optional(),
    teleconsult_room_id: z.string().uuid().optional(),
    status: z.enum(["scheduled", "cancelled", "completed"]).optional(),
  })
  .strict()

const MedicalRecordDataSchema = z
  .object({
    record_type: z.enum(["prescription", "lab_result", "diagnosis", "vaccination", "other"]),
    content: z.string().min(1).max(5000),
    file_url: z.string().url().max(1000).optional(),
    provider_id: z.string().uuid().optional(),
  })
  .strict()

const HealthDataSchema = z
  .object({
    blood_pressure: z.string().max(20).optional(),
    temperature: z.number().min(80).max(115).optional(),
    pulse_rate: z.number().int().min(30).max(250).optional(),
    blood_sugar: z.number().min(20).max(800).optional(),
    spo2: z.number().min(40).max(100).optional(),
    weight: z.number().min(1).max(300).optional(),
    recorded_at: z.string().optional(),
  })
  .strict()

const NotificationDataSchema = z
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

const OperationSchema = z.object({
  client_op_id: z.string().uuid(),
  table: z.enum(["appointments", "health_data", "medical_records", "notifications"]),
  type: z.enum(["INSERT", "UPDATE", "DELETE"]),
  id: z.string().uuid().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
})

const SyncBatchSchema = z.object({
  operations: z.array(OperationSchema).min(1).max(50),
})

export type SyncResult = {
  client_op_id: string
  status: "ok" | "duplicate" | "rejected"
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    // Auth guard: User-scoped client ensures RLS applies
    const { user, supabase } = await requireUser()
    const patient = await getPatientProfile(user.id)
    if (!patient) {
      return NextResponse.json({ error: "Patient profile required for offline sync", code: "PROFILE_REQUIRED" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = SyncBatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    const { operations } = parsed.data
    const results: SyncResult[] = []

    // 1. Fetch existing processed operations for idempotency check (C4, 09_scale §5)
    const clientOpIds = operations.map((op) => op.client_op_id)
    const { data: alreadyProcessed } = await supabase
      .from("processed_client_ops")
      .select("client_op_id")
      .eq("user_id", user.id)
      .in("client_op_id", clientOpIds)

    const processedSet = new Set((alreadyProcessed ?? []).map((row: any) => row.client_op_id))

    // 2. Process each operation with column whitelists & forced session scope
    const opsToRecordInIdempotency: { user_id: string; client_op_id: string; table_name: string }[] = []

    for (const op of operations) {
      // Idempotency: duplicate operations skip execution cleanly
      if (processedSet.has(op.client_op_id)) {
        results.push({ client_op_id: op.client_op_id, status: "duplicate" })
        continue
      }

      try {
        if (op.type === "INSERT") {
          let sanitizedPayload: Record<string, any>

          if (op.table === "appointments") {
            const val = AppointmentDataSchema.safeParse(op.data)
            if (!val.success) throw new Error(`Schema error: ${JSON.stringify(val.error.flatten().fieldErrors)}`)
            sanitizedPayload = {
              ...val.data,
              patient_id: patient.id, // Force session patient_id
              status: "scheduled",
            }
          } else if (op.table === "medical_records") {
            const val = MedicalRecordDataSchema.safeParse(op.data)
            if (!val.success) throw new Error(`Schema error: ${JSON.stringify(val.error.flatten().fieldErrors)}`)
            sanitizedPayload = {
              ...val.data,
              patient_id: patient.id, // Force session patient_id
            }
          } else if (op.table === "health_data") {
            const val = HealthDataSchema.safeParse(op.data)
            if (!val.success) throw new Error(`Schema error: ${JSON.stringify(val.error.flatten().fieldErrors)}`)
            sanitizedPayload = {
              ...val.data,
              patient_id: patient.id, // Force session patient_id
            }
          } else if (op.table === "notifications") {
            const val = NotificationDataSchema.safeParse(op.data)
            if (!val.success) throw new Error(`Schema error: ${JSON.stringify(val.error.flatten().fieldErrors)}`)
            sanitizedPayload = {
              ...val.data,
              recipient_id: patient.id,
              recipient_type: "individual",
            }
          } else {
            throw new Error(`Unsupported table: ${op.table}`)
          }

          const { error: insertError } = await supabase.from(op.table).insert([sanitizedPayload])
          if (insertError) throw new Error(insertError.message)

          results.push({ client_op_id: op.client_op_id, status: "ok" })
          opsToRecordInIdempotency.push({ user_id: user.id, client_op_id: op.client_op_id, table_name: op.table })
        } else if (op.type === "UPDATE") {
          if (!op.id) throw new Error("Update requires operation 'id'")

          let sanitizedPayload: Record<string, any>
          if (op.table === "appointments") {
            const val = z.object({ status: z.enum(["scheduled", "cancelled", "completed"]).optional(), notes: z.string().max(1000).optional() }).strict().safeParse(op.data)
            if (!val.success) throw new Error("Invalid update data")
            sanitizedPayload = val.data
          } else if (op.table === "notifications") {
            const val = z.object({ is_read: z.boolean() }).strict().safeParse(op.data)
            if (!val.success) throw new Error("Invalid update data")
            sanitizedPayload = val.data
          } else {
            throw new Error(`UPDATE not permitted offline for table ${op.table}`)
          }

          const { error: updateError } = await supabase.from(op.table).update(sanitizedPayload).eq("id", op.id)
          if (updateError) throw new Error(updateError.message)

          results.push({ client_op_id: op.client_op_id, status: "ok" })
          opsToRecordInIdempotency.push({ user_id: user.id, client_op_id: op.client_op_id, table_name: op.table })
        } else if (op.type === "DELETE") {
          if (!op.id) throw new Error("Delete requires operation 'id'")
          const { error: delError } = await supabase.from(op.table).delete().eq("id", op.id)
          if (delError) throw new Error(delError.message)

          results.push({ client_op_id: op.client_op_id, status: "ok" })
          opsToRecordInIdempotency.push({ user_id: user.id, client_op_id: op.client_op_id, table_name: op.table })
        }
      } catch (opErr: any) {
        results.push({
          client_op_id: op.client_op_id,
          status: "rejected",
          error: opErr.message || "Operation failed",
        })
      }
    }

    // 3. Record newly processed operations in idempotency table
    if (opsToRecordInIdempotency.length > 0) {
      try {
        await supabase.from("processed_client_ops").insert(opsToRecordInIdempotency)
      } catch (idemErr) {
        console.warn("[offline-sync] Idempotency record insert skipped:", idemErr)
      }
    }

    // 4. Best-effort audit logging into offline_sync_log
    try {
      const auditEntries = operations.map((op) => ({
        user_id: user.id,
        table_name: op.table,
        operation: op.type,
        data: op.data ?? {},
      }))
      await supabase.from("offline_sync_log").insert(auditEntries)
    } catch (auditErr) {
      console.warn("[offline-sync] Audit log insert skipped:", auditErr)
    }

    return NextResponse.json({ results }, { status: 200 })
  } catch (error) {
    return authErrorResponse(error)
  }
}