import { describe, it, expect, vi, beforeEach } from "vitest"
import { calculateBackoff, isOnline } from "@/lib/offline/sync"
import {
  checkStorageQuota,
  enqueue,
  listPending,
  listAll,
  markSent,
  deleteOps,
  getOutboxStats,
  markFailed,
  retryOp,
  discardOp,
  purgeSent,
  migrateLegacyLocalStorage,
  OutboxOperation,
} from "@/lib/offline/outbox"

// Mock idb module for in-memory simulated IndexedDB store
let mockStore: Map<string, OutboxOperation>
let mockIndexByStatus: (status: string) => OutboxOperation[]

vi.mock("idb", () => {
  return {
    openDB: vi.fn(async () => {
      return {
        count: vi.fn(async () => mockStore.size),
        put: vi.fn(async (_storeName: string, val: OutboxOperation) => {
          mockStore.set(val.client_op_id, { ...val })
          return val.client_op_id
        }),
        get: vi.fn(async (_storeName: string, key: string) => {
          const item = mockStore.get(key)
          return item ? { ...item } : undefined
        }),
        getAll: vi.fn(async () => {
          return Array.from(mockStore.values()).map((v) => ({ ...v }))
        }),
        getAllFromIndex: vi.fn(async (_storeName: string, _indexName: string, key: string) => {
          return mockIndexByStatus(key)
        }),
        delete: vi.fn(async (_storeName: string, key: string) => {
          mockStore.delete(key)
        }),
        transaction: vi.fn((_storeName: string, _mode: string) => {
          return {
            store: {
              get: vi.fn(async (key: string) => {
                const item = mockStore.get(key)
                return item ? { ...item } : undefined
              }),
              put: vi.fn(async (val: OutboxOperation) => {
                mockStore.set(val.client_op_id, { ...val })
              }),
              delete: vi.fn(async (key: string) => {
                mockStore.delete(key)
              }),
            },
            done: Promise.resolve(),
          }
        }),
      }
    }),
  }
})

