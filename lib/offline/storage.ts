// Local storage utilities for offline functionality
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

export function saveOfflineOperation(operation: Omit<OfflineOperation, "id" | "timestamp" | "synced">) {
  try {
    const operations = getOfflineOperations()
    const newOperation: OfflineOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      synced: false,
    }
    operations.push(newOperation)
    localStorage.setItem(OPERATIONS_KEY, JSON.stringify(operations))
    return newOperation
  } catch (error) {
    console.error("Failed to save offline operation:", error)
    return null
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
