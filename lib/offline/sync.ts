import { getUnsyncedOperations, markOperationAsSynced, clearSyncedOperations } from "./storage"

export async function syncOfflineData() {
  const unsyncedOps = getUnsyncedOperations()

  if (unsyncedOps.length === 0) {
    return { success: true, synced: 0 }
  }

  try {
    const response = await fetch("/api/offline-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operations: unsyncedOps }),
    })

    if (!response.ok) {
      throw new Error("Sync failed")
    }

    const result = await response.json()

    // Mark synced operations
    unsyncedOps.forEach((op) => {
      markOperationAsSynced(op.id)
    })

    clearSyncedOperations()

    return { success: true, synced: result.synced }
  } catch (error) {
    console.error("Offline sync error:", error)
    return { success: false, synced: 0, error }
  }
}

export function setupOfflineSync() {
  // Sync when connection is restored
  window.addEventListener("online", () => {
    console.log("[v0] Connection restored, syncing offline data...")
    syncOfflineData()
  })

  // Periodic sync check
  const syncInterval = setInterval(() => {
    if (navigator.onLine) {
      syncOfflineData()
    }
  }, 30000) // Every 30 seconds

  return () => clearInterval(syncInterval)
}

export function isOnline(): boolean {
  return navigator.onLine
}
