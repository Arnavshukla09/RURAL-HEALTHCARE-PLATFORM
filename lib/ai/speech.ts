/** Browser speech with explicit capability checks. Offline support depends on installed language packs/voices. */
import { ASSISTANT_LANGUAGES, getAssistantLanguage, type AssistantSpeechLocale } from "@/lib/assistant/languages"
import { getAssistantPrompt } from "@/lib/assistant/prompts"

export type SupportedLang = AssistantSpeechLocale
export const LANGUAGE_LABELS = Object.fromEntries(ASSISTANT_LANGUAGES.map((language) => [language.speechLocale, language.nativeName])) as Record<SupportedLang, string>
export const getSpeechLangFromCode = (code: string): SupportedLang => getAssistantLanguage(code).speechLocale

export type LocalRecognitionAvailability = "available" | "downloadable" | "downloading" | "unavailable" | "unknown"
const localRecognition = new Map<SupportedLang, LocalRecognitionAvailability>()

function recognitionConstructor(): any {
  if (typeof window === "undefined") return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

export interface SpeechCapabilities {
  recognitionSupported: boolean
  synthesisSupported: boolean
  matchingVoiceAvailable: boolean
  localVoiceAvailable: boolean
  recognitionOffline: "unknown" | "available" | "unavailable"
  localRecognition: LocalRecognitionAvailability
  canInstallLocalRecognition: boolean
}

export function getSpeechCapabilities(lang: SupportedLang): SpeechCapabilities {
  const constructor = recognitionConstructor()
  const voices = getAvailableVoices(lang)
  const availability = localRecognition.get(lang) || "unknown"
  return {
    recognitionSupported: Boolean(constructor),
    synthesisSupported: typeof window !== "undefined" && Boolean(window.speechSynthesis),
    matchingVoiceAvailable: voices.length > 0,
    localVoiceAvailable: voices.some((voice) => voice.localService),
    recognitionOffline: availability === "available" ? "available" : availability === "unavailable" ? "unavailable" : "unknown",
    localRecognition: availability,
    canInstallLocalRecognition: typeof constructor?.install === "function",
  }
}

/** Checks experimental on-device recognition; constructor presence alone is not evidence of language support. */
export async function checkLocalRecognition(lang: SupportedLang): Promise<LocalRecognitionAvailability> {
  const constructor = recognitionConstructor()
  if (typeof constructor?.available !== "function") return "unknown"
  try {
    const status = await constructor.available({ langs: [lang], processLocally: true })
    const availability: LocalRecognitionAvailability = ["available", "downloadable", "downloading", "unavailable"].includes(status) ? status : "unknown"
    localRecognition.set(lang, availability)
    return availability
  } catch {
    localRecognition.set(lang, "unknown")
    return "unknown"
  }
}

/** Call only after an explicit user click; never downloads a recognition pack during page initialization. */
export async function installLocalRecognition(lang: SupportedLang): Promise<boolean> {
  const constructor = recognitionConstructor()
  if (typeof constructor?.install !== "function") return false
  try {
    const installed = await constructor.install({ langs: [lang] })
    if (!installed) return false
    return (await checkLocalRecognition(lang)) === "available"
  } catch {
    return false
  }
}

const HINGLISH_MAP: Record<string, string> = {
  "seene mein dard": "सीने में दर्द", "stomach pain": "पेट दर्द", "sir dard": "सिरदर्द", "sar dard": "सिरदर्द", "pet dard": "पेट दर्द",
  bukhar: "बुखार", khasi: "खांसी", khansi: "खांसी", dast: "दस्त", ulti: "उल्टी", thakaan: "थकान", saans: "सांस", chakkar: "चक्कर", khujli: "खुजली",
}

function applyHinglishMap(text: string): string {
  let result = text
  for (const [roman, native] of Object.entries(HINGLISH_MAP)) result = result.replace(new RegExp(`\\b${roman}\\b`, "gi"), native)
  return result
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  lang: SupportedLang
  isFinal: boolean
}

export interface SpeechRecognitionOptions {
  lang: SupportedLang
  continuous?: boolean
  interimResults?: boolean
  processLocally?: boolean
  preserveOutput?: boolean
  onResult: (result: SpeechRecognitionResult) => void
  onInterimResult?: (result: SpeechRecognitionResult) => void
  onError?: (error: string) => void
  onErrorKind?: (kind: "micDenied" | "micUnavailable") => void
  onStart?: () => void
  onEnd?: () => void
}

let recognitionInstance: any = null
let recognitionGeneration = 0

function recognitionError(options: SpeechRecognitionOptions, kind: "micDenied" | "micUnavailable") {
  options.onErrorKind?.(kind)
  options.onError?.(getAssistantPrompt(options.lang, kind))
}

export function startSpeechRecognition(options: SpeechRecognitionOptions): boolean {
  const constructor = recognitionConstructor()
  if (!constructor) {
    recognitionError(options, "micUnavailable")
    return false
  }
  const useLocal = options.processLocally === true || localRecognition.get(options.lang) === "available"
  if ((options.processLocally === true || (typeof navigator !== "undefined" && navigator.onLine === false)) && localRecognition.get(options.lang) !== "available") {
    recognitionError(options, "micUnavailable")
    return false
  }
  stopSpeechRecognition()
  if (!options.preserveOutput) stopSpeaking()
  const generation = recognitionGeneration
  try {
    const recognition = new constructor()
    recognition.lang = options.lang
    recognition.continuous = options.continuous ?? false
    recognition.interimResults = options.interimResults ?? Boolean(options.onInterimResult)
    recognition.maxAlternatives = 3
    if (useLocal) recognition.processLocally = true
    const delivered = new Set<number>()
    recognition.onstart = () => { if (generation === recognitionGeneration) options.onStart?.() }
    recognition.onresult = (event: any) => {
      if (generation !== recognitionGeneration) return
      for (let index = event.resultIndex ?? 0; index < event.results.length; index++) {
        const result = event.results[index]
        if (!result?.[0]?.transcript) continue
        const transcript = options.lang === "hi-IN" ? applyHinglishMap(result[0].transcript) : result[0].transcript
        const value: SpeechRecognitionResult = { transcript: transcript.trim(), confidence: Number(result[0].confidence) || 0, lang: options.lang, isFinal: result.isFinal === true }
        if (!value.isFinal) {
          options.onInterimResult?.(value)
          continue
        }
        if (delivered.has(index)) continue
        delivered.add(index)
        options.onResult(value)
        if (!recognition.continuous) {
          try { recognition.stop() } catch {}
          break
        }
      }
    }
    recognition.onerror = (event: any) => {
      if (generation !== recognitionGeneration) return
      if (event.error === "aborted") return
      recognitionError(options, event.error === "not-allowed" || event.error === "service-not-allowed" ? "micDenied" : "micUnavailable")
    }
    recognition.onend = () => {
      if (generation !== recognitionGeneration) return
      if (recognitionInstance === recognition) recognitionInstance = null
      options.onEnd?.()
    }
    recognitionInstance = recognition
    recognition.start()
    return true
  } catch (error) {
    recognitionInstance = null
    recognitionError(options, error instanceof Error && error.name === "NotAllowedError" ? "micDenied" : "micUnavailable")
    return false
  }
}

export function stopSpeechRecognition(): void {
  recognitionGeneration++
  const instance = recognitionInstance
  recognitionInstance = null
  if (instance) try { instance.abort ? instance.abort() : instance.stop() } catch {}
}

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(recognitionConstructor())
}

