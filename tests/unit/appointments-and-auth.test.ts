import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST, PATCH } from "@/app/api/appointments/route"
import { parsePaginationParams, encodeCursor, paginateResults } from "@/lib/pagination"

// Mock auth guard directly without importing React cache
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

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  rateLimitResponse: vi.fn(),
}))

// Mock admin client
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

import { requireUser, getPatientProfile } from "@/lib/auth/guard"
import { checkRateLimit } from "@/lib/rate-limit"

describe("Appointments & Auth Matrix (Phase 10, C1, C2, H2, H8)", () => {
  let mockSupabase: any
  let queryChain: any

  const patientUser = { id: "user-patient-1111", email: "patient@test.com" }
  const patientProfile = { id: "patient-1111-uuid", user_id: patientUser.id, role: "patient" }

  const doctorUser = { id: "user-doctor-2222", email: "doctor@test.com" }
  const doctorProfile = { id: "doctor-2222-uuid", user_id: doctorUser.id, role: "doctor" }
  const doctorProvider = { id: "provider-2222-uuid", user_id: doctorUser.id }

  const adminUser = { id: "user-admin-3333", email: "admin@test.com" }
  const adminProfile = { id: "admin-3333-uuid", user_id: adminUser.id, role: "admin" }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any)

    queryChain = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
    }

    mockSupabase = {
      from: vi.fn().mockReturnValue(queryChain),
    }

    vi.mocked(requireUser).mockResolvedValue({
      user: patientUser as any,
      supabase: mockSupabase,
    })
    vi.mocked(getPatientProfile).mockResolvedValue(patientProfile as any)
  })

  describe("Pagination Engine (H8)", () => {
    it("encodes and parses cursor params cleanly", () => {
      const item = { id: "item-123", created_at: "2026-10-11T12:00:00.000Z" }
      const cursor = encodeCursor(item)

      const searchParams = new URLSearchParams({ cursor, limit: "25" })
      const parsed = parsePaginationParams(searchParams, 20, 100)

      expect(parsed.limit).toBe(25)
      expect(parsed.cursor).toEqual({
        id: "item-123",
        createdAt: "2026-10-11T12:00:00.000Z",
      })
    })

    it("clamps limit between 1 and maxLimit, and gracefully handles invalid cursor", () => {
      const paramsLow = parsePaginationParams(new URLSearchParams({ limit: "-5" }), 20, 100)
      expect(paramsLow.limit).toBe(1)

      const paramsHigh = parsePaginationParams(new URLSearchParams({ limit: "500" }), 20, 100)
      expect(paramsHigh.limit).toBe(100)

      const paramsInvalidCursor = parsePaginationParams(new URLSearchParams({ cursor: "not-a-valid-cursor" }), 20, 100)
      expect(paramsInvalidCursor.cursor).toBeNull()
    })

    it("paginateResults generates nextCursor when more results exist", () => {
      const items = [
        { id: "1", created_at: "2026-10-11T10:00:00Z" },
        { id: "2", created_at: "2026-10-11T09:00:00Z" },
        { id: "3", created_at: "2026-10-11T08:00:00Z" },
      ]

      const paginated = paginateResults(items, 2)
      expect(paginated.data).toHaveLength(2)
      expect(paginated.nextCursor).toBeDefined()
    })
  })

  describe("Double Booking Conflict (H2)", () => {
    it("maps Postgres 23505 unique constraint violation to HTTP 409 SLOT_TAKEN", async () => {
      const providerId = "44444444-4444-4444-8444-444444444444"

      // Mock appointment insert failing with 23505
      queryChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      })

      const req = new NextRequest("http://localhost:3000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: providerId,
          appointment_date: "2026-11-01T10:00:00.000Z",
          consultation_type: "video",
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(409)
      const json = await res.json()
      expect(json.code).toBe("SLOT_TAKEN")
    })
  })

  describe("PATCH Appointments Role Matrix (C2)", () => {
    const apptId = "55555555-5555-4555-8555-555555555555"

    it("allows a patient to cancel their own scheduled appointment", async () => {
      queryChain.single
        .mockResolvedValueOnce({
          data: {
            id: apptId,
            patient_id: patientProfile.id,
            provider_id: doctorProvider.id,
            status: "scheduled",
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: apptId, status: "cancelled" },
          error: null,
        })

      const req = new NextRequest("http://localhost:3000/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: apptId, status: "cancelled" }),
      })

      const res = await PATCH(req)
      expect(res.status).toBe(200)
    })

    it("denies a patient from marking an appointment completed (403)", async () => {
      queryChain.single.mockResolvedValueOnce({
        data: {
          id: apptId,
          patient_id: patientProfile.id,
          provider_id: doctorProvider.id,
          status: "scheduled",
        },
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: apptId, status: "completed" }),
      })

      const res = await PATCH(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.code).toBe("ACTION_NOT_PERMITTED")
    })

    it("returns 404 when a patient tries to modify another patient's appointment", async () => {
      queryChain.single.mockResolvedValueOnce({
        data: {
          id: apptId,
          patient_id: "other-patient-uuid",
          provider_id: doctorProvider.id,
          status: "scheduled",
        },
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: apptId, status: "cancelled" }),
      })

      const res = await PATCH(req)
      expect(res.status).toBe(404)
    })

    it("returns 409 when attempting to modify an already cancelled or completed appointment", async () => {
      queryChain.single.mockResolvedValueOnce({
        data: {
          id: apptId,
          patient_id: patientProfile.id,
          provider_id: doctorProvider.id,
          status: "cancelled",
        },
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: apptId, status: "cancelled" }),
      })

      const res = await PATCH(req)
      expect(res.status).toBe(409)
      const json = await res.json()
      expect(json.code).toBe("APPOINTMENT_TERMINAL")
    })

    it("allows a doctor to complete their assigned appointment", async () => {
      vi.mocked(requireUser).mockResolvedValueOnce({
        user: doctorUser as any,
        supabase: mockSupabase,
      })
      vi.mocked(getPatientProfile).mockResolvedValueOnce(doctorProfile as any)

      // 1. Fetch appointment
      queryChain.single.mockResolvedValueOnce({
        data: {
          id: apptId,
          patient_id: patientProfile.id,
          provider_id: doctorProvider.id,
          status: "scheduled",
        },
        error: null,
      })

      // 2. Doctor provider lookup
      queryChain.single.mockResolvedValueOnce({
        data: { id: doctorProvider.id },
        error: null,
      })

      // 3. Update appointment
      queryChain.single.mockResolvedValueOnce({
        data: { id: apptId, status: "completed" },
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: apptId, status: "completed" }),
      })

      const res = await PATCH(req)
      expect(res.status).toBe(200)
    })

    it("allows an admin to update any appointment", async () => {
      vi.mocked(requireUser).mockResolvedValueOnce({
        user: adminUser as any,
        supabase: mockSupabase,
      })
      vi.mocked(getPatientProfile).mockResolvedValueOnce(adminProfile as any)

      // 1. Fetch appointment
      queryChain.single.mockResolvedValueOnce({
        data: {
          id: apptId,
          patient_id: patientProfile.id,
          provider_id: doctorProvider.id,
          status: "scheduled",
        },
        error: null,
      })

      // 2. Update appointment
      queryChain.single.mockResolvedValueOnce({
        data: { id: apptId, status: "cancelled" },
        error: null,
      })

      const req = new NextRequest("http://localhost:3000/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: apptId, status: "cancelled" }),
      })

      const res = await PATCH(req)
      expect(res.status).toBe(200)
    })
  })
})
