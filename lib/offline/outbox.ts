import { getOutboxDB as getDB } from "./store"
import { calculateBackoff, getOfflineSyncOwner, notifyOutboxUpdated, isOfflineCleanupInProgress, getOfflineCleanupEpoch } from "./runtime"

export type OutboxTable =
  | "appointments"
  | "health_data"
  | "medical_records"
  | "notifications"
  | "clinical_encounters"
  | "clinical_observations"
export type OutboxOpType = "INSERT" | "UPDATE" | "DELETE"
export type OutboxStatus = "pending" | "sent" | "failed"

export interface OutboxOperation {
  client_op_id: string // UUID v4
  entity_id?: string // Client-preassigned target entity UUID (Intelehealth edge pattern)
  owner_user_id?: string | null // Unowned v1 records are quarantined and never sent.
  next_attempt_at?: number
  table: OutboxTable
  type: OutboxOpType
  payload: Record<string, any>
  created_at: string
  attempts: number
  status: OutboxStatus
  last_error?: string
}

const MAX_QUEUE_LENGTH = 500
const MAX_ATTEMPTS = 5

/**
 * Storage quota helper with 80% threshold warning (Audit §2.4)
 */
export async function checkStorageQuota(): Promise<{
  usage: number
  quota: number
  percent: number
  warning: boolean
}> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return { usage: 0, quota: 0, percent: 0, warning: false }
  }

  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage ?? 0
    const quota = estimate.quota ?? 1
    const percent = Math.round((usage / quota) * 100)
    return {
      usage,
      quota,
      percent,
      warning: percent >= 80,
    }
  } catch (err) {
    console.warn("[Outbox] Failed to estimate storage quota:", err)
    return { usage: 0, quota: 0, percent: 0, warning: false }
  }
}

/**
 * Generates an RFC4122 v4 UUID at the edge for offline entity pre-assignment.
 */
export function createClientEntityId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  if (typeof crypto === "undefined" || !crypto.getRandomValues) throw new Error("Secure UUID generation is unavailable")
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, n => n.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Enqueue a new operation to the IndexedDB outbox
 */
export async function enqueue(op: {
  table: OutboxTable
  type: OutboxOpType
  payload: Record<string, any>
  client_op_id?: string
  entity_id?: string
  owner_user_id?: string | null
}): Promise<OutboxOperation> {
  if (isOfflineCleanupInProgress()) throw new Error("Private storage cleanup is in progress; wait before creating another request")
  const epoch = getOfflineCleanupEpoch()
  const client_op_id = op.client_op_id || createClientEntityId()
  const owner_user_id = op.owner_user_id === undefined ? getOfflineSyncOwner() : op.owner_user_id
  const db = await getDB()
  if (isOfflineCleanupInProgress() || epoch !== getOfflineCleanupEpoch()) throw new Error("Private storage cleanup interrupted this request")
  const tx = db.transaction("outbox", "readwrite")
  const existing = await tx.store.get(client_op_id)
  if (isOfflineCleanupInProgress() || epoch !== getOfflineCleanupEpoch()) throw new Error("Private storage cleanup interrupted this request")
  if (existing) {
    if ((existing.owner_user_id ?? null) !== owner_user_id || existing.table !== op.table || existing.type !== op.type || JSON.stringify(existing.payload) !== JSON.stringify(op.payload)) throw new Error("Operation ID is associated with a different request")
    await tx.done
    return existing
  }
  const count = await tx.store.count()
  if (count >= MAX_QUEUE_LENGTH) {
    throw new Error(`Outbox queue limit reached (max ${MAX_QUEUE_LENGTH} operations)`)
  }

  const entity_id = op.entity_id || (op.payload?.id as string) || (op.type === "INSERT" ? client_op_id : undefined)
  if (isOfflineCleanupInProgress() || epoch !== getOfflineCleanupEpoch()) throw new Error("Private storage cleanup interrupted this request")

  const operation: OutboxOperation = {
    client_op_id,
    entity_id,
    owner_user_id: owner_user_id || null,
    next_attempt_at: 0,
    table: op.table,
    type: op.type,
    payload: op.payload,
    created_at: new Date().toISOString(),
    attempts: 0,
    status: "pending",
  }

  if (!owner_user_id) operation.last_error = "UNOWNED_LEGACY: recreate this request after signing in; it will not be sent automatically"
  await tx.store.put(operation)
  await tx.done
  notifyOutboxUpdated()
  return operation
}

/**
 * List all operations pending synchronization
 */
