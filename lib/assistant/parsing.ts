import { resolveAssistantLanguage } from "./languages"
import { ASSISTANT_PHRASES } from "./phrase-catalog"
import { ASSISTANT_EXTRA_NUMBERS, ASSISTANT_MONTHS } from "./date-catalog"
import { ASSISTANT_SYMPTOM_NAMES, SYMPTOM_PHRASES } from "./symptom-phrase-catalog"
import { WORKFLOW_PROMPTS } from "./workflow-prompt-catalog"
import { INTAKE_PROMPTS } from "./intake-prompt-catalog"
import { hasAssistantPhrase, normalizeAssistantText } from "./text"

function hasWholePhrase(text: string, phrase: string): boolean {
  const escaped = normalizeAssistantText(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{M}\\p{N}])`, "u").test(normalizeAssistantText(text))
}

export function normalizeAssistantDigits(text: string): string {
  return text.replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0)
    const start = [0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6, 0x0c66, 0x0ce6, 0x0d66, 0x0660, 0x06f0].find((first) => code >= first && code < first + 10)!
    return String(code - start)
  })
}

/** Ambiguous answers never authorise a mutation. */
export function parseAssistantConfirmation(text: string, language: string): boolean | null {
  const phrases = ASSISTANT_PHRASES[resolveAssistantLanguage(language)]
  const negativePhrases = [...phrases.no, ...ASSISTANT_PHRASES.en.no, ...phrases.negation, ...ASSISTANT_PHRASES.en.negation]
  const no = negativePhrases.some((phrase) => hasWholePhrase(text, phrase))
  // A negative phrase such as "do not confirm" must not authorise the embedded affirmative word.
  const affirmativeText = negativePhrases.sort((a, b) => b.length - a.length).reduce((input, phrase) => hasWholePhrase(input, phrase) ? input.replace(normalizeAssistantText(phrase), " ") : input, normalizeAssistantText(text))
  const yes = [...phrases.yes, ...ASSISTANT_PHRASES.en.yes].some((phrase) => hasWholePhrase(affirmativeText, phrase))
  return yes === no ? null : yes
}

export function parseAssistantNumber(text: string, language: string): number | null {
  const normalized = normalizeAssistantDigits(normalizeAssistantText(text)).replace(/([a-z])-([a-z])/g, "$1 $2")
  const numeric = normalized.match(/(?:^|[^\d])(-?\d+(?:\.\d+)?)(?!\d)/g)
  if (numeric?.length) {
    if (numeric.length !== 1) return null
    const value = Number(numeric[0].replace(/^[^\d-]+/, ""))
    return Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER ? value : null
  }
  const lang = resolveAssistantLanguage(language)
  const wordNumbers: Record<string, number> = { ...ASSISTANT_EXTRA_NUMBERS.en, ...ASSISTANT_EXTRA_NUMBERS[lang] }
  for (const [index, word] of ASSISTANT_PHRASES.en.numbers.entries()) wordNumbers[word] = index
  for (const [index, word] of ASSISTANT_PHRASES[lang].numbers.entries()) wordNumbers[word] = index
  const matches = Object.entries(wordNumbers).filter(([word]) => hasWholePhrase(normalized, word)).map(([word, value]) => ({ word, value }))
  if (matches.length === 1) return matches[0].value
  // A spoken English tens-plus-unit expression has an unambiguous sum. Other ambiguous sequences are rejected.
  if (matches.length === 2) {
    const tens = matches.find((match) => match.value >= 20 && match.value < 100 && match.value % 10 === 0)
    const unit = matches.find((match) => match.value > 0 && match.value < 10)
    if (tens && unit && normalized.includes(`${tens.word} ${unit.word}`)) return tens.value + unit.value
  }
  return null
}

function indiaDate(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: value("year"), month: value("month"), day: value("day") }
}

function dateString(year: number, month: number, day: number): string | null {
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** Calendar-only result in India time; callers must validate availability and future-booking limits. */
export function parseAssistantDate(text: string, language: string, now = new Date()): string | null {
  const lang = resolveAssistantLanguage(language)
  const input = normalizeAssistantDigits(normalizeAssistantText(text))
  const current = indiaDate(now)
  const phrases = ASSISTANT_PHRASES[lang]
  const relative = [{ phrases: [...phrases.dayAfter, ...ASSISTANT_PHRASES.en.dayAfter], days: 2 }, { phrases: [...phrases.tomorrow, ...ASSISTANT_PHRASES.en.tomorrow], days: 1 }, { phrases: [...phrases.today, ...ASSISTANT_PHRASES.en.today], days: 0 }]
  const choices = relative.flatMap((candidate) => candidate.phrases.filter((phrase) => hasWholePhrase(input, phrase)).map((phrase) => ({ days: candidate.days, phrase: normalizeAssistantText(phrase) }))).sort((a, b) => b.phrase.length - a.phrase.length)
  const match = choices[0]
  if (match) {
    const remaining = input.replace(match.phrase, " ")
    if (choices.some((choice) => choice.days !== match.days && hasWholePhrase(remaining, choice.phrase))) return null
    const target = new Date(Date.UTC(current.year, current.month - 1, current.day + match.days))
    return dateString(target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate())
  }
  const isoDates = [...input.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)]
  if (isoDates.length > 1) return null
  const iso = isoDates[0]
  if (iso) return dateString(Number(iso[1]), Number(iso[2]), Number(iso[3]))
  const indianDates = [...input.matchAll(/\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{4}))?\b/g)]
  if (indianDates.length > 1) return null
  const indian = indianDates[0]
  if (indian) return dateString(Number(indian[3] || current.year), Number(indian[2]), Number(indian[1]))
  for (let month = 0; month < 12; month++) {
    const names = `${ASSISTANT_MONTHS[lang][month]}|${ASSISTANT_MONTHS.en[month]}`.split("|")
    const found = names.find((name) => hasWholePhrase(input, name))
    if (!found) continue
    const dayText = input.replace(normalizeAssistantText(found), " ")
    const digits = dayText.match(/\d+/g) || []
    const yearText = digits.find((value) => value.length === 4)
    const remaining = yearText ? dayText.replace(yearText, " ") : dayText
    const day = parseAssistantNumber(remaining, lang)
    return day === null ? null : dateString(Number(yearText || current.year), month + 1, day)
  }
  return null
}

/** Negation is scoped to the nearby clause, not the whole intake. Respiratory inability remains a red flag. */
export function isAssistantSymptomNegated(text: string, phrase: string, language: string): boolean {
  const normalized = normalizeAssistantText(text)
  const target = normalizeAssistantText(phrase)
  if (/not breathing|cannot breathe|नहीं आ|नहीं ले|नाही|পারছে না|নিচ্ছে না|లేదు|இல்லை|முடியவில்லை|નથી|ಆಗುತ್ತಿಲ್ಲ|ಉಸಿರಾಡುತ್ತಿಲ್ಲ|ਨਹੀਂ ਆ|ନେଉନାହିଁ|കഴിയുന്നില്ല|ശ്വസിക്കുന്നില്ല|পৰা নাই|থকা নাই|نہیں آ|نہیں لے/i.test(target)) return false
  const index = normalized.indexOf(target)
  if (index < 0) return false
  const separators = /[,;.!?।]|\b(?:but|and|however)\b| लेकिन | और | पण | आणि | কিন্তু | এবং | కానీ | మరియు | ஆனால் | மற்றும் | પરંતુ | અને | ಆದರೆ | ಮತ್ತು | ਪਰ | ਅਤੇ | କିନ୍ତୁ | ଏବଂ | എന്നാൽ | ഒപ്പം | কিন্তু | আৰু | لیکن | اور /u
  const clauses = text.split(separators)
  const clause = clauses.find((part) => hasAssistantPhrase(part, phrase)) || text
  const nearby = normalizeAssistantText(clause)
  const phrases = [...ASSISTANT_PHRASES[resolveAssistantLanguage(language)].negation, ...ASSISTANT_PHRASES.en.negation]
  return phrases.some((negation) => hasWholePhrase(nearby, negation))
}

export function parseAssistantSymptoms(text: string, language: string): string[] {
  const lang = resolveAssistantLanguage(language)
  const vocabulary = { ...SYMPTOM_PHRASES.en }
  for (const [id, phrases] of Object.entries(SYMPTOM_PHRASES[lang])) vocabulary[id] = [...phrases, ...(vocabulary[id] || [])]
  const matched = Object.entries(vocabulary).filter(([, phrases]) => phrases.some((phrase) => hasAssistantPhrase(text, phrase) && !isAssistantSymptomNegated(text, phrase, lang))).map(([id]) => id)
  const specificity = [["high-fever", "low-fever"], ["severe-headache", "mild-headache"], ["severe-abdominal-pain", "mild-stomach-ache"], ["cough-with-blood", "cough"]]
  return matched.filter((id) => !specificity.some(([specific, general]) => id === general && matched.includes(specific)))
}

export function getAssistantSymptomNames(ids: string[], language = "en"): string[] {
  const lang = resolveAssistantLanguage(language)
  return ids.map((id) => lang === "en" ? ASSISTANT_SYMPTOM_NAMES[id] || id : SYMPTOM_PHRASES[lang][id]?.[0] || id)
}

export function parseAssistantMode(text: string, language: string): "video" | "audio" | "chat" | null {
  const prompts = WORKFLOW_PROMPTS[resolveAssistantLanguage(language)]
  return hasAssistantPhrase(text, prompts.modeVideo) || hasWholePhrase(text, "video") ? "video" : hasAssistantPhrase(text, prompts.modeAudio) || hasWholePhrase(text, "audio") ? "audio" : hasAssistantPhrase(text, prompts.modeChat) || hasWholePhrase(text, "chat") ? "chat" : null
}

export function parseAssistantGender(text: string, language: string): "male" | "female" | "other" | null {
  const prompts = WORKFLOW_PROMPTS[resolveAssistantLanguage(language)]
  for (const gender of ["female", "male", "other"] as const) if (hasWholePhrase(text, prompts[gender]) || hasWholePhrase(text, gender)) return gender
  return null
}

export function parseAssistantIntensity(text: string, language: string): "mild" | "moderate" | "severe" | null {
  const lang = resolveAssistantLanguage(language)
  const negative = [...ASSISTANT_PHRASES[lang].negation, ...ASSISTANT_PHRASES.en.negation].some((word) => hasWholePhrase(text, word))
  if (negative) return null
  const synonyms = lang === "hi" ? { mild: ["हल्का", "हल्की"], moderate: ["मध्यम"], severe: ["तेज", "बहुत ज्यादा"] } : { mild: [], moderate: [], severe: [] }
  const found = (["mild", "moderate", "severe"] as const).filter((value) => [INTAKE_PROMPTS[lang][value], value, ...synonyms[value]].some((word) => hasAssistantPhrase(text, word)))
  return found.length === 1 ? found[0] : null
}

export function parseAssistantAge(text: string, language: string): number | null {
  const value = parseAssistantNumber(text, language)
  if (value === null || value < 0) return null
  const months: Record<string, string[]> = {
    en: ["month", "months"], hi: ["महीना", "महीने", "माह"], mr: ["महिना", "महिने"], bn: ["মাস"], te: ["నెల"], ta: ["மாத"],
    gu: ["મહિના", "મહિનો"], kn: ["ತಿಂಗಳು", "ತಿಂಗಳ"], pa: ["ਮਹੀਨੇ", "ਮਹੀਨਾ"], or: ["ମାସ"], ml: ["മാസം", "മാസ"], as: ["মাহ"], ur: ["مہینے", "مہینہ", "ماہ"],
  }
  const monthInput = [...months[resolveAssistantLanguage(language)], ...months.en].some((unit) => hasAssistantPhrase(text, unit))
  return monthInput ? value / 12 : value
}

/** Never infer a clinical temperature unit from its magnitude. */
export function parseAssistantTemperature(text: string, language = "en"): { value: number; unit: "C" | "F" } | null {
  const unitText = normalizeAssistantDigits(text).replace(/(\d)\s*°?\s*([cf])\b/gi, "$1 $2")
  const value = parseAssistantNumber(unitText, language)
  if (value === null) return null
  const celsius = ["c", "celsius", "centigrade", "सेल्सियस", "सेल्सिअस", "সেলসিয়াস", "సెల్సియస్", "செல்சியஸ்", "સેલ્સિયસ", "ಸೆಲ್ಸಿಯಸ್", "ਸੈਲਸੀਅਸ", "ସେଲସିୟସ", "സെൽഷ്യസ്", "চেলচিয়াচ", "سیلسیس"]
  const fahrenheit = ["f", "fahrenheit", "फ़ारेनहाइट", "फारेनहाइट", "फॅरेनहाइट", "ফারেনহাইট", "ఫారెన్‌హీట్", "ஃபாரன்ஹீட்", "ફેરનહાઇટ", "ಫ್ಯಾರನ್‌ಹೀಟ್", "ਫਾਰਨਹਾਈਟ", "ଫାରେନହାଇଟ", "ഫാരൻഹീറ്റ്", "ফাৰেনহাইট", "فارنہائٹ"]
  const c = celsius.some((unit) => hasWholePhrase(unitText, unit))
  const f = fahrenheit.some((unit) => hasWholePhrase(unitText, unit))
  if (c === f) return null
  if (c && (value < 20 || value > 45)) return null
  if (f && (value < 68 || value > 113)) return null
  return { value, unit: c ? "C" : "F" }
}
