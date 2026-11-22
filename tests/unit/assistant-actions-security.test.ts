import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({ patient: vi.fn(), auth: vi.fn(), admin: vi.fn(), limiter: vi.fn(), jitsi: vi.fn() }))
vi.mock("@/lib/auth/guard", () => ({
  getPatientProfile: mocks.patient, requireUser: mocks.auth,
  authErrorResponse: (error: any) => new Response(JSON.stringify({ error: "Unauthorized", code: error.code ?? "ERROR" }), { status: error.status ?? 500 }),
}))
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: mocks.admin }))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.limiter, rateLimitResponse: () => new Response(null, { status: 429 }) }))
vi.mock("@/lib/jitsi/jwt", () => ({ generateJitsiToken: mocks.jitsi }))
import { executeAssistantAction } from "@/lib/services/assistant-actions.service"
import { handleCreateAppointment, handleGetAppointments, handlePatchAppointment } from "@/lib/services/appointments.service"
import { POST } from "@/app/api/assistant/actions/route"
import { authorizeTeleconsultRoom } from "@/lib/services/teleconsult-room.service"
import { POST as roomPOST } from "@/app/api/teleconsult/room/route"

const user = { id: "11111111-1111-4111-8111-111111111111", email: "patient@example.test" }
const patient = { id: "22222222-2222-4222-8222-222222222222", role: "patient", user_id: user.id }
const provider = { id: "33333333-3333-4333-8333-333333333333", user_id: "44444444-4444-4444-8444-444444444444", name: "Dr. Verified", specialization: "general", location: "Clinic", is_verified: true }
const appointmentId = "55555555-5555-4555-8555-555555555555"
const appointmentDate = "2026-11-23T03:30:00.000Z"

function database(initialAppointments: any[] = [], availableProvider: any = provider) {
  const rows = [...initialAppointments]
  const queries: any[] = []
  const client = { from(table: string) {
    const filters: Array<[string, string, any]> = []
    let inserted: any = null
    let changes: any = null
    const query: any = {
      table, filters, columns: "", select: vi.fn((columns = "*") => { query.columns = columns; return query }),
      eq: vi.fn((column: string, value: any) => { filters.push(["eq", column, value]); return query }),
      is: vi.fn((column: string, value: any) => { filters.push(["is", column, value]); return query }),
      in: vi.fn((column: string, value: any) => { filters.push(["in", column, value]); return query }),
      gte: vi.fn((column: string, value: any) => { filters.push(["gte", column, value]); return query }),
      lt: vi.fn((column: string, value: any) => { filters.push(["lt", column, value]); return query }),
      order: vi.fn(() => query), limit: vi.fn(() => query), or: vi.fn(() => query),
      insert: vi.fn((payload: any) => { inserted = payload; return query }),
      update: vi.fn((payload: any) => { changes = payload; return query }),
      single: vi.fn(async () => resolve(true)), maybeSingle: vi.fn(async () => resolve(true)),
      then: (fulfilled: any) => Promise.resolve(resolve(false)).then(fulfilled),
    }
    function matches(row: any) {
      return filters.every(([operator, key, value]) => operator === "eq" || operator === "is" ? row[key] === value : operator === "in" ? value.includes(row[key]) : operator === "gte" ? row[key] >= value : row[key] < value)
    }
    function resolve(single: boolean) {
      if (table === "notifications") return { data: [], error: null }
      if (table === "healthcare_providers") {
        const data = availableProvider && matches(availableProvider) ? availableProvider : null
        return { data: single ? data : data ? [data] : [], error: null }
      }
      if (inserted) {
        const payload = Array.isArray(inserted) ? inserted[0] : inserted
        if (rows.some((row) => row.provider_id === payload.provider_id && row.appointment_date === payload.appointment_date && row.status === "scheduled")) return { data: null, error: { code: "23505" } }
        const created = { id: appointmentId, created_at: "2026-11-22T03:00:00.000Z", ...payload }
        rows.push(created)
        return { data: created, error: null }
      }
      const selected = rows.filter(matches)
      if (changes) for (const row of selected) Object.assign(row, changes)
      return { data: single ? selected[0] ?? null : selected, error: single && changes && !selected.length ? { code: "PGRST116" } : null }
    }
    queries.push(query)
    return query
  } }
  return { client, queries, rows }
}

