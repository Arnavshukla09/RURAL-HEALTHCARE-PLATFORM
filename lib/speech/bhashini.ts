/**
 * lib/speech/bhashini.ts
 *
 * Speech & Language Processing Service Abstraction.
 *
 * $0 Free-Tier Posture:
 * - By default, uses standard HTML5 Web Speech API (SpeechRecognition / SpeechSynthesis)
 *   in client browsers at zero external cost.
 * - Architecture Seam: If Bhashini ULCA API credentials (`BHASHINI_API_KEY` & `BHASHINI_USER_ID`)
 *   are configured, requests can be routed to the Government of India Bhashini ASR/TTS endpoints
 *   for advanced vernacular dialect support (e.g. Hindi, Bhojpuri, Bundelkhandi, Malvi).
 */

export interface SpeechSynthesisOptions {
  text: string
  language: "hi" | "en" | "mr" | "ta" | "te"
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: any) => void
}

export interface SpeechRecognitionOptions {
  language: "hi" | "en" | "mr" | "ta" | "te"
  onResult: (transcript: string, isFinal: boolean) => void
  onError?: (err: any) => void
  onEnd?: () => void
}

export class VernacularSpeechEngine {
  private hasBhashiniKeys: boolean

  constructor() {
    this.hasBhashiniKeys = Boolean(
      process.env.BHASHINI_API_KEY && process.env.BHASHINI_USER_ID
    )
  }

  get isBhashiniEnabled(): boolean {
    return this.hasBhashiniKeys
  }

  /**
   * Synthesize speech from text.
   * Client-side zero cost fallback uses window.speechSynthesis.
   */
  speakText(options: SpeechSynthesisOptions): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported in this browser environment.")
      return
    }

    try {
      window.speechSynthesis.cancel() // Stop any ongoing speech

      const utterance = new SpeechSynthesisUtterance(options.text)
      utterance.lang = options.language === "hi" ? "hi-IN" : "en-IN"
      utterance.rate = 0.95 // Slightly slower for clarity in rural healthcare instructions

      if (options.onStart) utterance.onstart = options.onStart
      if (options.onEnd) utterance.onend = options.onEnd
      if (options.onError) utterance.onerror = options.onError

      window.speechSynthesis.speak(utterance)
    } catch (e) {
      if (options.onError) options.onError(e)
    }
  }

  /**
   * Stop any current speech playback.
   */
  stopSpeaking(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }

  /**
   * Create a browser Speech Recognition session (zero cost)
   */
  createRecognition(options: SpeechRecognitionOptions): any {
    if (typeof window === "undefined") return null

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn("Browser SpeechRecognition API not supported.")
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = options.language === "hi" ? "hi-IN" : "en-IN"

    recognition.onresult = (event: any) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      const text = finalTranscript || interimTranscript
      options.onResult(text, Boolean(finalTranscript))
    }

    if (options.onError) recognition.onerror = options.onError
    if (options.onEnd) recognition.onend = options.onEnd

    return recognition
  }
}

export const vernacularSpeech = new VernacularSpeechEngine()
