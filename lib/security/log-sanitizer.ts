/** Remove payload-bearing fields; logs are diagnostics, never a copy of a request. */
const privateKey = /password|secret|token|authorization|cookie|email|phone|patient|content|prompt|transcript|audio|prescription|notes|body|history|pretext|stack|url/i
export function sanitizeLogText(value: string) {
  return value.replace(/https?:\/\/[^\s"'<>]+/gi, "[url]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted]")
    .replace(/\b(?:sk-|hf_|sb_secret_)[A-Za-z0-9_-]+\b/g, "[redacted]")
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[email]")
    .replace(/((?:password|secret|token|api[_-]?key)\s*[:=]\s*)[^\s,;]+/gi, "$1[redacted]").slice(0, 500)
}
export function sanitizeLogContext(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    if (privateKey.test(key) || item === undefined || (typeof item === "object" && item !== null)) return []
    return [[key, typeof item === "string" ? sanitizeLogText(item) : item]]
  }))
}
