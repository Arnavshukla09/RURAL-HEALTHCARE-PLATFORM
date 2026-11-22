"use client"
import { useEffect, useRef, useState, type RefObject } from "react"
import { Accessibility, BookOpen, CalendarDays, Download, FileText, HeartPulse, Landmark, Loader2, Mic, MicOff, Settings2, Stethoscope, Tent, MapPin, Volume2, X } from "lucide-react"
import { ASSISTANT_LANGUAGES, resolveAssistantLanguage } from "@/lib/assistant/languages"
import { PANEL_LABELS } from "@/lib/assistant/panel-labels"
import { AvatarFace } from "./AvatarFace"
import type { useAssistantWorkflow } from "./useAssistantWorkflow"
import type { useVoiceSession } from "./useVoiceSession"
import type { usePageController } from "./usePageController"

interface Props {
  workflow: ReturnType<typeof useAssistantWorkflow>; voice: ReturnType<typeof useVoiceSession>; controller: ReturnType<typeof usePageController>
  language: string; setLanguage: (language: string) => void; online: boolean; installing: boolean; offlineReady: boolean; mediaBlocked: boolean
  input: string; setInput: (value: string) => void; scroll: RefObject<HTMLDivElement>
  onClose: () => void; onSend: () => void; onRun: (intent: string) => void; onPrepare: () => void; onAccessibility: () => void
}
const tasks = [
  { intent: "book_appointment", key: "book", Icon: CalendarDays }, { intent: "check_symptoms", key: "checkSymptoms", Icon: Stethoscope },
  { intent: "find_facilities", key: "findFacilities", Icon: MapPin }, { intent: "view_appointments", key: "appointments", Icon: CalendarDays },
  { intent: "view_records", key: "records", Icon: FileText }, { intent: "view_camps", key: "camps", Icon: Tent },
  { intent: "view_schemes", key: "schemes", Icon: Landmark }, { intent: "health_info", key: "healthInfo", Icon: BookOpen },
] as const

