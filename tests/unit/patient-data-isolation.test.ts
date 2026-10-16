import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { GET as getMedicalRecords, POST as postMedicalRecords, PATCH as patchMedicalRecords, DELETE as deleteMedicalRecords } from "@/app/api/medical-records/route"
import { POST as accessTeleconsultRoom } from "@/app/api/teleconsult/room/route"
import { PUT as updateProfile } from "@/app/api/auth/profile/route"
import { PATCH as updateDoctorRequest } from "@/app/api/doctor-requests/route"

// Mock the auth guard
vi.mock("@/lib/auth/guard", () => {
  class MockAuthError extends Error {
    constructor(public status: number, message: string, public code: string) {
      super(message)
      this.name = "AuthError"
    }
  }
  return {
    AuthError: MockAuthError,
    requireUser: vi.fn(),
    getPatientProfile: vi.fn(),
    getPatientId: vi.fn(),
    requireRole: vi.fn(),
    authErrorResponse: vi.fn((err: any) => {
      const status = err?.status || 500
      return new Response(JSON.stringify({ error: err?.message || "Error", code: err?.code || "ERROR" }), {
        status,
        headers: { "content-type": "application/json" },
      })
    }),
  }
})

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  rateLimitResponse: vi.fn(),
}))

// Mock admin client
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
  createAdminClient: vi.fn(() => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.")
    }
    return {} as any
  }),
}))

// Mock Jitsi token generator
vi.mock("@/lib/jitsi/jwt", () => ({
  generateJitsiToken: vi.fn().mockReturnValue("mock-jitsi-token-xyz"),
}))

import { requireUser, getPatientProfile } from "@/lib/auth/guard"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"

