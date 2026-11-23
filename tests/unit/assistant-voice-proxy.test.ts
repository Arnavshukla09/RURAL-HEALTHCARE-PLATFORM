import { afterEach, describe, expect, it, vi } from "vitest"
import { ASSISTANT_CONFIG } from "@/lib/assistant/config"
import { getVoiceServiceUrl } from "@/lib/services/voice-config"
import { getAssistantVoiceStatus, handleAssistantVoice } from "@/lib/services/assistant-voice.service"
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
describe("Owned voice adapter protocol and boundaries", () => {
  it("uses a stable port and does not contact an unconfigured service", async () => {
    vi.stubEnv("VOICE_SERVICE_URL", "")
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher)
    expect(ASSISTANT_CONFIG.voiceServicePort).toBe(8765)
    expect(await (await getAssistantVoiceStatus()).json()).toMatchObject({ available: false, reason: "NOT_CONFIGURED" })
    expect(fetcher).not.toHaveBeenCalled()
  })
  it("rejects remote plaintext origins and credential/query/path injection", () => {
    for (const url of ["http://public.example.com:8765", "https://user:pass@host.example", "https://host.example?token=x", "https://host.example/arbitrary/path", "file:///tmp/voice"]) {
      vi.stubEnv("VOICE_SERVICE_URL", url)
      expect(() => getVoiceServiceUrl()).toThrow()
    }
    vi.stubEnv("VOICE_SERVICE_URL", "http://127.0.0.1:8765")
    expect(getVoiceServiceUrl()).toBe("http://127.0.0.1:8765")
  })
  it("refuses invalid language/text and caller-specified host fields before forwarding", async () => {
    vi.stubEnv("VOICE_SERVICE_URL", "http://127.0.0.1:8765")
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher)
    for (const body of [{ task: "speak", language: "xx", text: "Hello" }, { task: "speak", language: "en", text: "x".repeat(1201) }, { task: "speak", language: "en", text: "Hello", url: "http://attacker.example" }]) {
      const response = await handleAssistantVoice(new Request("http://localhost/api/assistant/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }))
      expect(response.status).toBe(400)
    }
    expect(fetcher).not.toHaveBeenCalled()
  })
  it("does not accept non-WAV files as recorded audio", async () => {
    vi.stubEnv("VOICE_SERVICE_URL", "http://127.0.0.1:8765")
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher)
    const form = new FormData(); form.set("task", "transcribe"); form.set("language", "as"); form.set("audio", new Blob(["x".repeat(100)]), "input.wav")
    const response = await handleAssistantVoice(new Request("http://localhost/api/assistant/voice", { method: "POST", body: form }))
    expect(response.status).toBe(400)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it("bounds the actual body without trusting a content-length header", async () => {
    vi.stubEnv("VOICE_SERVICE_URL", "http://127.0.0.1:8765")
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher)
    const request = new Request("http://localhost/api/assistant/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: "x".repeat(9000) })
    expect((await handleAssistantVoice(request)).status).toBe(413)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it("keeps service tokens server-side and forwards all13 locale tags unchanged", async () => {
    vi.stubEnv("VOICE_SERVICE_URL", "http://127.0.0.1:8765"); vi.stubEnv("VOICE_SERVICE_TOKEN", "review-only-token")
    const wav = new Uint8Array(44); wav.set(new TextEncoder().encode("RIFF")); wav.set(new TextEncoder().encode("WAVE"), 8)
    const fetcher = vi.fn(async () => new Response(wav, { headers: { "Content-Type": "audio/wav" } })); vi.stubGlobal("fetch", fetcher)
    for (const language of ["en", "hi", "mr", "bn", "te", "ta", "gu", "kn", "pa", "or", "ml", "as", "ur"]) {
      const response = await handleAssistantVoice(new Request("http://localhost/api/assistant/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "speak", language, text: "Hello" }) }))
      expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toContain("no-store")
    }
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8765/v1/speak", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer review-only-token" }) }))
  })

  it("exposes only canonical capabilities and rejects upstream redirects", async () => {
    vi.stubEnv("VOICE_SERVICE_URL", "http://127.0.0.1:8765")
    const fetcher = vi.fn(async () => Response.json({ protocolVersion: 1, available: true, asrLanguages: ["en", "unknown", "en"], ttsLanguages: ["hi"], conversationAvailable: true, modelRevision: { internal: "private-path" }, token: "not-for-browser" })); vi.stubGlobal("fetch", fetcher)
    const result = await (await getAssistantVoiceStatus()).json()
    expect(result).toEqual({ protocolVersion: 1, available: true, asrLanguages: ["en"], ttsLanguages: ["hi"], conversationAvailable: true })
    expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ redirect: "error" }))
  })
  it("rejects oversized and invalid upstream responses without disclosing their contents", async () => {
    vi.stubEnv("VOICE_SERVICE_URL", "http://127.0.0.1:8765")
    for (const response of [Response.json({ protocolVersion: 9, error: "private-path" }), new Response("x".repeat(17000), { headers: { "Content-Type": "application/json" } })]) {
      vi.stubGlobal("fetch", vi.fn(async () => response))
      const result = await getAssistantVoiceStatus()
      expect(await result.json()).toMatchObject({ available: false, reason: "SERVICE_UNAVAILABLE" })
    }
  })
  it("rejects missing JSON content type and non-WAV synthesis output", async () => {
    vi.stubEnv("VOICE_SERVICE_URL", "http://127.0.0.1:8765")
    const fetcher = vi.fn(async () => new Response("internal-stack", { headers: { "Content-Type": "audio/wav" } })); vi.stubGlobal("fetch", fetcher)
    const body = JSON.stringify({ task: "speak", language: "en", text: "Hello" })
    expect((await handleAssistantVoice(new Request("http://localhost/api/assistant/voice", { method: "POST", body }))).status).toBe(415)
    const result = await handleAssistantVoice(new Request("http://localhost/api/assistant/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body }))
    expect(result.status).toBe(503)
    expect(await result.text()).not.toContain("internal-stack")
  })

  it("fails closed for a remote HTTPS service without a token, but accepts explicit authenticated remote configuration", async () => {
    vi.stubEnv("VOICE_SERVICE_URL", "https://clinic-voice.example")
    vi.stubEnv("VOICE_SERVICE_TOKEN", "")
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher)
    expect(() => getVoiceServiceUrl()).toThrow("require VOICE_SERVICE_TOKEN")
    expect(await (await getAssistantVoiceStatus()).json()).toMatchObject({ available: false, reason: "CONFIGURATION_INVALID" })
    const blocked = await handleAssistantVoice(new Request("http://localhost/api/assistant/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "speak", language: "en", text: "Hello" }) }))
    expect(blocked.status).toBe(503)
    expect((await blocked.json()).code).toBe("VOICE_CONFIGURATION_INVALID")
    expect(fetcher).not.toHaveBeenCalled()
    vi.stubEnv("VOICE_SERVICE_TOKEN", "owner-installed-token")
    expect(getVoiceServiceUrl()).toBe("https://clinic-voice.example")
  })
})
