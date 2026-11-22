export function normalizeAssistantText(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/[ـ\u200c\u200d]/g, "").replace(/[^\p{L}\p{M}\p{N}\s./:\-]/gu, " ").replace(/\s+/g, " ").trim()
}

/** Latin tokens need boundaries; native-language stems intentionally allow grammatical suffixes. */
export function hasAssistantPhrase(text: string, phrase: string): boolean {
  const input = normalizeAssistantText(text)
  const target = normalizeAssistantText(phrase)
  if (!target) return false
  if (/[a-z]/i.test(target)) {
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(input)
  }
  return input.includes(target)
}
