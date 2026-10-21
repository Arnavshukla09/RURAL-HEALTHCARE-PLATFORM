/**
 * lib/services/ai-chat.service.ts
 *
 * Core business logic, multilingual prompt templating, caching, and fallback for AI Chat.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical AI Assistant
 */

import { type NextRequest, NextResponse } from "next/server"
import { clientKey } from "@/lib/rate-limit"
import { detectTier0Emergency } from "@/lib/chat/emergency"
import { getMedicalBrainEntry } from "@/lib/ai/medical-brain"
import { generateGeminiContent, GeminiContent } from "@/lib/ai/gemini"
import { getCachedResponse, setCachedResponse, getSemanticCachedResponse } from "@/lib/cache/response-cache"
import { isLoadTest, stubDelay } from "@/lib/loadtest"
import { executeWithAiGateway } from "@/lib/ai/gateway"

export const BASE_RULES = `You are a helpful, culturally sensitive AI health assistant for rural communities in India.
Follow these clinical safety rules strictly:
1. Always remind the user to consult an ASHA worker, ANM, or visit their nearest Primary Health Centre (PHC) / Community Health Centre (CHC).
2. For severe symptoms (chest pain, severe breathing difficulty, sudden weakness, unconsciousness, heavy bleeding), tell them to call 108 ambulance immediately.
3. Suggest safe, practical home care and simple remedies using locally available ingredients (ORS, boiled water, ginger, tulsi, light khichdi).
4. Never prescribe specific prescription drug doses (e.g. antibiotic dosages). Direct the patient to follow medication labels or consult a local doctor/pharmacist.
5. Keep explanations simple, reassuring, and concise (under 120 words).`

export function buildMultilingualSystemPrompt(lang: string, dialect?: string): string {
  const langNames: Record<string, string> = {
    hi: "Hindi (हिन्दी)",
    mr: "Marathi (मराठी)",
    bn: "Bengali (বাংলা)",
    te: "Telugu (తెలుగు)",
    ta: "Tamil (தமிழ்)",
    gu: "Gujarati (ગુજરાતી)",
    kn: "Kannada (ಕನ್ನಡ)",
    pa: "Punjabi (ਪੰਜਾਬੀ)",
    or: "Odia (ଓଡ଼ିଆ)",
    ml: "Malayalam (മലയാളം)",
    as: "Assamese (অসমীয়া)",
    ur: "Urdu (اردو)",
    en: "English",
  }

  const targetLang = langNames[lang] || (lang === "hi" ? "Hindi (हिन्दी)" : "English")
  const dialectNote = dialect
    ? `The user speaks the ${dialect} vernacular dialect. Adapt your tone and vocabulary appropriately.`
    : "If the user uses regional Indian dialects (such as Bhojpuri, Maithili, Bundelkhandi, Malvi, Marwari, Chhattisgarhi, Ahirani, or Hinglish), understand their query naturally and respond empathetically."

  return `${BASE_RULES}
6. PRIMARY LANGUAGE: The user's active language is ${targetLang}.
${dialectNote}
Always ensure the reply is written in natural, fluent ${targetLang} (using native script where applicable).
If the user communicated in Romanized text (transliterated words), answer clearly and simply.

7. CRITICAL FORMAT REQUIREMENT:
Return STRICTLY a JSON object with this exact structure:
{
  "reply": "Your complete helpful response in ${targetLang} (no markdown asterisks like **)",
  "en": "Your exact corresponding complete response in clear, simple English (no markdown asterisks like **)",
  "hi": "Your exact corresponding complete response in clear, simple Hindi (no markdown asterisks like **)"
}
Do NOT wrap in any extra markdown or conversational commentary outside the JSON.`
}

