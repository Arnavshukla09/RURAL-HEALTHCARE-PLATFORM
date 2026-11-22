import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ auth: vi.fn() }))
vi.mock("@/lib/auth/guard", () => ({ requireUser: mocks.auth, authErrorResponse: (error: any) => new Response(null, { status: error.status || 500 }) }))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: async () => ({ success: true }), rateLimitResponse: vi.fn() }))
vi.mock("@/lib/audit", () => ({ logAuditEvent: async () => {} }))
import { POST } from "@/app/api/medical-records/route"

const patientId = "11111111-1111-4111-8111-111111111111"
const providerId = "22222222-2222-4222-8222-222222222222"
const appointmentId = "33333333-3333-4333-8333-333333333333"
const actorId = "44444444-4444-4444-8444-444444444444"
const recordId = "55555555-5555-4555-8555-555555555555"
const request = (body: unknown) => new NextRequest("http://localhost/api/medical-records", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } })
const data = { appointment_id: appointmentId, patient_id: patientId, provider_id: providerId, record_type: "prescription", content: "Clinician-entered findings", metadata: { doctor_name: "Forged Doctor", facility_name: "Forged Facility", patient_name: "Forged Patient", doctor_registration_number: "FAKE-REG" } }

function database(role: string, ownsPatient = false, assigned = true) {
  const inserts: any[] = []
  const profile = { id: ownsPatient ? patientId : actorId, user_id: actorId, role, first_name: "Real", last_name: "Patient" }
  return { inserts, client: { from: (table: string) => {
    let inserted: any
    const chain: any = { select: () => chain, eq: () => chain, insert: (payload: any) => { inserted = payload[0]; inserts.push(inserted); return chain }, single: async () => {
      if (table === "patients") return { data: profile, error: null }
      if (table === "appointments") return { data: { id: appointmentId, patient_id: patientId, provider_id: providerId, status: "scheduled" }, error: null }
      if (table === "healthcare_providers") return { data: { id: providerId, user_id: assigned ? actorId : recordId, name: "Real Clinician", location: "Real Clinic", is_verified: true }, error: null }
      return { data: { id: recordId, ...inserted }, error: null }
    } }
    return chain
  } } }
}

describe("Appointment-bound clinical record ownership", () => {
  beforeEach(() => vi.clearAllMocks())
  it("requires authentication and prevents patient/admin prescription authorship", async () => {
    mocks.auth.mockRejectedValueOnce({ status: 401 })
    expect((await POST(request(data))).status).toBe(401)
    for (const role of ["patient", "admin"]) {
      const db = database(role, true); mocks.auth.mockResolvedValue({ user: { id: actorId }, supabase: db.client })
      expect((await POST(request({ ...data, role: "doctor" }))).status).toBe(403)
      expect(db.inserts).toHaveLength(0)
    }
  })
  it("derives consultation identities and ignores supplied registry claims", async () => {
    const db = database("doctor"); mocks.auth.mockResolvedValue({ user: { id: actorId }, supabase: db.client })
    const response = await POST(request(data))
    expect(response.status).toBe(201)
    expect(db.inserts[0]).toMatchObject({ patient_id: patientId, provider_id: providerId, appointment_id: appointmentId, metadata: { doctor_name: "Real Clinician", facility_name: "Real Clinic", patient_name: "Real Patient", doctor_registration_number: "", source: "clinician-authored" } })
  })
  it("blocks unassigned clinicians and mismatched target identities", async () => {
    const wrongDoctor = database("doctor", false, false); mocks.auth.mockResolvedValue({ user: { id: actorId }, supabase: wrongDoctor.client })
    expect((await POST(request(data))).status).toBe(403)
    expect(wrongDoctor.inserts).toHaveLength(0)
    const db = database("doctor"); mocks.auth.mockResolvedValue({ user: { id: actorId }, supabase: db.client })
    expect((await POST(request({ ...data, patient_id: recordId }))).status).toBe(403)
    expect(db.inserts).toHaveLength(0)
  })
  it("permits own notes and standalone patient-provided uploads without clinician attribution", async () => {
    const db = database("patient", true); mocks.auth.mockResolvedValue({ user: { id: actorId }, supabase: db.client })
    expect((await POST(request({ ...data, record_type: "other" }))).status).toBe(201)
    expect(db.inserts[0].metadata.source).toBe("patient-provided")
    expect((await POST(request({ record_type: "prescription", content: "Uploaded paper prescription", metadata: { doctor_name: "Forged Clinician" } }))).status).toBe(201)
    expect(db.inserts[1].metadata).not.toHaveProperty("doctor_name")
    expect(db.inserts[1]).not.toHaveProperty("provider_id")
  })
})
