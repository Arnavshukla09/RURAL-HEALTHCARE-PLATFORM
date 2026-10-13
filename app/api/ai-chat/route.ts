import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit, rateLimitResponse, clientKey } from "@/lib/rate-limit"
import { detectTier0Emergency } from "@/lib/chat/emergency"
import { answerMedicalQuery, getMedicalBrainEntry } from "@/lib/ai/medical-brain"
import { generateGeminiContent, GeminiContent } from "@/lib/ai/gemini"
import { getCachedResponse, setCachedResponse, getSemanticCachedResponse } from "@/lib/cache/response-cache"
import { isLoadTest, stubDelay } from "@/lib/loadtest"
import { executeWithAiGateway } from "@/lib/ai/gateway"

const SYSTEM_PROMPT = `You are a helpful, culturally sensitive AI health assistant for rural communities in India.
Follow these clinical safety rules strictly:
1. Always remind the user to consult an ASHA worker, ANM, or visit their nearest Primary Health Centre (PHC) / Community Health Centre (CHC).
2. For severe symptoms (chest pain, severe breathing difficulty, sudden weakness, unconsciousness), tell them to call 108 ambulance immediately.
3. Suggest safe, practical home care and simple remedies using locally available ingredients (ORS, boiled water, ginger, tulsi, light khichdi).
4. Never prescribe specific prescription drug doses (e.g. antibiotic dosages). Direct the patient to follow medication labels or consult a local doctor/pharmacist.
5. Keep explanations simple, reassuring, and concise (under 120 words).
6. Always answer in the requested language (Hindi or English).`

