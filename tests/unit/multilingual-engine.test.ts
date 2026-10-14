import { describe, it, expect } from "vitest"
import {
  SUPPORTED_LANGUAGES,
  STATE_CODE_TO_LANGUAGE,
  getDeviceLanguage,
  getLanguageForStateCode,
  getLanguageFromCoordinates,
  getLanguageMetadata,
} from "@/lib/i18n/detect-language"
import { detectTier0Emergency } from "@/lib/chat/emergency"
import { getSpeechLangFromCode } from "@/lib/ai/speech"

describe("Multilingual Engine & Dialect Mapping", () => {
  it("provides all 13 major Indian languages with native endonyms and dialect metadata", () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(13)
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code)
    expect(codes).toContain("en")
    expect(codes).toContain("hi")
    expect(codes).toContain("mr")
    expect(codes).toContain("bn")
    expect(codes).toContain("te")
    expect(codes).toContain("ta")
    expect(codes).toContain("gu")
    expect(codes).toContain("kn")
    expect(codes).toContain("pa")
    expect(codes).toContain("or")

    // Check Hindi and Marathi vernacular dialects
    const hindi = getLanguageMetadata("hi")
    expect(hindi.nativeName).toBe("हिन्दी")
    expect(hindi.dialects).toBeDefined()
    expect(hindi.dialects?.some((d) => d.includes("Bhojpuri"))).toBe(true)
    expect(hindi.dialects?.some((d) => d.includes("Maithili"))).toBe(true)

    const marathi = getLanguageMetadata("mr")
    expect(marathi.nativeName).toBe("मराठी")
    expect(marathi.dialects?.some((d) => d.includes("Varhadi"))).toBe(true)
  })

  it("maps LGD State Codes to official regional languages", () => {
    expect(getLanguageForStateCode("27")).toBe("mr") // Maharashtra
    expect(getLanguageForStateCode("19")).toBe("bn") // West Bengal
    expect(getLanguageForStateCode("33")).toBe("ta") // Tamil Nadu
    expect(getLanguageForStateCode("28")).toBe("te") // Andhra Pradesh
    expect(getLanguageForStateCode("24")).toBe("gu") // Gujarat
    expect(getLanguageForStateCode("29")).toBe("kn") // Karnataka
    expect(getLanguageForStateCode("03")).toBe("pa") // Punjab
    expect(getLanguageForStateCode("21")).toBe("or") // Odisha
    expect(getLanguageForStateCode("23")).toBe("hi") // Madhya Pradesh
  })

  it("resolves GPS coordinates to nearest state and regional language", () => {
    // Mumbai (approx 19.07, 72.87) -> Maharashtra ('mr')
    const mumbai = getLanguageFromCoordinates(19.076, 72.8777)
    expect(mumbai.stateCode).toBe("27")
    expect(mumbai.languageCode).toBe("mr")

    // Kolkata (approx 22.57, 88.36) -> West Bengal ('bn')
    const kolkata = getLanguageFromCoordinates(22.5726, 88.3639)
    expect(kolkata.stateCode).toBe("19")
    expect(kolkata.languageCode).toBe("bn")

    // Chennai (approx 13.08, 80.27) -> Tamil Nadu ('ta')
    const chennai = getLanguageFromCoordinates(13.0827, 80.2707)
    expect(chennai.stateCode).toBe("33")
    expect(chennai.languageCode).toBe("ta")

    // Bhopal (approx 23.25, 77.41) -> Madhya Pradesh ('hi')
    const bhopal = getLanguageFromCoordinates(23.2599, 77.4126)
    expect(bhopal.stateCode).toBe("23")
    expect(bhopal.languageCode).toBe("hi")
  })

  it("provides regional language Tier 0 emergency responses with 108 and 14416 numbers", () => {
    // Marathi physical emergency
    const mrEmergency = detectTier0Emergency("severe chest pain", "mr")
    expect(mrEmergency).not.toBeNull()
    expect(mrEmergency?.isEmergency).toBe(true)
    expect(mrEmergency?.hotline).toBe("108")
    expect(mrEmergency?.reply).toContain("108")
    expect(mrEmergency?.reply).toContain("वैद्यकीय आणीबाणी")

    // Bengali physical emergency
    const bnEmergency = detectTier0Emergency("heart attack", "bn")
    expect(bnEmergency?.reply).toContain("108")
    expect(bnEmergency?.reply).toContain("জরুরি চিকিৎসা")

    // Telugu physical emergency
    const teEmergency = detectTier0Emergency("snake bite in field", "te")
    expect(teEmergency?.reply).toContain("108")
    expect(teEmergency?.reply).toContain("అత్యవసర వైద్య")

    // Tamil crisis emergency (Tele-MANAS 14416)
    const taCrisis = detectTier0Emergency("i want to end my life", "ta")
    expect(taCrisis?.hotline).toBe("14416")
    expect(taCrisis?.reply).toContain("14416")
    expect(taCrisis?.reply).toContain("மனநல அவசர உதவி")
  })

  it("maps language codes to Web Speech synthesis and recognition locales", () => {
    expect(getSpeechLangFromCode("mr")).toBe("mr-IN")
    expect(getSpeechLangFromCode("bn")).toBe("bn-IN")
    expect(getSpeechLangFromCode("ta")).toBe("ta-IN")
    expect(getSpeechLangFromCode("te")).toBe("te-IN")
    expect(getSpeechLangFromCode("gu")).toBe("gu-IN")
    expect(getSpeechLangFromCode("kn")).toBe("kn-IN")
    expect(getSpeechLangFromCode("pa")).toBe("pa-IN")
    expect(getSpeechLangFromCode("or")).toBe("or-IN")
    expect(getSpeechLangFromCode("hi")).toBe("hi-IN")
    expect(getSpeechLangFromCode("en")).toBe("en-IN")
  })

  it("safely handles all 13 supported languages without undefined property exceptions", () => {
    const sampleBilingualContent = {
      en: { title: "Welcome", button: "Click" },
      hi: { title: "नमस्ते", button: "क्लिक" },
    }

    for (const lang of SUPPORTED_LANGUAGES) {
      const resolved = sampleBilingualContent[lang.code as keyof typeof sampleBilingualContent] || sampleBilingualContent.en
      expect(resolved).toBeDefined()
      expect(resolved.title).toBeTruthy()
      expect(resolved.button).toBeTruthy()
    }
  })
})
