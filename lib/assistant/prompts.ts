import { resolveAssistantLanguage } from "./languages"
import { CORE_PROMPTS, type CorePromptKey } from "./prompt-catalog"
import { WORKFLOW_PROMPTS, type WorkflowPromptKey } from "./workflow-prompt-catalog"
import { PRIVACY_PROMPTS, type PrivacyPromptKey } from "./privacy-prompt-catalog"
import { INTAKE_PROMPTS, type IntakePromptKey } from "./intake-prompt-catalog"
import { OFFLINE_PROMPTS, type OfflinePromptKey } from "./offline-prompt-catalog"
import { CONTROL_PROMPTS, type ControlKey } from "./control-catalog"

const ALIASES = { chooseDoctor: "askDoctor", chooseSlot: "askSlot", askTaskAgain: "askTask", micUnavailableGreeting: "micUnavailable", voiceUnavailableGreeting: "voiceUnavailable" } as const
export type AssistantPromptKey = CorePromptKey | WorkflowPromptKey | PrivacyPromptKey | IntakePromptKey | OfflinePromptKey | ControlKey | keyof typeof ALIASES
export type PromptKey = AssistantPromptKey

/** These prompts are native text, independent of Google DOM translation and remote language models. */
export function getAssistantPrompt(language: string, key: AssistantPromptKey, values: Record<string, string | number> = {}): string {
  const lang = resolveAssistantLanguage(language)
  const resolvedKey = key in ALIASES ? ALIASES[key as keyof typeof ALIASES] : key
  const catalog = { ...CONTROL_PROMPTS[lang], ...CORE_PROMPTS[lang], ...WORKFLOW_PROMPTS[lang], ...PRIVACY_PROMPTS[lang], ...INTAKE_PROMPTS[lang], ...OFFLINE_PROMPTS[lang] }
  return catalog[resolvedKey as keyof typeof catalog].replace(/\{([a-zA-Z]+)\}/g, (placeholder, name: string) => {
    const value = values[name] ?? (name === "time" ? values.slot : undefined)
    return value === undefined ? placeholder : String(value)
  })
}

export function getAssistantTriageReply(language: string, urgency: string): string {
  const key: WorkflowPromptKey = urgency === "emergency" ? "triageEmergency" : urgency === "high" ? "triageHigh" : urgency === "medium" ? "triageMedium" : urgency === "low" ? "triageLow" : "unknownSymptoms"
  return getAssistantPrompt(language, key)
}
