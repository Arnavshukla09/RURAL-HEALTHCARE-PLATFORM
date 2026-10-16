import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET as readyGET } from "@/app/api/ready/route"

// Mock Supabase server client
let mockSelectResult: { error: any } = { error: null }
let shouldThrow = false

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => {
    if (shouldThrow) {
      throw new Error("Connection refused")
    }
    return {
      from: vi.fn((_table: string) => ({
        select: vi.fn((_cols: string) => ({
          limit: vi.fn(async (_count: number) => mockSelectResult),
        })),
      })),
    }
  }),
}))

// Mock Redis
vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: vi.fn(() => ({
      ping: vi.fn(async () => "PONG"),
    })),
  },
}))

// Mock AI Gateway
vi.mock("@/lib/ai/gateway", () => ({
  getAiGatewayStatus: vi.fn(() => ({
    circuitState: "CLOSED",
    consecutiveFailures: 0,
  })),
}))

import { GET as healthGET } from "@/app/api/health/route"

describe("Readiness, Liveness Probes & Edge Verification (Phase 4)", () => {
  beforeEach(() => {
    mockSelectResult = { error: null }
    shouldThrow = false
  })

  describe("GET /api/ready", () => {
    it("returns HTTP 200 with ready=true and service name", async () => {
      const res = await readyGET()
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.ready).toBe(true)
      expect(json.service).toBe("rural-healthcare-platform")
      expect(json.version).toBeDefined()
      expect(json.timestamp).toBeDefined()
      expect(res.headers.get("Cache-Control")).toBe("no-store")
    })
  })

  describe("GET /api/health", () => {
    it("returns HTTP 200 and status=ok when database is connected", async () => {
      mockSelectResult = { error: null }
      const res = await healthGET()
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.status).toBe("ok")
      expect(json.service).toBe("rural-healthcare-platform")
      expect(json.database).toBe("connected")
      expect(json.ai_circuit).toBe("CLOSED")
      expect(json.durationMs).toBeGreaterThanOrEqual(0)
      expect(res.headers.get("Cache-Control")).toContain("no-store")
    })

    it("returns HTTP 503 and status=degraded when database query returns error", async () => {
      mockSelectResult = { error: { message: "Query timeout" } }
      const res = await healthGET()
      expect(res.status).toBe(503)

      const json = await res.json()
      expect(json.status).toBe("degraded")
      expect(json.database).toBe("degraded")
    })

    it("returns HTTP 503 and status=degraded when database client throws an exception", async () => {
      shouldThrow = true
      const res = await healthGET()
      expect(res.status).toBe(503)

      const json = await res.json()
      expect(json.status).toBe("degraded")
      expect(json.database).toBe("unavailable")
    })
  })
})