export interface TTSOptions {
  lang: SupportedLang
  rate?: number
  pitch?: number
  volume?: number
  localOnly?: boolean
  onStart?: () => void
  onEnd?: () => void
  onError?: (msg: string) => void
}

let speakingGeneration = 0
let voicesCleanup: (() => void) | null = null

export function speak(text: string, options: TTSOptions): void {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
    options.onError?.(getAssistantPrompt(options.lang, "voiceUnavailable"))
    return
  }
  stopSpeaking()
  const generation = speakingGeneration
  const synthesis = window.speechSynthesis
  const clean = text.replace(/\*|#{1,6}\s/g, "").replace(/•/g, ".").trim()
  if (!clean) { options.onEnd?.(); return }
  const words = clean.split(/\s+/)
  const chunks: string[] = []
  for (let offset = 0; offset < words.length; offset += 120) chunks.push(words.slice(offset, offset + 120).join(" "))
  let index = 0
  let began = false
  const speakChunk = () => {
    if (generation !== speakingGeneration) return
    if (index >= chunks.length) { options.onEnd?.(); return }
    const localOnly = options.localOnly === true || (typeof navigator !== "undefined" && navigator.onLine === false)
    const voices = getAvailableVoices(options.lang).filter((voice) => !localOnly || voice.localService)
    const voice = voices.find((candidate) => candidate.localService && candidate.lang.toLowerCase() === options.lang.toLowerCase()) || voices.find((candidate) => candidate.localService) || voices[0]
    if (!voice) { options.onError?.(getAssistantPrompt(options.lang, "voiceUnavailable")); return }
    const utterance = new SpeechSynthesisUtterance(chunks[index])
    utterance.lang = options.lang
    utterance.voice = voice
    utterance.rate = Math.min(2, Math.max(0.5, options.rate ?? 0.85))
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1
    utterance.onstart = () => {
      if (generation !== speakingGeneration || began) return
      began = true
      options.onStart?.()
    }
    utterance.onend = () => { if (generation === speakingGeneration) { index++; speakChunk() } }
    utterance.onerror = (event) => {
      if (generation === speakingGeneration && event.error !== "canceled" && event.error !== "interrupted") options.onError?.(getAssistantPrompt(options.lang, "voiceUnavailable"))
    }
    try { synthesis.speak(utterance) } catch { options.onError?.(getAssistantPrompt(options.lang, "voiceUnavailable")) }
  }
  if (synthesis.getVoices().length > 0) { speakChunk(); return }
  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    synthesis.removeEventListener("voiceschanged", finish)
    voicesCleanup = null
    speakChunk()
  }
  const timer = setTimeout(finish, 2000)
  synthesis.addEventListener("voiceschanged", finish)
  voicesCleanup = () => { settled = true; clearTimeout(timer); synthesis.removeEventListener("voiceschanged", finish) }
}

export function stopSpeaking(): void {
  speakingGeneration++
  voicesCleanup?.()
  voicesCleanup = null
  if (typeof window !== "undefined") try { window.speechSynthesis?.cancel() } catch {}
}

export function getAvailableVoices(lang?: SupportedLang): SpeechSynthesisVoice[] {
  if (typeof window === "undefined") return []
  const voices = window.speechSynthesis?.getVoices() || []
  if (!lang) return voices
  const prefix = lang.split("-")[0].toLowerCase()
  return voices.filter((voice) => voice.lang.toLowerCase().split(/[-_]/)[0] === prefix)
}
