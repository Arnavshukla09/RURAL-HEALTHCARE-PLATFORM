import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { getAssistantVoiceStatus, handleAssistantVoice } from "@/lib/services/assistant-voice.service"
export const runtime = "nodejs"
export async function GET(request: Request) {
  const limit = await checkRateLimit(request, "public")
  if (!limit.success) return rateLimitResponse(limit)
  return getAssistantVoiceStatus()
}
export async function POST(request: Request) {
  const limit = await checkRateLimit(request, "public")
  if (!limit.success) return rateLimitResponse(limit)
  return handleAssistantVoice(request)
}
