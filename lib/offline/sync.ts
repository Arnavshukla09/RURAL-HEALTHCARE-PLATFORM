import {
  listPending,
  deleteOps,
  markFailed,
  migrateLegacyLocalStorage,
  type OutboxOperation,
} from "./outbox"

const MAX_BATCH_SIZE = 50

/**
 * Check if the browser environment has online connectivity
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true
}

/**
 * Register Background Sync with the service worker if supported (Audit C4, §2.4)
 */
export async function requestBackgroundSync(): Promise<void> {
  if (typeof window === "undefined") return
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      await (registration as any).sync?.register("offline-outbox-sync")
    } catch (err) {
      // SyncManager might not be granted in some permissions contexts
      console.warn("[OfflineSync] Background sync registration skipped:", err)
    }
  }
}

/**
 * Calculate jittered exponential backoff delay in ms
 */
export function calculateBackoff(attempts: number): number {
  const base = Math.min(30000, 1000 * Math.pow(2, attempts))
  const jitter = Math.random() * 1000
  return Math.round(base + jitter)
}

function notifyOutboxUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rhcp:outbox-updated"))
  }
}

let isSyncing = false

/**
 * Synchronize pending operations with POST /api/offline-sync
 */
export async function syncOfflineData(): Promise<{
  success: boolean
  synced: number
  duplicates: number
  failed: number
  error?: string
}> {
  if (!isOnline()) {
    return { success: false, synced: 0, duplicates: 0, failed: 0, error: "Offline" }
  }

  if (isSyncing) {
    return { success: false, synced: 0, duplicates: 0, failed: 0, error: "Sync already in progress" }
  }

  isSyncing = true

  try {
    // 1. One-time migration of any legacy localStorage operations
    await migrateLegacyLocalStorage()

    // 2. Fetch pending operations
    const pending = await listPending()
    if (pending.length === 0) {
      notifyOutboxUpdated()
      return { success: true, synced: 0, duplicates: 0, failed: 0 }
    }

    // 3. Batch up to 50 operations per request (Audit C4 cap)
    const batch: OutboxOperation[] = pending.slice(0, MAX_BATCH_SIZE)
    const operationsPayload = batch.map((op) => ({
      client_op_id: op.client_op_id,
      table: op.table,
      type: op.type,
      id: op.payload?.id,
      data: op.payload,
    }))

    const response = await fetch("/api/offline-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operations: operationsPayload }),
    })

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}))
      const errMsg = errJson.error || `HTTP ${response.status}`
      for (const op of batch) {
        await markFailed(op.client_op_id, errMsg)
      }
      notifyOutboxUpdated()
      return {
        success: false,
        synced: 0,
        duplicates: 0,
        failed: batch.length,
        error: errMsg,
      }
    }

    const { results } = (await response.json()) as {
      results: Array<{ client_op_id: string; status: "ok" | "duplicate" | "rejected"; error?: string }>
    }

    const okOrDuplicateIds: string[] = []
    let syncedCount = 0
    let duplicateCount = 0
    let failedCount = 0

    for (const res of results) {
      if (res.status === "ok") {
        okOrDuplicateIds.push(res.client_op_id)
        syncedCount++
      } else if (res.status === "duplicate") {
        okOrDuplicateIds.push(res.client_op_id)
        duplicateCount++
      } else if (res.status === "rejected") {
        await markFailed(res.client_op_id, res.error || "Rejected by server validation")
        failedCount++
      }
    }

    // 4. Client deletes ONLY ok and duplicate operations (Audit C4 rule: no silent drops)
    if (okOrDuplicateIds.length > 0) {
      await deleteOps(okOrDuplicateIds)
    }

    notifyOutboxUpdated()

    // If more pending items remain, schedule background continuation
    const remaining = await listPending()
    if (remaining.length > 0 && failedCount === 0) {
      setTimeout(() => {
        syncOfflineData().catch(console.warn)
      }, 500)
    }

    return {
      success: failedCount === 0,
      synced: syncedCount,
      duplicates: duplicateCount,
      failed: failedCount,
    }
  } catch (err: any) {
    console.error("[OfflineSync] Synchronization failed:", err)
    notifyOutboxUpdated()
    return {
      success: false,
      synced: 0,
      duplicates: 0,
      failed: 0,
      error: err?.message || "Network error",
    }
  } finally {
    isSyncing = false
  }
}

/**
 * Setup listeners for online events, visibility changes, and Service Worker sync messages
 */
export function setupOfflineSync(): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleOnline = () => {
    console.log("[OfflineSync] Network reconnected; initiating outbox sync...")
    syncOfflineData().catch(console.warn)
  }

  const handleVisibility = () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      syncOfflineData().catch(console.warn)
    }
  }

  const handleSwMessage = (event: MessageEvent) => {
    if (event.data?.type === "SYNC_OUTBOX") {
      syncOfflineData().catch(console.warn)
    }
  }

  window.addEventListener("online", handleOnline)
  document.addEventListener("visibilitychange", handleVisibility)
  navigator.serviceWorker?.addEventListener("message", handleSwMessage)

  // Initial sync attempt if online
  if (navigator.onLine) {
    syncOfflineData().catch(console.warn)
  }

  // Periodic fallback check every 45s
  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncOfflineData().catch(console.warn)
    }
  }, 45000)

  return () => {
    window.removeEventListener("online", handleOnline)
    document.removeEventListener("visibilitychange", handleVisibility)
    navigator.serviceWorker?.removeEventListener("message", handleSwMessage)
    clearInterval(interval)
  }
}
