import { closeOutboxStore } from "./store"
import { beginOfflineCleanup, finishOfflineCleanup, setOfflineSyncOwner } from "./runtime"
import { PRIVATE_DATABASES, clearPrivateStorage, erasePrivateDatabase } from "./private-storage"
import { PUBLIC_PACK_CACHE_PREFIX } from "@/lib/assistant/offline-packs"
export { isClientCleanupPending } from "./runtime"

let cleanupPromise: Promise<void> | null = null
let cleanupSequence = 0

/** Await worker erasure before another account can create a queue in its database. */
export async function requestWorkerPrivateCleanup(timeoutMs = 10000): Promise<boolean> {
  const controller = typeof navigator !== "undefined" ? navigator.serviceWorker?.controller : null
  if (!controller) return false
  if (typeof MessageChannel === "undefined") throw new Error("Active service worker requires cleanup acknowledgment support")
  const channel = new MessageChannel()
  const requestId = `private-cleanup-${Date.now()}-${++cleanupSequence}`
  return new Promise<boolean>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer)
      channel.port1.close(); channel.port2.close()
      if (error) reject(error)
      else resolve(true)
    }
    const timer = setTimeout(() => finish(new Error("Service worker did not acknowledge private storage cleanup")), timeoutMs)
    channel.port1.onmessage = (event) => {
      if (event.data?.requestId !== requestId || event.data?.type !== "PRIVATE_CACHES_CLEARED") return
      finish(event.data.success === true ? undefined : new Error("Service worker private storage cleanup failed"))
    }
    try { controller.postMessage({ type: "CLEAR_CACHES", requestId }, [channel.port2]) }
    catch { finish(new Error("Service worker cleanup message could not be sent")) }
  })
}

/** Single-flight cleanup blocks all queue writes, including explicit-owner writes. */
export function wipeClientCachesOnSignOut(): Promise<void> {
  if (cleanupPromise) return cleanupPromise
  setOfflineSyncOwner(null)
  if (typeof window === "undefined") return Promise.resolve()
  beginOfflineCleanup()
  cleanupPromise = eraseClientPrivateData().then(() => finishOfflineCleanup()).finally(() => { cleanupPromise = null })
  return cleanupPromise
}

/** Erases private data explicitly; public language/essential-guidance packs survive sign-out. */
async function eraseClientPrivateData(): Promise<void> {
  const failures: unknown[] = []
  try { if (typeof localStorage !== "undefined") clearPrivateStorage(localStorage) } catch (error) { failures.push(error) }
  try { if (typeof sessionStorage !== "undefined") clearPrivateStorage(sessionStorage) } catch (error) { failures.push(error) }
  try { await closeOutboxStore() } catch (error) { failures.push(error) }
  let workerErased = false
  let workerFailed = false
  try { workerErased = await requestWorkerPrivateCleanup() } catch (error) { workerFailed = true; failures.push(error) }
  // An unacknowledged worker may still be erasing. Keep the account paused; do not launch a competing late erasure.
  if (!workerErased && !workerFailed) for (const name of PRIVATE_DATABASES) {
      try { await erasePrivateDatabase(name) } catch (error) { failures.push(error) }
  }
  try {
    if (typeof caches !== "undefined") {
      const names = await caches.keys()
      await Promise.all(names.filter(name => !name.startsWith(PUBLIC_PACK_CACHE_PREFIX)).map(name => caches.delete(name)))
    }
  } catch (error) { failures.push(error) }
  if (failures.length) throw new Error("Private storage cleanup could not complete; close other tabs and retry")
}
