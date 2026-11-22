/** Canonical assistant languages. A locale tag does not guarantee a device speech engine. */
export const ASSISTANT_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", speechLocale: "en-IN", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechLocale: "hi-IN", dir: "ltr" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", speechLocale: "mr-IN", dir: "ltr" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", speechLocale: "bn-IN", dir: "ltr" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechLocale: "te-IN", dir: "ltr" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechLocale: "ta-IN", dir: "ltr" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", speechLocale: "gu-IN", dir: "ltr" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechLocale: "kn-IN", dir: "ltr" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", speechLocale: "pa-IN", dir: "ltr" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", speechLocale: "or-IN", dir: "ltr" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechLocale: "ml-IN", dir: "ltr" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", speechLocale: "as-IN", dir: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", speechLocale: "ur-IN", dir: "rtl" },
] as const

export type AssistantLanguageCode = (typeof ASSISTANT_LANGUAGES)[number]["code"]
export type AssistantLanguage = (typeof ASSISTANT_LANGUAGES)[number]
export type AssistantSpeechLocale = AssistantLanguage["speechLocale"]

export function resolveAssistantLanguage(input: string | null | undefined): AssistantLanguageCode {
  const normalized = (input || "en").trim().toLowerCase().split(/[-_]/)[0]
  const alias = normalized === "od" || normalized === "ori" ? "or" : normalized
  return ASSISTANT_LANGUAGES.find((language) => language.code === alias)?.code || "en"
}

export function getAssistantLanguage(input: string | null | undefined): AssistantLanguage {
  const code = resolveAssistantLanguage(input)
  return ASSISTANT_LANGUAGES.find((language) => language.code === code)!
}