export const FALLBACK_MESSAGES: Record<string, string> = {
  hi: "नमस्ते! आपकी सुरक्षा के लिए: यदि आपको तेज बुखार, सीने में दर्द या सांस लेने में तकलीफ जैसे गंभीर लक्षण हैं, तो तुरंत नजदीकी स्वास्थ्य केंद्र (PHC) या 108 पर संपर्क करें। सामान्य लक्षणों के लिए पर्याप्त आराम करें, ओआरएस या हल्का भोजन लें।",
  mr: "नमस्ते! तुमच्या सुरक्षिततेसाठी: तीव्र ताप, छातीत दुखणे किंवा श्वास घेण्यास त्रास यासारखी गंभीर लक्षणे असल्यास त्वरित 108 रुग्णवाहिकेला कॉल करा किंवा जवळच्या प्राथमिक आरोग्य केंद्रास (PHC) भेट द्या. साध्या लक्षणांसाठी पुरेशी विश्रांती आणि ओआरएस घ्या.",
  bn: "নমস্কার! আপনার সুরক্ষার জন্য: তীব্র জ্বর, বুকে ব্যথা বা শ্বাসকষ্টের মতো গুরুতর লক্ষণ থাকলে অবিলম্বে ১০৮ নম্বরে কল করুন বা নিকটস্থ প্রাথমিক স্বাস্থ্য কেন্দ্রে যান। সাধারণ উপসর্গের জন্য পর্যাপ্ত বিশ্রাম ও ওআরএস নিন।",
  te: "నమస్కారం! మీ భద్రత కోసం: తీవ్రమైన జ్వరం, ఛాతీ నొప్పి లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంటే వెంటనే 108 కు కాల్ చేయండి లేదా సమీప ప్రాథమిక ఆరోగ్య కేంద్రాన్ని సంప్రదించండి. విశ్రాంతి తీసుకోండి మరియు ఓఆర్ఎస్ తాగండి.",
  ta: "வணக்கம்! உங்கள் பாதுகாப்பிற்காக: அதிக காய்ச்சல், மார்பு வலி அல்லது கடுமையான மூச்சுத் திணறல் இருந்தால் உடனே 108-ஐ அழைக்கவும் அல்லது அருகிலுள்ள ஆரம்ப சுகாதார நிலையத்தை அணுகவும். போதுமான ஓய்வு மற்றும் ஓஆர்எஸ் எடுத்துக் கொள்ளுங்கள்.",
  gu: "નમસ્તે! તમારી સુરક્ષા માટે: જો તીવ્ર તાવ, છાતીમાં દુખાવો અથવા શ્વાસ લેવામાં તકલીફ હોય, તો તરત જ 108 પર કૉલ કરો અથવા નજીકના આરોગ્ય કેન્દ્રની મુલાકાત લો. પૂરતો આરામ અને ઓઆરએસ લો.",
  kn: "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಸುರಕ್ಷತೆಗಾಗಿ: ತೀವ್ರ ಜ್ವರ, ಎದೆ ನೋವು ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆಯಂತಹ ಗಂಭೀರ ಲಕ್ಷಣಗಳಿದ್ದರೆ ತಕ್ಷಣ 108 ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.",
  pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੀ ਸੁਰੱਖਿਆ ਲਈ: ਜੇਕਰ ਤੇਜ਼ ਬੁਖਾਰ, ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਜਾਂ ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼ ਹੋਵੇ, ਤਾਂ ਤੁਰੰਤ 108 'ਤੇ ਕਾਲ ਕਰੋ ਜਾਂ ਨੇੜਲੇ ਸਿਹਤ ਕੇਂਦਰ ਜਾਓ।",
  or: "ନମସ୍କାର! ଆପଣଙ୍କ ସୁରକ୍ଷା ପାଇଁ: ଯଦି ତୀବ୍ର ଜ୍ୱର, ଛାତିରେ ଯନ୍ତ୍ରଣା କିମ୍ବା ନିଶ୍ୱାସ ନେବାରେ କଷ୍ଟ ହୁଏ, ତୁରନ୍ତ 108 କୁ କଲ୍ କରନ୍ତୁ ବା ନିକଟସ୍ଥ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ଯାଆନ୍ତୁ।",
  en: "Hello! For your health and safety: If you are experiencing high fever, chest pain, or severe difficulty breathing, please consult your nearest Primary Health Centre (PHC) or call 108 immediately. For mild symptoms, rest adequately, hydrate with ORS, and take light bland meals.",
}

/**
 * Executes AI Chat request pipeline with clinical safety gating, caching, and graceful fallback.
 */
