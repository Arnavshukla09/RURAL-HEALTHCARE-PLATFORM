"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/providers/AppProvider"
import { getAssistantLanguage } from "@/lib/assistant/languages"
import { getAssistantPrompt, getAssistantTriageReply, type AssistantPromptKey } from "@/lib/assistant/prompts"
import { detectAssistantIntent } from "@/lib/assistant/intents"
import { parseAssistantConfirmation, parseAssistantDate, parseAssistantNumber, parseAssistantSymptoms, getAssistantSymptomNames, parseAssistantMode, parseAssistantIntensity, parseAssistantAge, parseAssistantTemperature } from "@/lib/assistant/parsing"
import { assistantAction, formatAssistantDate, formatAssistantTime, type AssistantProvider, type AssistantAppointment, type AssistantSlot, type PreparedAction } from "@/lib/assistant/client-actions"
import { composeResponse } from "@/lib/symptoms/compose"
import { enqueue } from "@/lib/offline/outbox"
import { ASSISTANT_CONFIG } from "@/lib/assistant/config"
import type { AssistantChoice, AssistantDraft, AssistantMessage, AssistantStage } from "./types"
import { performConfirmedVoiceBooking, performConfirmedVoiceCancellation } from "./action-receipts"

const navigation: Record<string, string> = { navigate_home: "/", view_camps: "/camps", view_schemes: "/health-info/schemes", health_info: "/health-info", directory: "/directory" }
export function useAssistantWorkflow() {
  const { user, language, setLanguage, setSymptomCheckResult } = useApp()
  const router = useRouter()
  const locale = getAssistantLanguage(language).speechLocale
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [choices, setChoices] = useState<AssistantChoice[]>([])
  const [stage, setStage] = useState<AssistantStage>("idle")
  const [draft, setDraft] = useState<AssistantDraft>({})
  const [prepared, setPrepared] = useState<PreparedAction | null>(null)
  const [busy, setBusy] = useState(false)
  const [hydratedOwner, setHydratedOwner] = useState<string | null>(null)
  const [emergency, setEmergency] = useState(false)
  const serial = useRef(Date.now())
  const running = useRef(false)
  const ownerGeneration = useRef(0)
  const owner = user?.id || "guest"
  const prompt = useCallback((key: AssistantPromptKey, values: Record<string, string | number> = {}) => getAssistantPrompt(language, key, values), [language])
  const say = useCallback((content: string, isEmergency = false) => {
    setMessages(previous => [...previous.slice(-18), { id: ++serial.current, role: "assistant", content, emergency: isEmergency }])
  }, [])
  useEffect(() => {
    ownerGeneration.current++; running.current = false; setBusy(false)
    setPrepared(null)
    setChoices([])
    setEmergency(false)
    try {
      const stored = owner === "guest" ? null : JSON.parse(sessionStorage.getItem(`${ASSISTANT_CONFIG.sessionKey}_${owner}`) || "null")
      const restored: AssistantDraft = stored?.draft || {}
      setDraft(restored)
      const stages: Record<string, AssistantPromptKey> = { "symptoms-age": "askAge", "symptoms-duration": "askDuration", "symptoms-intensity": "askIntensity", "symptoms-temperature": "askTemperature", "symptoms-input": "askSymptoms" }
      const nextStage = stored?.stage in stages ? stored.stage as AssistantStage : restored.provider && String(stored?.stage).startsWith("book-") ? "book-date" : "idle"
      setStage(nextStage)
      if (nextStage === "symptoms-intensity") setChoices(["mild", "moderate", "severe"].map((value, index) => ({ id: String(index + 1), value, label: `${index + 1}. ${prompt(value as "mild" | "moderate" | "severe")}` })))
      if (nextStage === "symptoms-temperature") setChoices([{ id: "skip", value: "skip", label: prompt("skip") }])
      setMessages([{ id: ++serial.current, role: "assistant", content: getAssistantPrompt(language, nextStage === "book-date" ? "askDate" : stages[nextStage] || "welcome") }])
      setHydratedOwner(owner)
    } catch { setDraft({}); setStage("idle"); setHydratedOwner(owner); setMessages([{ id: ++serial.current, role: "assistant", content: getAssistantPrompt(language, "welcome") }]) }
  }, [owner, language])
  useEffect(() => {
    if (owner === "guest" || hydratedOwner !== owner) return
    try { sessionStorage.setItem(`${ASSISTANT_CONFIG.sessionKey}_${owner}`, JSON.stringify({ draft, stage })) } catch {}
  }, [draft, owner, stage, hydratedOwner])
  const reset = () => { setStage("idle"); setPrepared(null); setChoices([]); setDraft({}) }
  const showEmergency = () => {
    reset(); setEmergency(true); say(prompt("triageEmergency"), true)
    setChoices([{ id: "emergency-page", label: prompt("emergency"), value: "/emergency", kind: "route" }])
  }
  const login = () => { say(prompt("loginRequired")); router.push("/login?redirect=/appointments") }
  const showSlots = async (nextDraft: AssistantDraft) => {
    const generation = ownerGeneration.current
    if (!nextDraft.provider || !nextDraft.date) return
    let slots: AssistantSlot[] = []
    if (navigator.onLine) {
      const result = await assistantAction<{ slots: AssistantSlot[] }>("appointments.slots", { providerId: nextDraft.provider.id, date: nextDraft.date })
      if (generation !== ownerGeneration.current) return
      slots = result.slots.filter(slot => slot.available)
    } else {
      slots = Array.from({ length: 16 }, (_, index) => ({ appointmentDate: new Date(`${nextDraft.date}T${String(9 + Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}:00+05:30`).toISOString(), available: true }))
        .filter(slot => Date.parse(slot.appointmentDate) > Date.now())
    }
    setChoices(slots.slice(0, 16).map((slot, index) => ({ id: String(index + 1), value: slot.appointmentDate, label: `${index + 1}. ${formatAssistantTime(slot.appointmentDate, locale)}` })))
    setStage("book-slot")
    say(`${navigator.onLine ? prompt("askSlot") : prompt("offlineSlots")} ${slots.slice(0, 8).map((slot, index) => `${index + 1}. ${formatAssistantTime(slot.appointmentDate, locale)}`).join(". ")}`)
    if (!slots.length) say(prompt("bookingFailed"))
  }
  const start = async (intent: string) => {
    const generation = ownerGeneration.current
    if (running.current) return
    if (intent === "repeat") { const last = messages.filter(message => message.role === "assistant").at(-1); if (last) say(last.content, last.emergency); return }
    if (intent === "stop") { say(prompt("stopVoice")); return }
    if (intent === "help") { say(prompt("help")); return }
    reset(); setEmergency(false)
    if (intent === "emergency") return showEmergency()
    if (intent === "check_symptoms") { setStage("symptoms-age"); say(prompt("askAge")); return }
    if (intent === "find_facilities") { setStage("facility-location"); say(`${prompt("findFacilities")}. 1. ${prompt("gps")}. 2. ${prompt("district")}`); setChoices([{ id: "1", label: `1. 📍 ${prompt("gps")}`, value: "gps", kind: "location" }, { id: "2", label: `2. 🗺️ ${prompt("district")}`, value: "/locations", kind: "route" }]); return }
    if (intent === "view_records") { if (!user) return login(); setStage("records-confirm"); say(`${prompt("confirmReadRecords")} ${prompt("yesNo")}`); return }
    if (intent === "cancel_appointment" || intent === "join_consultation") intent = "view_appointments"
    if (navigation[intent]) { router.push(navigation[intent]); say(prompt("opened", { item: prompt(intent === "view_camps" ? "camps" : intent === "view_schemes" ? "schemes" : "healthInfo") })); return }
    if (intent === "book_appointment" || intent === "view_appointments") {
      if (!user) return login()
      running.current = true; setBusy(true)
      try {
        if (intent === "book_appointment") {
          let providers: AssistantProvider[] = []
          if (navigator.onLine) {
            const result = await assistantAction<{ providers: AssistantProvider[] }>("providers.list")
            if (generation !== ownerGeneration.current) return
            providers = result.providers
            localStorage.setItem("rhcp_assistant_public_providers", JSON.stringify(providers))
          } else {
            try { providers = JSON.parse(localStorage.getItem("rhcp_assistant_public_providers") || "[]") } catch {}
          }
          setStage("book-provider")
          setChoices(providers.slice(0, 12).map((provider, index) => ({ id: String(index + 1), value: JSON.stringify(provider), label: `${index + 1}. ${provider.name}`, detail: provider.specialization })))
          say(providers.length ? `${prompt("askDoctor")} ${providers.slice(0, 6).map((provider, index) => `${index + 1}. ${provider.name}`).join(". ")}` : prompt("noProviders"))
        } else {
          if (!navigator.onLine) { say(prompt("onlineRequired")); return }
          const result = await assistantAction<{ appointments: AssistantAppointment[] }>("appointments.list", { limit: 10 })
          if (generation !== ownerGeneration.current) return
          const active = result.appointments.filter(appointment => appointment.status === "scheduled")
          say(active.length ? `${prompt("appointments")}. ${active.slice(0, 3).map(appointment => `${formatAssistantDate(appointment.appointment_date, locale)}, ${formatAssistantTime(appointment.appointment_date, locale)}`).join(". ")}` : prompt("noAppointments"))
          setChoices(active.flatMap((appointment, index) => [{ id: String(index * 2 + 1), label: `${index * 2 + 1}. ${prompt("cancel")}: ${formatAssistantDate(appointment.appointment_date, locale)} ${formatAssistantTime(appointment.appointment_date, locale)}`, value: appointment.id, kind: "cancel" as const }, { id: String(index * 2 + 2), label: `${index * 2 + 2}. ${prompt("join")}`, value: appointment.id, kind: "join" as const }]))
        }
      } catch { if (generation === ownerGeneration.current) say(prompt("serverUnavailable")) }
      finally { if (generation === ownerGeneration.current) { setBusy(false); running.current = false } }
    }
  }
  const select = async (choice: AssistantChoice) => {
    const generation = ownerGeneration.current
    if (running.current) return
    if (choice.kind === "route") { router.push(choice.value); return }
    running.current = true; setBusy(true)
    try {
      if (choice.kind === "join") {
        const response = await fetch("/api/teleconsult/room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appointmentId: choice.value }) })
        if (generation !== ownerGeneration.current) return
        if (!response.ok) { say(prompt("onlineRequired")); return }
        router.push(`/teleconsult/room?appointmentId=${encodeURIComponent(choice.value)}`)
        return
      }
      if (choice.kind === "location") {
        const location = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 300000 }))
        if (generation !== ownerGeneration.current) return
        const response = await fetch(`/api/facilities/nearby?lat=${location.coords.latitude}&lon=${location.coords.longitude}&radius_km=25`)
        if (!response.ok) throw new Error("Facilities unavailable")
        const data = await response.json()
        if (generation !== ownerGeneration.current) return
        const facilities = (data.facilities || []).slice(0, 3)
        say(facilities.length ? facilities.map((facility: { name: string }) => facility.name).join(". ") : prompt("serverUnavailable"))
        setChoices([{ id: "map", label: prompt("findFacilities"), value: "/locations", kind: "route" }]); return
      }
      if (choice.kind === "cancel") {
        const result = await assistantAction<PreparedAction>("appointments.cancel.prepare", { appointmentId: choice.value })
        if (generation !== ownerGeneration.current) return
        setPrepared(result); setStage("cancel-confirm"); setChoices([])
        say(`${prompt("confirmCancel", { date: formatAssistantDate(result.draft.appointmentDate, locale), time: formatAssistantTime(result.draft.appointmentDate, locale) })} ${prompt("yesNo")}`)
        return
      }
      if (stage === "book-provider") {
        const provider: AssistantProvider = JSON.parse(choice.value)
        setDraft({ provider }); setStage("book-mode"); setChoices(["video", "audio", "chat"].map((mode, index) => ({ id: String(index + 1), value: mode, label: `${index + 1}. ${prompt(mode === "video" ? "modeVideo" : mode === "audio" ? "modeAudio" : "modeChat")}` }))); say(prompt("askMode")); return
      }
      if (stage === "book-mode") {
        const consultationType = choice.value as "video" | "audio" | "chat"
        setDraft(previous => ({ ...previous, consultationType })); setStage("book-date"); setChoices([]); say(prompt("askDate")); return
      }
      if (stage === "symptoms-intensity") {
        setDraft(previous => ({ ...previous, intensity: choice.value as "mild" | "moderate" | "severe" })); setStage("symptoms-temperature"); setChoices([{ id: "skip", value: "skip", label: prompt("skip") }]); say(prompt("askTemperature")); return
      }
      if (stage === "symptoms-temperature") {
        setStage("symptoms-input"); setChoices([]); say(prompt("askSymptoms")); return
      }
      if (stage === "symptoms-unit") {
        const value = Number(draft.temperature)
        const unit = choice.value
        if ((unit === "C" && (value < 30 || value > 46)) || (unit === "F" && (value < 86 || value > 115))) { say(prompt("numberInvalid")); return }
        setDraft(previous => ({ ...previous, tempUnit: unit })); setStage("symptoms-input"); setChoices([]); say(prompt("askSymptoms")); return
      }
      if (stage === "book-slot") {
        const nextDraft = { ...draft, appointmentDate: choice.value }
        setDraft(nextDraft); setChoices([])
        if (navigator.onLine) {
          const result = await assistantAction<PreparedAction>("appointments.prepare", { providerId: draft.provider!.id, appointmentDate: choice.value, consultationType: draft.consultationType || "video" })
          if (generation !== ownerGeneration.current) return
          setPrepared(result)
        }
        setStage("book-confirm")
        say(`${prompt("confirmBooking", { doctor: draft.provider!.name, date: formatAssistantDate(choice.value, locale), time: formatAssistantTime(choice.value, locale) })} ${prompt(draft.consultationType === "audio" ? "modeAudio" : draft.consultationType === "chat" ? "modeChat" : "modeVideo")}. ${prompt("yesNo")}`)
      }
    } catch { if (generation === ownerGeneration.current) say(prompt("bookingFailed")) }
    finally { if (generation === ownerGeneration.current) { setBusy(false); running.current = false } }
  }
  const confirm = async (accepted: boolean) => {
    const generation = ownerGeneration.current
    if (running.current) return
    if (!accepted) { reset(); say(prompt("askTask")); return }
    if (!user) return login()
    running.current = true; setBusy(true)
    try {
      if (stage === "book-confirm") {
        if (!navigator.onLine || !prepared) {
          if (!draft.provider || !draft.appointmentDate) return
          await enqueue({ table: "appointments", type: "INSERT", owner_user_id: user.id, payload: { provider_id: draft.provider.id, appointment_date: draft.appointmentDate, consultation_type: draft.consultationType || "video", notes: "Patient-confirmed offline voice appointment request" } })
          if (generation !== ownerGeneration.current) return
          say(prompt("bookingQueued")); reset(); return
        }
        if (!draft.provider || !draft.appointmentDate) throw new Error("Missing selected booking")
        const appointment = await performConfirmedVoiceBooking(prepared, { userId: user.id, providerId: draft.provider.id, appointmentDate: draft.appointmentDate, consultationType: draft.consultationType || "video" })
        if (generation !== ownerGeneration.current) return
        say(prompt("bookingSuccess", { doctor: prepared.draft.providerName, date: formatAssistantDate(appointment.appointment_date, locale), time: formatAssistantTime(appointment.appointment_date, locale) }))
      } else if (stage === "cancel-confirm" && prepared) {
        await performConfirmedVoiceCancellation(prepared, user.id); if (generation !== ownerGeneration.current) return; say(prompt("cancelSuccess"))
      } else if (stage === "records-confirm") {
        if (!navigator.onLine) { say(prompt("onlineRequired")); return }
        const response = await fetch("/api/medical-records?limit=3")
        if (!response.ok) throw new Error("Records unavailable")
        const data = await response.json()
        if (generation !== ownerGeneration.current) return
        const records = data.records || data.data || []
        say(records.length ? records.map((record: { content: string }) => String(record.content).slice(0, 400)).join(". ") : prompt("records"))
      }
      reset()
    } catch { if (generation === ownerGeneration.current) say(prompt("bookingFailed")) }
    finally { if (generation === ownerGeneration.current) { setBusy(false); running.current = false } }
  }
  const submit = async (text: string) => {
    const generation = ownerGeneration.current
    const content = text.trim().slice(0, 1500)
    if (!content || running.current) return
    setMessages(previous => [...previous.slice(-18), { id: ++serial.current, role: "user", content }])
    const symptoms = parseAssistantSymptoms(content, language)
    if (symptoms.some(symptom => ["chest-pain", "shortness-of-breath", "fainting", "cough-with-blood"].includes(symptom))) return showEmergency()
    const matched = detectAssistantIntent(content, language)
    if (matched.intent === "emergency") return showEmergency()
    if (matched.intent === "change_language" && matched.targetLanguage) { setLanguage(matched.targetLanguage); return }
    if (matched.intent === "stop" || matched.intent === "repeat") { await start(matched.intent); return }
    if (stage === "book-confirm" || stage === "cancel-confirm" || stage === "records-confirm") {
      const accepted = parseAssistantConfirmation(content, language)
      if (accepted === null) say(prompt("yesNo")); else await confirm(accepted)
      return
    }
    if (stage === "symptoms-age" || stage === "symptoms-duration") {
      const value = stage === "symptoms-age" ? parseAssistantAge(content, language) : parseAssistantNumber(content, language)
      if (value === null || value < 0 || value > (stage === "symptoms-age" ? 120 : 365)) { say(prompt("numberInvalid")); return }
      if (stage === "symptoms-age") { setDraft(previous => ({ ...previous, age: value })); setStage("symptoms-duration"); say(prompt("askDuration")) }
      else { setDraft(previous => ({ ...previous, duration: value })); setStage("symptoms-intensity"); setChoices(["mild", "moderate", "severe"].map((value, index) => ({ id: String(index + 1), value, label: `${index + 1}. ${["🟢", "🟡", "🔴"][index]} ${prompt(value as "mild" | "moderate" | "severe")}` }))); say(prompt("askIntensity")) }
      return
    }
    if (stage === "symptoms-intensity") {
      const index = parseAssistantNumber(content, language)
      const intensity = parseAssistantIntensity(content, language)
      const choice = choices.find(value => value.id === String(index) || value.value === intensity)
      if (choice) await select(choice); else say(prompt("selectionInvalid"))
      return
    }
    if (stage === "symptoms-temperature") {
      const temperature = parseAssistantTemperature(content, language)
      const value = parseAssistantNumber(content, language)
      if (temperature) setDraft(previous => ({ ...previous, temperature: String(temperature.value), tempUnit: temperature.unit }))
      else if (value !== null) { setDraft(previous => ({ ...previous, temperature: String(value), tempUnit: undefined })); setStage("symptoms-unit"); setChoices([{ id: "1", value: "C", label: "1. °C" }, { id: "2", value: "F", label: "2. °F" }]); say(prompt("askTemperature")); return }
      else if (!content.toLowerCase().includes(prompt("skip").toLowerCase()) && !/\bskip\b/i.test(content)) { say(prompt("askTemperature")); return }
      setStage("symptoms-input"); setChoices([]); say(prompt("askSymptoms")); return
    }
    if (stage === "symptoms-unit" || stage === "facility-location") {
      const value = parseAssistantNumber(content, language)
      const choice = choices.find(item => item.id === String(value))
      if (choice) await select(choice); else say(prompt("selectionInvalid"))
      return
    }
    if (stage === "symptoms-input") {
      if (!symptoms.length) { say(prompt("unknownSymptoms")); return }
      const result = composeResponse({ symptoms: getAssistantSymptomNames(symptoms, "en"), age: String(draft.age ?? ""), daysSick: String(draft.duration ?? ""), intensity: draft.intensity || "moderate", temperature: draft.temperature, tempUnit: draft.tempUnit }, "en")
      setSymptomCheckResult({ symptoms, urgency: result.urgency })
      say(getAssistantTriageReply(language, result.urgency), result.urgency === "emergency")
      setEmergency(result.urgency === "emergency"); reset(); return
    }
    if (stage === "book-mode") {
      const mode = parseAssistantMode(content, language)
      const index = parseAssistantNumber(content, language)
      const choice = choices.find(value => value.value === mode || value.id === String(index))
      if (choice) await select(choice); else say(prompt("selectionInvalid"))
      return
    }
    if (stage === "book-date") {
      const date = parseAssistantDate(content, language)
      if (!date) { say(prompt("dateInvalid")); return }
      const nextDraft = { ...draft, date }; setDraft(nextDraft)
      running.current = true; setBusy(true)
      try { await showSlots(nextDraft) } catch { if (generation === ownerGeneration.current) say(prompt("bookingFailed")) }
      finally { if (generation === ownerGeneration.current) { running.current = false; setBusy(false) } }
      return
    }
    if (stage === "book-provider" || stage === "book-slot") {
      const option = parseAssistantNumber(content, language)
      const choice = choices.find(candidate => candidate.id === String(option)) || choices.find(candidate => candidate.label.toLowerCase().includes(content.toLowerCase()))
      if (choice) await select(choice); else say(prompt("selectionInvalid"))
      return
    }
    if (choices.some(choice => choice.kind === "cancel" || choice.kind === "join")) {
      const option = parseAssistantNumber(content, language)
      const requestedKind = matched.intent === "cancel_appointment" ? "cancel" : matched.intent === "join_consultation" ? "join" : null
      const choice = choices.find(item => item.id === String(option)) || (requestedKind ? choices.find(item => item.kind === requestedKind) : undefined)
      if (choice) await select(choice); else say(prompt("selectionInvalid"))
      return
    }
    if (matched.intent !== "unknown") { await start(matched.intent); return }
    if (symptoms.length) { setDraft({ symptoms }); setStage("symptoms-age"); say(prompt("askAge")); return }
    if (navigator.onLine) {
      running.current = true; setBusy(true)
      try {
        const status = await fetch("/api/assistant/voice").then(response => response.json())
        if (generation !== ownerGeneration.current) return
        if (status.conversationAvailable) {
          const response = await fetch("/api/assistant/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "chat", language, text: content.slice(0, 800) }), signal: AbortSignal.timeout(30000) })
          const result = await response.json()
          if (generation !== ownerGeneration.current) return
          if (response.ok && result.reply) { say(result.reply); return }
        }
      } catch {}
      finally { if (generation === ownerGeneration.current) { running.current = false; setBusy(false) } }
    }
    say(prompt("help"))
  }
  return { messages, choices, stage, draft, busy, emergency, prompt, say, start, submit, select, confirm }
}
