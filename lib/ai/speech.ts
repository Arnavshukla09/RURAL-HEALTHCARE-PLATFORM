/**
 * lib/ai/speech.ts
 *
 * Multilingual Voice Input/Output layer for RuralHealth.
 *
 * Supports:
 *  - Speech-to-Text via Web Speech API (works offline on Android Chrome)
 *  - Text-to-Speech via Web Speech Synthesis (works offline on any browser)
 *  - Languages: English, Hindi, Marathi, Bengali, Tamil
 *  - Auto-detection of spoken language
 *  - Transliteration hints for Hindi spoken in Roman script (e.g. "bukhar" → "बुखार")
 */

export type SupportedLang = 'en-IN' | 'hi-IN' | 'mr-IN' | 'bn-IN' | 'ta-IN'

export const LANGUAGE_LABELS: Record<SupportedLang, string> = {
  'en-IN': 'English',
  'hi-IN': 'हिन्दी',
  'mr-IN': 'मराठी',
  'bn-IN': 'বাংলা',
  'ta-IN': 'தமிழ்',
}

// Common Hindi health terms spoken in Roman (Hinglish) → Hindi script
const HINGLISH_MAP: Record<string, string> = {
  'bukhar': 'बुखार', 'fever': 'बुखार',
  'sir dard': 'सिरदर्द', 'sar dard': 'सिरदर्द',
  'pet dard': 'पेट दर्द', 'stomach pain': 'पेट दर्द',
  'khasi': 'खांसी', 'khansi': 'खांसी',
  'dast': 'दस्त', 'loose motion': 'दस्त',
  'ulti': 'उल्टी', 'vomit': 'उल्टी',
  'thakaan': 'थकान', 'weakness': 'कमज़ोरी',
  'sans': 'सांस', 'saans': 'सांस',
  'chakkar': 'चक्कर', 'dizziness': 'चक्कर',
  'khujli': 'खुजली', 'itching': 'खुजली',
  'seene mein dard': 'सीने में दर्द',
  'ambulance': 'एम्बुलेंस', 'hospital': 'अस्पताल',
  'doctor': 'डॉक्टर', 'dawai': 'दवाई', 'dawa': 'दवाई',
  'injection': 'इंजेक्शन', 'blood': 'खून',
}

function applyHinglishMap(text: string): string {
  let result = text.toLowerCase()
  for (const [roman, devanagari] of Object.entries(HINGLISH_MAP)) {
    result = result.replace(new RegExp(roman, 'gi'), devanagari)
  }
  return result
}

// ── Speech Recognition ────────────────────────────────────────────────────────

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
  onResult: (result: SpeechRecognitionResult) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

let recognitionInstance: any = null

export function startSpeechRecognition(options: SpeechRecognitionOptions): boolean {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!SpeechRecognition) {
    options.onError?.('Speech recognition not supported on this browser. Please use Chrome on Android.')
    return false
  }

  // Stop any existing session
  stopSpeechRecognition()

  const recognition = new SpeechRecognition()
  recognition.lang = options.lang
  recognition.continuous = options.continuous ?? false
  recognition.interimResults = options.interimResults ?? true
  recognition.maxAlternatives = 3

  recognition.onresult = (event: any) => {
    const result = event.results[event.results.length - 1]
    let transcript = result[0].transcript

    // Apply Hinglish transliteration for Hindi mode
    if (options.lang === 'hi-IN') {
      transcript = applyHinglishMap(transcript)
    }

    options.onResult({
      transcript,
      confidence: result[0].confidence,
      lang: options.lang,
      isFinal: result.isFinal,
    })
  }

  recognition.onerror = (event: any) => {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone not found. Please check permissions.',
      'not-allowed': 'Microphone permission denied. Please allow microphone access.',
      'network': 'Network error during speech recognition.',
      'aborted': 'Speech recognition was stopped.',
    }
    options.onError?.(errorMessages[event.error] ?? `Error: ${event.error}`)
  }

  recognition.onend = () => {
    recognitionInstance = null
    options.onEnd?.()
  }

  recognition.start()
  recognitionInstance = recognition
  return true
}

export function stopSpeechRecognition(): void {
  if (recognitionInstance) {
    recognitionInstance.stop()
    recognitionInstance = null
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  )
}

// ── Text-to-Speech ────────────────────────────────────────────────────────────

export interface TTSOptions {
  lang: SupportedLang
  rate?: number   // 0.5 – 2.0, default 0.85 (slightly slower for clarity)
  pitch?: number  // 0 – 2.0, default 1
  volume?: number // 0 – 1.0, default 1
  onEnd?: () => void
  onError?: (msg: string) => void
}

export function speak(text: string, options: TTSOptions): void {
  if (!window.speechSynthesis) {
    options.onError?.('Text-to-speech not supported on this browser.')
    return
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  // Strip markdown characters for clean audio
  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/•/g, '.')
    .trim()

  // Split into chunks to avoid iOS/Android TTS truncation on long text
  const chunks = splitIntoChunks(cleanText, 200)
  let chunkIndex = 0

  const speakChunk = () => {
    if (chunkIndex >= chunks.length) {
      options.onEnd?.()
      return
    }

    const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex])
    utterance.lang = options.lang
    utterance.rate = options.rate ?? 0.85
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1

    // Pick a regional voice if available
    const voices = window.speechSynthesis.getVoices()
    const regional = voices.find(v => v.lang === options.lang)
    const fallback = voices.find(v => v.lang.startsWith(options.lang.split('-')[0]))
    if (regional) utterance.voice = regional
    else if (fallback) utterance.voice = fallback

    utterance.onend = () => {
      chunkIndex++
      speakChunk()
    }

    utterance.onerror = (e) => {
      options.onError?.(`TTS error: ${e.error}`)
    }

    window.speechSynthesis.speak(utterance)
  }

  // Ensure voices are loaded
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', speakChunk, { once: true })
  } else {
    speakChunk()
  }
}

export function stopSpeaking(): void {
  window.speechSynthesis?.cancel()
}

export function getAvailableVoices(lang?: SupportedLang): SpeechSynthesisVoice[] {
  const voices = window.speechSynthesis?.getVoices() ?? []
  if (!lang) return voices
  return voices.filter(v =>
    v.lang === lang || v.lang.startsWith(lang.split('-')[0])
  )
}

function splitIntoChunks(text: string, maxWords: number): string[] {
  const sentences = text.split(/(?<=[।.!?])\s+/)
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).split(' ').length > maxWords) {
      if (current) chunks.push(current.trim())
      current = sentence
    } else {
      current += ' ' + sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.length > 0 ? chunks : [text]
}
