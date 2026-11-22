import registrations from "./registered-controls.json"
import { hasAssistantPhrase, normalizeAssistantText } from "./text"

export interface PageControl { element: HTMLElement; id: string; label: string; policy: string; secure: boolean; fingerprint: string }
const registry: Record<string, { policy: string; secure: boolean }> = registrations
const fieldTags = new Set(["INPUT", "TEXTAREA", "SELECT"])
export function isVisible(element: HTMLElement) {
  if (!element.isConnected || element.closest('[hidden],[inert],[aria-hidden="true"]')) return false
  const style = getComputedStyle(element)
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0 && !element.matches('input[type="hidden"]')
}
export function isEnabled(element: HTMLElement) {
  return !element.matches(':disabled,[aria-disabled="true"]') && !element.closest('fieldset:disabled,[inert]')
}
export function isSecureField(element: HTMLElement) {
  return /password|otp|token|secret|one-time|verification.?code/i.test([element.getAttribute("type"), element.id, element.getAttribute("name"), element.getAttribute("autocomplete")].join(" "))
}
function controlLabel(element: HTMLElement) {
  const associated = fieldTags.has(element.tagName) ? Array.from((element as HTMLInputElement).labels || []).map(label => label.textContent).join(" ") : ""
  const labelled = element.getAttribute("aria-labelledby")?.split(/\s+/).map(id => document.getElementById(id)?.textContent || "").join(" ")
  const nearbyLabel = fieldTags.has(element.tagName) ? element.parentElement?.querySelector("label")?.textContent || element.parentElement?.parentElement?.querySelector("label")?.textContent : ""
  const own = element.getAttribute("aria-label") || labelled || associated || nearbyLabel || element.getAttribute("title") || element.getAttribute("placeholder") || (!fieldTags.has(element.tagName) ? element.innerText : "") || element.getAttribute("name") || element.id
  const context = element.closest("[data-voice-context]")?.getAttribute("data-voice-context")
  return [context, own].filter(Boolean).join(": ").replace(/\s+/g, " ").trim().slice(0, 220)
}
export function controlFingerprint(element: HTMLElement) {
  const form = element.closest("form") || element.closest('[role="dialog"]') || element.closest("main")
  const fields = form ? Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input,textarea,select")) : []
  // In-memory only; never sent to a model, persisted or printed. Secrets omitted.
  return JSON.stringify([element.getAttribute("href"), element.closest("[data-voice-entity]")?.getAttribute("data-voice-entity"), controlLabel(element), fields.filter(field => !isSecureField(field) && field.type !== "file").map(field => [field.id, field.name, field.value, "checked" in field ? field.checked : null])])
}
export function describeControlReview(control: PageControl) {
  const scope = control.element.closest("form") || control.element.closest('[role="dialog"]') || control.element.closest("[data-slot=card]")
  if (!scope) return control.label
  const fields = Array.from(scope.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input,textarea,select"))
  const details = fields.filter(field => isVisible(field) && !isSecureField(field) && !["file", "hidden", "password"].includes(field.type) && field.value).slice(0, 12).map(field => {
    const label = controlLabel(field)
    const value = field instanceof HTMLSelectElement ? field.selectedOptions[0]?.text : field.value
    return `${label}: ${String(value || "").slice(0, 160)}`
  })
  return [control.label, ...details].join(". ")
}
export function readPageControls(): PageControl[] {
  const modal = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"],[role="alertdialog"]')).filter(isVisible).at(-1)
  const root = modal || document.body
  return Array.from(root.querySelectorAll<HTMLElement>("[data-voice-control]")).flatMap(element => {
    const id = element.dataset.voiceControl || ""
    const entry = registry[id]
    if (!entry || entry.policy === "container" || entry.policy === "assistant" || element.closest('[data-testid="voice-assistant"]') || !isVisible(element)) return []
    return [{ element, id, label: controlLabel(element), policy: entry.policy, secure: entry.secure || isSecureField(element), fingerprint: controlFingerprint(element) }]
  })
}
export function unchanged(control: PageControl) {
  return isVisible(control.element) && isEnabled(control.element) && control.element.dataset.voiceControl === control.id && controlFingerprint(control.element) === control.fingerprint
}
export function findPageControl(controls: PageControl[], name: string) {
  const normalized = normalizeAssistantText(name)
  const matches = controls.filter(control => normalizeAssistantText(control.label) === normalized)
  if (matches.length) return matches.length === 1 ? matches[0] : null
  const partial = controls.filter(control => hasAssistantPhrase(control.label, name))
  return partial.length === 1 ? partial[0] : null
}
export function isEditable(control: PageControl) {
  return control.policy === "field" && fieldTags.has(control.element.tagName) && !["checkbox", "radio", "button", "submit", "reset", "hidden"].includes((control.element as HTMLInputElement).type)
}
/** Native input events reach the existing React onChange handler and validation. */
export function editPageField(control: PageControl, text: string): boolean {
  if (!unchanged(control) || control.secure || !isEditable(control)) return false
  const field = control.element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  if (("readOnly" in field && field.readOnly) || field.type === "file") return false
  const maxLength = "maxLength" in field ? field.maxLength : 1500
  let value = text.slice(0, maxLength > 0 ? maxLength : 1500)
  if (field instanceof HTMLSelectElement) {
    const options = Array.from(field.options).filter(option => !option.disabled)
    const match = options.filter(option => normalizeAssistantText(option.text) === normalizeAssistantText(text) || option.value === text)
    if (match.length !== 1) return false
    value = match[0].value
  }
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : field instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set
  if (!setter) return false
  setter.call(field, value)
  field.dispatchEvent(new Event("input", { bubbles: true }))
  field.dispatchEvent(new Event("change", { bubbles: true }))
  return field.value === value && field.validity.valid
}
export function requestPageControl(control: PageControl) {
  if (!unchanged(control) || control.secure || control.policy === "handoff") return false
  const element = control.element
  if (element instanceof HTMLAnchorElement) {
    const url = new URL(element.href, location.href)
    if (!["https:", "http:", "tel:", "mailto:", "sms:"].includes(url.protocol)) return false
  }
  if (element.getAttribute("role") === "tab") element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
  else element.click()
  return true
}
