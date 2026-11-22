/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { executeOfflineSync } from "@/lib/offline/executor"
import { closeOutboxStore } from "@/lib/offline/store"
import { PRIVATE_DATABASES, erasePrivateDatabase } from "@/lib/offline/private-storage"
import { beginOfflineCleanup, finishOfflineCleanup } from "@/lib/offline/runtime"
import { PUBLIC_PACK_CACHE_PREFIX } from "@/lib/assistant/offline-packs"
import {
  Serwist,
  NetworkOnly,
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
  ExpirationPlugin,
} from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: false,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.mode === "navigate"
        },
      },
    ],
  },
  runtimeCaching: [
    // 1. CRITICAL (C3): NetworkOnly for ALL private, authenticated, or mutation APIs
    // Under no circumstances may patient medical data or auth tokens enter Cache Storage
    {
      matcher: ({ request, url }) => {
        if (request.method !== "GET") return true
        const path = url.pathname
        return (
          path.startsWith("/api/appointments") ||
          path.startsWith("/api/medical-records") ||
          path.startsWith("/api/notifications") ||
          path.startsWith("/api/health-data") ||
          path.startsWith("/api/doctor-requests") ||
          path.startsWith("/api/chat-cache") ||
          path.startsWith("/api/offline-sync") ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/teleconsult") ||
          path.startsWith("/api/admin") ||
          path.startsWith("/api/assistant") ||
          path.startsWith("/api/abdm") ||
          path.startsWith("/auth/")
        )
      },
      handler: new NetworkOnly(),
    },

    {
      matcher: ({ request, url }) => request.method === "GET" && /^\/api\/facilities\/district\/\d{4}$/.test(url.pathname),
      handler: async ({ request, url }) => {
        try { return await fetch(request) }
        catch {
          const district = url.pathname.split("/").pop()!
          const pack = await caches.match(`/data/facilities/${district}.json`)
          if (!pack) return new Response(JSON.stringify({ facilities: [], source: "offline-pack-unavailable" }), { status: 503, headers: { "Content-Type": "application/json" } })
          const facilities = await pack.json()
          return new Response(JSON.stringify({ districtCode: district, count: facilities.length, facilities, source: "offline-public-pack" }), { headers: { "Content-Type": "application/json" } })
        }
      },
    },

    // 2. Public JSON APIs (providers, camps, facilities locator, health check): StaleWhileRevalidate
    {
      matcher: ({ request, url }) => {
        if (request.method !== "GET") return false
        const path = url.pathname
        return (
          path.startsWith("/api/providers") ||
          path.startsWith("/api/facilities") ||
          path.startsWith("/api/health")
        )
      },
      handler: new StaleWhileRevalidate({
        cacheName: "public-api-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 2 * 60 * 60, // 2 hours
          }),
        ],
      }),
    },

    // 3. Static Images: CacheFirst, 30 days
    {
      matcher: ({ request, url }) =>
        request.destination === "image" ||
        /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/i.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "images-cache",
        plugins: [
          { handlerDidError: async ({ request }) => caches.match(request) },
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },

    // 4. Web Fonts: CacheFirst, 1 year
    {
      matcher: ({ request, url }) =>
        request.destination === "font" ||
        /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i.test(url.href) ||
        /\.(?:woff|woff2|eot|ttf|otf)$/i.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "fonts-cache",
        plugins: [
          { handlerDidError: async ({ request }) => caches.match(request) },
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          }),
        ],
      }),
    },

    // 5. Immutable Next.js static JS/CSS chunks: StaleWhileRevalidate
    {
      matcher: ({ request, url }) =>
        request.destination === "style" ||
        request.destination === "script" ||
        url.pathname.startsWith("/_next/static/"),
      handler: new StaleWhileRevalidate({
        cacheName: "static-assets-cache",
        plugins: [
          { handlerDidError: async ({ request }) => caches.match(request) },
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60,
          }),
        ],
      }),
    },

    // 6. Navigation & RSC Payloads: NetworkFirst with 3s timeout for flaky 2G/3G connections
    // Falls back to cached page, or /offline if unvisited
    {
      matcher: ({ request, url }) => {
        if (request.mode === "navigate") return true
        // Next.js App Router client-side RSC data prefetches and client navigations
        if (
          url.searchParams.has("_rsc") ||
          request.headers.get("RSC") === "1" ||
          request.headers.get("Next-Router-State-Tree") !== null
        ) {
          return true
        }
        return false
      },
      handler: new NetworkFirst({
        cacheName: "pages-cache",
        networkTimeoutSeconds: 3,
        plugins: [
          {
            handlerDidError: async ({ request }) => {
              // RSC fetches require RSC data; HTML fallback would corrupt the client router.
              if (request.mode !== "navigate") return caches.match(request)
              const url = new URL(request.url)
              const publicPage = ["/", "/offline", "/emergency", "/symptom-checker"].includes(url.pathname)
              const names = (await caches.keys()).filter(name => name.startsWith(PUBLIC_PACK_CACHE_PREFIX))
              for (const name of names) {
                const cache = await caches.open(name)
                const fallback = await cache.match(publicPage ? url.pathname : "/offline")
                if (fallback) return fallback
              }
              return undefined
            },
          },
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    },
  ],
})

