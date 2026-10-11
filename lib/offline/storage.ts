// Local storage & key-value cache utilities for offline functionality
// Bridged with IndexedDB outbox (lib/offline/outbox.ts) for persistent guaranteed synchronization
import { enqueue, type OutboxTable, type OutboxOpType } from "./outbox"

export interface OfflineOperation {
  id: string
  table: string
  type: "INSERT" | "UPDATE" | "DELETE"
  data: any
  timestamp: number
  synced: boolean
}

const OPERATIONS_KEY = "rhcp_offline_operations"
const CACHE_KEY = "rhcp_cache"

/**
 * Save an operation to the offline queue.
 * Bridges seamlessly to IndexedDB outbox.
 */
export function saveOfflineOperation(operation: {
  table: string
  type: "INSERT" | "UPDATE" | "DELETE"
  data: any
}) {
  const validTable: OutboxTable = [
    "appointments",
    "health_data",
    "medical_records",
    "notifications",
  ].includes(operation.table)
    ? (operation.table as OutboxTable)
    : "medical_records"

  const validOpType: OutboxOpType = ["INSERT", "UPDATE", "DELETE"].includes(operation.type)
    ? (operation.type as OutboxOpType)
    : "INSERT"

  const opId = crypto.randomUUID()

  // Asynchronously enqueue to IndexedDB outbox
  enqueue({
    client_op_id: opId,
    table: validTable,
    type: validOpType,
    payload: operation.data || {},
  })
    .then(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("rhcp:outbox-updated"))
      }
    })
    .catch((err) => {
      console.warn("[storage] Outbox enqueue error:", err)
    })

  return {
    id: opId,
    table: validTable,
    type: validOpType,
    data: operation.data,
    timestamp: Date.now(),
    synced: false,
  }
}

export function getOfflineOperations(): OfflineOperation[] {
  try {
    const data = localStorage.getItem(OPERATIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Failed to get offline operations:", error)
    return []
  }
}

export function getUnsyncedOperations(): OfflineOperation[] {
  const operations = getOfflineOperations()
  return operations.filter((op) => !op.synced)
}

export function markOperationAsSynced(operationId: string) {
  try {
    const operations = getOfflineOperations()
    const updated = operations.map((op) => (op.id === operationId ? { ...op, synced: true } : op))
    localStorage.setItem(OPERATIONS_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Failed to mark operation as synced:", error)
  }
}

export function clearSyncedOperations() {
  try {
    const operations = getOfflineOperations()
    const remaining = operations.filter((op) => !op.synced)
    localStorage.setItem(OPERATIONS_KEY, JSON.stringify(remaining))
  } catch (error) {
    console.error("Failed to clear synced operations:", error)
  }
}

export function cacheData(key: string, data: any) {
  try {
    const cache = getCacheData()
    cache[key] = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error("Failed to cache data:", error)
  }
}

export function getCachedData(key: string) {
  try {
    const cache = getCacheData()
    return cache[key]?.data || null
  } catch (error) {
    console.error("Failed to get cached data:", error)
    return null
  }
}

function getCacheData(): Record<string, { data: any; timestamp: number }> {
  try {
    const data = localStorage.getItem(CACHE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error("Failed to get cache data:", error)
    return {}
  }
}

export function clearOldCache(maxAgeMs = 24 * 60 * 60 * 1000) {
  try {
    const cache = getCacheData()
    const now = Date.now()
    const cleaned = Object.entries(cache).reduce(
      (acc, [key, value]) => {
        if (now - value.timestamp < maxAgeMs) {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, { data: any; timestamp: number }>,
    )
    localStorage.setItem(CACHE_KEY, JSON.stringify(cleaned))
  } catch (error) {
    console.error("Failed to clear old cache:", error)
  }
}
