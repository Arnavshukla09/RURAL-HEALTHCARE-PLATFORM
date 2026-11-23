import { describe, expect, it } from "vitest"
import { canUseDeviceRecognition, canUseOwnedSynthesis } from "@/lib/assistant/speech-fallback"
import type { SpeechCapabilities } from "@/lib/ai/speech"
describe("speech fallback boundaries", () => {
  it("allows vendor recognition only online or with a verified local pack", () => {
    const capabilities = { recognitionSupported: true, recognitionOffline: "unknown" } as SpeechCapabilities
    expect(canUseDeviceRecognition(capabilities, true)).toBe(true)
    expect(canUseDeviceRecognition(capabilities, false)).toBe(false)
    expect(canUseDeviceRecognition({ ...capabilities, recognitionOffline: "available" }, false)).toBe(true)
    expect(canUseDeviceRecognition({ ...capabilities, recognitionSupported: false }, true)).toBe(false)
  })
  it("never substitutes an unavailable language or unreachable owned speaker", () => {
    const service = { available: true, ttsLanguages: ["en", "hi"] }
    expect(canUseOwnedSynthesis(service, "hi", true)).toBe(true)
    expect(canUseOwnedSynthesis(service, "as", true)).toBe(false)
    expect(canUseOwnedSynthesis(service, "hi", false)).toBe(false)
    expect(canUseOwnedSynthesis({ ...service, available: false }, "hi", true)).toBe(false)
  })
})
