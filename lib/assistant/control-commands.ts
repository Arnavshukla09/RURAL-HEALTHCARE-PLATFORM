import { CONTROL_PROMPTS, type ControlKey } from "./control-catalog"
import { resolveAssistantLanguage } from "./languages"
import { normalizeAssistantText } from "./text"

const aliases: Partial<Record<ControlKey, string[]>> = {
  options: ["what can i do here", "show all options", "website options", "current options"],
  more: ["next options"], cancelTask: ["cancel this task", "cancel conversation", "cancel current task", "cancel chat"],
  newRequest: ["change task", "start over", "new task"], question: ["ask a question", "question"],
  increaseFont: ["increase the font size", "bigger text", "make text larger", "increase text size"],
  decreaseFont: ["decrease the font size", "smaller text", "reduce text size"],
  contrastOn: ["turn on high contrast", "enable high contrast"], contrastOff: ["turn off high contrast", "disable high contrast"],
  readPage: ["read aloud", "read this page"], stopReading: ["stop page reading"],
  select: ["click", "open option", "choose option", "page option"],
  nearest: ["nearest clinic", "nearest pharmacy", "nearest hospital", "nearest phc"],
}
const commands: ControlKey[] = ["cancelTask", "newRequest", "question", "correctLast", "increaseFont", "decreaseFont", "contrastOn", "contrastOff", "resetAccessibility", "accessibility", "stopReading", "readPage", "options", "more", "back", "nextField", "previousField", "clearField", "scrollDown", "scrollUp", "top", "bottom", "select", "nearest", "slower", "faster"]
export function detectControlCommand(text: string, language: string): { key: ControlKey; rest: string } | null {
  const input = normalizeAssistantText(text).replace(/[.!?।]+$/u, "").trim()
  const catalog = CONTROL_PROMPTS[resolveAssistantLanguage(language)]
  for (const key of commands) {
    const phrases = [catalog[key], CONTROL_PROMPTS.en[key], ...(aliases[key] || [])]
    for (const phrase of phrases.sort((a, b) => b.length - a.length)) {
      const normalized = normalizeAssistantText(phrase)
      if (input === normalized) return { key, rest: "" }
      if (input.startsWith(normalized + " ")) return { key, rest: text.trim().slice(phrase.length).trim() }
    }
  }
  return null
}
