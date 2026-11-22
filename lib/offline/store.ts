import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { OutboxOperation, OutboxStatus } from "./outbox"

export const OUTBOX_DB_NAME = "rhcp_offline_db"
interface OutboxDBSchema extends DBSchema {
  outbox: {
    key: string
    value: OutboxOperation
    indexes: { "by-status": OutboxStatus; "by-created": string; "by-owner": string; "by-next-attempt": number }
  }
}
let dbPromise: Promise<IDBPDatabase<OutboxDBSchema>> | null = null

/** Shared by the page and service worker. */
export function getOutboxDB(): Promise<IDBPDatabase<OutboxDBSchema>> {
  if (typeof indexedDB === "undefined" && typeof window === "undefined" && typeof self === "undefined") return Promise.reject(new Error("IndexedDB is unavailable"))
  if (!dbPromise) {
    dbPromise = openDB<OutboxDBSchema>(OUTBOX_DB_NAME, 2, {
      upgrade(db, _old, _next, transaction) {
        const store = db.objectStoreNames.contains("outbox") ? transaction.objectStore("outbox") : db.createObjectStore("outbox", { keyPath: "client_op_id" })
        if (!store.indexNames.contains("by-status")) store.createIndex("by-status", "status")
        if (!store.indexNames.contains("by-created")) store.createIndex("by-created", "created_at")
        if (!store.indexNames.contains("by-owner")) store.createIndex("by-owner", "owner_user_id")
        if (!store.indexNames.contains("by-next-attempt")) store.createIndex("by-next-attempt", "next_attempt_at")
      },
      blocking() { void closeOutboxStore() },
      terminated() { dbPromise = null },
    })
    dbPromise.catch(() => { dbPromise = null })
  }
  return dbPromise
}

export async function closeOutboxStore(): Promise<void> {
  const pending = dbPromise
  dbPromise = null
  if (pending) (await pending).close()
}