export async function listPending(owner: string | null = getOfflineSyncOwner(), dueOnly = false, now = Date.now()): Promise<OutboxOperation[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex("outbox", "by-status", "pending")
  return all.filter(op => (op.owner_user_id ?? null) === owner && (!dueOnly || (op.next_attempt_at ?? 0) <= now)).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

/**
 * List all operations (pending, sent, failed) for UI inspection
 */
export async function listAll(owner: string | null = getOfflineSyncOwner()): Promise<OutboxOperation[]> {
  const db = await getDB()
  const all = await db.getAll("outbox")
  return all.filter(op => (op.owner_user_id ?? null) === owner).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getQuarantinedCount(): Promise<number> { return (await listAll(null)).length }

export async function hasOwnedPendingOperations(): Promise<boolean> {
  const db = await getDB()
  return (await db.getAllFromIndex("outbox", "by-status", "pending")).some(op => !!op.owner_user_id)
}

export async function getNextRetryAt(owner: string): Promise<number | null> {
  const pending = await listPending(owner)
  return pending.length ? Math.min(...pending.map(op => op.next_attempt_at ?? 0)) : null
}

/**
 * Mark operations as successfully sent
 */
export async function markSent(client_op_ids: string[], owner: string | null = getOfflineSyncOwner()): Promise<void> {
  const db = await getDB()
  const tx = db.transaction("outbox", "readwrite")
  for (const id of client_op_ids) {
    const item = await tx.store.get(id)
    if (item && (item.owner_user_id ?? null) === owner) {
      item.status = "sent"
      await tx.store.put(item)
    }
  }
  await tx.done
}

/**
 * Permanently delete operations that were successfully accepted or recognized as duplicate by the server
 * (Audit C4: Client deletes only ok/duplicate ops)
 */
export async function deleteOps(client_op_ids: string[], owner: string | null = getOfflineSyncOwner()): Promise<void> {
  const db = await getDB()
  const tx = db.transaction("outbox", "readwrite")
  for (const id of client_op_ids) {
    const item = await tx.store.get(id)
    if (item && (item.owner_user_id ?? null) === owner) await tx.store.delete(id)
  }
  await tx.done
}

/**
 * Get aggregate counts of pending, failed, and total operations
 */
export async function getOutboxStats(): Promise<{ pending: number; failed: number; total: number }> {
  try {
    const all = await listAll()
    const pending = all.filter((op) => op.status === "pending").length
    const failed = all.filter((op) => op.status === "failed").length
    return { pending, failed, total: all.length }
  } catch {
    return { pending: 0, failed: 0, total: 0 }
  }
}

/**
 * Record an attempt failure, marking as failed if max attempts reached
 */
export async function markFailed(client_op_id: string, error: string, owner: string | null = getOfflineSyncOwner(), minimumDelayMs = 0): Promise<void> {
  const db = await getDB()
  const item = await db.get("outbox", client_op_id)
  if (!item || (item.owner_user_id ?? null) !== owner) return

  item.next_attempt_at = Date.now() + Math.max(minimumDelayMs, calculateBackoff(item.attempts))
  item.attempts += 1
  item.last_error = error
  if (item.attempts >= MAX_ATTEMPTS) {
    item.status = "failed"
  }
  await db.put("outbox", item)
}

/**
 * User-initiated retry for a failed operation
 */
export async function retryOp(client_op_id: string): Promise<void> {
  const db = await getDB()
  const item = await db.get("outbox", client_op_id)
  if (!item || (item.owner_user_id ?? null) !== getOfflineSyncOwner()) return

  item.status = "pending"
  item.attempts = 0
  item.next_attempt_at = 0
  item.last_error = undefined
  await db.put("outbox", item)
}

/**
 * User-initiated discard for a failed operation
 */
export async function discardOp(client_op_id: string): Promise<void> {
  await deleteOps([client_op_id])
}

/**
 * Purge completed operations from the outbox
 */
export async function purgeSent(): Promise<number> {
  const db = await getDB()
  const sentItems = (await listAll()).filter(op => op.status === "sent")
  const tx = db.transaction("outbox", "readwrite")
  for (const item of sentItems) {
    await tx.store.delete(item.client_op_id)
  }
  await tx.done
  return sentItems.length
}

/**
 * One-time migration: transfers legacy localStorage rhcp_offline_operations into IndexedDB outbox
 */
export async function migrateLegacyLocalStorage(): Promise<number> {
  if (typeof window === "undefined") return 0

  try {
    const raw = localStorage.getItem("rhcp_offline_operations")
    if (!raw) return 0

    const legacyOps: any[] = JSON.parse(raw)
    if (!Array.isArray(legacyOps) || legacyOps.length === 0) {
      localStorage.removeItem("rhcp_offline_operations")
      return 0
    }

    let migrated = 0
    for (const legacy of legacyOps) {
      if (legacy.synced) continue
      const validTable: OutboxTable = [
        "appointments",
        "health_data",
        "medical_records",
        "notifications",
      ].includes(legacy.table)
        ? legacy.table
        : "medical_records"

      const validOpType: OutboxOpType = ["INSERT", "UPDATE", "DELETE"].includes(legacy.type)
        ? legacy.type
        : "INSERT"

      await enqueue({
        table: validTable,
        type: validOpType,
        payload: legacy.data || {},
        client_op_id: crypto.randomUUID(),
        owner_user_id: null,
      })
      migrated++
    }

    localStorage.removeItem("rhcp_offline_operations")
    console.log(`[Outbox] Migrated ${migrated} legacy offline operations into IndexedDB`)
    return migrated
  } catch (err) {
    console.warn("[Outbox] Migration error:", err)
    return 0
  }
}