export function AssistantPanel(props: Props) {
  const { workflow, voice, controller, language, scroll } = props
  const [pane, setPane] = useState<"chat" | "actions">("chat")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const previousActions = useRef(false)
  const t = workflow.prompt, labels = PANEL_LABELS[resolveAssistantLanguage(language)]
  const busy = workflow.busy || voice.status === "thinking"
  const lastReply = workflow.messages.filter(message => message.role === "assistant").at(-1)
  const confirming = ["book-confirm", "cancel-confirm", "records-confirm"].includes(workflow.stage)
  const hasActions = controller.menu.length > 0 || workflow.choices.length > 0 || confirming
  useEffect(() => {
    const changePanel = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.pane === "chat" || detail?.pane === "actions") setPane(detail.pane)
      if (detail?.settings === true) setSettingsOpen(true)
    }
    window.addEventListener("rhcp:assistant-panel", changePanel)
    return () => window.removeEventListener("rhcp:assistant-panel", changePanel)
  }, [])
  useEffect(() => {
    if (hasActions) setPane("actions")
    else if (previousActions.current) setPane("chat")
    previousActions.current = hasActions
  }, [hasActions, workflow.stage, workflow.choices, controller.menu])
  useEffect(() => { if (pane === "chat") scroll.current?.scrollTo({ top: scroll.current.scrollHeight }) }, [pane, scroll])
  const cancel = () => { voice.interrupt(); controller.clear(); workflow.cancelTask(); workflow.say(controller.prompt("cancelled")); setPane("chat") }
  return <section role="dialog" aria-modal="false" aria-labelledby="voice-assistant-title"
    className="fixed bottom-20 right-3 z-50 flex max-h-[min(680px,calc(100dvh-110px))] w-[calc(100vw-24px)] max-w-[420px] flex-col overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-2xl md:bottom-6 md:right-6">
    <header className="flex shrink-0 items-center gap-2 bg-teal-800 px-3 py-2 text-white">
      <AvatarFace state={busy ? "thinking" : voice.status} small/>
      <div className="min-w-0 flex-1"><h2 id="voice-assistant-title" className="text-sm font-bold">RuralHealth</h2><p className="truncate text-xs text-teal-100" aria-live="polite">{t(busy ? "working" : voice.status === "listening" ? "listening" : "ready")}</p></div>
      <button data-voice-control="ui.69cdcd9ecaa9d407" type="button" aria-label={controller.prompt("accessibility")} onClick={props.onAccessibility} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15"><Accessibility size={19}/></button>
      <button data-voice-control="ui.8325c9a5a93fd6d8" type="button" aria-label={labels.settings} aria-expanded={settingsOpen} aria-controls="assistant-settings" onClick={() => setSettingsOpen(value => !value)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15"><Settings2 size={19}/></button>
      <button data-voice-control="ui.990a6c99cc1af3ff" type="button" aria-label={t("close")} onClick={props.onClose} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15"><X size={20}/></button>
    </header>
    {settingsOpen && <div id="assistant-settings" className="flex shrink-0 gap-2 border-b bg-gray-50 p-3">
      <select data-voice-control="ui.8b80606d3332eb6d" aria-label={t("chooseLanguage")} value={language} onChange={event => props.setLanguage(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border bg-white px-2 text-sm">
        {ASSISTANT_LANGUAGES.map(entry => <option key={entry.code} value={entry.code}>{entry.nativeName}</option>)}
      </select>
      <button data-voice-control="ui.2780b6939ae9ab96" type="button" onClick={props.onPrepare} disabled={props.installing || !props.online} aria-label={t("downloadOffline")} title={t("downloadOffline")} className={`flex h-11 w-11 items-center justify-center rounded-xl ${props.offlineReady ? "bg-teal-100 text-teal-800" : "bg-white text-gray-700"}`}>{props.installing ? <Loader2 size={19} className="animate-spin"/> : <Download size={19}/>}</button>
    </div>}
    <div role="tablist" aria-label="RuralHealth" className="grid shrink-0 grid-cols-2 border-b px-3 pt-1">
      {(["chat", "actions"] as const).map(value => <button data-voice-control="ui.6e797b6f58a9e21e" key={value} id={`assistant-${value}-tab`} type="button" role="tab" aria-selected={pane === value} aria-controls={`assistant-${value}-panel`} tabIndex={pane === value ? 0 : -1} onClick={() => setPane(value)} onKeyDown={event => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); const next = pane === "chat" ? "actions" : "chat"; setPane(next); document.getElementById(`assistant-${next}-tab`)?.focus() } }} className={`min-h-11 border-b-2 text-sm font-semibold ${pane === value ? "border-teal-700 text-teal-800" : "border-transparent text-gray-500"}`}>{labels[value]}{value === "actions" && hasActions && <span className="ms-2 inline-block h-2 w-2 rounded-full bg-teal-600"/>}</button>)}
    </div>
    {!props.online && <p className="shrink-0 border-b bg-amber-50 px-3 py-2 text-xs text-amber-900">{t(props.offlineReady ? "offlineReady" : "offlineGuidance")}</p>}
    <div ref={scroll} id="assistant-chat-panel" role="tabpanel" aria-labelledby="assistant-chat-tab" hidden={pane !== "chat"} className="min-h-0 max-h-[380px] flex-1 overflow-y-auto p-4" data-testid="assistant-conversation">
      <div className="min-h-[160px] space-y-3">
      {workflow.messages.map(message => <div key={message.id} className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${message.emergency ? "border border-red-200 bg-red-50 font-semibold text-red-900" : message.role === "assistant" ? "bg-teal-50 text-gray-900" : "ms-6 bg-gray-100 text-gray-800"}`}><p className="whitespace-pre-wrap">{message.content}</p></div>)}
      {busy && <Loader2 className="mx-auto animate-spin text-teal-600" aria-label={t("working")}/>}
      </div>
    </div>
    <div id="assistant-actions-panel" role="tabpanel" aria-labelledby="assistant-actions-tab" hidden={pane !== "actions"} className="min-h-0 max-h-[380px] flex-1 space-y-3 overflow-y-auto p-4" data-testid="assistant-action-panel">
      {(workflow.choices.length > 0 || confirming) && lastReply && <p className="rounded-xl bg-teal-50 p-3 text-sm leading-relaxed text-teal-950">{lastReply.content}</p>}
      {controller.menu.length > 0 && <div className="grid gap-2" data-testid="page-voice-options">{controller.menu.map(option => <button data-voice-control="ui.88bc1f0893e2717b" key={option.id} type="button" className="min-h-12 rounded-xl border border-teal-200 px-3 py-2 text-start text-sm" onClick={() => controller.select(option.id)}>{option.label}</button>)}</div>}
      {workflow.choices.length > 0 && <div className="grid gap-2" data-testid="assistant-choices">{workflow.choices.map(choice => <button data-voice-control="ui.58626b9cb2ade380" key={choice.id} type="button" disabled={busy} onClick={() => workflow.select(choice).catch(() => workflow.say(t("error")))} className="min-h-12 rounded-xl border border-teal-200 px-3 py-2 text-start text-sm font-semibold text-teal-900 disabled:opacity-50">{choice.label}{choice.detail && <span className="block text-xs font-normal text-gray-500">{choice.detail}</span>}</button>)}</div>}
      {confirming && <div className="grid grid-cols-2 gap-2"><button data-voice-control="ui.658a6b18f7f0c944" type="button" disabled={busy} onClick={() => workflow.confirm(true)} aria-label={t("yesNo")} className="min-h-14 rounded-xl bg-teal-700 text-2xl text-white">✓</button><button data-voice-control="ui.361a4716ee08ea42" type="button" disabled={busy} onClick={() => workflow.confirm(false)} aria-label={t("cancel")} className="min-h-14 rounded-xl bg-gray-100 text-2xl">✕</button></div>}
      {!hasActions && <div className="grid grid-cols-2 gap-2">{tasks.map(({ intent, key, Icon }) => <button data-voice-control="ui.942e30c956f9b2f3" key={intent} type="button" onClick={() => { setPane("chat"); props.onRun(intent) }} className="flex min-h-16 items-center gap-2 rounded-xl border border-gray-200 p-3 text-start text-xs font-semibold hover:bg-teal-50"><Icon size={22} className="shrink-0 text-teal-700"/>{t(key)}</button>)}</div>}
      <div className="grid border-t pt-3"><button data-voice-control="ui.3aff41b469e06540" type="button" onClick={() => { voice.interrupt(); workflow.cancelTask(); controller.list(controller.menu.length > 0) }} className="min-h-11 rounded-xl border px-3 text-start text-sm">{controller.prompt(controller.menu.length > 0 ? "more" : "options")}</button></div>
    </div>
    <footer className="shrink-0 space-y-2 border-t bg-white p-3">
      {workflow.emergency && <a data-voice-control="ui.fb8d78ae84c95c3f" href="tel:108" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white"><HeartPulse size={19}/>{t("emergencyCall")}</a>}
      <form data-voice-control="ui.9d1aaab16b8150af" onSubmit={event => { event.preventDefault(); props.onSend() }} className="flex gap-2"><input data-voice-control="ui.33b2694ab5005c31" value={props.input} onChange={event => props.setInput(event.target.value)} aria-label={t("textInput")} placeholder={t("textInput")} className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 px-3 text-sm"/><button data-voice-control="ui.41d797e82355b2ef" type="submit" disabled={!props.input.trim()} aria-label={t("send")} className="h-11 w-11 rounded-xl bg-teal-700 font-bold text-white disabled:opacity-50">→</button></form>
      <div className="flex gap-2"><button data-voice-control="ui.43d3b9d44db0c9b7" type="button" disabled={props.mediaBlocked} onClick={voice.toggleListen} aria-label={t("listen")} className={`flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-2 text-xs font-semibold ${voice.status === "listening" ? "bg-red-100 text-red-800" : "bg-teal-700 text-white"}`}><Mic size={19}/>{t("listen")}</button><button data-voice-control="ui.18cbf23cb6405eaf" type="button" disabled={props.mediaBlocked} onClick={() => { voice.enable(); if (lastReply) voice.speakReply(lastReply.content) }} aria-label={t("replay")} title={t("replay")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><Volume2 size={19}/></button><button data-voice-control="ui.f88049b789a89920" type="button" onClick={voice.stop} aria-label={t("stop")} title={t("stop")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700"><MicOff size={19}/></button></div>
      <div className="flex justify-between gap-2"><button data-voice-control="ui.6bf10c81f8905fba" type="button" onClick={cancel} className="min-h-11 rounded-lg px-2 text-xs font-semibold text-gray-600">{controller.prompt("cancelTask")}</button><button data-voice-control="ui.41f7f8e77eec6464" type="button" onClick={() => props.onRun("emergency")} className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-bold text-red-700"><HeartPulse size={17}/>{t("emergency")}</button></div>
    </footer>
  </section>
}
