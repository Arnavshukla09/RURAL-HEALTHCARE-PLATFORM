import { resolveAssistantLanguage, type AssistantLanguageCode } from "./languages"
import type { AssistantPhraseCatalog } from "./phrase-catalog"

export const OFFLINE_PACK_VERSION = 1
export const PUBLIC_PACK_CACHE_PREFIX = "rhcp-public-assistant-v1-"
export const CORE_OFFLINE_ASSETS = ["/", "/offline", "/emergency", "/symptom-checker", "/directory", "/locations", "/camps", "/campaigns", "/health-info", "/health-info/schemes", "/avatar/rural-guide.svg", "/data/facilities/2301.json", "/data/facilities/2302.json", "/data/facilities/2303.json", "/data/facilities/0801.json", "/data/facilities/0802.json"]
export interface OfflineLanguagePack {
  version: number
  catalogRevision: number
  language: { code: AssistantLanguageCode; speechLocale: string; dir: string }
  prompts: Record<string, string>
  phrases: AssistantPhraseCatalog
  vocabulary: { months: string[]; extraNumbers: Record<string, number>; symptoms: Record<string, string[]>; intensity: Record<"mild" | "moderate" | "severe", string> }
}
interface PackManifest { version: number; packs: Record<string, { url: string; sha256: string }> }
export interface OfflinePackStatus { language: AssistantLanguageCode; ready: boolean; installed: boolean; missing: string[]; persisted: boolean; error?: string }

function available(): boolean { return typeof caches !== "undefined" && typeof crypto !== "undefined" && !!crypto.subtle }
async function digest(response: Response): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await response.clone().arrayBuffer())
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("")
}
function trustedPack(manifest: PackManifest, language: AssistantLanguageCode) {
  const entry = manifest?.packs?.[language]
  if (manifest?.version !== OFFLINE_PACK_VERSION || !entry || entry.url !== `/data/assistant/${language}.json` || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error("Invalid offline pack manifest")
  return entry
}

export async function requestOfflinePersistence(): Promise<boolean> {
  try { return typeof navigator !== "undefined" && navigator.storage?.persist ? await navigator.storage.persist() : false }
  catch { return false }
}

export async function getOfflinePackData(input: string): Promise<OfflineLanguagePack | null> {
  if (!available()) return null
  const language = resolveAssistantLanguage(input)
  const cache = await caches.open(PUBLIC_PACK_CACHE_PREFIX + language)
  try {
    const manifestResponse = await cache.match("/data/assistant/manifest.json")
    if (!manifestResponse) return null
    const entry = trustedPack(await manifestResponse.json(), language)
    const response = await cache.match(entry.url)
    if (!response || await digest(response) !== entry.sha256) return null
    const pack = await response.json()
    return pack.version === OFFLINE_PACK_VERSION && pack.catalogRevision === 3 && pack.language?.code === language && pack.prompts?.confirmBooking && pack.prompts?.confirmReadRecords && pack.prompts?.offlineTitle && pack.vocabulary?.months?.length === 12 ? pack : null
  } catch { return null }
}

export async function getOfflinePackStatus(input: string): Promise<OfflinePackStatus> {
  const language = resolveAssistantLanguage(input)
  if (!available()) return { language, ready: false, installed: false, missing: ["CacheStorage/WebCrypto unavailable"], persisted: false }
  const cache = await caches.open(PUBLIC_PACK_CACHE_PREFIX + language)
  const pack = await getOfflinePackData(language)
  const missing: string[] = []
  const readiness = await cache.match("/data/assistant/ready.json")
  const marker = readiness ? await readiness.json().catch(() => null) : null
  if (marker?.version !== OFFLINE_PACK_VERSION || marker?.language !== language) missing.push("Offline preparation not completed")
  for (const asset of CORE_OFFLINE_ASSETS) if (!(await cache.match(asset))) missing.push(asset)
  const dependencyManifest = await cache.match("/data/assistant/dependencies.json")
  if (!dependencyManifest) missing.push("JavaScript dependency manifest")
  else {
    const dependencies: string[] = await dependencyManifest.json().catch(() => [])
    for (const asset of dependencies) if (!(await cache.match(asset))) missing.push(asset)
    if (!dependencies.length) missing.push("JavaScript dependencies")
  }
  if (!pack) missing.push(`/data/assistant/${language}.json`)
  let persisted = false
  try { persisted = typeof navigator !== "undefined" && !!(await navigator.storage?.persisted?.()) } catch {}
  return { language, ready: !!pack && missing.length === 0, installed: !!pack, missing, persisted }
}

/** Readiness stays false after any missing/failed asset; never claims offline speech models exist. */
export async function installOfflinePack(input: string): Promise<OfflinePackStatus> {
  const language = resolveAssistantLanguage(input)
  if (!available()) return getOfflinePackStatus(language)
  const cache = await caches.open(PUBLIC_PACK_CACHE_PREFIX + language)
  try {
    await cache.delete("/data/assistant/ready.json")
    const manifestResponse = await fetch("/data/assistant/manifest.json", { cache: "no-store", credentials: "omit" })
    if (!manifestResponse.ok) throw new Error("Public language pack manifest unavailable")
    const manifest: PackManifest = await manifestResponse.clone().json()
    const entry = trustedPack(manifest, language)
    const packResponse = await fetch(entry.url, { cache: "no-store", credentials: "omit" })
    if (!packResponse.ok || await digest(packResponse) !== entry.sha256) throw new Error("Language pack checksum failed")
    await cache.put(entry.url, packResponse)
    await cache.put("/data/assistant/manifest.json", manifestResponse)
    const dependencies = new Set<string>()
    for (const asset of CORE_OFFLINE_ASSETS) {
      const response = await fetch(asset, { cache: "reload", credentials: "omit" })
      if (!response.ok || response.redirected) throw new Error("Offline asset unavailable: " + asset)
      if (response.headers.get("content-type")?.includes("text/html")) {
        const html = await response.clone().text()
        for (const match of html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"']+\.(?:js|css))["']/g)) dependencies.add(match[1].replace(/&amp;/g, "&"))
      }
      await cache.put(asset, response)
    }
    // Include already-loaded dynamically imported avatar chunks, in addition to shell imports.
    if (typeof performance !== "undefined") for (const resource of performance.getEntriesByType("resource")) {
      const url = new URL(resource.name, typeof location !== "undefined" ? location.origin : "https://offline.invalid")
      if (url.pathname.startsWith("/_next/static/") && /\.(js|css|woff2?|ttf|png|svg|webp)$/.test(url.pathname)) dependencies.add(url.pathname)
    }
    if (!dependencies.size) throw new Error("The application shell did not expose JavaScript assets")
    for (const asset of dependencies) {
      const response = await fetch(asset, { cache: "reload", credentials: "omit" })
      if (!response.ok) throw new Error("Offline dependency unavailable: " + asset)
      await cache.put(asset, response)
    }
    await cache.put("/data/assistant/dependencies.json", new Response(JSON.stringify([...dependencies]), { headers: { "Content-Type": "application/json" } }))
    await cache.put("/data/assistant/ready.json", new Response(JSON.stringify({ version: OFFLINE_PACK_VERSION, language }), { headers: { "Content-Type": "application/json" } }))
    await requestOfflinePersistence()
    return getOfflinePackStatus(language)
  } catch (error) {
    const status = await getOfflinePackStatus(language)
    return { ...status, ready: false, error: error instanceof Error ? error.message : "Offline preparation failed" }
  }
}
