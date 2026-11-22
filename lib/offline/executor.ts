import { deleteOps, getNextRetryAt, hasOwnedPendingOperations, listPending, markFailed } from "./outbox"
import { getOfflineSyncOwner, notifyOutboxUpdated, isOfflineCleanupInProgress, getOfflineCleanupEpoch } from "./runtime"

export interface OfflineSyncOptions { ownerUserId?: string | null; source?: "page" | "background"; maxBatches?: number }
export interface OfflineSyncReport {
  success: boolean; synced: number; duplicates: number; failed: number; error?: string
  nextRetryAt?: number | null; ownerUserId?: string
}

let isSyncing = false
const empty = (error?: string): OfflineSyncReport => ({ success: !error, synced: 0, duplicates: 0, failed: 0, ...(error ? { error } : {}) })

async function boundedFetch(url: string, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.min(8000, Math.max(1, timeoutMs)))
  try {
    const response = await fetch(url, { ...init, credentials: "same-origin", cache: "no-store", signal: controller.signal })
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > 256 * 1024) throw new Error("Synchronization response exceeded the size limit")
    return new Response(bytes, { status: response.status, statusText: response.statusText, headers: response.headers })
  }
  finally { clearTimeout(timer) }
}

/** Worker resolves the server-verified session, never a cached client role/profile. */
async function resolveOwner(options: OfflineSyncOptions, deadline: number): Promise<string | null> {
  if (options.source !== "background") return options.ownerUserId === undefined ? getOfflineSyncOwner() : options.ownerUserId
  const response = await boundedFetch("/api/auth/profile", {}, deadline - Date.now())
  if (!response.ok) return null
  const profile = await response.json()
  return typeof profile?.user?.id === "string" ? profile.user.id : null
}

/** Bounded, window-independent executor used by both the page and Background Sync. */
export async function executeOfflineSync(options: OfflineSyncOptions = {}): Promise<OfflineSyncReport> {
  if (isOfflineCleanupInProgress()) return empty("Private storage cleanup is in progress")
  const epoch = getOfflineCleanupEpoch()
  if (typeof navigator !== "undefined" && navigator.onLine === false) return empty("Offline")
  if (isSyncing) return empty("Sync already in progress")
  isSyncing = true
  const report = empty()
  const deadline = Date.now() + 20000
  try {
    if (options.source === "background" && !(await hasOwnedPendingOperations())) return report
    const owner = await resolveOwner(options, deadline)
    if (!owner) return empty("Sign in before synchronizing; unowned legacy requests remain quarantined")
    report.ownerUserId = owner
    for (let index = 0; index < Math.min(3, Math.max(1, options.maxBatches ?? 1)) && Date.now() < deadline; index++) {
      if (isOfflineCleanupInProgress() || epoch !== getOfflineCleanupEpoch()) return { ...report, success: false, error: "Private storage cleanup interrupted sync" }
      // Check the active page owner again after each await; account changes never adopt queued work.
      if (options.source !== "background" && getOfflineSyncOwner() !== owner) return { ...report, success: false, error: "Account changed during sync" }
      const batch = (await listPending(owner, true)).slice(0, 50)
      if (isOfflineCleanupInProgress() || epoch !== getOfflineCleanupEpoch()) return { ...report, success: false, error: "Private storage cleanup interrupted sync" }
      if (!batch.length) break
      if (batch.some(op => op.owner_user_id !== owner)) return { ...report, success: false, error: "Queue ownership validation failed" }
      let response: Response
      try {
        response = await boundedFetch("/api/offline-sync", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner_user_id: owner,
            operations: batch.map(op => {
              const { id: payloadId, ...data } = op.payload
              return { client_op_id: op.client_op_id, table: op.table, type: op.type, id: op.entity_id || payloadId, entity_id: op.entity_id, data }
            }),
          }),
        }, deadline - Date.now())
      } catch (error) {
        for (const op of batch) await markFailed(op.client_op_id, "Network error during sync", owner)
        report.failed += batch.length; report.success = false; report.error = "Network error during sync"
        break
      }
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = body.code || body.error || `HTTP ${response.status}`
        report.success = false; report.error = message
        // Session failures are recoverable without consuming the clinical request's retry budget.
        if (response.status === 401 || response.status === 403) break
        const retryHeader = Number(response.headers.get("Retry-After")) * 1000
        const delay = Number.isFinite(retryHeader) ? Math.max(0, retryHeader) : 0
        for (const op of batch) await markFailed(op.client_op_id, message, owner, delay)
        report.failed += batch.length
        break
      }
      const expected = new Set(batch.map(op => op.client_op_id))
      const received = new Set<string>()
      const results = body.results
      const valid = Array.isArray(results) && results.length === batch.length && results.every(row => {
        if (!row || !expected.has(row.client_op_id) || received.has(row.client_op_id) || !["ok", "duplicate", "rejected"].includes(row.status)) return false
        received.add(row.client_op_id)
        return true
      }) && body.owner_user_id === owner
      if (!valid) {
        for (const op of batch) await markFailed(op.client_op_id, "Invalid sync acknowledgment", owner)
        report.failed += batch.length; report.success = false; report.error = "Invalid sync acknowledgment"
        break
      }
      const acknowledged: string[] = []
      for (const result of results) {
        if (result.status === "ok") { acknowledged.push(result.client_op_id); report.synced++ }
        else if (result.status === "duplicate") { acknowledged.push(result.client_op_id); report.duplicates++ }
        else {
          await markFailed(result.client_op_id, result.error || "Operation rejected", owner)
          report.failed++; report.success = false
        }
      }
      if (acknowledged.length) await deleteOps(acknowledged, owner)
      if (report.failed) break
    }
    report.nextRetryAt = await getNextRetryAt(owner)
    return report
  } catch (error) { return { ...report, success: false, error: error instanceof Error ? error.message : "Synchronization failed" } }
  finally { isSyncing = false; notifyOutboxUpdated() }
}
