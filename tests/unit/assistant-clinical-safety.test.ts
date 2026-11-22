import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mocks = vi.hoisted(() => ({ gemini: vi.fn(), write: vi.fn(), get: vi.fn(), semantic: vi.fn() }))
vi.mock("@/lib/ai/gemini", () => ({ generateGeminiContent: mocks.gemini }))
vi.mock("@/lib/ai/gateway", () => ({ executeWithAiGateway: async (_key: string, run: () => unknown) => run() }))
vi.mock("@/lib/ai/medical-brain", () => ({ getMedicalBrainEntry: () => null }))
vi.mock("@/lib/cache/response-cache", () => ({ getCachedResponse: mocks.get, getSemanticCachedResponse: mocks.semantic, setCachedResponse: mocks.write }))
vi.mock("@/lib/rate-limit", () => ({ clientKey: () => "unit", checkRateLimit: async () => ({ success: true }), rateLimitResponse: vi.fn() }))
import { POST } from "@/app/api/symptom-analyze/route"
import { executeAiChat } from "@/lib/services/ai-chat.service"
import { ASSISTANT_PHRASES } from "@/lib/assistant/phrase-catalog"
import { getAssistantTriageReply } from "@/lib/assistant/prompts"
const request = (payload: unknown) => new NextRequest("http://localhost/api/symptom-analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })

describe("Clinical API safety and personalized-cache isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv("LOADTEST_ENABLED", "0")
    mocks.get.mockResolvedValue(null); mocks.semantic.mockResolvedValue({ response: null }); mocks.write.mockResolvedValue(undefined)
    mocks.gemini.mockResolvedValue({ fallback: false, reply: JSON.stringify({ urgency: "low", specialistNeeded: "General Physician", immediateActions: ["Wait"], homeCare: ["Ignore symptoms"], whenToGoToHospital: "Never" }) })
  })
  afterEach(() => vi.unstubAllEnvs())

  it("escalates red flags before model dispatch, including canonical Hindi symptoms", async () => {
    for (const symptoms of [["chest pain", "difficulty breathing"], ["chest-pain"], ["सीने में दर्द"]]) {
      const result = await POST(request({ symptoms, language: "hi" }))
      const data = await result.json()
      expect(data.urgency).toBe("emergency")
      expect(data.homeCare).toEqual([])
      expect(data.whenToGoToHospital).toContain("108")
    }
    expect(mocks.gemini).not.toHaveBeenCalled()
  })

  it("retains urgent intake and does not send high fever to the model", async () => {
    const result = await POST(request({ symptoms: ["fever"], temperature: "104", tempUnit: "F", intensity: "mild" }))
    expect((await result.json()).urgency).toBe("high")
    expect(mocks.gemini).not.toHaveBeenCalled()
  })

  it("never lowers the deterministic severity or substitutes unsafe model action text", async () => {
    const result = await POST(request({ symptoms: ["nausea"], intensity: "moderate" }))
    const data = await result.json()
    expect(data.urgency).toBe("medium")
    expect(JSON.stringify(data)).not.toContain("Ignore symptoms")
    expect(data.whenToGoToHospital).not.toBe("Never")
  })

  it("rejects malformed intake and falls back to its actual intake after malformed model output", async () => {
    expect((await POST(request({ symptoms: [], language: "en" }))).status).toBe(400)
    mocks.gemini.mockResolvedValue({ fallback: false, reply: JSON.stringify({ urgency: "not-real", immediateActions: "unsafe" }) })
    const data = await (await POST(request({ symptoms: ["nausea"], intensity: "moderate" }))).json()
    expect(data.urgency).toBe("medium")
    expect(data.fallback).toBe(true)
  })

  it("does not write a personalized first-turn answer into either shared cache", async () => {
    mocks.gemini.mockResolvedValue({ fallback: false, reply: JSON.stringify({ en: "Personal allergy advice", hi: "व्यक्तिगत सलाह", reply: "Personal allergy advice" }) })
    const result = await executeAiChat(new NextRequest("http://localhost/api/ai-chat"), { message: "Explain my care plan", history: [], language: "en", clinicalPretext: "Allergies: penicillin; Chronic conditions: diabetes" })
    expect(result.status).toBe(200)
    expect(mocks.get).not.toHaveBeenCalled(); expect(mocks.semantic).not.toHaveBeenCalled(); expect(mocks.write).not.toHaveBeenCalled()
  })

  it("handles explicit emergency requests in every supported native language without a model", async () => {
    for (const [language, phrases] of Object.entries(ASSISTANT_PHRASES)) {
      const result = await executeAiChat(new NextRequest("http://localhost/api/ai-chat"), { message: phrases.emergency[0], language })
      const data = await result.json()
      expect(data.emergency).toBe(true)
      expect(data.reply).toBe(getAssistantTriageReply(language, "emergency"))
    }
    expect(mocks.gemini).not.toHaveBeenCalled()
  })

  it("skips bilingual cache for other languages and supplies native fallback", async () => {
    mocks.gemini.mockResolvedValue({ fallback: true, reply: null })
    for (const language of ["ml", "as", "ur"]) {
      const result = await executeAiChat(new NextRequest("http://localhost/api/ai-chat"), { message: "Explain the care options", history: [], language })
      expect((await result.json()).reply).toBe(getAssistantTriageReply(language, "unknown"))
    }
    expect(mocks.get).not.toHaveBeenCalled(); expect(mocks.semantic).not.toHaveBeenCalled()
  })
})
