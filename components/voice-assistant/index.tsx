"use client"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Mic, MicOff, Volume2, X, Download, Stethoscope, CalendarDays, MapPin, FileText, HeartPulse, Tent, Landmark, BookOpen, Loader2 } from "lucide-react"
import { useApp } from "@/components/providers/AppProvider"
import { ASSISTANT_LANGUAGES, getAssistantLanguage } from "@/lib/assistant/languages"
import { getOfflinePackStatus, installOfflinePack, type OfflinePackStatus } from "@/lib/assistant/offline-packs"
import { useAssistantWorkflow } from "./useAssistantWorkflow"
import { useVoiceSession } from "./useVoiceSession"
import { AvatarFace } from "./AvatarFace"
import { ASSISTANT_CONFIG } from "@/lib/assistant/config"
import { detectAssistantIntent } from "@/lib/assistant/intents"
import { installLocalRecognition, getSpeechLangFromCode } from "@/lib/ai/speech"

export function VoiceAssistant() {
  const { language, setLanguage, user } = useApp()
  const pathname = usePathname()
  const workflow = useAssistantWorkflow()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [online, setOnline] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [beaconActive, setBeaconActive] = useState(false)
  const [pack, setPack] = useState<OfflinePackStatus | null>(null)
  const spoken = useRef<number | null>(null)
  const previousLocale = useRef(language)
  const scroll = useRef<HTMLDivElement>(null)
  const voice = useVoiceSession(language, text => {
    if (detectAssistantIntent(text, language).intent === "stop") voice.stop()
    workflow.submit(text).catch(() => workflow.say(workflow.prompt("error")))
  }, key => workflow.say(workflow.prompt(key)))
  const uiOwner = user?.id || "guest"
  const [hydratedUiOwner, setHydratedUiOwner] = useState<string | null>(null)
  useEffect(() => {
    try { setOpen(sessionStorage.getItem(`${ASSISTANT_CONFIG.sessionKey}_${uiOwner}_ui`) === "open") } catch {}
    setHydratedUiOwner(uiOwner)
  }, [uiOwner])
  useEffect(() => {
    if (hydratedUiOwner !== uiOwner) return
    try { sessionStorage.setItem(`${ASSISTANT_CONFIG.sessionKey}_${uiOwner}_ui`, open ? "open" : "closed") } catch {}
  }, [open, uiOwner, hydratedUiOwner])
  const t = workflow.prompt
  const selectedLanguage = getAssistantLanguage(language)
  const busy = workflow.busy || voice.status === "thinking"
  const lastReply = workflow.messages.filter(message => message.role === "assistant").at(-1)
  useEffect(() => {
    if (voice.enabled && lastReply && lastReply.id !== spoken.current) {
      spoken.current = lastReply.id
      voice.speakReply(lastReply.content).catch(() => {})
    }
  }, [lastReply, voice.enabled, voice.speakReply])
  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" }) }, [workflow.messages, workflow.choices])
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update(); window.addEventListener("online", update); window.addEventListener("offline", update)
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update) }
  }, [])
  useEffect(() => {
    let active = true
    setPack(null)
    getOfflinePackStatus(language).then(value => { if (active) setPack(value) }).catch(() => {})
    return () => { active = false }
  }, [language])
  useEffect(() => {
    if (pathname.startsWith("/teleconsult/room")) voice.stop()
  // Stop once on conference entry so the assistant never competes for its microphone.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
  useEffect(() => {
    const changingLanguage = previousLocale.current !== language
    const resume = changingLanguage && open && voice.enabled && !pathname.startsWith("/teleconsult/room")
    previousLocale.current = language
    voice.stop(); spoken.current = null
    if (resume) voice.enable()
  // Preserve an explicitly started voice session when its language changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, language, voice.stop, voice.enable])
  useEffect(() => {
    const onBeacon = (event: Event) => { const active = Boolean((event as CustomEvent).detail?.active); setBeaconActive(active); if (active) voice.stop() }
    window.addEventListener("rhcp:emergency-beacon", onBeacon)
    return () => window.removeEventListener("rhcp:emergency-beacon", onBeacon)
  }, [voice.stop])
  useEffect(() => {
    if (!voice.enabled || !("wakeLock" in navigator)) return
    let lock: { release: () => Promise<void> } | null = null
    let released = false
    const wakeLock = (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock
    wakeLock.request("screen").then(value => { if (released) value.release().catch(() => {}); else lock = value }).catch(() => {})
    return () => { released = true; lock?.release().catch(() => {}) }
  }, [voice.enabled])
  const tasks = [
    { intent: "book_appointment", key: "book" as const, Icon: CalendarDays },
    { intent: "check_symptoms", key: "checkSymptoms" as const, Icon: Stethoscope },
    { intent: "find_facilities", key: "findFacilities" as const, Icon: MapPin },
    { intent: "view_appointments", key: "appointments" as const, Icon: CalendarDays },
    { intent: "view_records", key: "records" as const, Icon: FileText },
    { intent: "view_camps", key: "camps" as const, Icon: Tent },
    { intent: "view_schemes", key: "schemes" as const, Icon: Landmark },
    { intent: "health_info", key: "healthInfo" as const, Icon: BookOpen },
  ]
  const run = (intent: string) => workflow.start(intent).catch(() => workflow.say(t("error")))
  const send = () => { const text = input; setInput(""); workflow.submit(text).catch(() => workflow.say(t("error"))) }
  const prepareOffline = async () => {
    setInstalling(true)
    try { const result = await installOfflinePack(language); setPack(result); await installLocalRecognition(getSpeechLangFromCode(language)); workflow.say(t(result.ready ? "offlineReady" : "error")) }
    catch { workflow.say(t("error")) }
    finally { setInstalling(false) }
  }
  const openAssistant = () => { setOpen(true); spoken.current = null; if (!beaconActive && !pathname.startsWith("/teleconsult/room")) voice.enable() }
  const currentStatus = busy ? t("working") : voice.status === "listening" ? t("listening") : t("ready")
  return <div className="notranslate" translate="no" dir={selectedLanguage.dir} data-testid="voice-assistant">
    <style>{`
      .rural-avatar-eyes{transform-origin:48px 41px;animation:rural-blink 7s infinite}
      .rural-avatar--speaking .rural-avatar-mouth{transform-origin:48px 58px;animation:rural-talk .32s infinite alternate}
      .rural-avatar--listening{filter:drop-shadow(0 0 5px #34d399)}
      @keyframes rural-talk{from{transform:scaleY(.45)}to{transform:scaleY(1.35)}}
      @keyframes rural-blink{0%,94%,98%,100%{transform:scaleY(1)}96%{transform:scaleY(.12)}}
      @media(prefers-reduced-motion:reduce){.rural-avatar-eyes,.rural-avatar-mouth{animation:none!important}}
    `}</style>
    {!open && <button type="button" onClick={openAssistant} aria-label={t("welcome")} data-testid="assistant-open"
      className="fixed bottom-20 right-4 z-50 flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-teal-700 shadow-xl transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-teal-600 md:bottom-6 md:right-6">
      <AvatarFace state="idle"/><span className="absolute -bottom-1 -left-1 rounded-full bg-white p-1 text-teal-700"><Mic size={16}/></span>
    </button>}
    {open && <section role="dialog" aria-modal="false" aria-labelledby="voice-assistant-title" className="fixed bottom-20 right-3 z-50 flex max-h-[calc(100dvh-110px)] w-[calc(100vw-24px)] flex-col overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-2xl sm:w-[390px] md:bottom-6 md:right-6">
      <header className="flex items-center gap-2 bg-teal-800 px-3 py-3 text-white">
        <AvatarFace state={busy ? "thinking" : voice.status} small/>
        <div className="min-w-0 flex-1"><h2 id="voice-assistant-title" className="text-sm font-bold">RuralHealth</h2><p className="truncate text-xs text-teal-100" aria-live="polite">{currentStatus}</p></div>
        <button type="button" aria-label={t("close")} onClick={() => { voice.stop(); setOpen(false) }} className="rounded-full p-3 hover:bg-white/15"><X size={20}/></button>
      </header>
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <select aria-label={t("chooseLanguage")} value={language} onChange={event => setLanguage(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-2 text-sm text-gray-900">
          {ASSISTANT_LANGUAGES.map(entry => <option key={entry.code} value={entry.code}>{entry.nativeName}</option>)}
        </select>
        <button type="button" onClick={prepareOffline} disabled={installing || !online} aria-label={t("downloadOffline")} title={t("downloadOffline")} className={`flex h-11 w-11 items-center justify-center rounded-xl ${pack?.ready ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-700"}`}>
          {installing ? <Loader2 size={19} className="animate-spin"/> : <Download size={19}/>}
        </button>
      </div>
      {!online && <p className="border-b bg-amber-50 px-3 py-2 text-xs text-amber-900">{t(pack?.ready && pack.language === selectedLanguage.code ? "offlineReady" : "offlineGuidance")}</p>}
      <div ref={scroll} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3" style={{ maxHeight: "42dvh" }}>
        {workflow.messages.map(message => <div key={message.id} className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${message.emergency ? "border border-red-200 bg-red-50 font-semibold text-red-900" : message.role === "assistant" ? "bg-teal-50 text-gray-900" : "ml-6 bg-gray-100 text-gray-800"}`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>)}
        {busy && <Loader2 className="mx-auto animate-spin text-teal-600" aria-label={t("working")}/>}
        {workflow.emergency && <a href="tel:108" className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 font-bold text-white"><HeartPulse/>{t("emergencyCall")}</a>}
        {workflow.choices.length > 0 && <div className="grid grid-cols-1 gap-2" data-testid="assistant-choices">{workflow.choices.map(choice => <button key={choice.id} type="button" disabled={busy} onClick={() => workflow.select(choice).catch(() => workflow.say(t("error")))} className="min-h-12 rounded-xl border border-teal-200 bg-white px-3 py-2 text-start text-sm font-semibold text-teal-900 hover:bg-teal-50 disabled:opacity-50">
          {choice.label}{choice.detail && <span className="block text-xs font-normal text-gray-500">{choice.detail}</span>}
        </button>)}</div>}
        {(workflow.stage === "book-confirm" || workflow.stage === "cancel-confirm" || workflow.stage === "records-confirm") && <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={busy} onClick={() => workflow.confirm(true)} aria-label={t("yesNo")} className="min-h-14 rounded-xl bg-teal-700 text-2xl text-white">✓</button>
          <button type="button" disabled={busy} onClick={() => workflow.confirm(false)} aria-label={t("cancel")} className="min-h-14 rounded-xl bg-gray-100 text-2xl text-gray-700">✕</button>
        </div>}
        {workflow.stage === "idle" && <div className="grid grid-cols-2 gap-2">{tasks.map(({ intent, key, Icon }) => <button key={intent} type="button" disabled={busy} onClick={() => run(intent)} className="flex min-h-16 items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-2 py-2 text-start text-xs font-semibold text-gray-800 hover:bg-teal-50 disabled:opacity-50"><Icon size={24} className="shrink-0 text-teal-700"/>{t(key)}</button>)}</div>}
      </div>
      <div className="border-t bg-white p-3">
        <div className="mb-2 grid grid-cols-3 gap-2">
          <button type="button" disabled={busy || beaconActive || pathname.startsWith("/teleconsult/room")} onClick={voice.toggleListen} aria-label={t("listen")} className={`flex min-h-12 items-center justify-center gap-1 rounded-xl text-xs font-semibold ${voice.status === "listening" ? "bg-red-100 text-red-800" : "bg-teal-700 text-white"}`}><Mic size={20}/>{t("listen")}</button>
          <button type="button" disabled={beaconActive || pathname.startsWith("/teleconsult/room")} onClick={() => { voice.enable(); if (lastReply) voice.speakReply(lastReply.content) }} aria-label={t("replay")} className="flex min-h-12 items-center justify-center gap-1 rounded-xl bg-teal-50 text-xs font-semibold text-teal-800"><Volume2 size={20}/>{t("replay")}</button>
          <button type="button" onClick={voice.stop} aria-label={t("stop")} className="flex min-h-12 items-center justify-center gap-1 rounded-xl bg-gray-100 text-xs font-semibold text-gray-700"><MicOff size={20}/>{t("stop")}</button>
        </div>
        <form onSubmit={event => { event.preventDefault(); send() }} className="flex gap-2"><input value={input} onChange={event => setInput(event.target.value)} aria-label={t("textInput")} placeholder={t("textInput")} disabled={busy} className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 px-3 text-sm text-gray-900"/><button type="submit" disabled={!input.trim() || busy} aria-label={t("listen")} className="h-11 w-11 rounded-xl bg-teal-700 font-bold text-white">→</button></form>
        <button type="button" onClick={() => run("emergency")} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-bold text-red-700"><HeartPulse size={20}/>{t("emergency")}</button>
      </div>
    </section>}
  </div>
}
