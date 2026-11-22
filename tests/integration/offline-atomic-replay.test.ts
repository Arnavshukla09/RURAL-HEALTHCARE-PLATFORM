import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { verifyIntegrationDatabaseTarget } from "./db-safety-guard"

const target = verifyIntegrationDatabaseTarget()
const local = target.isSafeToExecute && /^https?:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(target.targetUrl)
if (process.env.REQUIRE_DB === "1" && !local) throw new Error("Atomic replay tests require a disposable localhost Supabase stack")

describe.skipIf(!local)("Atomic offline replay against disposable local PostgreSQL", () => {
  let admin: SupabaseClient
  let patient: SupabaseClient
  let userId: string
  let patientId: string
  let providerId: string
  const op = (payload: Record<string, unknown>, clientOpId = crypto.randomUUID()) => {
    return { p_client_op_id: clientOpId, p_table: "medical_records", p_operation: "INSERT", p_entity_id: crypto.randomUUID(), p_payload: payload }
  }

  beforeAll(async () => {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!anonKey || !serviceKey) throw new Error("Local Supabase test keys are required")
    admin = createClient(target.targetUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const email = `atomic_${crypto.randomUUID()}@ruralhealth.test`
    const password = `Local!${crypto.randomUUID()}`
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Atomic Fixture" } })
    if (created.error || !created.data.user) throw new Error(created.error?.message || "Fixture user not created")
    userId = created.data.user.id
    const profile = await admin.from("patients").select("id").eq("user_id", userId).single()
    if (profile.error) throw new Error(profile.error.message)
    patientId = profile.data.id
    const provider = await admin.from("healthcare_providers").insert({ name: "Offline Booking Fixture", email, is_verified: true }).select("id").single()
    if (provider.error) throw new Error(provider.error.message)
    providerId = provider.data.id
    patient = createClient(target.targetUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const session = await patient.auth.signInWithPassword({ email, password })
    if (session.error) throw new Error(session.error.message)
  }, 30000)

  afterAll(async () => {
    if (!admin || !userId) return
    await admin.from("processed_client_ops").delete().eq("user_id", userId)
    await admin.auth.admin.deleteUser(userId)
    if (providerId) await admin.from("healthcare_providers").delete().eq("id", providerId)
  })

  it("commits one clinical row for concurrent duplicate requests", async () => {
    const params = op({ record_type: "other", content: "Concurrent fixture" })
    const responses = await Promise.all(Array.from({ length: 3 }, () => patient.rpc("apply_offline_operation", params)))
    for (const response of responses) expect(response.error).toBeNull()
    expect(responses.map(response => response.data.status).sort()).toEqual(["duplicate", "duplicate", "ok"])
    const records = await patient.from("medical_records").select("id").eq("id", params.p_entity_id)
    expect(records.data).toHaveLength(1)
    const ledger = await patient.from("processed_client_ops").select("client_op_id").eq("client_op_id", params.p_client_op_id)
    expect(ledger.data).toHaveLength(1)
  })

  it("rolls back the ledger when the clinical mutation fails, then permits a corrected retry", async () => {
    const params = op({ record_type: "other" }) // content NOT NULL forces a real PostgreSQL failure.
    expect((await patient.rpc("apply_offline_operation", params)).error).not.toBeNull()
    const ledger = await patient.from("processed_client_ops").select("client_op_id").eq("client_op_id", params.p_client_op_id)
    expect(ledger.data).toEqual([])
    const retry = await patient.rpc("apply_offline_operation", { ...params, p_payload: { record_type: "other", content: "Corrected fixture" } })
    expect(retry.error).toBeNull()
    expect(retry.data.status).toBe("ok")
  })

  it("forces authenticated ownership and rejects payload reuse under the same operation ID", async () => {
    const params = op({ record_type: "other", content: "Owned fixture", patient_id: crypto.randomUUID() })
    const first = await patient.rpc("apply_offline_operation", params)
    expect(first.error).toBeNull()
    const record = await patient.from("medical_records").select("patient_id").eq("id", params.p_entity_id).single()
    expect(record.data?.patient_id).toBe(patientId)
    const modified = await patient.rpc("apply_offline_operation", { ...params, p_payload: { ...params.p_payload, content: "Changed request" } })
    expect(modified.error).not.toBeNull()
  })

  it("rejects unallowlisted columns without leaving a ledger or record", async () => {
    const params = op({ record_type: "other", content: "Rejected fixture", role: "admin" })
    expect((await patient.rpc("apply_offline_operation", params)).error).not.toBeNull()
    const ledger = await patient.from("processed_client_ops").select("client_op_id").eq("client_op_id", params.p_client_op_id)
    expect(ledger.data).toEqual([])
    expect((await patient.from("medical_records").select("id").eq("id", params.p_entity_id)).data).toEqual([])
  })

  it("rejects an expired offline booking, rolls back its ledger, and accepts a future corrected request", async () => {
    const params = {
      p_client_op_id: crypto.randomUUID(), p_table: "appointments", p_operation: "INSERT", p_entity_id: crypto.randomUUID(),
      p_payload: { provider_id: providerId, appointment_date: new Date(Date.now() - 60000).toISOString(), status: "scheduled" },
    }
    const expired = await patient.rpc("apply_offline_operation", params)
    expect(expired.error?.message).toContain("expired")
    expect((await patient.from("processed_client_ops").select("client_op_id").eq("client_op_id", params.p_client_op_id)).data).toEqual([])
    expect((await patient.from("appointments").select("id").eq("id", params.p_entity_id)).data).toEqual([])
    const future = await patient.rpc("apply_offline_operation", { ...params, p_payload: { ...params.p_payload, appointment_date: new Date(Date.now() + 86400000).toISOString() } })
    expect(future.error).toBeNull()
    expect(future.data.status).toBe("ok")
    expect((await patient.from("appointments").select("id").eq("id", params.p_entity_id)).data).toHaveLength(1)
  })

  it("acknowledges an already committed duplicate after its appointment time passes", async () => {
    const appointmentTime = Date.now() + 3000
    const params = {
      p_client_op_id: crypto.randomUUID(), p_table: "appointments", p_operation: "INSERT", p_entity_id: crypto.randomUUID(),
      p_payload: { provider_id: providerId, appointment_date: new Date(appointmentTime).toISOString(), status: "scheduled" },
    }
    const first = await patient.rpc("apply_offline_operation", params)
    expect(first.error).toBeNull()
    expect(first.data.status).toBe("ok")
    await new Promise(resolve => setTimeout(resolve, Math.max(0, appointmentTime + 100 - Date.now())))
    const replay = await patient.rpc("apply_offline_operation", params)
    expect(replay.error).toBeNull()
    expect(replay.data.status).toBe("duplicate")
  })
})
