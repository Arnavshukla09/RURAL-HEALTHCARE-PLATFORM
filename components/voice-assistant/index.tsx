"use client"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Mic } from "lucide-react"
import { useApp } from "@/components/providers/AppProvider"
import { getAssistantLanguage } from "@/lib/assistant/languages"
import { getOfflinePackStatus, installOfflinePack, type OfflinePackStatus } from "@/lib/assistant/offline-packs"
import { useAssistantWorkflow } from "./useAssistantWorkflow"
import { useVoiceSession } from "./useVoiceSession"
import { AvatarFace } from "./AvatarFace"
import { AssistantPanel } from "./AssistantPanel"
import { ASSISTANT_CONFIG } from "@/lib/assistant/config"
import { detectAssistantIntent } from "@/lib/assistant/intents"
import { installLocalRecognition, getSpeechLangFromCode } from "@/lib/ai/speech"
import { usePageController } from "./usePageController"
import { detectControlCommand } from "@/lib/assistant/control-commands"
import { normalizeAssistantText } from "@/lib/assistant/text"

export function VoiceAssistant() {
  const { language, setLanguage, user } = useApp()
  const pathname = usePathname()
  const workflow = useAssistantWorkflow()
  const pageController = usePageController(workflow.say, workflow.cancelTask)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [online, setOnline] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [beaconActive, setBeaconActive] = useState(false)
  const [pack, setPack] = useState<OfflinePackStatus | null>(null)
  const spoken = useRef<number | null>(null)
  const previousLocale = useRef(language)
  const previousPath = useRef(pathname)
  const scroll = useRef<HTMLDivElement>(null)
  const errorKey = useRef("")
  const submit = async (text: string, fresh = false): Promise<void> => {
    const intent = detectAssistantIntent(text, language).intent
    const command = detectControlCommand(text, language)
    if (intent === "emergency") { pageController.clear(); await workflow.start("emergency"); return }
    const input = normalizeAssistantText(text).replace(/[.!?]+$/u, "")
    const ownCommand = (key: "close" | "downloadOffline" | "listen" | "replay", aliases: string[]) => [workflow.prompt(key), ...aliases].some(value => input === normalizeAssistantText(value))
    if (ownCommand("close", ["close assistant", "close chatbot"])) { voice.stop(); setOpen(false); return }
    if (ownCommand("downloadOffline", ["prepare offline", "download offline guidance"])) { if (online && !installing) await prepareOffline(); else workflow.say(workflow.prompt("onlineRequired")); return }
    if (ownCommand("listen", ["start listening", "start voice"])) { if (!beaconActive && !pathname.startsWith("/teleconsult/room")) voice.toggleListen(); return }
    if (ownCommand("replay", ["listen again"])) { if (!beaconActive && !pathname.startsWith("/teleconsult/room")) { voice.enable(); if (lastReply) await voice.speakReply(lastReply.content) }; return }
    if (command?.key === "correctLast") { pageController.clear(); await workflow.correctLast(); return }
    if (await pageController.handle(text)) return
    if (command && ["newRequest", "question", "cancelTask"].includes(command.key) && command.rest) return submit(command.rest, true)
    if (intent !== "unknown") pageController.clear()
    await workflow.submit(text, fresh)
  }
  const voice = useVoiceSession(language, text => {
    if (detectAssistantIntent(text, language).intent === "stop") voice.stop()
    submit(text).catch(() => workflow.say(workflow.prompt("error")))
  }, key => { const value = `${user?.id}:${language}:${key}`; if (errorKey.current !== value) { errorKey.current = value; workflow.say(workflow.prompt(key)) } })
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
  const lastReply = workflow.messages.filter(message => message.role === "assistant").at(-1)
  useEffect(() => {
    if (voice.enabled && lastReply && lastReply.id !== spoken.current) {
      spoken.current = lastReply.id
      voice.speakReply(lastReply.content).catch(() => {})
    }
  }, [lastReply, voice.enabled, voice.speakReply])
  useEffect(() => {
    const stop = () => voice.interrupt()
    const secure = () => voice.suspendAfterReply()
    const read = () => {
      if (beaconActive || pathname.startsWith("/teleconsult/room")) return
      const text = document.querySelector("main")?.innerText.trim().slice(0, 1200)
      if (text) { voice.enable(); voice.speakReply(text).catch(() => {}) }
    }
    window.addEventListener("rhcp:stop-audio", stop); window.addEventListener("rhcp:read-page", read); window.addEventListener("rhcp:secure-input", secure)
    return () => { window.removeEventListener("rhcp:stop-audio", stop); window.removeEventListener("rhcp:read-page", read); window.removeEventListener("rhcp:secure-input", secure) }
  }, [voice.interrupt, voice.enable, voice.speakReply, voice.suspendAfterReply, beaconActive, pathname])
  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" }) }, [workflow.messages, workflow.choices])
  useEffect(() => {
    if (previousPath.current !== pathname) workflow.cancelTask()
    previousPath.current = pathname
  // Page changes revoke pending assistant confirmations/reads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
  useEffect(() => {
    const reply = (event: Event) => { const content = String((event as CustomEvent).detail?.text || ""); if (content) workflow.say(content) }
    window.addEventListener("rhcp:page-reply", reply)
    return () => window.removeEventListener("rhcp:page-reply", reply)
  }, [workflow.say])
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
  const run = (intent: string) => { voice.interrupt(); pageController.clear(); return workflow.start(intent).catch(() => workflow.say(t("error"))) }
  const send = () => { const text = input; setInput(""); voice.interrupt(); submit(text).catch(() => workflow.say(t("error"))) }
  const prepareOffline = async () => {
    errorKey.current = ""
    setInstalling(true)
    try { const result = await installOfflinePack(language); setPack(result); await installLocalRecognition(getSpeechLangFromCode(language)); workflow.say(t(result.ready ? "offlineReady" : "error")) }
    catch { workflow.say(t("error")) }
    finally { setInstalling(false) }
  }
  const openAssistant = () => {
    setOpen(true); errorKey.current = ""; spoken.current = null
    if (!beaconActive && !pathname.startsWith("/teleconsult/room")) {
      voice.enable()
      if (lastReply) { spoken.current = lastReply.id; voice.speakReply(lastReply.content).catch(() => {}) }
    }
  }
  return <div className="notranslate" translate="no" dir={selectedLanguage.dir} data-testid="voice-assistant">
    <style>{`
      .rural-avatar-eyes{transform-origin:48px 41px;animation:rural-blink 7s infinite}
      .rural-avatar--speaking .rural-avatar-mouth{transform-origin:48px 58px;animation:rural-talk .32s infinite alternate}
      .rural-avatar--listening{filter:drop-shadow(0 0 5px #34d399)}
      @keyframes rural-talk{from{transform:scaleY(.45)}to{transform:scaleY(1.35)}}
      @keyframes rural-blink{0%,94%,98%,100%{transform:scaleY(1)}96%{transform:scaleY(.12)}}
      @media(prefers-reduced-motion:reduce){.rural-avatar-eyes,.rural-avatar-mouth{animation:none!important}}
    `}</style>
    {!open && <button data-voice-control="ui.a22bf1e71c1028f5" type="button" onClick={openAssistant} aria-label={t("welcome")} data-testid="assistant-open"
      className="fixed bottom-20 right-4 z-50 flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-teal-700 shadow-xl transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-teal-600 md:bottom-6 md:right-6">
      <AvatarFace state="idle"/><span className="absolute -bottom-1 -left-1 rounded-full bg-white p-1 text-teal-700"><Mic size={16}/></span>
    </button>}
    {open && <AssistantPanel workflow={workflow} voice={voice} controller={pageController} language={language} setLanguage={setLanguage}
      online={online} installing={installing} offlineReady={Boolean(pack?.ready && pack.language === selectedLanguage.code)} mediaBlocked={beaconActive || pathname.startsWith("/teleconsult/room")}
      input={input} setInput={setInput} scroll={scroll} onClose={() => { voice.stop(); setOpen(false) }} onSend={send} onRun={run} onPrepare={prepareOffline}
      onAccessibility={() => { submit(pageController.prompt("accessibility")).catch(() => {}) }}/>}

  </div>
}
