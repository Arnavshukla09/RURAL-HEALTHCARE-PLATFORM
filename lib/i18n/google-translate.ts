/**
 * lib/i18n/google-translate.ts
 *
 * Client-Side Google Translate Integration for Zero-Cost Full Site Regional Translation ($0 Free Tier).
 * Enables seamless on-the-fly DOM translation across all 13 supported Indian languages:
 * English (en), Hindi (hi), Marathi (mr), Bengali (bn), Telugu (te), Tamil (ta),
 * Gujarati (gu), Kannada (kn), Punjabi (pa), Odia (or), Malayalam (ml), Assamese (as), Urdu (ur).
 */

declare global {
  interface Window {
    google?: any
    googleTranslateElementInit?: () => void
  }
}

/**
 * Patch DOM methods to avoid React crashing with:
 * "NotFoundError: Failed to execute 'removeChild' on 'Node'"
 * when Google Translate mutates DOM text nodes into <font> tags.
 */
export function installTranslateCrashGuard() {
  if (typeof window === "undefined" || typeof Node === "undefined") return

  try {
    const originalRemoveChild = Node.prototype.removeChild
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        if (child.parentNode) {
          return child.parentNode.removeChild(child)
        }
        return child
      }
      return originalRemoveChild.call(this, child) as T
    }

    const originalInsertBefore = Node.prototype.insertBefore
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        return originalInsertBefore.call(this, newNode, null) as T
      }
      return originalInsertBefore.call(this, newNode, referenceNode) as T
    }
  } catch (err) {
    console.warn("[i18n] Translate crash guard init warning:", err)
  }
}

/**
 * Clean up Google Translate DOM artifacts:
 * - Hides all top banner iframes (.skiptranslate, .goog-te-banner-frame, VIpgJd, etc.)
 * - Resets document.body position and margin offsets so the navigation bar is never obscured.
 */
export function hideGoogleTranslateBanner() {
  if (typeof document === "undefined") return

  try {
    const banners = document.querySelectorAll<HTMLElement>(
      'iframe.skiptranslate, .goog-te-banner-frame, iframe[id*=":1.container"], iframe[id*=":2.container"], iframe[src*="translate.google"], [class*="VIpgJd-ZVi9od-ORHb-Oxf5td"], [class*="VIpgJd-ZVi9od-aZ2wEe-wOHMyf"], [class*="VIpgJd-ZVi9od-ORHb-OEVmcd"], [class*="VIpgJd-ZVi9od-l4eHX"]'
    )
    banners.forEach((el) => {
      el.style.setProperty("display", "none", "important")
      el.style.setProperty("visibility", "hidden", "important")
      el.style.setProperty("height", "0", "important")
      el.style.setProperty("width", "0", "important")
      el.style.setProperty("opacity", "0", "important")
      el.style.setProperty("pointer-events", "none", "important")
      el.style.setProperty("position", "absolute", "important")
      el.style.setProperty("top", "-9999px", "important")
      el.style.setProperty("left", "-9999px", "important")
      el.setAttribute("aria-hidden", "true")
    })

    if (document.body) {
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.setProperty("top", "0px", "important")
      }
      if (document.body.style.position && document.body.style.position !== "static") {
        document.body.style.setProperty("position", "static", "important")
      }
      if (document.body.style.marginTop && document.body.style.marginTop !== "0px") {
        document.body.style.setProperty("margin-top", "0px", "important")
      }
    }
  } catch (err) {
    // Non-blocking cleanup
  }
}

/**
 * Start an observer to continuously suppress any banner iframes injected by Google Translate.
 */
export function startGoogleTranslateBannerSuppression() {
  if (typeof window === "undefined" || typeof document === "undefined") return

  hideGoogleTranslateBanner()

  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(() => {
      hideGoogleTranslateBanner()
    })

    try {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      })
    } catch {}
  }
}

// Ensure crash guard and banner suppression are initialized at client module load
if (typeof window !== "undefined") {
  installTranslateCrashGuard()
  startGoogleTranslateBannerSuppression()
}

/**
 * Set Google Translate cookies across all relevant host and subdomain paths.
 */
export function setTranslateCookie(langCode: string) {
  if (typeof document === "undefined" || typeof window === "undefined") return

  const isEnglish = langCode === "en"
  const host = window.location.hostname
  const domains = [host, `.${host}`, ""]

  domains.forEach((d) => {
    const domainPart = d ? `; domain=${d}` : ""
    if (isEnglish) {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${domainPart}`
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${domainPart}`
    } else {
      document.cookie = `googtrans=/auto/${langCode}; path=/${domainPart}`
      document.cookie = `googtrans=/en/${langCode}; path=/${domainPart}`
    }
  })
}

/**
 * Programmatically trigger Google Translate to translate the DOM into targetLang.
 * If the widget combo select is present, dispatches the change event immediately.
 * If not yet in DOM, retries briefly and falls back to a page reload if requested.
 */
export function triggerGoogleTranslate(langCode: string, allowReload = false) {
  if (typeof window === "undefined" || typeof document === "undefined") return

  // 1. Update googtrans cookies
  setTranslateCookie(langCode)

  // 2. Suppress any banner frame that might appear
  hideGoogleTranslateBanner()

  // 3. Locate Google Translate select dropdown element (.goog-te-combo)
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo")
  if (select) {
    const targetValue = langCode === "en" ? "" : langCode
    if (select.value !== targetValue) {
      select.value = targetValue
      select.dispatchEvent(new Event("change"))
    }
    setTimeout(hideGoogleTranslateBanner, 50)
    setTimeout(hideGoogleTranslateBanner, 300)
    return
  }

  // 4. Retry finding .goog-te-combo if script is still initializing
  let attempts = 0
  const maxAttempts = 6
  const interval = setInterval(() => {
    attempts++
    hideGoogleTranslateBanner()
    const retrySelect = document.querySelector<HTMLSelectElement>(".goog-te-combo")
    if (retrySelect) {
      clearInterval(interval)
      const targetValue = langCode === "en" ? "" : langCode
      if (retrySelect.value !== targetValue) {
        retrySelect.value = targetValue
        retrySelect.dispatchEvent(new Event("change"))
      }
      setTimeout(hideGoogleTranslateBanner, 50)
      setTimeout(hideGoogleTranslateBanner, 300)
    } else if (attempts >= maxAttempts) {
      clearInterval(interval)
      if (allowReload && langCode !== "en") {
        window.location.reload()
      }
    }
  }, 250)
}
