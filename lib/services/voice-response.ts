import { ASSISTANT_LANGUAGES } from "@/lib/assistant/languages"

export async function readBoundedVoiceResponse(response: Response, limit: number): Promise<Uint8Array> {
  if (Number(response.headers.get("content-length")) > limit) { await response.body?.cancel(); throw new RangeError("Upstream response exceeds limit") }
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []; let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) { await reader.cancel(); throw new RangeError("Upstream response exceeds limit") }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size); let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return bytes
}
export async function readVoiceJson(response: Response) {
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Expected JSON")
  return JSON.parse(new TextDecoder().decode(await readBoundedVoiceResponse(response, 16000)))
}
export function publicVoiceCapabilities(data: Record<string, unknown>) {
  if (data.protocolVersion !== 1) throw new Error("Unsupported voice protocol")
  const languages = (value: unknown) => Array.isArray(value) ? ASSISTANT_LANGUAGES.map(entry => entry.code).filter(code => value.includes(code)) : []
  const asrLanguages = languages(data.asrLanguages), ttsLanguages = languages(data.ttsLanguages)
  return { available: data.available === true && Boolean(asrLanguages.length || ttsLanguages.length), protocolVersion: 1, asrLanguages, ttsLanguages, conversationAvailable: data.conversationAvailable === true }
}