export async function POST(request: NextRequest) {
  try {
    // 1. Route-class rate limiting (Audit H4)
    const rl = await checkRateLimit(request, "ai")
    if (!rl.success) {
      return rateLimitResponse(rl)
    }

    const body = await request.json()
    const { message, history, language } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const sanitizedMessage = message.trim().slice(0, 1000)
    const lang = language === "hi" ? "hi" : "en"

    // 2. Server-side Tier 0 Emergency Gate (Deterministic, 0ms, No LLM Call)
    // Ensures direct API callers, mobile apps, or fallback requests never bypass critical emergency triage
    const emergencyMatch = detectTier0Emergency(sanitizedMessage, lang)
    if (emergencyMatch) {
      return NextResponse.json({
        reply: emergencyMatch.reply,
        replyHi: emergencyMatch.replyHi,
        replyEn: emergencyMatch.replyEn,
        tier: 0,
        emergency: true,
        hotline: emergencyMatch.hotline,
        fallback: false,
        source: "tier0-emergency-gate",
      })
    }

    // 3. Immediate Clinical Knowledge Engine Match (Tier 2 & Urgent Referrals)
    const brainEntry = getMedicalBrainEntry(sanitizedMessage)
    if (brainEntry) {
      return NextResponse.json({
        reply: lang === "hi" ? brainEntry.hi : brainEntry.en,
        replyHi: brainEntry.hi,
        replyEn: brainEntry.en,
        fallback: false,
        source: "clinical-knowledge-engine"
      })
    }

    // 3. Prepare sanitized conversation history for Gemini (alternating turns)
    const contents: GeminiContent[] = []

    if (Array.isArray(history)) {
      let expectedRole: "user" | "model" = "user"

      for (const item of history.slice(-6)) {
        if (!item || typeof item.content !== "string") continue
        const itemContent = item.content.slice(0, 500)
        const role = item.role === "assistant" || item.role === "model" ? "model" : "user"

        if (role === expectedRole) {
          contents.push({
            role,
            parts: [{ text: itemContent }]
          })
          expectedRole = expectedRole === "user" ? "model" : "user"
        } else if (contents.length > 0) {
          // Merge consecutive same-role turns into previous
          const prev = contents[contents.length - 1]
          prev.parts.push({ text: itemContent })
        }
      }

      // Ensure the history ends ready for a user message
      if (contents.length > 0 && contents[contents.length - 1].role === "user") {
        contents.pop()
      }
    }

    // 3b. Server-side response cache check (Tier 2.5: Exact Hash + Option 1 Semantic Meaning Match)
    // Only cache single-turn queries (history-free) to avoid stale contextual replies
    if (history.length === 0) {
      // (i) Exact query hash hit
      const cached = await getCachedResponse(sanitizedMessage)
      if (cached) {
        const selectedReply = lang === "hi" ? (cached.replyHi || cached.replyEn) : (cached.replyEn || cached.replyHi)
        return NextResponse.json({
          reply: selectedReply,
          replyEn: cached.replyEn || undefined,
          replyHi: cached.replyHi || undefined,
          fallback: false,
          source: "server-cache",
          model: cached.model,
        })
      }

      // (ii) Option 1: Semantic meaning / concept similarity match
      // Catches rephrased queries with identical medical symptoms (e.g. "fever and chills" vs "high temperature with shivering")
      const semanticMatch = await getSemanticCachedResponse(sanitizedMessage)
      if (semanticMatch.response) {
        const semCached = semanticMatch.response
        const selectedReply = lang === "hi" ? (semCached.replyHi || semCached.replyEn) : (semCached.replyEn || semCached.replyHi)
        return NextResponse.json({
          reply: selectedReply,
          replyEn: semCached.replyEn || undefined,
          replyHi: semCached.replyHi || undefined,
          fallback: false,
          source: semanticMatch.source || "semantic-cache",
          model: semCached.model,
        })
      }
    }

    // System instruction requesting bilingual JSON
    const BILINGUAL_SYSTEM_PROMPT = `${SYSTEM_PROMPT}
7. CRITICAL FORMAT REQUIREMENT:
You must provide your response in BOTH English and Hindi.
Return STRICTLY a JSON object with this exact structure:
{
  "en": "Your complete helpful response in English (no markdown asterisks like **)",
  "hi": "Your exact corresponding complete response in clear, simple Hindi (no markdown asterisks like **)"
}
Do NOT wrap in any extra markdown or conversational commentary outside the JSON.`

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: sanitizedMessage }]
    })

    // Staging load-test mode bypass (Audit §4 / scale-kit patch)
    if (isLoadTest(request)) {
      await stubDelay()
      return NextResponse.json({ reply: "Load-test stub reply.", fallback: false })
    }

    // 4. Request Gemini with graceful fallback via AI Gateway (Circuit Breaker & Quota Guard)
    const userKey = clientKey(request)
    let geminiResult
    try {
      geminiResult = await executeWithAiGateway(userKey, () =>
        generateGeminiContent(contents, BILINGUAL_SYSTEM_PROMPT)
      )
    } catch (gwErr: any) {
      console.warn("[ai-chat] AI Gateway bypassed to offline triage:", gwErr?.message || gwErr)
      geminiResult = { reply: null, fallback: true, reason: gwErr?.code || "gateway-circuit" }
    }

    if (geminiResult.reply && !geminiResult.fallback) {
      let replyEn = ""
      let replyHi = ""

      // Attempt parsing bilingual JSON
      try {
        const cleanedRaw = geminiResult.reply
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim()
        const parsed = JSON.parse(cleanedRaw)
        if (parsed.en && parsed.hi) {
          replyEn = String(parsed.en).trim()
          replyHi = String(parsed.hi).trim()
        }
      } catch {
        // Fallback: raw text in whatever language Gemini produced
        if (lang === "hi") replyHi = geminiResult.reply
        else replyEn = geminiResult.reply
      }

      const selectedReply = lang === "hi" ? (replyHi || replyEn) : (replyEn || replyHi)

      // Write to server-side cache for future identical queries (fire-and-forget)
      if (replyEn && replyHi && history.length === 0) {
        setCachedResponse(sanitizedMessage, {
          replyEn,
          replyHi,
          cachedAt: Date.now(),
          model: geminiResult.modelUsed ?? undefined,
        }).catch(() => {})
      }

      return NextResponse.json({
        reply: selectedReply,
        replyEn: replyEn || undefined,
        replyHi: replyHi || undefined,
        model: geminiResult.modelUsed,
        fallback: false
      })
    }

    // 5. Zero-500 Graceful Clinical Fallback
    const fallbackHi = "नमस्ते! आपकी सुरक्षा के लिए: यदि आपको तेज बुखार, सीने में दर्द या सांस लेने में तकलीफ जैसे गंभीर लक्षण हैं, तो तुरंत नजदीकी स्वास्थ्य केंद्र (PHC) या 108 पर संपर्क करें। सामान्य लक्षणों के लिए पर्याप्त आराम करें, ओआरएस या हल्का भोजन लें।"
    const fallbackEn = "Hello! For your health and safety: If you are experiencing high fever, chest pain, or severe difficulty breathing, please consult your nearest Primary Health Centre (PHC) or call 108 immediately. For mild symptoms, rest adequately, hydrate with ORS, and take light bland meals."

    return NextResponse.json({
      reply: lang === "hi" ? fallbackHi : fallbackEn,
      replyHi: fallbackHi,
      replyEn: fallbackEn,
      fallback: true,
      reason: geminiResult.reason || "upstream-exhausted"
    })
  } catch (error: any) {
    console.error("AI chat server error:", error)
    const errEn = "We are currently experiencing connectivity difficulties. If your symptoms are severe, please call 108 or visit your nearest Primary Health Centre."
    const errHi = "तकनीकी समस्या के कारण सेवा में बाधा है। यदि लक्षण गंभीर हैं, तो कृपया तुरंत 108 पर कॉल करें या नजदीकी स्वास्थ्य केंद्र जाएँ।"
    return NextResponse.json({
      reply: "We are currently experiencing connectivity difficulties. If your symptoms are severe, please call 108 or visit your nearest Primary Health Centre.",
      replyEn: errEn,
      replyHi: errHi,
      fallback: true,
      reason: "internal-exception"
    })
  }
}
