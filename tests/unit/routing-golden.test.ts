import { describe, it, expect, vi } from "vitest"
import { routeChatMessage } from "@/lib/chat/router"
import cases from "../chat-routing.cases.json"

describe("Chat Routing Golden Cases", () => {
  it("routes all 40 golden cases to their intended architectural tiers", async () => {
    // Mock fetch for Tier 3 calls to avoid external network dependencies
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes("/api/ai-chat")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ reply: "Mocked Gemini reply", model: "gemini-3.5-flash" }),
        })
      }
      return Promise.reject(new Error("Unknown route"))
    })

    for (const testCase of cases) {
      const result = await routeChatMessage({
        message: testCase.input,
        language: "en",
      })

      expect(
        result.tier,
        `Query "${testCase.input}" expected tier ${testCase.expectedTier} but got ${result.tier}`
      ).toBe(testCase.expectedTier)
    }
  })
})
