/**
 * lib/chat/emergency.ts
 *
 * Tier 0 Red-Flag Emergency Gate.
 * Instant, rule-based, zero LLM calls. Always provides 108 or Tele-MANAS 14416.
 */

export interface EmergencyMatch {
  isEmergency: boolean
  reply: string
  replyHi?: string
  replyEn?: string
  hotline: "108" | "14416"
}

// Phrases that inherently contain negative words ("nahi", "not") but ARE life-threatening emergencies.
// These MUST NEVER be suppressed by negation checks!
const INHERENT_NEGATIVE_ALLOWLIST = [
  /\b(baby|infant|newborn|child|bachha|shishu)\s+(is\s+)?(not\s+breathing|cannot\s+breathe|saans\s+nahi)\b/i,
  /\b(not\s+breathing|cannot\s+breathe|unable\s+to\s+breathe)\b/i,
  /\b(saans\s+nahi\s+(aa\s+rahi|le\s+pa\s+raha|le\s+raha|chal\s+rahi))\b/i,
  /(सांस\s+नहीं\s+(आ\s+रही|ले\s+पा\s+रहा|ले\s+रहा|चल\s+रही))/i,
  /(बच्चा|शिशु)\s+सांस\s+नहीं\s+ले\s+रहा/i,
]

// Symptoms where preceding or following negation ("no chest pain", "dard nahi hai") negates the emergency.
// We strictly scope negation to symptom phrases, preventing false positives without silencing real respiratory distress.
const SCOPED_NEGATIONS = [
  /\b(no|not having|don't have|do not have|without|free of|denies)\s+(any\s+)?(chest pain|heart attack|stroke|paralysis|seizure|bleeding)\b/i,
  /\b(chest pain|seene mein dard|chhati me dard|dard)\s+(nahi|nhi)\s+(hai|ho raha|tha)\b/i,
  /(सीने में दर्द|छाती में दर्द|दर्द)\s+नहीं\s+है/i,
  /\b(nahi hai|nhi hai)\s+(seene mein dard|chhati me dard)\b/i,
  /\b(zeher|zehar|poison|pesticide|keetnashak)\b.*?\b(nahi|nhi)\s+(hai|tha|hoga)\b/i,
  /(ज़हर|जहर|कीटनाशक).*?नहीं\s+है/i,
  /\b(nahi hai|nhi hai)\s+(zeher|zehar|poison)\b/i,
  /\b(no|not|free of|without)\s+.*?\b(poison|toxic|pesticide)\b/i,
]

// Educational inquiries about symptoms (e.g. "Is chest pain always a heart attack?")
// These are informational questions, not acute personal medical emergencies.
const INFORMATIONAL_QUESTION_PATTERNS = [
  /^(is|can|could|does|what causes|why does|how does|what is)\s+.*?\b(always|mean|caused by|difference between|normal|curable|contagious|prevented)\b/i,
  /\b(always|hamesha|har baar)\s+(a\s+)?(heart attack|stroke|fatal|emergency|khatarnak)\b/i,
  /^(क्या\s+.*?(हमेशा|होता है|हो सकता है)|kya\s+.*?(hamesha|hota hai|ho sakta hai))/i,
]

// Self-harm & Crisis patterns (Tele-MANAS)
const SELF_HARM_REGEX = /\b(suicide|kill myself|end my life|want to die|atmahathya|khudkushi|jeene ka man(n)? nahi|jeena nahi chahta|mar jana chahta|jeene ki ichha nahi|better off dead)\b/i
const SELF_HARM_HINDI_REGEX = /(आत्महत्या|खुदकुशी|जान देना|मरना चाहता|जीने का मन नहीं|जीना नहीं चाहता|मर जाना चाहता|जीने की इच्छा नहीं)/i

// Emergency red flags with word boundary enforcement
const EMERGENCY_PATTERNS = [
  // 1. Pediatric respiratory & critical danger signs (WHO IMCI)
  /\b(baby|infant|newborn|toddler|bachha|shishu)\s+(not breathing|cannot breathe|turned blue|blue lips|unresponsive)\b/i,
  /(बच्चा|शिशु)\s+(सांस नहीं ले रहा|नीला पड़ गया|बेहोश)/i,

  // 2. Obstetric emergencies & maternal hemorrhage
  /\b(pregnant|pregnancy|garbhvati)\b.*?\b(bleeding heavily|heavy bleeding|haemorrhage|severe pain|water broke|leaking fluid)\b/i,
  /\b(bleeding heavily|severe bleeding|heavy vaginal bleeding)\b/i,
  /(गर्भवती|गर्भावस्था).*?(भारी रक्तस्राव|खून बह रहा|अत्यधिक रक्तस्राव)/i,

  // 3. Neurological: Seizures, Convulsions & Stroke FAST Signs
  /\b(seizure|seizures|convulsion|convulsions|fit|fits|daura|daure|mirgi)\b/i,
  /(दौरा|दौरे|मिर्गी|झटके आ रहे)/i,
  /\b(face drooping|facial droop|arm weakness|slurred speech|sudden confusion)\b/i,
  /\b(stroke(?! of luck)|paralysis(?! tick)|unconscious|fainted|loss of consciousness)\b/i,
  /\b(behosh|behhosh|behoshi|lakwa)\b/i,
  /(बेहोश|बेहोशी|लकवा|चक्कर खाकर गिर|मुंह टेढ़ा)/i,

  // 4. Cardiac & Severe respiratory distress
  /\b(chest pain|heart attack|heart failure)\b/i,
  /\b(shortness of breath|cannot breathe|suffocating|choking|gasping for breath)\b/i,
  /\b(seene mein dard|chhati me dard|saans lene me (dikkat|takleef))\b/i,
  /\b(saans nahi aa rahi|saans phool rahi|dum ghut raha)\b/i,
  /(सीने में दर्द|छाती में दर्द|सांस फूल|सांस नहीं आ|सांस लेने में|दम घुट)/i,

  // 5. Toxicology, Envenomation & Environmental (Snakebite, Scorpion, Pesticide, Severe Burns)
  /\b(snake bite|snakebite|saanp ne kaat|saanp)\b/i,
  /\b(scorpion sting|scorpion bite|bichhu|bichhoo|bicchu)\b/i,
  /\b(pesticide|keetnashak|insecticide|rat poison|consumed poison|zeher|zehar)\b/i,
  /\b(severe burn|severe burns|third degree burn|aag se jala|body burnt)\b/i,
  /\b(cough with blood|khoon ki ulti|vomiting blood)\b/i,
  /(सांप ने काट|सांप का डंक|सांप|बिच्छू|कीटनाशक|जहर|खून की उल्टी|गंभीर रक्तस्राव|आग से जल)/i,

  // 6. Crisis & Self-harm
  SELF_HARM_REGEX,
  SELF_HARM_HINDI_REGEX,
]

export function detectTier0Emergency(text: string, language: string): EmergencyMatch | null {
  const query = text.toLowerCase().trim()

  // 1. Check for self-harm / mental health emergency first (Tele-MANAS)
  if (SELF_HARM_REGEX.test(query) || SELF_HARM_HINDI_REGEX.test(query)) {
    const replyHi = "🚨 आपातकालीन सहायता: यदि आप या आपका कोई प्रिय व्यक्ति मानसिक तनाव या संकट में है, तो कृपया तुरंत Tele-MANAS राष्ट्रीय हेल्पलाइन 14416 पर कॉल करें (24/7 मुफ्त एवं गोपनीय)। आप अकेले नहीं हैं, मदद उपलब्ध है।"
    const replyEn = "🚨 Mental Health Emergency: If you or someone you know is in distress, please call the national Tele-MANAS helpline at 14416 immediately (toll-free, 24/7, confidential support). You are not alone and help is available."
    return {
      isEmergency: true,
      hotline: "14416",
      reply: language === "hi" ? replyHi : replyEn,
      replyHi,
      replyEn,
    }
  }

  // 2. Check for informational/educational question (bypass 108 emergency lock if asking a general question)
  const isInformational = 
    INFORMATIONAL_QUESTION_PATTERNS.some(rx => rx.test(query)) &&
    !/\b(i have|i am having|mujhe|mere|help me|right now|abhi|bachao)\b/i.test(query)

  if (isInformational) {
    return null
  }

  // 2. Check for inherently negative emergency phrases FIRST (Allowlist protection)
  // If a phrase contains an inherently negative life-threatening situation (e.g. "baby not breathing", "saans nahi aa rahi"),
  // it immediately triggers emergency and MUST NEVER be suppressed by negation rules.
  for (const allowRx of INHERENT_NEGATIVE_ALLOWLIST) {
    if (allowRx.test(query)) {
      const replyHi = "🚨 मेडिकल इमरजेंसी चेतावनी: यह एक गंभीर जीवन-रक्षक स्थिति हो सकती है। कृपया तुरंत 108 एम्बुलेंस पर कॉल करें या नजदीकी अस्पताल के इमरजेंसी वार्ड में जाएं। मरीज को शांत रखें और तुरंत चिकित्सा सहायता लें।"
      const replyEn = "🚨 MEDICAL EMERGENCY DETECTED: This is a life-threatening acute situation requiring immediate intervention. Please call 108 Ambulance right now or go directly to the nearest hospital casualty/emergency department."
      return {
        isEmergency: true,
        hotline: "108",
        reply: language === "hi" ? replyHi : replyEn,
        replyHi,
        replyEn,
      }
    }
  }

  // 3. Check scoped negation rules (e.g. "I do not have chest pain", "chhati me dard nahi hai")
  // Only suppress if the negation specifically scopes to the symptom being negated
  for (const negRx of SCOPED_NEGATIONS) {
    if (negRx.test(query)) {
      return null
    }
  }

  // 4. Check for physical medical emergencies (108 Ambulance)
  for (const rx of EMERGENCY_PATTERNS) {
    if (rx.test(query)) {
      const replyHi = "🚨 मेडिकल इमरजेंसी चेतावनी: यह एक गंभीर स्थिति हो सकती है। कृपया तुरंत 108 एम्बुलेंस पर कॉल करें या नजदीकी अस्पताल के इमरजेंसी वार्ड में जाएं। मरीज को शांत रखें और डॉक्टर की सलाह के बिना कोई दवा न दें।"
      const replyEn = "🚨 MEDICAL EMERGENCY DETECTED: This requires immediate clinical attention. Please call 108 Ambulance right now or go directly to the nearest hospital emergency department. Keep the patient calm and comfortable."
      return {
        isEmergency: true,
        hotline: "108",
        reply: language === "hi" ? replyHi : replyEn,
        replyHi,
        replyEn,
      }
    }
  }

  return null
}
