/**
 * lib/chat/emergency.ts
 *
 * Tier 0 Red-Flag Emergency Gate.
 * Instant, rule-based, zero LLM calls. Always provides 108 or Tele-MANAS 14416.
 */

export interface EmergencyMatch {
  isEmergency: boolean
  reply: string
  hotline: "108" | "14416"
}

// Emergency red flags with word boundary enforcement
const EMERGENCY_PATTERNS = [
  // Cardiac / Severe respiratory
  /\b(chest pain|heart attack|heart failure)\b/i,
  /\b(shortness of breath|cannot breathe|suffocating|choking)\b/i,
  /\b(seene mein dard|chhati me dard|saans lene me dikkat)\b/i,

  // Neurological / Stroke
  /\b(stroke|paralysis|unconscious|fainted|loss of consciousness)\b/i,
  /\b(behhosh|behoshi|lakwa)\b/i,

  // Trauma / Poison / Environmental
  /\b(snake bite|snakebite|saanp ne kaat|poison|zeher)\b/i,
  /\b(severe bleeding|cough with blood|khoon ki ulti)\b/i,

  // Self-harm / Crisis
  /\b(suicide|kill myself|end my life|want to die|atmahathya|khudkushi)\b/i,
]

export function detectTier0Emergency(text: string, language: string): EmergencyMatch | null {
  const query = text.toLowerCase()

  // 1. Check for self-harm / mental health emergency first (Tele-MANAS)
  if (/\b(suicide|kill myself|end my life|want to die|atmahathya|khudkushi)\b/i.test(query)) {
    const isHi = language === "hi"
    return {
      isEmergency: true,
      hotline: "14416",
      reply: isHi
        ? "🚨 आपातकालीन सहायता: यदि आप या आपका कोई प्रिय व्यक्ति मानसिक तनाव या संकट में है, तो कृपया तुरंत Tele-MANAS राष्ट्रीय हेल्पलाइन 14416 पर कॉल करें (24/7 मुफ्त एवं गोपनीय)। आप अकेले नहीं हैं, मदद उपलब्ध है।"
        : "🚨 Mental Health Emergency: If you or someone you know is in distress, please call the national Tele-MANAS helpline at 14416 immediately (toll-free, 24/7, confidential support). You are not alone and help is available.",
    }
  }

  // 2. Check for physical medical emergencies (108 Ambulance)
  for (const rx of EMERGENCY_PATTERNS) {
    if (rx.test(query)) {
      const isHi = language === "hi"
      return {
        isEmergency: true,
        hotline: "108",
        reply: isHi
          ? "🚨 मेडिकल इमरजेंसी चेतावनी: यह एक गंभीर स्थिति हो सकती है। कृपया तुरंत 108 एम्बुलेंस पर कॉल करें या नजदीकी अस्पताल के इमरजेंसी वार्ड में जाएं। मरीज को शांत रखें और डॉक्टर की सलाह के बिना कोई दवा न दें।"
          : "🚨 MEDICAL EMERGENCY DETECTED: This requires immediate clinical attention. Please call 108 Ambulance right now or go directly to the nearest hospital emergency department. Keep the patient calm and comfortable.",
      }
    }
  }

  return null
}
