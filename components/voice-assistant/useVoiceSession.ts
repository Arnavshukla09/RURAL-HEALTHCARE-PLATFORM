"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { checkLocalRecognition, getSpeechLangFromCode, getSpeechCapabilities, speak, startSpeechRecognition, stopSpeaking, stopSpeechRecognition } from "@/lib/ai/speech"
import { startAudioRecording } from "@/lib/voice/audio-recording"
import type { VoiceStatus } from "./types"
import { getAccessibility } from "@/lib/assistant/accessibility"
import { parseSpokenInterruption } from "@/lib/assistant/interruption"

interface VoiceServiceStatus { available: boolean; asrLanguages: string[]; ttsLanguages: string[] }
export function useVoiceSession(language: string, onTranscript: (text: string) => void, onError: (kind: "micDenied" | "micUnavailable" | "voiceUnavailable") => void) {
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState<VoiceStatus>("idle")
  const [service, setService] = useState<VoiceServiceStatus>({ available: false, asrLanguages: [], ttsLanguages: [] })
  const enabledRef = useRef(false)
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)
  const playback = useRef<HTMLAudioElement | null>(null)
  const playbackUrl = useRef<string | null>(null)
  const requests = useRef(new Set<AbortController>())
  const recorder = useRef<{ stop: () => void; cancel: () => void } | null>(null)
  const turn = useRef(0)
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resumeAfterReply = useRef(true)
  const ownsSpeech = useRef(false)
  onTranscriptRef.current = onTranscript
  onErrorRef.current = onError
  useEffect(() => {
    fetch("/api/assistant/voice").then(response => response.json()).then(setService).catch(() => {})
  }, [])
  // Experimental recognition probes may terminate unsupported browser renderers.
  // Probe only during explicit offline preparation or an activated offline voice session.
  const stop = useCallback(() => {
    turn.current++
    enabledRef.current = false; setEnabled(false); setStatus("idle")
    if (retry.current) clearTimeout(retry.current)
    stopSpeechRecognition(); if (ownsSpeech.current) stopSpeaking(); ownsSpeech.current = false; recorder.current?.cancel(); recorder.current = null
    playback.current?.pause(); playback.current = null
    if (playbackUrl.current) URL.revokeObjectURL(playbackUrl.current)
    playbackUrl.current = null
    requests.current.forEach(request => request.abort()); requests.current.clear()
  }, [])
  const listen = useCallback(async () => {
    if (!enabledRef.current || document.visibilityState !== "visible") return
    const currentTurn = ++turn.current
    if (retry.current) clearTimeout(retry.current)
    stopSpeaking(); playback.current?.pause(); setStatus("listening")
    if (service.available && service.asrLanguages.includes(language) && navigator.onLine) {
      const startup = new AbortController(); requests.current.add(startup)
      try {
        const recording = await startAudioRecording(async audio => {
          if (!enabledRef.current || currentTurn !== turn.current) return
          recorder.current = null
          setStatus("thinking")
          const form = new FormData(); form.set("task", "transcribe"); form.set("language", language); form.set("audio", audio, "utterance.wav")
          const controller = new AbortController(); requests.current.add(controller)
          const timeout = setTimeout(() => controller.abort(), 30000)
          try {
            const response = await fetch("/api/assistant/voice", { method: "POST", body: form, signal: controller.signal })
            const data = await response.json()
            if (!enabledRef.current || currentTurn !== turn.current) return
            if (!response.ok || !data.transcript?.trim()) throw new Error("No speech")
            setStatus("idle"); onTranscriptRef.current(data.transcript)
          } catch { if (currentTurn === turn.current) { stop(); onErrorRef.current("micUnavailable") } }
          finally { clearTimeout(timeout); requests.current.delete(controller) }
        }, () => { if (currentTurn === turn.current) { stop(); onErrorRef.current("micUnavailable") } }, startup.signal)
        if (!enabledRef.current || currentTurn !== turn.current) recording.cancel()
        else recorder.current = recording
      } catch { if (currentTurn === turn.current) { stop(); onErrorRef.current("micDenied") } }
      finally { requests.current.delete(startup) }
      return
    }
    if (!navigator.onLine) {
      await checkLocalRecognition(getSpeechLangFromCode(language))
      if (!enabledRef.current || currentTurn !== turn.current) return
    }
    const available = startSpeechRecognition({
      lang: getSpeechLangFromCode(language), interimResults: false,
      onResult: result => { if (result.isFinal && enabledRef.current && currentTurn === turn.current) { setStatus("idle"); onTranscriptRef.current(result.transcript) } },
      onErrorKind: kind => { if (currentTurn !== turn.current) return; stop(); onErrorRef.current(kind) },
      onEnd: () => { if (currentTurn === turn.current) { setStatus(previous => previous === "listening" ? "idle" : previous); retry.current = setTimeout(() => { if (currentTurn === turn.current && enabledRef.current) listen().catch(() => {}) }, 800) } },
    })
    if (!available) { stop(); onErrorRef.current("micUnavailable") }
  }, [language, service, stop])
  const speakReply = useCallback(async (text: string) => {
    if (!enabledRef.current || !text.trim() || document.visibilityState !== "visible") return
    stopSpeechRecognition(); recorder.current?.cancel(); recorder.current = null
    stopSpeaking(); playback.current?.pause()
    if (playbackUrl.current) URL.revokeObjectURL(playbackUrl.current)
    playbackUrl.current = null
    const currentTurn = ++turn.current
    setStatus("speaking")
    const done = () => {
      if (currentTurn !== turn.current || !enabledRef.current) return
      stopSpeechRecognition()
      ownsSpeech.current = false
      if (!resumeAfterReply.current) { stop(); return }
      setStatus("idle")
      retry.current = setTimeout(() => { listen().catch(() => {}) }, 350)
    }
    const capabilities = await getSpeechCapabilities(getSpeechLangFromCode(language))
    if (currentTurn !== turn.current || !enabledRef.current) return
    const armInterruption = () => {
      if (!resumeAfterReply.current || !capabilities.recognitionSupported || (!navigator.onLine && capabilities.recognitionOffline !== "available")) return
      startSpeechRecognition({ lang: getSpeechLangFromCode(language), continuous: true, interimResults: false, preserveOutput: true,
        onResult: result => {
          if (!result.isFinal || currentTurn !== turn.current || !enabledRef.current) return
          const request = parseSpokenInterruption(result.transcript, text, language)
          if (!request) return
          stop()
          if (document.visibilityState === "visible") { enabledRef.current = true; setEnabled(true); onTranscriptRef.current(request) }
        },
      })
    }
    if (capabilities.matchingVoiceAvailable) {
      ownsSpeech.current = true
      speak(text, { lang: getSpeechLangFromCode(language), localOnly: !navigator.onLine, rate: getAccessibility().rate, onEnd: done, onError: () => { if (currentTurn === turn.current) { stop(); onErrorRef.current("voiceUnavailable") } } })
      armInterruption()
      return
    }
    if (service.available && service.ttsLanguages.includes(language)) {
      const controller = new AbortController(); requests.current.add(controller)
      try {
        const response = await fetch("/api/assistant/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "speak", language, text: text.slice(0, 1200) }), signal: controller.signal })
        if (!response.ok) throw new Error("No voice")
        const data = await response.blob()
        if (currentTurn !== turn.current || !enabledRef.current) return
        const url = URL.createObjectURL(data); playbackUrl.current = url
        const audio = new Audio(url); playback.current = audio
        audio.onended = () => { URL.revokeObjectURL(url); done() }
        audio.onerror = () => { URL.revokeObjectURL(url); if (currentTurn === turn.current) { stop(); onErrorRef.current("voiceUnavailable") } }
        await audio.play()
        if (currentTurn === turn.current && enabledRef.current) armInterruption()
      } catch { if (currentTurn === turn.current) { stop(); onErrorRef.current("voiceUnavailable") } }
      finally { requests.current.delete(controller) }
      return
    }
    stop(); onErrorRef.current("voiceUnavailable")
  }, [language, service, listen, stop])
  const enable = useCallback(() => { resumeAfterReply.current = true; enabledRef.current = true; setEnabled(true) }, [])
  const suspendAfterReply = useCallback(() => { resumeAfterReply.current = false; if (retry.current) clearTimeout(retry.current); stopSpeechRecognition(); recorder.current?.cancel(); recorder.current = null }, [])
  const interrupt = useCallback(() => { const resume = enabledRef.current; stop(); if (resume && document.visibilityState === "visible") enable() }, [stop, enable])
  const toggleListen = useCallback(() => {
    if (status === "listening") { if (recorder.current) { recorder.current.stop(); setStatus("thinking") } else { stopSpeechRecognition(); setStatus("idle") } }
    else { interrupt(); enable(); listen().catch(() => { stop(); onErrorRef.current("micDenied") }) }
  }, [status, enable, listen, stop, interrupt])
  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState !== "visible") stop() }
    document.addEventListener("visibilitychange", onVisibility)
    return () => { document.removeEventListener("visibilitychange", onVisibility); stop() }
  }, [stop])
  return { enabled, status, service, enable, stop, interrupt, suspendAfterReply, listen, toggleListen, speakReply }
}
