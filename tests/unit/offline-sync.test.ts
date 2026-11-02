import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/offline-sync/route"
import { NextRequest } from "next/server"

// Mock the auth guard
vi.mock("@/lib/auth/guard", () => {
  return {
    requireUser: vi.fn(),
    getPatientProfile: vi.fn(),
    authErrorResponse: vi.fn((err: any) => {
      const status = err?.status || 401
      return new Response(JSON.stringify({ error: err?.message || "Unauthorized" }), {
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
  rateLimit: vi.fn().mockResolvedValue(true),
  clientKey: vi.fn().mockReturnValue("user:test"),
}))

import { requireUser, getPatientProfile } from "@/lib/auth/guard"

describe("Offline Sync Rewrite (Audit C4, §2.4)", () => {
  const dummyUser = { id: "11111111-1111-4111-8111-111111111111", email: "patient@example.com" }
  const dummyPatient = { id: "22222222-2222-4222-8222-222222222222", user_id: dummyUser.id, name: "Test Patient" }

  let mockSupabase: any
  let processedOpsStore: Set<string>
  let insertedRecords: { table: string; data: any }[]

  beforeEach(() => {
    vi.clearAllMocks()
    processedOpsStore = new Set()
    insertedRecords = []

    mockSupabase = {
      from: vi.fn((table: string) => {
        return {
          select: vi.fn((cols: string) => ({
            eq: vi.fn(() => ({
              in: vi.fn(async (col: string, values: string[]) => {
                const matched = values
                  .filter((v) => processedOpsStore.has(v))
                  .map((v) => ({ client_op_id: v }))
                return { data: matched, error: null }
              }),
            })),
          })),
          insert: vi.fn(async (rows: any[]) => {
            if (table === "processed_client_ops") {
              rows.forEach((r) => processedOpsStore.add(r.client_op_id))
              return { data: rows, error: null }
            }
            if (table === "offline_sync_log") {
              return { data: rows, error: null }
            }
            insertedRecords.push({ table, data: rows })
            return { data: rows, error: null }
          }),
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: null, error: null })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: null, error: null })),
          })),
        }
      }),
    }

    vi.mocked(requireUser).mockResolvedValue({
      user: dummyUser,
      supabase: mockSupabase,
    } as any)

    vi.mocked(getPatientProfile).mockResolvedValue(dummyPatient as any)
  })

  it("1. Requires authentication before accepting offline operations", async () => {
    vi.mocked(requireUser).mockRejectedValueOnce({
      status: 401,
      message: "Authentication required",
    })

    const req = new NextRequest("http://localhost:3000/api/offline-sync", {
      method: "POST",
      body: JSON.stringify({
        operations: [
          {
            client_op_id: "33333333-3333-4333-8333-333333333333",
            table: "appointments",
            type: "INSERT",
            data: {
              provider_id: "44444444-4444-4444-8444-444444444444",
              appointment_date: "2026-11-01T10:00:00Z",
            },
          },
        ],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("2. Enforces strict batch cap of at most 50 operations", async () => {
    const tooManyOps = Array.from({ length: 51 }, (_, i) => ({
      client_op_id: "33333333-3333-4333-8333-333333333333",
      table: "health_data",
      type: "INSERT",
      data: { pulse_rate: 72 },
    }))

    const req = new NextRequest("http://localhost:3000/api/offline-sync", {
      method: "POST",
      body: JSON.stringify({ operations: tooManyOps }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.code).toBe("VALIDATION_ERROR")
  })

  it("3. Idempotent replay: skips operations already processed and returns duplicate", async () => {
    const opId = "55555555-5555-4555-8555-555555555555"
    processedOpsStore.add(opId) // Already recorded from earlier run

    const req = new NextRequest("http://localhost:3000/api/offline-sync", {
      method: "POST",
      body: JSON.stringify({
        operations: [
          {
            client_op_id: opId,
            table: "health_data",
            type: "INSERT",
            data: { temperature: 98.6 },
          },
        ],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results).toEqual([{ client_op_id: opId, status: "duplicate" }])
    // Ensure table insert was skipped
    expect(insertedRecords.filter((r) => r.table === "health_data")).toHaveLength(0)
  })

  it("4. Whitelist rejects unknown columns / invalid schema per table", async () => {
    const opId = "66666666-6666-4666-8666-666666666666"
    const req = new NextRequest("http://localhost:3000/api/offline-sync", {
      method: "POST",
      body: JSON.stringify({
        operations: [
          {
            client_op_id: opId,
            table: "appointments",
            type: "INSERT",
            data: {
              provider_id: "44444444-4444-4444-8444-444444444444",
              appointment_date: "2026-11-01T10:00:00Z",
              is_admin: true, // Unknown / malicious column
              hacked_role: "superuser",
            },
          },
        ],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results[0].status).toBe("rejected")
    expect(json.results[0].error).toContain("Schema error")
  })

  it("5. Handles partial failure in a batch without dropping valid operations", async () => {
    const validOpId = "77777777-7777-4777-8777-777777777777"
    const invalidOpId = "88888888-8888-4888-8888-888888888888"

    const req = new NextRequest("http://localhost:3000/api/offline-sync", {
      method: "POST",
      body: JSON.stringify({
        operations: [
          {
            client_op_id: validOpId,
            table: "health_data",
            type: "INSERT",
            data: { blood_pressure: "120/80", pulse_rate: 72 },
          },
          {
            client_op_id: invalidOpId,
            table: "health_data",
            type: "INSERT",
            data: { pulse_rate: 99999 }, // Outside allowable human range (30-250)
          },
        ],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.results).toEqual([
      { client_op_id: validOpId, status: "ok" },
      {
        client_op_id: invalidOpId,
        status: "rejected",
        error: expect.stringContaining("Schema error"),
      },
    ])

    // Valid op was inserted with forced patient_id
    expect(insertedRecords).toHaveLength(1)
    expect(insertedRecords[0].data[0].patient_id).toBe(dummyPatient.id)
  })

  it("6. Rejects patient attempt to mark an appointment as completed offline", async () => {
    vi.mocked(getPatientProfile).mockResolvedValueOnce({
      ...dummyPatient,
      role: "patient",
    } as any)

    const opId = "99999999-9999-4999-8999-999999999999"
    const req = new NextRequest("http://localhost:3000/api/offline-sync", {
      method: "POST",
      body: JSON.stringify({
        operations: [
          {
            client_op_id: opId,
            table: "appointments",
            type: "UPDATE",
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            data: { status: "completed" },
          },
        ],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results[0].status).toBe("rejected")
    expect(json.results[0].error).toContain("Patients are not authorized to mark appointments as completed")
  })

  it("7. Aborts batch with 500 when idempotency database check fails", async () => {
    mockSupabase.from = vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(async () => ({ data: null, error: { message: "Database connection failed" } })),
        })),
      })),
    }))

    const req = new NextRequest("http://localhost:3000/api/offline-sync", {
      method: "POST",
      body: JSON.stringify({
        operations: [
          {
            client_op_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            table: "medical_records",
            type: "INSERT",
            data: { record_type: "prescription", content: "Valid test" },
          },
        ],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.code).toBe("IDEMPOTENCY_CHECK_FAILED")
  })

  it("8. Successfully processes EAV-formatted vitals data (data_type, value, unit, notes)", async () => {
    const opId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
    const req = new NextRequest("http://localhost:3000/api/offline-sync", {
      method: "POST",
      body: JSON.stringify({
        operations: [
          {
            client_op_id: opId,
            table: "health_data",
            type: "INSERT",
            data: { data_type: "heart_rate", value: 72, unit: "bpm", notes: "Normal resting" },
          },
        ],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results[0].status).toBe("ok")
    expect(insertedRecords).toHaveLength(1)
    expect(insertedRecords[0].data[0].data_type).toBe("heart_rate")
    expect(insertedRecords[0].data[0].value).toBe(72)
  })
})