export async function executeAiChat(request: NextRequest, body: any) {
  const { message, history, language, dialect } = body
  const safeHistory = Array.isArray(history) ? history : []

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  const sanitizedMessage = message.trim().slice(0, 1000)
  const lang = typeof language === "string" && language.trim() ? language.trim().toLowerCase() : "en"

  // 1. Server-side Tier 0 Emergency Gate
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

  // 2. Immediate Clinical Knowledge Engine Match
  if (lang === "en" || lang === "hi") {
    const brainEntry = getMedicalBrainEntry(sanitizedMessage)
    if (brainEntry) {
      return NextResponse.json({
        reply: lang === "hi" ? brainEntry.hi : brainEntry.en,
        replyHi: brainEntry.hi,
        replyEn: brainEntry.en,
        fallback: false,
        source: "clinical-knowledge-engine",
      })
    }
  }

  // 3. Conversation history formatting
  const contents: GeminiContent[] = []
  if (safeHistory.length > 0) {
    let expectedRole: "user" | "model" = "user"

    for (const item of safeHistory.slice(-6)) {
      if (!item || typeof item.content !== "string") continue
      const itemContent = item.content.slice(0, 500)
      const role = item.role === "assistant" || item.role === "model" ? "model" : "user"

      if (role === expectedRole) {
        contents.push({
          role,
          parts: [{ text: itemContent }],
        })
        expectedRole = expectedRole === "user" ? "model" : "user"
      } else if (contents.length > 0) {
        const prev = contents[contents.length - 1]
        prev.parts.push({ text: itemContent })
      }
    }

    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      contents.pop()
    }
  }

  // 4. Response caching check (Tier 2.5)
  if (safeHistory.length === 0) {
    const cached = await getCachedResponse(sanitizedMessage)
    if (cached) {
      const selectedReply =
        lang === "hi"
          ? cached.replyHi || cached.replyEn
          : cached.replyEn || cached.replyHi
      return NextResponse.json({
        reply: selectedReply,
        replyEn: cached.replyEn || undefined,
        replyHi: cached.replyHi || undefined,
        fallback: false,
        source: "server-cache",
        model: cached.model,
      })
    }

    const semanticMatch = await getSemanticCachedResponse(sanitizedMessage)
    if (semanticMatch.response) {
      const semCached = semanticMatch.response
      const selectedReply =
        lang === "hi"
          ? semCached.replyHi || semCached.replyEn
          : semCached.replyEn || semCached.replyHi
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

  const systemPrompt = buildMultilingualSystemPrompt(lang, dialect)
  contents.push({
    role: "user",
    parts: [{ text: sanitizedMessage }],
  })

  if (isLoadTest(request)) {
    await stubDelay()
    return NextResponse.json({ reply: "Load-test stub reply.", fallback: false })
  }

  // 5. Gateway dispatch
  const userKey = clientKey(request)
  let geminiResult
  try {
    geminiResult = await executeWithAiGateway(userKey, () =>
      generateGeminiContent(contents, systemPrompt)
    )
  } catch (gwErr: any) {
    console.warn("[ai-chat] AI Gateway bypassed to offline triage:", gwErr?.message || gwErr)
    geminiResult = { reply: null, fallback: true, reason: gwErr?.code || "gateway-circuit" }
  }

  if (geminiResult.reply && !geminiResult.fallback) {
    let replyEn = ""
    let replyHi = ""
    let replyTarget = ""

    try {
      const cleanedRaw = geminiResult.reply
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim()
      const parsed = JSON.parse(cleanedRaw)
      if (parsed.reply || parsed.en || parsed.hi) {
        replyTarget = parsed.reply ? String(parsed.reply).trim() : ""
        replyEn = parsed.en ? String(parsed.en).trim() : ""
        replyHi = parsed.hi ? String(parsed.hi).trim() : ""
      }
    } catch {
      if (lang === "hi") replyHi = geminiResult.reply
      else if (lang === "en") replyEn = geminiResult.reply
      else replyTarget = geminiResult.reply
    }

    const selectedReply =
      lang === "hi"
        ? replyHi || replyTarget || replyEn
        : lang === "en"
        ? replyEn || replyTarget || replyHi
        : replyTarget || replyHi || replyEn

    if (replyEn && replyHi && safeHistory.length === 0) {
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
      language: lang,
      model: geminiResult.modelUsed,
      fallback: false,
    })
  }

  // 6. Zero-500 Graceful Clinical Fallback
  const fallbackText = FALLBACK_MESSAGES[lang] || FALLBACK_MESSAGES.en
  return NextResponse.json({
    reply: fallbackText,
    replyHi: FALLBACK_MESSAGES.hi,
    replyEn: FALLBACK_MESSAGES.en,
    fallback: true,
    reason: geminiResult.reason || "upstream-exhausted",
  })
}
