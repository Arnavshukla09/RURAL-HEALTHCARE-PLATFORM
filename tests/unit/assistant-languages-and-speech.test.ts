import { afterEach, describe, expect, it, vi } from "vitest"
import { ASSISTANT_LANGUAGES, getAssistantLanguage } from "@/lib/assistant/languages"
import { CORE_PROMPTS } from "@/lib/assistant/prompt-catalog"
import { WORKFLOW_PROMPTS } from "@/lib/assistant/workflow-prompt-catalog"
import { PRIVACY_PROMPTS } from "@/lib/assistant/privacy-prompt-catalog"
import { getAssistantPrompt, getAssistantTriageReply } from "@/lib/assistant/prompts"
import { detectAssistantIntent } from "@/lib/assistant/intents"
import { getAssistantSymptomNames, normalizeAssistantDigits, parseAssistantAge, parseAssistantConfirmation, parseAssistantDate, parseAssistantIntensity, parseAssistantNumber, parseAssistantSymptoms, parseAssistantTemperature } from "@/lib/assistant/parsing"
import { ASSISTANT_PHRASES } from "@/lib/assistant/phrase-catalog"
import { SYMPTOM_PHRASES } from "@/lib/assistant/symptom-phrase-catalog"
import { checkLocalRecognition, getSpeechCapabilities, getSpeechLangFromCode, installLocalRecognition, speak, startSpeechRecognition, stopSpeaking, stopSpeechRecognition } from "@/lib/ai/speech"

