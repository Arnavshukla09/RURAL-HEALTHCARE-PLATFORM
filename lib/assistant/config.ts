/** Stable assistant contracts. Optional inference is owned infrastructure, never a paid API. */
export const ASSISTANT_CONFIG = Object.freeze({
  protocolVersion: 1,
  voiceServicePort: 8765,
  requestTimeoutMs: 30000,
  maxRecordingSeconds: 20,
  maxAudioBytes: 2 * 1024 * 1024,
  maxSpeechCharacters: 1200,
  sessionKey: "rhcp_assistant_session",
})

export function getVoiceServiceUrl(): string | null {
  const configured = process.env.VOICE_SERVICE_URL?.trim()
  if (!configured) return null
  const url = new URL(configured)
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("VOICE_SERVICE_URL must be an HTTP(S) origin without credentials")
  }
  if (url.pathname !== "/") throw new Error("VOICE_SERVICE_URL must be an origin without a path")
  if (url.protocol === "http:" && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
    throw new Error("Remote voice services must use HTTPS")
  }
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) && !process.env.VOICE_SERVICE_TOKEN?.trim()) {
    throw new Error("Remote voice services require VOICE_SERVICE_TOKEN")
  }
  return url.origin
}