describe("Assistant action authorization and acknowledgment", () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-22T03:00:00Z")); vi.clearAllMocks()
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "unit-test-confirmation-key")
    mocks.patient.mockResolvedValue(patient); mocks.limiter.mockResolvedValue({ success: true })
    mocks.jitsi.mockReturnValue({ token: "unit-signed-room-token", requiresToken: true })
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })

  it("requires authentication at the assistant API boundary", async () => {
    mocks.auth.mockRejectedValue({ status: 401, code: "UNAUTHORIZED" })
    const response = await POST(new NextRequest("http://localhost/api/assistant/actions", { method: "POST", body: JSON.stringify({ action: "providers.list" }) }))
    expect(response.status).toBe(401)
  })

  it("rejects arbitrary actions, caller roles and unconfirmed writes", async () => {
    const db = database()
    for (const payload of [{ action: "run_sql", sql: "delete" }, { action: "providers.list", role: "admin" }, { action: "appointments.book", confirmationToken: "not-a-valid-server-token", confirmed: false }]) {
      expect((await executeAssistantAction(db.client, user, payload)).status).toBe(400)
    }
    expect(db.queries).toHaveLength(0)
  })

  it("reads doctor appointments by exact linked provider with no admin or GET mutation", async () => {
    const doctor = { ...user, id: provider.user_id }
    mocks.patient.mockResolvedValue({ ...patient, role: "doctor" })
    const db = database([
      { id: appointmentId, provider_id: provider.id, created_at: "2026-11-22T03:00:00.000Z" },
      { id: "66666666-6666-4666-8666-666666666666", provider_id: "77777777-7777-4777-8777-777777777777", notes: provider.name, created_at: "2026-11-22T03:00:00.000Z" },
    ])
    const result = await handleGetAppointments(db.client, doctor, new URLSearchParams())
    expect((await result.json()).appointments.map((row: any) => row.id)).toEqual([appointmentId])
    expect(mocks.admin).not.toHaveBeenCalled()
    expect(db.queries.every((query) => !query.update.mock.calls.length)).toBe(true)
  })

  it("does not promote a patient when a provider link exists", async () => {
    const db = database([{ id: appointmentId, patient_id: patient.id, created_at: appointmentDate }], { ...provider, user_id: user.id })
    await handleGetAppointments(db.client, user, new URLSearchParams())
    expect(db.queries.some((query) => query.table === "healthcare_providers")).toBe(false)
    expect(mocks.admin).not.toHaveBeenCalled()
    expect(patient.role).toBe("patient")
  })

  it("requires an exact verified provider and preserves mode plus the actual server room", async () => {
    const db = database(); mocks.admin.mockReturnValue(database().client)
    expect((await handleCreateAppointment(db.client, user, { appointment_date: appointmentDate, notes: `— ${provider.name}` })).status).toBe(400)
    const unavailable = database([], { ...provider, is_verified: false })
    expect((await handleCreateAppointment(unavailable.client, user, { provider_id: provider.id, appointment_date: appointmentDate })).status).toBe(404)
    const result = await handleCreateAppointment(db.client, user, { provider_id: provider.id, appointment_date: appointmentDate, consultation_type: "audio", teleconsult_room_id: "client-untrusted-room", patient_id: "spoofed" })
    const data = await result.json()
    expect(result.status).toBe(201)
    expect(data.appointment).toMatchObject({ patient_id: patient.id, provider_id: provider.id, consultation_type: "audio" })
    expect(data.appointment.teleconsult_room_id).not.toBe("client-untrusted-room")
    expect(data.appointment.teleconsult_room_id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it("returns India-time slots and exposes no patient details in the service-role availability query", async () => {
    const db = database(); const admin = database([{ provider_id: provider.id, status: "scheduled", appointment_date: appointmentDate, duration_minutes: 60, notes: "private", patient_id: "private" }]); mocks.admin.mockReturnValue(admin.client)
    const result = await executeAssistantAction(db.client, user, { action: "appointments.slots", providerId: provider.id, date: "2026-11-23" })
    const data = await result.json()
    expect(data.slots).toHaveLength(16)
    expect(data.slots[0]).toEqual({ appointmentDate, available: false })
    expect(data.slots[1].available).toBe(false)
    expect(data.slots[2].available).toBe(true)
    expect(admin.queries[0].columns).toBe("appointment_date, duration_minutes")
    expect(JSON.stringify(data)).not.toContain("private")
  })

  it("prepares a server-bound draft, rejects tampering/user changes/expiry, then acknowledges booking", async () => {
    const db = database(); mocks.admin.mockReturnValue(db.client)
    const prepared = await executeAssistantAction(db.client, user, { action: "appointments.prepare", providerId: provider.id, appointmentDate, consultationType: "audio", notes: "Consultation" })
    const { draft, confirmationToken } = await prepared.json()
    expect(draft).toEqual({ providerId: provider.id, providerName: provider.name, appointmentDate, consultationType: "audio", notes: "Consultation" })
    expect(db.rows).toHaveLength(0)
    const [encoded, signature] = confirmationToken.split(".")
    const changed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")); changed.draft.notes = "Unsigned changed clinical notes"
    const tampered = `${Buffer.from(JSON.stringify(changed)).toString("base64url")}.${signature}`
    expect((await executeAssistantAction(db.client, user, { action: "appointments.book", confirmationToken: tampered, confirmed: true })).status).toBe(403)
    expect((await executeAssistantAction(db.client, { ...user, id: "99999999-9999-4999-8999-999999999999" }, { action: "appointments.book", confirmationToken, confirmed: true })).status).toBe(403)
    vi.advanceTimersByTime(5 * 60000)
    expect((await executeAssistantAction(db.client, user, { action: "appointments.book", confirmationToken, confirmed: true })).status).toBe(409)
    vi.setSystemTime(new Date("2026-11-22T03:00:00Z"))
    const booking = await executeAssistantAction(db.client, user, { action: "appointments.book", confirmationToken, confirmed: true })
    expect(booking.status).toBe(201)
    expect((await booking.json()).appointment.teleconsult_room_id).toBeTruthy()
    expect((await executeAssistantAction(db.client, user, { action: "appointments.book", confirmationToken, confirmed: true })).status).toBe(200)
    expect(db.rows).toHaveLength(1)
    db.rows[0].status = "cancelled"
    expect((await executeAssistantAction(db.client, user, { action: "appointments.book", confirmationToken, confirmed: true })).status).toBe(409)
    expect(db.rows).toHaveLength(1)
  })

  it("requires cancellation confirmation and rechecks ownership", async () => {
    const db = database([{ id: appointmentId, patient_id: patient.id, provider_id: provider.id, appointment_date: appointmentDate, status: "scheduled" }]); mocks.admin.mockReturnValue(database().client)
    const prepared = await executeAssistantAction(db.client, user, { action: "appointments.cancel.prepare", appointmentId })
    const payload = await prepared.json()
    expect(payload.draft.providerId).toBe(provider.id)
    expect(db.rows[0].status).toBe("scheduled")
    expect((await executeAssistantAction(db.client, user, { action: "appointments.cancel", confirmationToken: payload.confirmationToken, confirmed: true })).status).toBe(200)
    expect(db.rows[0].status).toBe("cancelled")
    expect((await executeAssistantAction(db.client, user, { action: "appointments.cancel", confirmationToken: payload.confirmationToken, confirmed: true })).status).toBe(200)
    const result = await handlePatchAppointment(db.client, user, { id: appointmentId, status: "scheduled" })
    expect(result.status).toBe(409)
  })

  it("rejects URL-like role/room fields and unauthenticated teleconsultation requests", async () => {
    mocks.auth.mockRejectedValueOnce({ status: 401, code: "UNAUTHORIZED" })
    expect((await roomPOST(new NextRequest("http://localhost/api/teleconsult/room", { method: "POST", body: JSON.stringify({ appointmentId }) }))).status).toBe(401)
    mocks.auth.mockResolvedValue({ user, supabase: database().client })
    expect((await roomPOST(new NextRequest("http://localhost/api/teleconsult/room", { method: "POST", body: JSON.stringify({ appointmentId, role: "doctor", roomId: "spoofed" }) }))).status).toBe(400)
  })

  it("allows only the patient or exact verified doctor and derives participant role on the server", async () => {
    const booking = { id: appointmentId, patient_id: patient.id, provider_id: provider.id, appointment_date: "2026-11-22T03:10:00Z", duration_minutes: 30, status: "scheduled", teleconsult_room_id: "verified_room" }
    mocks.patient.mockResolvedValue({ ...patient, first_name: "Patient", last_name: "One" })
    const result = await authorizeTeleconsultRoom(database([booking]).client, user, appointmentId)
    expect(await result.json()).toMatchObject({ appointmentId, patientId: patient.id, participantRole: "patient", participantName: "Patient One", roomId: "verified_room", token: "unit-signed-room-token" })
    mocks.patient.mockResolvedValue({ ...patient, id: "66666666-6666-4666-8666-666666666666", role: "doctor" })
    const doctor = { ...user, id: provider.user_id }
    const authorizedDoctor = await authorizeTeleconsultRoom(database([booking]).client, doctor, appointmentId)
    expect((await authorizedDoctor.json()).participantRole).toBe("doctor")
    expect(mocks.jitsi).toHaveBeenLastCalledWith(expect.objectContaining({ role: "doctor", userId: provider.user_id }))
    expect((await authorizeTeleconsultRoom(database([booking], { ...provider, user_id: "different-doctor" }).client, doctor, appointmentId)).status).toBe(403)
    mocks.patient.mockResolvedValue({ ...patient, id: "66666666-6666-4666-8666-666666666666", role: "admin" })
    expect((await authorizeTeleconsultRoom(database([booking]).client, user, appointmentId)).status).toBe(403)
    mocks.patient.mockResolvedValue({ ...patient, role: "admin" })
    expect((await (await authorizeTeleconsultRoom(database([booking]).client, user, appointmentId)).json()).participantRole).toBe("patient")
  })

  it("enforces consultation state, valid timestamps and entry window before generating credentials", async () => {
    const booking = { id: appointmentId, patient_id: patient.id, provider_id: provider.id, appointment_date: appointmentDate, duration_minutes: 30, status: "scheduled", teleconsult_room_id: "verified_room" }
    expect((await authorizeTeleconsultRoom(database([booking]).client, user, appointmentId)).status).toBe(403)
    expect((await authorizeTeleconsultRoom(database([{ ...booking, appointment_date: "invalid" }]).client, user, appointmentId)).status).toBe(500)
    expect((await authorizeTeleconsultRoom(database([{ ...booking, duration_minutes: 0 }]).client, user, appointmentId)).status).toBe(500)
    for (const status of ["cancelled", "completed"]) expect((await authorizeTeleconsultRoom(database([{ ...booking, status }]).client, user, appointmentId)).status).toBe(409)
    expect(mocks.jitsi).not.toHaveBeenCalled()
  })

  it("assigns one acknowledged room for legacy bookings with a compare-and-set", async () => {
    const db = database([{ id: appointmentId, patient_id: patient.id, provider_id: provider.id, appointment_date: "2026-11-22T03:10:00Z", duration_minutes: 30, status: "scheduled", teleconsult_room_id: null }])
    const results = await Promise.all([authorizeTeleconsultRoom(db.client, user, appointmentId), authorizeTeleconsultRoom(db.client, user, appointmentId)])
    const rooms = await Promise.all(results.map((result) => result.json()))
    expect(rooms[0].roomId).toMatch(/^rhcp_[0-9a-f-]{36}$/)
    expect(rooms[1].roomId).toBe(rooms[0].roomId)
    expect(db.queries.find((query) => query.update.mock.calls.length)?.is).toHaveBeenCalledWith("teleconsult_room_id", null)
  })
})
