import { ASSISTANT_LANGUAGES, resolveAssistantLanguage, type AssistantLanguageCode } from "./languages"
import { ASSISTANT_PHRASES, type AssistantPhraseCatalog } from "./phrase-catalog"
import { parseAssistantSymptoms } from "./parsing"
import { hasAssistantPhrase, normalizeAssistantText } from "./text"

export type AssistantIntent = "book_appointment" | "check_symptoms" | "find_facilities" | "view_appointments" | "view_records" | "emergency" | "navigate_home" | "repeat" | "stop" | "change_language" | "help" | "cancel_appointment" | "join_consultation" | "view_camps" | "view_schemes" | "health_info" | "unknown"
export interface AssistantIntentResult { intent: AssistantIntent; confidence: number; targetLanguage?: AssistantLanguageCode }

const INTENT_KEYS: Array<[AssistantIntent, keyof AssistantPhraseCatalog]> = [
  ["emergency", "emergency"], ["stop", "stop"], ["repeat", "repeat"], ["cancel_appointment", "cancel"], ["join_consultation", "join"],
  ["book_appointment", "book"], ["check_symptoms", "symptoms"], ["find_facilities", "facilities"], ["view_appointments", "appointments"],
  ["view_records", "records"], ["view_camps", "camps"], ["view_schemes", "schemes"], ["health_info", "healthInfo"], ["navigate_home", "home"], ["help", "help"],
]

/** Deterministic vocabulary routes permitted workflows; it never authorises or executes a write. */
export function detectAssistantIntent(text: string, language: string): AssistantIntentResult {
  const input = normalizeAssistantText(text)
  if (!input) return { intent: "unknown", confidence: 0 }
  const lang = resolveAssistantLanguage(language)
  const phrases = ASSISTANT_PHRASES[lang]
  const requestedLanguage = ASSISTANT_LANGUAGES.find((entry) => input === normalizeAssistantText(entry.name) || input === normalizeAssistantText(entry.nativeName) || ((phrases.language.some((phrase) => hasAssistantPhrase(input, phrase)) || ASSISTANT_PHRASES.en.language.some((phrase) => hasAssistantPhrase(input, phrase))) && (hasAssistantPhrase(input, entry.name) || hasAssistantPhrase(input, entry.nativeName))))
  if (requestedLanguage) return { intent: "change_language", confidence: 1, targetLanguage: requestedLanguage.code }
  const symptoms = parseAssistantSymptoms(text, lang)
  if (symptoms.some((id) => ["chest-pain", "shortness-of-breath", "fainting", "cough-with-blood", "heavy-bleeding", "snake-bite"].includes(id))) return { intent: "emergency", confidence: 1 }
  for (const [intent, key] of INTENT_KEYS) {
    const vocabulary = [...phrases[key], ...ASSISTANT_PHRASES.en[key]]
    if (vocabulary.some((phrase) => hasAssistantPhrase(input, phrase))) return { intent, confidence: 0.95 }
  }
  return symptoms.length ? { intent: "check_symptoms", confidence: 0.85 } : { intent: "unknown", confidence: 0 }
}
