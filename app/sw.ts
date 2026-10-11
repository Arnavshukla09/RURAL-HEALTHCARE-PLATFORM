/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
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
          path.startsWith("/auth/")
        )
      },
      handler: new NetworkOnly(),
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
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60,
          }),
        ],
      }),
    },

    // 6. Navigation: NetworkFirst with 3s timeout for flaky 2G/3G connections
    // Falls back to cached page, or /offline if unvisited
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages-cache",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 24 * 60 * 60,
          }),
        ],
      }),
    },
  ],
})

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
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            console.log("[Serwist] Wiping runtime cache on sign-out:", key)
            return caches.delete(key)
          })
        )
      })
    )
  }
})

serwist.addEventListeners()