afterEach(() => { stopSpeaking(); stopSpeechRecognition(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers() })

describe("All-language assistant workflows", () => {
  it("provides native task, privacy, booking and urgent medical prompts for every picker language", () => {
    expect(ASSISTANT_LANGUAGES.map((entry) => entry.code)).toEqual(["en", "hi", "mr", "bn", "te", "ta", "gu", "kn", "pa", "or", "ml", "as", "ur"])
    for (const { code } of ASSISTANT_LANGUAGES) {
      const all = { ...CORE_PROMPTS[code], ...WORKFLOW_PROMPTS[code], ...PRIVACY_PROMPTS[code] }
      expect(Object.values(all).every((value) => value.length > 0)).toBe(true)
      if (code !== "en") {
        expect(getAssistantPrompt(code, "confirmBooking", { doctor: "Dr A", date: "24", time: "10" })).not.toContain("Book ")
        expect(getAssistantTriageReply(code, "emergency")).toContain("108")
        expect(getAssistantTriageReply(code, "low")).not.toBe(getAssistantTriageReply("en", "low"))
      }
    }
    expect(getAssistantLanguage("as-IN").speechLocale).toBe("as-IN")
    expect(getAssistantLanguage("ur").dir).toBe("rtl")
    expect(getAssistantPrompt("hi", "confirmBooking", { doctor: "Dr A", date: "24", slot: "10" })).not.toContain("{time}")
  })

  it("understands safe yes/no and spoken option numbers in each of the 13 languages", () => {
    for (const { code } of ASSISTANT_LANGUAGES) {
      const phrase = ASSISTANT_PHRASES[code]
      expect(parseAssistantConfirmation(phrase.yes[0], code)).toBe(true)
      expect(parseAssistantConfirmation(phrase.no[0], code)).toBe(false)
      expect(parseAssistantConfirmation(`${phrase.yes[0]} ${phrase.no[0]}`, code)).toBe(null)
      expect(parseAssistantNumber(phrase.numbers[3], code)).toBe(3)
    }
    expect(parseAssistantNumber("पैंतीस साल", "hi")).toBe(35)
    expect(parseAssistantNumber("twenty-one", "en")).toBe(21)
    expect(parseAssistantNumber("one or two", "en")).toBe(null)
    expect(parseAssistantConfirmation("maybe", "en")).toBe(null)
    expect(parseAssistantConfirmation("do not confirm", "en")).toBe(false)
    expect(parseAssistantConfirmation("not okay", "en")).not.toBe(true)
  })

  it("normalises local numerals and calendar dates without guessing ambiguous or impossible values", () => {
    expect(normalizeAssistantDigits("१२ ১২ ੧੨ ૧૨ ୧୨ ௧௨ ౧౨ ೧೨ ൧൨ ١٢ ۱۲")).toBe("12 12 12 12 12 12 12 12 12 12 12")
    const now = new Date("2026-11-22T20:00:00Z") // Already 23 November in India.
    for (const { code } of ASSISTANT_LANGUAGES) {
      expect(parseAssistantDate(ASSISTANT_PHRASES[code].tomorrow[0], code, now)).toBe("2026-11-24")
      expect(parseAssistantDate(ASSISTANT_PHRASES[code].dayAfter[0], code, now)).toBe("2026-11-25")
    }
    expect(parseAssistantDate("२४ नवंबर", "hi", now)).toBe("2026-11-24")
    expect(parseAssistantDate("২৪ নভেম্বর", "bn", now)).toBe("2026-11-24")
    expect(parseAssistantDate("24/11/2026", "en", now)).toBe("2026-11-24")
    expect(parseAssistantDate("2026-02-30", "en", now)).toBe(null)
    expect(parseAssistantDate("today or tomorrow", "en", now)).toBe(null)
    expect(parseAssistantDate("2026-11-24 or 2026-11-25", "en", now)).toBe(null)
    expect(parseAssistantDate("24/11/2026 or 25/11/2026", "en", now)).toBe(null)
    expect(parseAssistantDate("आजारी", "mr", now)).toBe(null)
  })

  it("routes native tasks and makes native acute symptoms take precedence over navigation", () => {
    for (const { code } of ASSISTANT_LANGUAGES) {
      expect(detectAssistantIntent(ASSISTANT_PHRASES[code].book[0], code).intent).toBe("book_appointment")
      expect(detectAssistantIntent(ASSISTANT_PHRASES[code].records[0], code).intent).toBe("view_records")
      expect(detectAssistantIntent(ASSISTANT_PHRASES[code].repeat[0], code).intent).toBe("repeat")
      expect(parseAssistantSymptoms(SYMPTOM_PHRASES[code]["chest-pain"][0], code)).toContain("chest-pain")
      expect(detectAssistantIntent(`${ASSISTANT_PHRASES[code].book[0]} ${SYMPTOM_PHRASES[code]["chest-pain"][0]}`, code).intent).toBe("emergency")
    }
    expect(detectAssistantIntent("speak in Assamese", "en").targetLanguage).toBe("as")
    expect(getAssistantSymptomNames(["chest-pain", "shortness-of-breath"])).toEqual(["Chest pain", "Shortness of breath"])
  })

  it("does not invent symptoms or turn a negated symptom into an emergency", () => {
    expect(parseAssistantSymptoms("no chest pain but cough", "en")).toEqual(["cough"])
    expect(parseAssistantSymptoms("chest pain and no fever", "en")).toEqual(["chest-pain"])
    expect(parseAssistantSymptoms("सीने में दर्द नहीं है और खांसी है", "hi")).toEqual(["cough"])
    expect(parseAssistantSymptoms("baby not breathing", "en")).toContain("shortness-of-breath")
    expect(parseAssistantSymptoms("बच्चा सांस नहीं ले रहा", "hi")).toContain("shortness-of-breath")
    expect(parseAssistantSymptoms("high fever and cough with blood", "en")).toEqual(["high-fever", "cough-with-blood"])
    expect(parseAssistantSymptoms("this phrase has no known symptom", "en")).toEqual([])
  })

  it("parses localized severity choices without interpreting an uncertain or negated answer as severe", () => {
    for (const { code } of ASSISTANT_LANGUAGES) for (const value of ["mild", "moderate", "severe"] as const) expect(parseAssistantIntensity(getAssistantPrompt(code, value), code)).toBe(value)
    expect(parseAssistantIntensity("हल्का", "hi")).toBe("mild")
    expect(parseAssistantIntensity("not severe", "en")).toBe(null)
    expect(parseAssistantIntensity("mild or severe", "en")).toBe(null)
  })

  it("preserves infant ages in months and never guesses a temperature unit", () => {
    expect(parseAssistantAge("3 months", "en")).toBe(0.25)
    expect(parseAssistantAge("छह माह", "hi")).toBe(0.5)
    expect(parseAssistantAge("১২ মাস", "bn")).toBe(1)
    expect(parseAssistantTemperature("37 Celsius")).toEqual({ value: 37, unit: "C" })
    expect(parseAssistantTemperature("103°F")).toEqual({ value: 103, unit: "F" })
    expect(parseAssistantTemperature("१०३ फ़ारेनहाइट")).toEqual({ value: 103, unit: "F" })
    expect(parseAssistantTemperature("100 Celsius")).toBe(null)
    expect(parseAssistantTemperature("100")).toBe(null)
  })
})

describe("Browser speech boundaries", () => {
  it("safely reports missing browser capabilities, including Assamese", () => {
    vi.stubGlobal("window", undefined)
    expect(getSpeechLangFromCode("as")).toBe("as-IN")
    expect(getSpeechCapabilities("as-IN").recognitionOffline).toBe("unknown")
    const error = vi.fn()
    expect(startSpeechRecognition({ lang: "as-IN", onResult: vi.fn(), onError: error })).toBe(false)
    expect(error).toHaveBeenCalledWith(getAssistantPrompt("as", "micUnavailable"))
  })

  it("delivers final transcripts only once while keeping interim events separate", () => {
    let instance: any
    class Recognition {
      continuous = false
      start = vi.fn()
      stop = vi.fn()
      abort = vi.fn()
      constructor() { instance = this }
    }
    vi.stubGlobal("window", { SpeechRecognition: Recognition })
    vi.stubGlobal("navigator", { onLine: true })
    const final = vi.fn(), interim = vi.fn()
    expect(startSpeechRecognition({ lang: "hi-IN", onResult: final, onInterimResult: interim })).toBe(true)
    const result = Object.assign([{ transcript: "bukhar", confidence: 0.9 }], { isFinal: false })
    instance.onresult({ resultIndex: 0, results: [result] })
    expect(final).not.toHaveBeenCalled()
    expect(interim).toHaveBeenCalledTimes(1)
    result.isFinal = true
    instance.onresult({ resultIndex: 0, results: [result] })
    instance.onresult({ resultIndex: 0, results: [result] })
    expect(final).toHaveBeenCalledTimes(1)
    expect(final.mock.calls[0][0]).toMatchObject({ transcript: "बुखार", isFinal: true })
    expect(instance.stop).toHaveBeenCalledTimes(1)
  })

  it("does not claim offline ASR merely because recognition exists; installs only when explicitly requested", async () => {
    class Recognition {
      static available = vi.fn(async () => "available")
      static install = vi.fn(async () => true)
      start = vi.fn()
      abort = vi.fn()
    }
    vi.stubGlobal("window", { SpeechRecognition: Recognition })
    expect(getSpeechCapabilities("mr-IN").recognitionOffline).toBe("unknown")
    expect(Recognition.install).not.toHaveBeenCalled()
    expect(await checkLocalRecognition("mr-IN")).toBe("available")
    expect(await installLocalRecognition("mr-IN")).toBe(true)
    expect(Recognition.install).toHaveBeenCalledWith({ langs: ["mr-IN"] })
  })

  it("never uses an English or remote voice as an offline Assamese fallback", () => {
    const synthesis = { cancel: vi.fn(), getVoices: () => [{ lang: "en-IN", localService: true }, { lang: "as-IN", localService: false }], speak: vi.fn() }
    vi.stubGlobal("window", { speechSynthesis: synthesis })
    vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(public text: string) {} })
    vi.stubGlobal("navigator", { onLine: false })
    const error = vi.fn()
    speak("অসমীয়া", { lang: "as-IN", onError: error })
    expect(synthesis.speak).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(getAssistantPrompt("as", "voiceUnavailable"))
  })

  it("ends voice loading with a native error instead of leaving the avatar speaking forever", () => {
    vi.useFakeTimers()
    const synthesis = { cancel: vi.fn(), getVoices: () => [], speak: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }
    vi.stubGlobal("window", { speechSynthesis: synthesis })
    vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(public text: string) {} })
    const error = vi.fn()
    speak("Hello", { lang: "en-IN", onError: error })
    vi.advanceTimersByTime(2000)
    expect(error).toHaveBeenCalledTimes(1)
    expect(synthesis.removeEventListener).toHaveBeenCalled()
  })
})
