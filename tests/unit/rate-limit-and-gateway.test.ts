import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  clientKey,
  createLimiter,
  checkRateLimit,
} from "@/lib/rate-limit"
import { isLoadTest } from "@/lib/loadtest"
import {
  executeWithAiGateway,
  resetCircuitBreaker,
  getAiGatewayStatus,
  AiGatewayError,
} from "@/lib/ai/gateway"

describe("Rate Limiting Engine & Staging Load-Test Mode (Audit H4)", () => {
  it("1. clientKey extracts user ID when authenticated", () => {
    const req = new Request("http://localhost/api/appointments", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    })
    const key = clientKey(req, "usr_12345")
    expect(key).toBe("user:usr_12345")
  })

  it("2. clientKey takes ONLY the first hop of x-forwarded-for for anonymous requests (Audit H4)", () => {
    const req = new Request("http://localhost/api/appointments", {
      headers: { "x-forwarded-for": "  203.0.113.195 , 198.51.100.17 " },
    })
    const key = clientKey(req, null)
    expect(key).toBe("ip:203.0.113.195")
  })

  it("3. Rate limiter enforces sliding limits and provides retry-after", async () => {
    const testLimiter = createLimiter({
      name: "unit_test_limiter",
      limit: 3,
      windowSeconds: 2,
    })

    const r1 = await testLimiter("test_client_a")
    expect(r1.success).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = await testLimiter("test_client_a")
    expect(r2.success).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = await testLimiter("test_client_a")
    expect(r3.success).toBe(true)
    expect(r3.remaining).toBe(0)

    // 4th request must be blocked
    const r4 = await testLimiter("test_client_a")
    expect(r4.success).toBe(false)
    expect(r4.remaining).toBe(0)
    expect(r4.retryAfter).toBeGreaterThan(0)
  })

  it("4. Staging load-test mode: strictly inert unless LOADTEST_ENABLED=1 and secret key matches", async () => {
    const originalEnv = process.env

    try {
      process.env = { ...originalEnv }
      delete process.env.LOADTEST_ENABLED
      delete process.env.LOADTEST_KEY

      // Without env vars: false even if header sent
      const reqWithHeader = new Request("http://localhost/api/appointments", {
        headers: { "x-loadtest-key": "secret123" },
      })
      expect(isLoadTest(reqWithHeader)).toBe(false)

      // With wrong key: false
      process.env.LOADTEST_ENABLED = "1"
      process.env.LOADTEST_KEY = "super_secret_loadtest_key"
      expect(isLoadTest(reqWithHeader)).toBe(false)

      // With exact matching secret key: true
      const validReq = new Request("http://localhost/api/appointments", {
        headers: { "x-loadtest-key": "super_secret_loadtest_key" },
      })
      expect(isLoadTest(validReq)).toBe(true)

      // Bypasses rate limiter
      const rl = await checkRateLimit(validReq, "write")
      expect(rl.success).toBe(true)
      expect(rl.limit).toBe(999999)
    } finally {
      process.env = originalEnv
    }
  })
})

describe("AI Gateway & Circuit Breaker (Audit M4)", () => {
  beforeEach(() => {
    resetCircuitBreaker()
  })

  it("5. Trips circuit breaker open after 5 consecutive upstream failures", async () => {
    const failingFn = vi.fn().mockRejectedValue(new Error("Upstream Gemini 503"))

    // Fail 5 times in a row
    for (let i = 0; i < 5; i++) {
      await expect(
        executeWithAiGateway("user_test_breaker", failingFn)
      ).rejects.toThrow("Upstream Gemini 503")
    }

    const status = getAiGatewayStatus()
    expect(status.circuitState).toBe("open")
    expect(status.consecutiveFailures).toBe(5)

    // 6th call should immediately fail-fast with CIRCUIT_OPEN error without calling the function
    const probeFn = vi.fn()
    await expect(
      executeWithAiGateway("user_test_breaker", probeFn)
    ).rejects.toThrow(AiGatewayError)

    expect(probeFn).not.toHaveBeenCalled()
  })

  it("6. Times out slow upstream requests exceeding threshold", async () => {
    const slowFn = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    )

    await expect(
      executeWithAiGateway("user_test_timeout", slowFn, 50) // 50ms timeout limit
    ).rejects.toThrow(AiGatewayError)
  })

  it("7. Recovers circuit breaker to closed upon successful execution", async () => {
    const successFn = vi.fn().mockResolvedValue({ text: "Hello" })
    const res = await executeWithAiGateway("user_test_success", successFn)

    expect(res).toEqual({ text: "Hello" })
    const status = getAiGatewayStatus()
    expect(status.circuitState).toBe("closed")
    expect(status.consecutiveFailures).toBe(0)
  })
})
