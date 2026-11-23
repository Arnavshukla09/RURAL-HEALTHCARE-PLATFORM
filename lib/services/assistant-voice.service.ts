import { NextResponse } from "next/server"
import { z } from "zod"
import { publicVoiceCapabilities, readBoundedVoiceResponse, readVoiceJson } from "./voice-response"
import { ASSISTANT_CONFIG } from "@/lib/assistant/config"
import { getVoiceServiceUrl } from "@/lib/services/voice-config"

const language = z.enum(["en", "hi", "mr", "bn", "te", "ta", "gu", "kn", "pa", "or", "ml", "as", "ur"])
const SpeechSchema = z.object({ task: z.literal("speak"), language, text: z.string().trim().min(1).max(ASSISTANT_CONFIG.maxSpeechCharacters) }).strict()
const ChatSchema = z.object({ task: z.literal("chat"), language, text: z.string().trim().min(1).max(800) }).strict()

function upstreamHeaders(): Record<string, string> {
  const token = process.env.VOICE_SERVICE_TOKEN?.trim()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
async function boundedRequest(request: Request): Promise<Request> {
  const limit = request.headers.get("content-type")?.includes("multipart/form-data") ? ASSISTANT_CONFIG.maxAudioBytes + 8192 : 8000
  const reader = request.body?.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  if (reader) while (true) {
    const { value, done } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > limit) { await reader.cancel(); throw new RangeError("Request too large") }
    chunks.push(value)
  }
  const body = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
  return new Request(request.url, { method: "POST", headers: request.headers, body })
}

export async function getAssistantVoiceStatus() {
  let base: string | null
  try { base = getVoiceServiceUrl() }
  catch { return NextResponse.json({ available: false, protocolVersion: 1, asrLanguages: [], ttsLanguages: [], reason: "CONFIGURATION_INVALID" }, { headers: { "Cache-Control": "no-store" } }) }
  if (!base) return NextResponse.json({ available: false, protocolVersion: 1, asrLanguages: [], ttsLanguages: [], reason: "NOT_CONFIGURED" }, { headers: { "Cache-Control": "no-store" } })
  try {
    const response = await fetch(`${base}/v1/health`, { headers: upstreamHeaders(), redirect: "error", signal: AbortSignal.timeout(2000), cache: "no-store" })
    if (!response.ok) throw new Error("Voice service unavailable")
    const data = await readVoiceJson(response)
    return NextResponse.json(publicVoiceCapabilities(data), { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ available: false, protocolVersion: 1, asrLanguages: [], ttsLanguages: [], reason: "SERVICE_UNAVAILABLE" }, { headers: { "Cache-Control": "no-store" } })
  }
}

export async function handleAssistantVoice(request: Request) {
  let base: string | null
  try { base = getVoiceServiceUrl() }
  catch { return NextResponse.json({ error: "Remote speech service requires secure configuration", code: "VOICE_CONFIGURATION_INVALID" }, { status: 503 }) }
  if (!base) return NextResponse.json({ error: "Local speech service is not configured", code: "VOICE_UNAVAILABLE" }, { status: 503 })
  const declaredSize = Number(request.headers.get("content-length") || 0)
  if (declaredSize > ASSISTANT_CONFIG.maxAudioBytes + 4096) return NextResponse.json({ error: "Audio too large" }, { status: 413 })
  try {
    const type = request.headers.get("content-type") || ""
    if (!type.includes("application/json") && !type.includes("multipart/form-data")) return NextResponse.json({ error: "Unsupported content type", code: "VALIDATION_ERROR" }, { status: 415 })
    request = await boundedRequest(request)
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const body = await request.formData()
      const parsedLanguage = language.safeParse(body.get("language"))
      const audio = body.get("audio")
      if (body.get("task") !== "transcribe" || !parsedLanguage.success || !(audio instanceof File) || audio.size > ASSISTANT_CONFIG.maxAudioBytes || audio.size < 44) {
        return NextResponse.json({ error: "Invalid audio request", code: "VALIDATION_ERROR" }, { status: 400 })
      }
      const wave = new Uint8Array(await audio.slice(0, 12).arrayBuffer())
      if (String.fromCharCode(...wave.slice(0, 4)) !== "RIFF" || String.fromCharCode(...wave.slice(8, 12)) !== "WAVE") {
        return NextResponse.json({ error: "PCM WAV audio required", code: "VALIDATION_ERROR" }, { status: 400 })
      }
      const forwarded = new FormData()
      forwarded.set("language", parsedLanguage.data)
      forwarded.set("audio", audio, "utterance.wav")
      const response = await fetch(`${base}/v1/transcribe`, { method: "POST", headers: upstreamHeaders(), body: forwarded, redirect: "error", signal: AbortSignal.timeout(ASSISTANT_CONFIG.requestTimeoutMs) })
      if (!response.ok) return NextResponse.json({ error: "Speech recognition unavailable", code: "VOICE_UNAVAILABLE" }, { status: 503 })
      const data = await readVoiceJson(response)
      if (typeof data.transcript !== "string") throw new Error("Invalid speech response")
      return NextResponse.json({ transcript: data.transcript.slice(0, 2000), language: parsedLanguage.data }, { headers: { "Cache-Control": "no-store" } })
    }
    const raw = await request.text()
    if (raw.length > 8000) return NextResponse.json({ error: "Request too large" }, { status: 413 })
    const body = JSON.parse(raw)
    if (body.task === "chat") {
      const parsed = ChatSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ error: "Invalid conversation request", code: "VALIDATION_ERROR" }, { status: 400 })
      const response = await fetch(`${base}/v1/chat`, { method: "POST", headers: { ...upstreamHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), redirect: "error", signal: AbortSignal.timeout(30000) })
      if (!response.ok) return NextResponse.json({ error: "Local conversation unavailable", code: "VOICE_UNAVAILABLE" }, { status: 503 })
      const data = await readVoiceJson(response)
      if (typeof data.reply !== "string") throw new Error("Invalid conversation response")
      return NextResponse.json({ reply: data.reply.slice(0, 1200), language: parsed.data.language }, { headers: { "Cache-Control": "private, no-store" } })
    }
    const parsed = SpeechSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid speech request", code: "VALIDATION_ERROR" }, { status: 400 })
    const response = await fetch(`${base}/v1/speak`, { method: "POST", headers: { ...upstreamHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), redirect: "error", signal: AbortSignal.timeout(ASSISTANT_CONFIG.requestTimeoutMs) })
    if (!response.ok || !response.headers.get("content-type")?.includes("audio/wav")) return NextResponse.json({ error: "Speech synthesis unavailable", code: "VOICE_UNAVAILABLE" }, { status: 503 })
    const audio = await readBoundedVoiceResponse(response, 4 * 1024 * 1024)
    if (audio.length < 44 || new TextDecoder().decode(audio.slice(0, 4)) !== "RIFF" || new TextDecoder().decode(audio.slice(8, 12)) !== "WAVE") throw new Error("Invalid WAV response")
    return new NextResponse(audio.buffer as ArrayBuffer, { headers: { "Content-Type": "audio/wav", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } })
  } catch (error) {
    if (error instanceof RangeError) return NextResponse.json({ error: "Request or response too large", code: "VALIDATION_ERROR" }, { status: 413 })
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON", code: "VALIDATION_ERROR" }, { status: 400 })
    return NextResponse.json({ error: "Speech service unavailable", code: "VOICE_UNAVAILABLE" }, { status: 503 })
  }
}