describe("Client Offline Resilience & Outbox Lifecycle (Phase 3)", () => {
  beforeEach(() => {
    mockStore = new Map()
    mockIndexByStatus = (status: string) =>
      Array.from(mockStore.values())
        .filter((v) => v.status === status)
        .map((v) => ({ ...v }))

    // Stub window & navigator
    vi.stubGlobal("window", {})
    vi.stubGlobal("navigator", {
      onLine: true,
      storage: {
        estimate: vi.fn(async () => ({ usage: 1048576, quota: 10485760 })), // 10%
      },
    })
  })

  describe("Exponential Backoff & Network Status", () => {
    it("computes jittered exponential backoff with upper bound of 31000ms", () => {
      // attempt 0: base 1000ms + jitter (0-1000ms) -> 1000..2000
      const delay0 = calculateBackoff(0)
      expect(delay0).toBeGreaterThanOrEqual(1000)
      expect(delay0).toBeLessThanOrEqual(2000)

      // attempt 1: base 2000ms + jitter -> 2000..3000
      const delay1 = calculateBackoff(1)
      expect(delay1).toBeGreaterThanOrEqual(2000)
      expect(delay1).toBeLessThanOrEqual(3000)

      // attempt 2: base 4000ms + jitter -> 4000..5000
      const delay2 = calculateBackoff(2)
      expect(delay2).toBeGreaterThanOrEqual(4000)
      expect(delay2).toBeLessThanOrEqual(5000)

      // attempt 10: capped base 30000ms + jitter -> 30000..31000
      const delay10 = calculateBackoff(10)
      expect(delay10).toBeGreaterThanOrEqual(30000)
      expect(delay10).toBeLessThanOrEqual(31000)
    })

    it("correctly identifies online and offline states from navigator.onLine", () => {
      vi.stubGlobal("navigator", { onLine: true })
      expect(isOnline()).toBe(true)

      vi.stubGlobal("navigator", { onLine: false })
      expect(isOnline()).toBe(false)
    })
  })

  describe("Storage Quota Monitoring & Thresholds", () => {
    it("calculates percentage and returns warning=false when usage < 80%", async () => {
      vi.stubGlobal("navigator", {
        storage: {
          estimate: vi.fn(async () => ({ usage: 200, quota: 1000 })), // 20%
        },
      })

      const quota = await checkStorageQuota()
      expect(quota.percent).toBe(20)
      expect(quota.warning).toBe(false)
      expect(quota.usage).toBe(200)
      expect(quota.quota).toBe(1000)
    })

    it("flags warning=true when storage reaches or exceeds 80% threshold", async () => {
      vi.stubGlobal("navigator", {
        storage: {
          estimate: vi.fn(async () => ({ usage: 850, quota: 1000 })), // 85%
        },
      })

      const quota = await checkStorageQuota()
      expect(quota.percent).toBe(85)
      expect(quota.warning).toBe(true)
    })

    it("handles missing or throwing navigator.storage gracefully", async () => {
      vi.stubGlobal("navigator", { storage: undefined })
      const quota = await checkStorageQuota()
      expect(quota).toEqual({ usage: 0, quota: 0, percent: 0, warning: false })
    })
  })

  describe("Outbox Queue Operations", () => {
    it("enqueues an operation with generated UUID, status=pending, and attempts=0", async () => {
      const op = await enqueue({
        table: "medical_records",
        type: "INSERT",
        payload: { record_type: "prescription", content: "Paracetamol 500mg TDS" },
      })

      expect(op.client_op_id).toBeDefined()
      expect(op.table).toBe("medical_records")
      expect(op.type).toBe("INSERT")
      expect(op.status).toBe("pending")
      expect(op.attempts).toBe(0)

      const pending = await listPending()
      expect(pending).toHaveLength(1)
      expect(pending[0].client_op_id).toBe(op.client_op_id)
    })

    it("rejects enqueuing when queue limit of 500 operations is reached", async () => {
      // Simulate 500 items in mock store
      for (let i = 0; i < 500; i++) {
        mockStore.set(`op-${i}`, {
          client_op_id: `op-${i}`,
          table: "health_data",
          type: "INSERT",
          payload: {},
          created_at: new Date().toISOString(),
          attempts: 0,
          status: "pending",
        })
      }

      await expect(
        enqueue({
          table: "health_data",
          type: "INSERT",
          payload: { pulse_rate: 72 },
        })
      ).rejects.toThrow("Outbox queue limit reached (max 500 operations)")
    })

    it("tracks failed attempts and marks status=failed after 5 consecutive failures", async () => {
      const op = await enqueue({
        table: "appointments",
        type: "INSERT",
        payload: { provider_id: "00000000-0000-0000-0000-000000000000", appointment_date: "2026-11-01" },
      })

      // Fail 4 times
      for (let i = 1; i <= 4; i++) {
        await markFailed(op.client_op_id, `Network timeout ${i}`)
        const current = mockStore.get(op.client_op_id)
        expect(current?.attempts).toBe(i)
        expect(current?.status).toBe("pending")
      }

      // 5th failure trips status to "failed"
      await markFailed(op.client_op_id, "Max retries exceeded")
      const finalState = mockStore.get(op.client_op_id)
      expect(finalState?.attempts).toBe(5)
      expect(finalState?.status).toBe("failed")
      expect(finalState?.last_error).toBe("Max retries exceeded")

      const stats = await getOutboxStats()
      expect(stats.failed).toBe(1)
      expect(stats.pending).toBe(0)
    })

    it("allows manual retry to reset status to pending and zero attempts", async () => {
      const op = await enqueue({
        table: "health_data",
        type: "INSERT",
        payload: { blood_sugar: 110 },
      })

      // Trip to failed
      for (let i = 0; i < 5; i++) {
        await markFailed(op.client_op_id, "Error")
      }
      expect(mockStore.get(op.client_op_id)?.status).toBe("failed")

      // Retry
      await retryOp(op.client_op_id)
      const retried = mockStore.get(op.client_op_id)
      expect(retried?.status).toBe("pending")
      expect(retried?.attempts).toBe(0)
      expect(retried?.last_error).toBeUndefined()
    })

    it("discards failed operations when requested by user", async () => {
      const op = await enqueue({
        table: "notifications",
        type: "INSERT",
        payload: { message: "Test alert" },
      })

      await discardOp(op.client_op_id)
      expect(mockStore.has(op.client_op_id)).toBe(false)
    })

    it("permanently deletes acknowledged operations with deleteOps", async () => {
      const op1 = await enqueue({ table: "medical_records", type: "INSERT", payload: { content: "Rec 1" } })
      const op2 = await enqueue({ table: "medical_records", type: "INSERT", payload: { content: "Rec 2" } })

      expect(mockStore.size).toBe(2)
      await deleteOps([op1.client_op_id])
      expect(mockStore.size).toBe(1)
      expect(mockStore.has(op1.client_op_id)).toBe(false)
      expect(mockStore.has(op2.client_op_id)).toBe(true)
    })

    it("marks sent operations and purges them with purgeSent", async () => {
      const op = await enqueue({ table: "health_data", type: "INSERT", payload: { spo2: 98 } })
      await markSent([op.client_op_id])

      expect(mockStore.get(op.client_op_id)?.status).toBe("sent")
      const purged = await purgeSent()
      expect(purged).toBe(1)
      expect(mockStore.has(op.client_op_id)).toBe(false)
    })
  })

  describe("Legacy LocalStorage Migration", () => {
    it("migrates unsynced legacy localStorage items into IndexedDB and cleans up storage key", async () => {
      const legacyItems = [
        { table: "appointments", type: "INSERT", data: { provider_id: "p1" }, synced: false },
        { table: "medical_records", type: "INSERT", data: { content: "v1" }, synced: false },
        { table: "health_data", type: "INSERT", data: { temp: 98 }, synced: true }, // already synced, should skip
      ]

      const localStore: Record<string, string> = {
        rhcp_offline_operations: JSON.stringify(legacyItems),
      }

      vi.stubGlobal("localStorage", {
        getItem: vi.fn((key: string) => localStore[key] || null),
        removeItem: vi.fn((key: string) => {
          delete localStore[key]
        }),
      })

      const count = await migrateLegacyLocalStorage()
      expect(count).toBe(2)
      expect(mockStore.size).toBe(2)
      expect(localStore["rhcp_offline_operations"]).toBeUndefined()
    })
  })
})
