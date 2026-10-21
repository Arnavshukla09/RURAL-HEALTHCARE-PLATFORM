/**
 * app/api/ai-chat/route.ts
 *
 * Route handler for Multilingual AI Health Assistant Chat.
 * Architecture: Delegates pipeline execution to lib/services/ai-chat.service.ts
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 */

import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { executeAiChat } from "@/lib/services/ai-chat.service"

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "ai")
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const body = await request.json()
    return await executeAiChat(request, body)
  } catch (error: any) {
    console.error("AI chat server error:", error)
    const errEn =
      "We are currently experiencing connectivity difficulties. If your symptoms are severe, please call 108 or visit your nearest Primary Health Centre."
    const errHi =
      "तकनीकी समस्या के कारण सेवा में बाधा है। यदि लक्षण गंभीर हैं, तो कृपया तुरंत 108 पर कॉल करें या नजदीकी स्वास्थ्य केंद्र जाएँ।"
    return NextResponse.json({
      reply: errEn,
      replyEn: errEn,
      replyHi: errHi,
      fallback: true,
      reason: "internal-exception",
    })
  }
}
