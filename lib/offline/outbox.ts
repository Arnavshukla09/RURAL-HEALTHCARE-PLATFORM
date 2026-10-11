import { openDB, type DBSchema, type IDBPDatabase } from "idb"

export type OutboxTable = "appointments" | "health_data" | "medical_records" | "notifications"
export type OutboxOpType = "INSERT" | "UPDATE" | "DELETE"
export type OutboxStatus = "pending" | "sent" | "failed"

export interface OutboxOperation {
  client_op_id: string // UUID v4
  table: OutboxTable
  type: OutboxOpType
  payload: Record<string, any>
  created_at: string
  attempts: number
  status: OutboxStatus
  last_error?: string
}

interface OutboxDBSchema extends DBSchema {
  outbox: {
    key: string
    value: OutboxOperation
    indexes: {
      "by-status": OutboxStatus
      "by-created": string
    }
  }
}

const DB_NAME = "rhcp_offline_db"
const DB_VERSION = 1
const MAX_QUEUE_LENGTH = 500
const MAX_ATTEMPTS = 5

let dbPromise: Promise<IDBPDatabase<OutboxDBSchema>> | null = null

function getDB(): Promise<IDBPDatabase<OutboxDBSchema>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in browser"))
  }
  if (!dbPromise) {
    dbPromise = openDB<OutboxDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("outbox")) {
          const store = db.createObjectStore("outbox", { keyPath: "client_op_id" })
          store.createIndex("by-status", "status")
          store.createIndex("by-created", "created_at")
        }
      },
    })
  }
  return dbPromise
}

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
 * Enqueue a new operation to the IndexedDB outbox
 */
export async function enqueue(op: {
  table: OutboxTable
  type: OutboxOpType
  payload: Record<string, any>
  client_op_id?: string
}): Promise<OutboxOperation> {
  const db = await getDB()

  // Cap check
  const count = await db.count("outbox")
  if (count >= MAX_QUEUE_LENGTH) {
    throw new Error(`Outbox queue limit reached (max ${MAX_QUEUE_LENGTH} operations)`)
  }

  const client_op_id = op.client_op_id || crypto.randomUUID()
  const operation: OutboxOperation = {
    client_op_id,
    table: op.table,
    type: op.type,
    payload: op.payload,
    created_at: new Date().toISOString(),
    attempts: 0,
    status: "pending",
  }

  await db.put("outbox", operation)
  return operation
}

/**
 * List all operations pending synchronization
 */
export async function listPending(): Promise<OutboxOperation[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex("outbox", "by-status", "pending")
  return all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

/**
 * List all operations (pending, sent, failed) for UI inspection
 */
export async function listAll(): Promise<OutboxOperation[]> {
  const db = await getDB()
  const all = await db.getAll("outbox")
  return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/**
 * Mark operations as successfully sent
 */
export async function markSent(client_op_ids: string[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction("outbox", "readwrite")
  for (const id of client_op_ids) {
    const item = await tx.store.get(id)
    if (item) {
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
export async function deleteOps(client_op_ids: string[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction("outbox", "readwrite")
  for (const id of client_op_ids) {
    await tx.store.delete(id)
  }
  await tx.done
}

/**
 * Get aggregate counts of pending, failed, and total operations
 */
export async function getOutboxStats(): Promise<{ pending: number; failed: number; total: number }> {
  try {
    const db = await getDB()
    const all = await db.getAll("outbox")
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
export async function markFailed(client_op_id: string, error: string): Promise<void> {
  const db = await getDB()
  const item = await db.get("outbox", client_op_id)
  if (!item) return

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
  if (!item) return

  item.status = "pending"
  item.attempts = 0
  item.last_error = undefined
  await db.put("outbox", item)
}

/**
 * User-initiated discard for a failed operation
 */
export async function discardOp(client_op_id: string): Promise<void> {
  const db = await getDB()
  await db.delete("outbox", client_op_id)
}

/**
 * Purge completed operations from the outbox
 */
export async function purgeSent(): Promise<number> {
  const db = await getDB()
  const sentItems = await db.getAllFromIndex("outbox", "by-status", "sent")
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
