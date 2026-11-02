import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, PATCH } from "@/app/api/notifications/route"
import { NextRequest } from "next/server"

// Mock auth guard
vi.mock("@/lib/auth/guard", () => ({
  requireUser: vi.fn(),
  getPatientProfile: vi.fn(),
  authErrorResponse: vi.fn((err: any) => {
    const status = err?.status || 401
    return new Response(JSON.stringify({ error: err?.message || "Unauthorized" }), {
      status,
      headers: { "content-type": "application/json" },
    })
  }),
}))

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  rateLimitResponse: vi.fn(),
}))

import { requireUser, getPatientProfile } from "@/lib/auth/guard"
import { checkRateLimit } from "@/lib/rate-limit"

describe("Notifications API & Realtime Replacement (Phase 7, Audit H10)", () => {
  let mockSupabase: any
  let queryChain: any
  const testPatient = { id: "22222222-2222-4222-8222-222222222222", user_id: "user-123", role: "patient" }

  beforeEach(() => {
    vi.resetAllMocks()

    vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any)

    queryChain = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: any) => resolve({ data: [], error: null })),
    }

    mockSupabase = {
      from: vi.fn().mockReturnValue(queryChain),
    }

    vi.mocked(requireUser).mockResolvedValue({
      user: { id: "user-123", email: "patient@example.com" },
      supabase: mockSupabase,
    } as any)

    vi.mocked(getPatientProfile).mockResolvedValue(testPatient as any)
  })

  it("requires authentication for GET /api/notifications", async () => {
    vi.mocked(requireUser).mockRejectedValueOnce({ status: 401, message: "Unauthorized" })

    const req = new NextRequest("http://localhost:3000/api/notifications")
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("applies since filter when ?since parameter is supplied", async () => {
    const fakeData = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Camp Reminder",
        message: "Free health camp tomorrow",
        type: "info",
        created_at: "2026-10-11T10:00:00.000Z",
      },
    ]

    queryChain.then = (resolve: any) => resolve({ data: fakeData, error: null })

    const req = new NextRequest("http://localhost:3000/api/notifications?since=2026-10-11T09:00:00.000Z")
    const res = await GET(req)
    expect(res.status).toBe(200)

    // Verify .gt("created_at", ...) was called
    expect(queryChain.gt).toHaveBeenCalledWith("created_at", "2026-10-11T09:00:00.000Z")
  })

  it("rejects PATCH /api/notifications with missing ID payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: true }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.code).toBe("VALIDATION_ERROR")
  })

  it("updates single notification with notificationId", async () => {
    const testId = "11111111-1111-4111-8111-111111111111"
    queryChain.then = (resolve: any) =>
      resolve({
        data: [{ id: testId, title: "Test", is_read: true }],
        error: null,
      })

    const req = new NextRequest("http://localhost:3000/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: testId, is_read: true }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(queryChain.update).toHaveBeenCalledWith({ is_read: true })
    expect(queryChain.in).toHaveBeenCalledWith("id", [testId])
  })

  it("updates batch notifications with notificationIds", async () => {
    const id1 = "11111111-1111-4111-8111-111111111111"
    const id2 = "22222222-2222-4222-8222-222222222222"
    queryChain.then = (resolve: any) =>
      resolve({
        data: [
          { id: id1, title: "Test 1", is_read: true },
          { id: id2, title: "Test 2", is_read: true },
        ],
        error: null,
      })

    const req = new NextRequest("http://localhost:3000/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds: [id1, id2], is_read: true }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(queryChain.update).toHaveBeenCalledWith({ is_read: true })
    expect(queryChain.in).toHaveBeenCalledWith("id", [id1, id2])
  })
})
