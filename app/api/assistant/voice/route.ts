import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { getAssistantVoiceStatus, handleAssistantVoice } from "@/lib/services/assistant-voice.service"
export const runtime = "nodejs"
export async function GET(request: Request) {
  const limit = await checkRateLimit(request, "public")
  if (!limit.success) return rateLimitResponse(limit)
  return getAssistantVoiceStatus()
}
export async function POST(request: Request) {
  const limit = await checkRateLimit(request, "voice")
  if (!limit.success) return rateLimitResponse(limit)
  const response = await handleAssistantVoice(request)
  response.headers.set("Cache-Control", "private, no-store")
  response.headers.set("X-Content-Type-Options", "nosniff")
  return response
}
