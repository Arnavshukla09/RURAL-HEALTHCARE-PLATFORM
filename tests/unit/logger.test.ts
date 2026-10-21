import { describe, it, expect, vi } from "vitest"
import { hashUserId, getRequestId, logInfo, logWarn, logError } from "@/lib/logger"

describe("Structured Logger & Observability (Phase 8, Audit M6)", () => {
  it("hashUserId hashes user ID to 12-character hex and preserves privacy", () => {
    const rawUuid = "11111111-2222-3333-4444-555555555555"
    const hash = hashUserId(rawUuid)

    expect(hash).toBeDefined()
    expect(hash).toHaveLength(12)
    expect(hash).not.toContain(rawUuid)
    expect(hashUserId(null)).toBeUndefined()
    expect(hashUserId(undefined)).toBeUndefined()
  })

  it("getRequestId retrieves existing x-request-id header", () => {
    const req = new Request("http://localhost:3000/api/health", {
      headers: { "x-request-id": "custom-req-id-12345" },
    })

    const reqId = getRequestId(req)
    expect(reqId).toBe("custom-req-id-12345")
  })

  it("getRequestId generates a fresh UUID if header is missing", () => {
    const req = new Request("http://localhost:3000/api/health")
    const reqId = getRequestId(req)

    expect(reqId).toBeDefined()
    expect(reqId.length).toBeGreaterThan(10)
  })

  it("emits structured JSON to console.log/warn/error", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    logInfo("Request processed successfully", {
      requestId: "req-1",
      route: "/api/health",
      status: 200,
      durationMs: 42,
      userId: "user-abc-123",
    })

    expect(logSpy).toHaveBeenCalledTimes(1)
    const logArg = JSON.parse(logSpy.mock.calls[0][0])
    expect(logArg.level).toBe("info")
    expect(logArg.message).toBe("Request processed successfully")
    expect(logArg.requestId).toBe("req-1")
    expect(logArg.status).toBe(200)
    expect(logArg.durationMs).toBe(42)
    expect(logArg.userIdHash).toBeDefined()
    expect(logArg.userId).toBeUndefined() // Raw user ID MUST NOT be in output!

    logWarn("Rate limit threshold approaching", { requestId: "req-2", status: 429 })
    expect(warnSpy).toHaveBeenCalledTimes(1)
    const warnArg = JSON.parse(warnSpy.mock.calls[0][0])
    expect(warnArg.level).toBe("warn")

    logError("Database query failed", { requestId: "req-3", status: 500 }, new Error("DB Connection Reset"))
    expect(errorSpy).toHaveBeenCalledTimes(1)
    const errorArg = JSON.parse(errorSpy.mock.calls[0][0])
    expect(errorArg.level).toBe("error")
    expect(errorArg.errorMessage).toBe("DB Connection Reset")

    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
