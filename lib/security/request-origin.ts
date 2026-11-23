/** Match exact origins; a provider's wildcard host is not application ownership. */
export function isRequestOriginAllowed(origin: string, requestUrl: string): boolean {
  try {
    const supplied = new URL(origin)
    if (supplied.origin !== origin || supplied.username || supplied.password) return false
    const request = new URL(requestUrl)
    if (supplied.origin === request.origin) return true
    const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
    if (configured && supplied.origin === new URL(configured).origin) return true
    return process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "[::1]"].includes(supplied.hostname)
  } catch { return false }
}