// Pre-cache core emergency and public routes during Service Worker installation
const CORE_OFFLINE_ROUTES = [
  "/offline",
  "/",
  "/emergency",
  "/symptom-checker",
  "/camps",
  "/directory",
]

self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open("pages-cache").then((cache) => {
      return cache.addAll(CORE_OFFLINE_ROUTES).catch((err) => {
        console.warn("[Serwist] Pre-cache initial warning (non-fatal):", err)
      })
    })
  )
})


let privateCleanupPromise: Promise<void> | null = null
function clearWorkerPrivateData(): Promise<void> {
  if (privateCleanupPromise) return privateCleanupPromise
  beginOfflineCleanup()
  privateCleanupPromise = closeOutboxStore().then(async () => {
    await Promise.all(PRIVATE_DATABASES.map(erasePrivateDatabase))
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => !key.startsWith(PUBLIC_PACK_CACHE_PREFIX)).map(key => caches.delete(key)))
    finishOfflineCleanup()
  }).finally(() => { privateCleanupPromise = null })
  return privateCleanupPromise
}

// Custom message listener for PWA lifecycle events
self.addEventListener("message", (event: any) => {
  if (!event.data) return

  // User confirmed update toast -> activate new service worker
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  // User signed out -> wipe all runtime caches to protect privacy on shared rural devices
  if (event.data.type === "CLEAR_CACHES") {
    event.waitUntil(
      clearWorkerPrivateData().then(() => {
        event.ports?.[0]?.postMessage({ type: "PRIVATE_CACHES_CLEARED", requestId: event.data.requestId, success: true })
      }).catch(() => {
        event.ports?.[0]?.postMessage({ type: "PRIVATE_CACHES_CLEARED", requestId: event.data.requestId, success: false })
      })
    )
  }
})

// Background Sync support (Audit C4 / Phase 4)
self.addEventListener("sync", (event: any) => {
  if (event.tag === "offline-outbox-sync") {
    event.waitUntil(
      executeOfflineSync({ source: "background", maxBatches: 3 }).then(async (report) => {
        const clients = await self.clients.matchAll({ type: "window" })
        for (const client of clients) {
          client.postMessage({ type: "SYNC_OUTBOX", report })
        }
        // Reject for the browser's retry policy instead of depending on a live window.
        const sessionUnavailable = /sign in|OWNER_MISMATCH|UNAUTHORIZED|FORBIDDEN|cleanup/i.test(report.error || "")
        if (!sessionUnavailable && (!report.success || report.nextRetryAt != null)) throw new Error(report.error || "Offline queue has pending retries")
      })
    )
  }
})

serwist.addEventListeners()
