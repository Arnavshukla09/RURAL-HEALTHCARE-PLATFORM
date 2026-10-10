/**
 * lib/chat/router.ts
 *
 * Single Source of Truth multi-tier conversational router.
 * Runs client-side (works 100% offline).
 *
 * Resolution Order:
 * 1. Navigation Intent (keep existing app routing)
 * 2. Tier 0: Red-flag Emergency (108 / Tele-MANAS 14416)
 * 3. Tier 2: Curated Clinical Knowledge Engine & Medical FAQ
 * 4. Tier 2b: IndexedDB Learned Cache (TF-IDF / BM25)
 * 5. Tier 3: Server-side Gemini API (/api/ai-chat)
 * 6. Offline Graceful Fallback
 */

import { ChatResult, RouteChatInput } from "./types"
import { detectTier0Emergency } from "./emergency"
import { answerMedicalQuery, getMedicalBrainEntry } from "@/lib/ai/medical-brain"
import { lookupOffline } from "@/lib/offline/offline-ai"
import { findCachedAnswer, learnFromAnswer } from "@/lib/ai/query-learner"
import { normalizeQuery, cleanMarkdown } from "./normalize"

export async function routeChatMessage(input: RouteChatInput): Promise<ChatResult> {
  const { message, language, history = [], symptomContext = [] } = input
  const lang = language === "hi" ? "hi" : "en"
  const text = message.trim()

  if (!text) {
    return {
      reply: lang === "hi" ? "कृपया अपना स्वास्थ्य संबंधी प्रश्न लिखें।" : "Please enter your health question.",
      replyHi: "कृपया अपना स्वास्थ्य संबंधी प्रश्न लिखें।",
      replyEn: "Please enter your health question.",
      tier: 2,
      confidence: 1.0,
    }
  }

  // ── 0. Translation Request Gate ──────────────────────────────────────
  // If user requests a translation, bypass medical QA pattern matching and delegate to Gemini Tier 3
  const isTranslationRequest =
    /\b(translate|अनुवाद|hindi mein|english mein|translate to|translation)\b/i.test(text) ||
    /^(hindi|हिन्दी|english|अंग्रेजी)$/i.test(text)

  // ── 1. Tier 0: Emergency Gate ──────────────────────────────────────────
  const emergencyMatch = !isTranslationRequest ? detectTier0Emergency(text, lang) : null
  if (emergencyMatch) {
    if (process.env.NODE_ENV === "development") {
      console.log("[ChatRouter] Responded via Tier 0 (Emergency Gate)")
    }
    return {
      reply: cleanMarkdown(emergencyMatch.reply),
      replyHi: emergencyMatch.replyHi ? cleanMarkdown(emergencyMatch.replyHi) : undefined,
      replyEn: emergencyMatch.replyEn ? cleanMarkdown(emergencyMatch.replyEn) : undefined,
      tier: 0,
      confidence: 1.0,
      emergency: true,
    }
  }

  // ── 2. Tier 2: Curated Clinical Knowledge (Medical Brain) ──────────────
  const normalized = normalizeQuery(text)
  if (!isTranslationRequest) {
    const brainEntry = getMedicalBrainEntry(normalized, symptomContext)
    if (brainEntry) {
      if (process.env.NODE_ENV === "development") {
        console.log("[ChatRouter] Responded via Tier 2 (Clinical Knowledge Engine)")
      }
      const selectedReply = lang === "hi" ? brainEntry.hi : brainEntry.en
      // Asynchronously record into learned cache with explicit language
      learnFromAnswer(text, selectedReply, lang).catch(() => {})
      return {
        reply: cleanMarkdown(selectedReply),
        replyHi: cleanMarkdown(brainEntry.hi),
        replyEn: cleanMarkdown(brainEntry.en),
        tier: 2,
        confidence: 0.95,
        source: "medical-brain",
      }
    }
  }

  // ── 3. Tier 2: Static Medical FAQ ──────────────────────────────────────
  if (!isTranslationRequest) {
    const faqHit = lookupOffline(text) || lookupOffline(normalized)
    if (faqHit) {
      if (process.env.NODE_ENV === "development") {
        console.log("[ChatRouter] Responded via Tier 2 (Static FAQ)")
      }
      const replyText = lang === "hi" ? faqHit.answerHi : faqHit.answer
      return {
        reply: cleanMarkdown(replyText),
        replyHi: cleanMarkdown(faqHit.answerHi),
        replyEn: cleanMarkdown(faqHit.answer),
        tier: 2,
        confidence: 0.9,
        source: "offline-faq",
      }
    }
  }

  // ── 4. Tier 2b: Local IndexedDB Learned Cache (language-isolated) ──────
  if (!isTranslationRequest) {
    try {
      const cachedHit = await findCachedAnswer(text, lang)
      if (cachedHit.found && cachedHit.response) {
        if (process.env.NODE_ENV === "development") {
          console.log("[ChatRouter] Responded via Tier 2b (IndexedDB Cache)")
        }
        return {
          reply: cleanMarkdown(cachedHit.response),
          tier: "2b",
          confidence: cachedHit.similarity || 0.8,
          queryId: cachedHit.queryId,
          source: "indexeddb-cache",
        }
      }
    } catch (err) {
      console.warn("[ChatRouter] Cache lookup skipped:", err)
    }
  }

  // ── 5. Tier 3: Server Gemini API ───────────────────────────────────────
  const offlineHi = "आप वर्तमान में ऑफ़लाइन हैं। सामान्य स्वास्थ्य समस्या के लिए पर्याप्त आराम करें और ओआरएस/स्वच्छ पानी से हाइड्रेटेड रहें। यदि स्थिति गंभीर है, तो 108 पर कॉल करें।"
  const offlineEn = "You are currently offline. For general recovery, rest well and stay hydrated with ORS or boiled water. If symptoms are severe, please call 108 or visit your nearest PHC."

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    // Device is offline — deliver graceful offline clinical triage response
    return {
      reply: lang === "hi" ? offlineHi : offlineEn,
      replyHi: offlineHi,
      replyEn: offlineEn,
      tier: 2,
      confidence: 0.7,
      fallback: true,
    }
  }

  try {
    const response = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: history.slice(-6),
        language: lang,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.reply) {
        const cleanedReply = cleanMarkdown(data.reply)
        const cleanedEn = data.replyEn ? cleanMarkdown(data.replyEn) : undefined
        const cleanedHi = data.replyHi ? cleanMarkdown(data.replyHi) : undefined

        // Only cache if not an upstream emergency or generic fallback
        if (!data.fallback && !data.emergency) {
          learnFromAnswer(text, cleanedReply, lang).catch(() => {})
        }

        if (process.env.NODE_ENV === "development") {
          console.log(`[ChatRouter] Responded via Tier 3 (Gemini / ${data.model || "API"})`)
        }

        return {
          reply: cleanedReply,
          replyEn: cleanedEn,
          replyHi: cleanedHi,
          tier: 3,
          confidence: data.fallback ? 0.6 : 0.9,
          fallback: data.fallback,
          source: data.source || "gemini",
        }
      }
    }
  } catch (apiErr) {
    console.warn("[ChatRouter] Tier 3 API call failed, falling back to local guidance:", apiErr)
  }

  // ── 6. Fail-Safe Local Triage ──────────────────────────────────────────
  const failSafeHi = "नमस्ते! स्वास्थ्य सुरक्षा के लिए: यदि आपको तेज बुखार या गंभीर समस्या है, तो 108 पर कॉल करें या नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) जाएं। हल्के लक्षणों के लिए हल्का भोजन और आराम लें।"
  const failSafeEn = "Hello! For your health and safety: If you have high fever, severe weakness, or worsening pain, please consult your nearest PHC or call 108. For mild symptoms, rest adequately and drink boiled water."

  return {
    reply: lang === "hi" ? failSafeHi : failSafeEn,
    replyHi: failSafeHi,
    replyEn: failSafeEn,
    tier: 2,
    confidence: 0.5,
    fallback: true,
  }
}