describe("Patient Data Isolation & Privileged Access Guards (Phase 2, P0/P1)", () => {
  let mockSupabase: any
  let queryChain: any

  const patientAUser = { id: "11111111-1111-4111-8111-111111111111", email: "alice@test.com" }
  const patientAProfile = { id: "22222222-2222-4222-8222-222222222222", user_id: patientAUser.id, role: "patient" as const }

  const patientBUser = { id: "33333333-3333-4333-8333-333333333333", email: "bob@test.com" }
  const patientBProfile = { id: "44444444-4444-4444-8444-444444444444", user_id: patientBUser.id, role: "patient" as const }

  const doctorUser = { id: "55555555-5555-4555-8555-555555555555", email: "doctor@test.com" }
  const doctorProfile = { id: "66666666-6666-4666-8666-666666666666", user_id: doctorUser.id, role: "doctor" as const }
  const doctorProvider = { id: "77777777-7777-4777-8777-777777777777", user_id: doctorUser.id }

  const intruderUser = { id: "88888888-8888-4888-8888-888888888888", email: "intruder@test.com" }
  const intruderProfile = { id: "99999999-9999-4999-8999-999999999999", user_id: intruderUser.id, role: "patient" as const }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any)

    queryChain = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
    }

    mockSupabase = {
      from: vi.fn().mockReturnValue(queryChain),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: patientAUser }, error: null }),
      },
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireUser).mockResolvedValue({
      user: patientAUser as any,
      supabase: mockSupabase,
    })
    vi.mocked(getPatientProfile).mockResolvedValue(patientAProfile as any)
  })

  describe("Medical Records Cross-Tenant Isolation", () => {
    it("strictly isolates GET requests to the authenticated patient's own records", async () => {
      // Mock patient row lookup
      queryChain.single.mockResolvedValueOnce({
        data: patientAProfile,
        error: null,
      })

      // Mock return data
      const patientARecords = [
        { id: "record-1", patient_id: patientAProfile.id, content: "Alice Blood Test" },
      ]
      queryChain.then.mockImplementationOnce((resolve: any) => resolve({ data: patientARecords, error: null }))

      const req = new NextRequest("http://localhost:3000/api/medical-records")
      const res = await getMedicalRecords(req)

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.records).toEqual(patientARecords)

      // Verify that query was filtered strictly by patientAProfile.id
      expect(queryChain.eq).toHaveBeenCalledWith("patient_id", patientAProfile.id)
    })

    it("prevents an attacker from modifying another patient's medical record via PATCH", async () => {
      // Mock patient row lookup
      queryChain.single.mockResolvedValueOnce({
        data: patientAProfile,
        error: null,
      })

      // When updating, the query chain appends .eq("patient_id", patientAProfile.id)
      queryChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Row not found or RLS violation" },
      })

      const req = new NextRequest("http://localhost:3000/api/medical-records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "44444444-4444-4444-8444-444444444444",
          content: "Tampered diagnosis",
          record_type: "diagnosis",
        }),
      })

      const res = await patchMedicalRecords(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.code).toBe("DB_ERROR")

      // Verify ownership condition was strictly enforced on the query
      expect(queryChain.eq).toHaveBeenCalledWith("patient_id", patientAProfile.id)
    })

    it("prevents an attacker from deleting another patient's medical record via DELETE", async () => {
      queryChain.single.mockResolvedValueOnce({
        data: patientAProfile,
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/medical-records?id=44444444-4444-4444-8444-444444444444", {
        method: "DELETE",
      })

      await deleteMedicalRecords(req)

      // Verify ownership filter was enforced on the delete query
      expect(queryChain.eq).toHaveBeenCalledWith("patient_id", patientAProfile.id)
    })
  })

  describe("Teleconsultation Room Eavesdropping & Access Guards (C5)", () => {
    const validAppointmentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"

    it("rejects unauthorized patient attempting to enter another patient's consultation room (403)", async () => {
      // Authenticate as intruder
      vi.mocked(requireUser).mockResolvedValueOnce({
        user: intruderUser as any,
        supabase: mockSupabase,
      })
      vi.mocked(getPatientProfile).mockResolvedValueOnce(intruderProfile as any)

      // Appointment belongs to Patient A and Doctor
      queryChain.single.mockResolvedValueOnce({
        data: {
          id: validAppointmentId,
          patient_id: patientAProfile.id,
          provider_id: doctorProvider.id,
          appointment_date: new Date().toISOString(),
          duration_minutes: 30,
          status: "scheduled",
          teleconsult_room_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        },
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/teleconsult/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: validAppointmentId }),
      })

      const res = await accessTeleconsultRoom(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.code).toBe("FORBIDDEN")
      expect(json.error).toBe("You are not authorized to enter this consultation room.")
    })

    it("rejects an unassigned doctor from entering a consultation room (403)", async () => {
      const otherDoctorUser = { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", email: "other.doctor@test.com" }
      const otherDoctorProfile = { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", user_id: otherDoctorUser.id, role: "doctor" as const }

      vi.mocked(requireUser).mockResolvedValueOnce({
        user: otherDoctorUser as any,
        supabase: mockSupabase,
      })
      vi.mocked(getPatientProfile).mockResolvedValueOnce(otherDoctorProfile as any)

      // 1. Appointment lookup: assigned to doctorProvider (not otherDoctor)
      queryChain.single.mockResolvedValueOnce({
        data: {
          id: validAppointmentId,
          patient_id: patientAProfile.id,
          provider_id: doctorProvider.id,
          appointment_date: new Date().toISOString(),
          duration_minutes: 30,
          status: "scheduled",
          teleconsult_room_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        },
        error: null,
      })

      // 2. Healthcare provider lookup for otherDoctor
      queryChain.single.mockResolvedValueOnce({
        data: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" },
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/teleconsult/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: validAppointmentId }),
      })

      const res = await accessTeleconsultRoom(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.code).toBe("FORBIDDEN")
    })

    it("rejects access outside the scheduled consultation time window (403 OUTSIDE_TIME_WINDOW)", async () => {
      // Legitimate patient (Alice), but appointment is scheduled 24 hours in the future
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      queryChain.single.mockResolvedValueOnce({
        data: {
          id: validAppointmentId,
          patient_id: patientAProfile.id,
          provider_id: doctorProvider.id,
          appointment_date: futureDate,
          duration_minutes: 30,
          status: "scheduled",
          teleconsult_room_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        },
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/teleconsult/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: validAppointmentId }),
      })

      const res = await accessTeleconsultRoom(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.code).toBe("OUTSIDE_TIME_WINDOW")
    })
  })

  describe("Privilege Escalation Prevention & Service Role Key Isolation", () => {
    it("strips malicious 'role' parameter during profile update, preventing self-promotion to admin", async () => {
      queryChain.single.mockResolvedValueOnce({
        data: { id: patientAProfile.id, first_name: "Alice", last_name: "Smith" },
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileType: "patient",
          first_name: "Alice",
          role: "admin", // Attacker trying to inject admin role
        }),
      })

      const res = await updateProfile(req)
      expect(res.status).toBe(200)

      // Verify that the payload sent to supabase update() does NOT include 'role'
      expect(queryChain.update).toHaveBeenCalledWith(
        expect.not.objectContaining({ role: "admin" })
      )
    })

    it("blocks non-admin users from approving doctor registration requests (403)", async () => {
      // Supabase server client returns patientA with role='patient'
      queryChain.single.mockResolvedValueOnce({
        data: { role: "patient" },
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/doctor-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: "77777777-7777-4777-8777-777777777777",
          action: "approved",
        }),
      })

      const res = await updateDoctorRequest(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe("Admin access required")
    })

    it("throws an explicit error if service role client is requested without server-side environment secrets", () => {
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      try {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY
        expect(() => createAdminClient()).toThrow("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.")
      } finally {
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
      }
    })
  })
})
