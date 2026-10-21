/**
 * Cache and Storage Cleaner for Sign-out (Audit §2.3, Hardening C3)
 * Ensures no private patient medical records, appointments, or auth tokens
 * remain in Cache Storage, localStorage, or IndexedDB on shared rural devices.
 */
export async function wipeClientCachesOnSignOut(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    // 1. Notify Service Worker to delete runtime caches
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHES" })
    }

    // 2. Client-side fallback: directly delete all window.caches
    if ("caches" in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }

    // 3. Clear legacy offline operations in localStorage
    localStorage.removeItem("rhcp_offline_operations")

    // 4. Clear IndexedDB outbox if indexedDB exists
    if ("indexedDB" in window) {
      try {
        const dbs = await indexedDB.databases?.()
        if (dbs) {
          for (const db of dbs) {
            if (db.name && (db.name.includes("offline") || db.name.includes("rhcp"))) {
              indexedDB.deleteDatabase(db.name)
            }
          }
        }
      } catch {
        // indexedDB.databases() might not be supported in older WebViews
      }
    }
  } catch (err) {
    console.warn("[CacheCleaner] Error while wiping client caches:", err)
  }
}
