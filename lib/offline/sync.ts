import { executeOfflineSync, type OfflineSyncOptions, type OfflineSyncReport } from "./executor"
import { getNextRetryAt, migrateLegacyLocalStorage } from "./outbox"
import { getOfflineSyncOwner, setOfflineSyncOwner } from "./runtime"
export { calculateBackoff, setOfflineSyncOwner, getOfflineSyncOwner, isOfflineCleanupInProgress, isClientCleanupPending } from "./runtime"
export type { OfflineSyncOptions, OfflineSyncReport } from "./executor"

export function isOnline(): boolean { return typeof navigator === "undefined" || navigator.onLine }

export async function requestBackgroundSync(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return
  try {
    const registration = await navigator.serviceWorker.ready
    await (registration as any).sync?.register("offline-outbox-sync")
  } catch {}
}

export async function syncOfflineData(options: OfflineSyncOptions = {}): Promise<OfflineSyncReport> {
  if (typeof window !== "undefined") await migrateLegacyLocalStorage()
  return executeOfflineSync(options)
}

/** Backoff is read from each persisted operation and actually schedules the next attempt. */
export function setupOfflineSync(userId?: string | null): () => void {
  if (userId !== undefined) setOfflineSyncOwner(userId)
  if (typeof window === "undefined") return () => {}
  let disposed = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let running = false
  let sessionBlockedOwner: string | null = null
  const schedule = async () => {
    if (disposed || running) return
    if (timer) clearTimeout(timer)
    const owner = getOfflineSyncOwner()
    if (!owner || !isOnline() || sessionBlockedOwner === owner) return
    const nextAt = await getNextRetryAt(owner).catch(() => null)
    if (disposed || nextAt === null) return
    timer = setTimeout(run, Math.max(500, nextAt - Date.now()))
  }
  const run = async () => {
    if (disposed || running || !isOnline()) return
    running = true
    const report = await syncOfflineData()
    running = false
    if (report.error && /sign in|account changed|UNAUTHORIZED|OWNER_MISMATCH|FORBIDDEN/i.test(report.error)) sessionBlockedOwner = getOfflineSyncOwner()
    else sessionBlockedOwner = null
    if (report.nextRetryAt != null) void requestBackgroundSync()
    void schedule()
  }
  const onOnline = () => { sessionBlockedOwner = null; void run() }
  const onVisibility = () => { if (document.visibilityState === "visible") void schedule() }
  const onUpdated = () => {
    if (sessionBlockedOwner !== getOfflineSyncOwner()) sessionBlockedOwner = null
    void schedule()
  }
  const onWorkerMessage = (event: MessageEvent) => { if (event.data?.type === "SYNC_OUTBOX") void run() }
  window.addEventListener("online", onOnline)
  window.addEventListener("rhcp:outbox-updated", onUpdated)
  document.addEventListener("visibilitychange", onVisibility)
  navigator.serviceWorker?.addEventListener("message", onWorkerMessage)
  void schedule()
  return () => {
    disposed = true
    if (timer) clearTimeout(timer)
    window.removeEventListener("online", onOnline)
    window.removeEventListener("rhcp:outbox-updated", onUpdated)
    document.removeEventListener("visibilitychange", onVisibility)
    navigator.serviceWorker?.removeEventListener("message", onWorkerMessage)
  }
}
