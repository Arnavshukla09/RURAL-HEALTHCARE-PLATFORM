import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { installOfflinePack, getOfflinePackData, getOfflinePackStatus, CORE_OFFLINE_ASSETS, PUBLIC_PACK_CACHE_PREFIX } from "@/lib/assistant/offline-packs"
import { erasePrivateDatabase } from "@/lib/offline/private-storage"

const manifest = fs.readFileSync(path.resolve("public/data/assistant/manifest.json"), "utf8")
const pack = fs.readFileSync(path.resolve("public/data/assistant/hi.json"), "utf8")
let stores: Map<string, Map<string, Response>>
const key = (input: string | Request) => typeof input === "string" ? input : new URL(input.url).pathname

describe("Versioned offline assistant packs", () => {
  beforeEach(() => {
    stores = new Map()
    vi.stubGlobal("caches", { open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map())
      const store = stores.get(name)!
      return {
        match: async (input: string | Request) => store.get(key(input))?.clone(),
        put: async (input: string | Request, response: Response) => { store.set(key(input), response.clone()) },
        delete: async (input: string | Request) => store.delete(key(input)),
      }
    } })
    vi.stubGlobal("navigator", { storage: { persist: async () => true, persisted: async () => true } })
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "/data/assistant/manifest.json") return new Response(manifest)
      if (url === "/data/assistant/hi.json") return new Response(pack)
      if (url.startsWith("/_next/static/")) return new Response("public application chunk")
      if (url.endsWith(".json")) return new Response("[]", { headers: { "Content-Type": "application/json" } })
      if (url.endsWith(".svg")) return new Response("<svg/>")
      return new Response('<html><script src="/_next/static/chunks/assistant.js"></script></html>', { headers: { "Content-Type": "text/html" } })
    }))
  })
  afterEach(() => vi.unstubAllGlobals())

  it("validates each of the 13 generated packs against its checksum and language", () => {
    const data = JSON.parse(manifest)
    expect(Object.keys(data.packs)).toHaveLength(13)
    for (const [language, entry] of Object.entries(data.packs) as [string, any][]) {
      const contents = fs.readFileSync(path.resolve("public", entry.url.replace(/^\//, "")), "utf8")
      const parsed = JSON.parse(contents)
      expect(crypto.createHash("sha256").update(contents).digest("hex")).toBe(entry.sha256)
      expect(parsed.version).toBe(1)
      expect(parsed.catalogRevision).toBe(3)
      expect(parsed.language.code).toBe(language)
      expect(parsed.prompts.welcome).toBeTruthy()
      expect(parsed.prompts.askDoctor).toBeTruthy()
      expect(parsed.prompts.confirmBooking).toBeTruthy()
      expect(parsed.prompts.confirmReadRecords).toBeTruthy()
      expect(parsed.prompts.intakeComplete).toBeTruthy()
      expect(parsed.prompts.offlineTitle).toBeTruthy()
      expect(parsed.phrases.yes.length).toBeGreaterThan(0)
      expect(parsed.vocabulary.months).toHaveLength(12)
      expect(parsed.vocabulary.symptoms["chest-pain"].length).toBeGreaterThan(0)
      expect(parsed.vocabulary.intensity.severe).toBeTruthy()
    }
  })

  it("reports ready only after the selected language, essential assets and actual shell chunks are cached", async () => {
    const result = await installOfflinePack("hi")
    expect(result).toMatchObject({ ready: true, installed: true, persisted: true, missing: [] })
    const cached = stores.get(PUBLIC_PACK_CACHE_PREFIX + "hi")!
    for (const asset of CORE_OFFLINE_ASSETS) expect(cached.has(asset)).toBe(true)
    expect(cached.has("/_next/static/chunks/assistant.js")).toBe(true)
    expect((await getOfflinePackData("hi"))?.language.code).toBe("hi")
    for (const call of vi.mocked(fetch).mock.calls) expect(call[1]?.credentials).toBe("omit")
  })

  it("keeps readiness false after a missing essential asset, including later status checks", async () => {
    const original = fetch
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => url === "/avatar/rural-guide.svg" ? new Response("Missing", { status: 404 }) : original(url, init)))
    expect((await installOfflinePack("hi")).ready).toBe(false)
    expect((await getOfflinePackStatus("hi")).ready).toBe(false)
  })

  it("refuses a tampered language pack instead of treating cached presence as readiness", async () => {
    await installOfflinePack("hi")
    stores.get(PUBLIC_PACK_CACHE_PREFIX + "hi")!.set("/data/assistant/hi.json", new Response(pack.replace("स्वास्थ्य", "tampered")))
    expect(await getOfflinePackData("hi")).toBeNull()
    expect((await getOfflinePackStatus("hi")).ready).toBe(false)
  })

  it("clears all private object stores before resolving a blocked database deletion", async () => {
    let erased = false
    let closed = false
    const request: any = {}
    const db = {
      objectStoreNames: ["clinical_notes"], close: () => { closed = true },
      transaction: () => {
        const transaction: any = { objectStore: () => ({ clear: () => { erased = true } }) }
        queueMicrotask(() => transaction.oncomplete?.())
        return transaction
      },
    }
    request.result = db
    vi.stubGlobal("indexedDB", {
      open: () => { queueMicrotask(() => request.onsuccess?.()); return request },
      deleteDatabase: () => {
        expect(erased).toBe(true); expect(closed).toBe(true)
        const deletion: any = {}
        queueMicrotask(() => deletion.onblocked?.())
        return deletion
      },
    })
    await expect(erasePrivateDatabase("ruralhealth_ai")).resolves.toBeUndefined()
  })
})
