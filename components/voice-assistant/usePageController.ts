"use client"
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useApp } from "@/components/providers/AppProvider"
import { CONTROL_PROMPTS, type ControlKey } from "@/lib/assistant/control-catalog"
import { detectControlCommand } from "@/lib/assistant/control-commands"
import { resolveAssistantLanguage } from "@/lib/assistant/languages"
import { parseAssistantConfirmation, parseAssistantNumber, parseAssistantDate, normalizeAssistantDigits } from "@/lib/assistant/parsing"
import { getAccessibility, setAccessibility, requestPageReading, requestAudioStop } from "@/lib/assistant/accessibility"
import { readPageControls, findPageControl, unchanged, isEditable, isEnabled, editPageField, requestPageControl, describeControlReview, type PageControl } from "@/lib/assistant/page-controls"
import { detectAssistantIntent } from "@/lib/assistant/intents"

export function usePageController(say: (text: string) => void, cancelTask: () => void) {
  const { language, user } = useApp()
  const pathname = usePathname(), router = useRouter()
  const [menu, setMenu] = useState<Array<{ id: string; label: string }>>([])
  const snapshot = useRef<PageControl[]>([]), offset = useRef(0)
  const pending = useRef<PageControl | "reading" | null>(null)
  const field = useRef<PageControl | null>(null)
  const active = useRef(false)
  const prompt = (key: ControlKey, item = "") => CONTROL_PROMPTS[resolveAssistantLanguage(language)][key].replaceAll("{item}", item)
  const clear = () => { pending.current = null; field.current = null; snapshot.current = []; active.current = false; setMenu([]) }
  useEffect(() => { clear() }, [pathname, user?.id, language]) // Never retain private DOM/confirmation across owners or routes.
  const list = (more = false) => {
    pending.current = null; field.current = null
    if (!more) { snapshot.current = readPageControls(); offset.current = 0 }
    else offset.current = offset.current + 5 < snapshot.current.length ? offset.current + 5 : 0
    active.current = true
    const options = snapshot.current.slice(offset.current, offset.current + 5).map((control, i) => ({ id: String(offset.current + i + 1), label: `${offset.current + i + 1}. ${control.label || prompt("select")} ${isEnabled(control.element) ? "" : prompt("unavailable")}` }))
    setMenu(options)
    say(`${prompt("options")}: ${options.map(option => option.label).join(". ") || prompt("unavailable")}. ${snapshot.current.length > 5 ? prompt("more") : ""}`)
  }
  const choose = (control: PageControl) => {
    if (!unchanged(control)) { say(prompt("stale")); return }
    if (control.secure || control.policy === "handoff") { requestAudioStop(); if (control.secure) window.dispatchEvent(new Event("rhcp:secure-input")); clear(); say(prompt(control.secure ? "secure" : "unavailable", control.label)); return }
    if (isEditable(control)) {
      field.current = control; pending.current = null; active.current = false; setMenu([])
      const options = control.element instanceof HTMLSelectElement ? Array.from(control.element.options).filter(option => !option.disabled).map(option => option.text).join(". ") : ""
      say(`${prompt("value", control.label)} ${options}. ${prompt("dictation")}`)
      return
    }
    if (control.policy === "local" || (control.element instanceof HTMLAnchorElement && new URL(control.element.href).origin === location.origin)) {
      if (requestPageControl(control)) { clear(); say(prompt("requested", control.label)) }
      else say(prompt("unavailable", control.label))
      return
    }
    pending.current = control; field.current = null; active.current = false; setMenu([])
    say(prompt("confirmControl", describeControlReview(control)))
  }
  const select = (id: string) => { const control = snapshot.current[Number(id) - 1]; if (control) choose(control) }
  const handle = async (text: string): Promise<boolean> => {
    const command = detectControlCommand(text, language)
    if (!command && detectAssistantIntent(text, language).intent !== "unknown" && !field.current) { clear(); return false }
    if (command?.key === "cancelTask" || command?.key === "newRequest" || command?.key === "question") {
      clear(); cancelTask(); requestAudioStop()
      say(prompt("cancelled"))
      return !command.rest
    }
    if (command) {
      const key = command.key, settings = getAccessibility()
      if (["increaseFont", "decreaseFont", "contrastOn", "contrastOff", "resetAccessibility", "slower", "faster"].includes(key)) {
        const next = setAccessibility(key === "resetAccessibility" ? { fontSize: 16, highContrast: false, rate: 0.85 } : key === "increaseFont" || key === "decreaseFont" ? { fontSize: settings.fontSize + (key === "increaseFont" ? 2 : -2) } : key === "slower" || key === "faster" ? { rate: settings.rate + (key === "slower" ? -0.1 : 0.1) } : { highContrast: key === "contrastOn" })
        say(prompt("changed", key === "increaseFont" || key === "decreaseFont" ? `${prompt("fontSize")} ${next.fontSize}px` : prompt(key))); return true
      }
      if (key === "accessibility") { setAccessibility({ open: true }); say(["increaseFont", "decreaseFont", "contrastOn", "contrastOff", "readPage", "resetAccessibility"].map(key => prompt(key as ControlKey)).join(". ")); return true }
      if (key === "stopReading") { requestAudioStop(); return true }
      if (key === "readPage") { pending.current = "reading"; say(prompt("readConsent")); return true }
      if (key === "options" || key === "more") { cancelTask(); list(key === "more"); return true }
      if (key === "back") { clear(); cancelTask(); router.back(); return true }
      if (["scrollDown", "scrollUp", "top", "bottom"].includes(key)) {
        if (key === "top" || key === "bottom") window.scrollTo({ top: key === "top" ? 0 : document.body.scrollHeight, behavior: "smooth" })
        else window.scrollBy({ top: window.innerHeight * (key === "scrollDown" ? 0.7 : -0.7), behavior: "smooth" })
        return true
      }
      if (key === "clearField") {
        if (field.current && editPageField(field.current, "")) { field.current.fingerprint = readPageControls().find(control => control.element === field.current?.element)?.fingerprint || ""; say(prompt("changed", field.current.label)) }
        else say(prompt("unavailable"))
        return true
      }
      if (key === "nextField" || key === "previousField") {
        const fields = readPageControls().filter(control => isEditable(control) && isEnabled(control.element))
        const current = fields.findIndex(control => control.element === field.current?.element)
        const next = fields[current < 0 ? 0 : current + (key === "nextField" ? 1 : -1)]
        if (next) choose(next); else say(prompt("unavailable")); return true
      }
      if (key === "select") {
        cancelTask()
        const controls = active.current ? snapshot.current : readPageControls()
        const number = parseAssistantNumber(command.rest, language)
        const selected = number !== null ? controls[number - 1] : findPageControl(controls, command.rest)
        if (selected) choose(selected); else { list(); say(prompt("stale")) }
        return true
      }
      if (key === "nearest") {
        clear(); cancelTask()
        if (pathname === "/locations") window.dispatchEvent(new CustomEvent("rhcp:facility-nearest", { detail: { text } }))
        else router.push(`/locations?voice=nearest&request=${encodeURIComponent(text.slice(0, 120))}`)
        return true
      }
    }
    if (pending.current) {
      const accepted = parseAssistantConfirmation(text, language)
      if (accepted === null) { say(prompt("confirmControl", pending.current === "reading" ? prompt("readPage") : pending.current.label)); return true }
      const action = pending.current; pending.current = null
      if (!accepted) { say(prompt("cancelled")); return true }
      if (action === "reading") requestPageReading()
      else if (requestPageControl(action)) { clear(); say(prompt("requested", action.label)) }
      else say(prompt("stale"))
      return true
    }
    if (field.current) {
      const target = field.current
      const type = target.element.getAttribute("type")
      const value = type === "date" ? parseAssistantDate(text, language) : type === "number" || type === "range" ? parseAssistantNumber(text, language)?.toString() : normalizeAssistantDigits(text)
      if (value !== null && value !== undefined && editPageField(target, value)) {
        field.current = readPageControls().find(control => control.element === target.element) || null
        say(prompt("changed", target.label))
      } else say(prompt("unavailable", target.label))
      return true
    }
    if (active.current) {
      const number = parseAssistantNumber(text, language)
      const control = number !== null ? snapshot.current[number - 1] : findPageControl(snapshot.current, text)
      if (control) { choose(control); return true }
    }
    return false
  }
  return { menu, handle, select, list, clear, prompt }
}
