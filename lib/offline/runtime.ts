let ownerUserId: string | null = null
let cleanupInProgress = false
let cleanupEpoch = 0
export const PRIVATE_CLEANUP_MARKER = "rhcp_private_cleanup_pending"

/** Persisted without patient information so reloads cannot outrun a late worker erasure. */
export function isClientCleanupPending(): boolean {
  try { return typeof localStorage !== "undefined" && localStorage.getItem(PRIVATE_CLEANUP_MARKER) === "1" }
  catch { return false }
}

/** Set only from the authenticated profile lifecycle; legacy requests are never adopted. */
export function setOfflineSyncOwner(userId: string | null): void {
  ownerUserId = typeof userId === "string" && userId.trim() ? userId.trim() : null
  notifyOutboxUpdated()
}

export function getOfflineSyncOwner(): string | null { return ownerUserId }

export function isOfflineCleanupInProgress(): boolean { return cleanupInProgress || isClientCleanupPending() }
export function getOfflineCleanupEpoch(): number { return cleanupEpoch }
export function beginOfflineCleanup(): void {
  cleanupEpoch++
  cleanupInProgress = true
  try { if (typeof localStorage !== "undefined") localStorage.setItem(PRIVATE_CLEANUP_MARKER, "1") } catch {}
  setOfflineSyncOwner(null)
}
export function finishOfflineCleanup(): void {
  try { if (typeof localStorage !== "undefined") localStorage.removeItem(PRIVATE_CLEANUP_MARKER) } catch {}
  cleanupInProgress = false
  notifyOutboxUpdated()
}

export function calculateBackoff(attempts: number): number {
  return Math.round(Math.min(30000, 1000 * 2 ** Math.max(0, attempts)) + Math.random() * 1000)
}

export function notifyOutboxUpdated(): void {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") window.dispatchEvent(new CustomEvent("rhcp:outbox-updated"))
}
