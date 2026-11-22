import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ operations: new Map<string, any>() }))
vi.mock("idb", () => ({ openDB: vi.fn(async () => ({
  close: vi.fn(), count: async () => state.operations.size,
  get: async (_store: string, id: string) => state.operations.get(id),
  getAll: async () => [...state.operations.values()],
  getAllFromIndex: async (_store: string, _index: string, status: string) => [...state.operations.values()].filter(op => op.status === status),
  put: async (_store: string, op: any) => state.operations.set(op.client_op_id, { ...op }),
  transaction: () => ({ store: {
    get: async (id: string) => state.operations.get(id), count: async () => state.operations.size,
    put: async (op: any) => state.operations.set(op.client_op_id, { ...op }), delete: async (id: string) => state.operations.delete(id),
  }, done: Promise.resolve() }),
})) }))

import * as outbox from "@/lib/offline/outbox"
import { executeOfflineSync } from "@/lib/offline/executor"
import { closeOutboxStore } from "@/lib/offline/store"
import { setOfflineSyncOwner, finishOfflineCleanup, isOfflineCleanupInProgress, PRIVATE_CLEANUP_MARKER, isClientCleanupPending } from "@/lib/offline/runtime"
import * as privateStorage from "@/lib/offline/private-storage"
import { clearPrivateStorage } from "@/lib/offline/private-storage"
import { wipeClientCachesOnSignOut, requestWorkerPrivateCleanup } from "@/lib/offline/cache-cleaner"

const ALICE = "11111111-1111-4111-8111-111111111111"
const BOB = "22222222-2222-4222-8222-222222222222"
const operation = (owner = ALICE, id?: string) => outbox.enqueue({ owner_user_id: owner, client_op_id: id, table: "medical_records", type: "INSERT", payload: { record_type: "other", content: "Private review fixture" } })
const json = (data: any, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })

describe("Account-owned offline queue and worker executor", () => {
  beforeEach(async () => {
    vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); state.operations.clear()
    await closeOutboxStore()
    vi.stubGlobal("window", { dispatchEvent: vi.fn() })
    vi.stubGlobal("navigator", { onLine: true })
    finishOfflineCleanup()
    setOfflineSyncOwner(ALICE)
  })

  it("keeps another account and unowned legacy data outside the active account queue", async () => {
    await operation(ALICE); await operation(BOB)
    await outbox.enqueue({ table: "health_data", type: "INSERT", payload: { value: 72 }, owner_user_id: null })
    expect(await outbox.listPending(ALICE)).toHaveLength(1)
    setOfflineSyncOwner(BOB)
    expect(await outbox.listAll()).toHaveLength(1)
    expect((await outbox.listAll())[0].owner_user_id).toBe(BOB)
    expect(await outbox.getQuarantinedCount()).toBe(1)
  })

  it("deduplicates the same request but refuses to replace it with a different account or payload", async () => {
    const first = await operation(ALICE)
    expect(await operation(ALICE, first.client_op_id)).toEqual(first)
    await expect(operation(BOB, first.client_op_id)).rejects.toThrow("different request")
    expect(state.operations.size).toBe(1)
  })

  it("captures the initiating account before asynchronous storage work can observe an account switch", async () => {
    const pending = outbox.enqueue({ table: "health_data", type: "INSERT", payload: { value: 72 } })
    setOfflineSyncOwner(BOB)
    expect((await pending).owner_user_id).toBe(ALICE)
  })

  it("persists actual retry deadlines and excludes operations until their jittered backoff expires", async () => {
    const op = await operation()
    vi.spyOn(Date, "now").mockReturnValue(10000)
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    await outbox.markFailed(op.client_op_id, "Retryable", ALICE)
    expect(state.operations.get(op.client_op_id).next_attempt_at).toBe(11500)
    expect(await outbox.listPending(ALICE, true, 11499)).toHaveLength(0)
    expect(await outbox.listPending(ALICE, true, 11500)).toHaveLength(1)
  })

  it("replays through a service worker without window and resolves account identity from the server", async () => {
    const op = await operation(ALICE)
    await operation(BOB)
    vi.stubGlobal("window", undefined)
    vi.stubGlobal("indexedDB", {})
    setOfflineSyncOwner(null)
    const network = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/auth/profile") return json({ user: { id: ALICE } })
      const payload = JSON.parse(String(init?.body))
      expect(payload.owner_user_id).toBe(ALICE)
      expect(payload.operations.map((row: any) => row.client_op_id)).toEqual([op.client_op_id])
      return json({ owner_user_id: ALICE, results: [{ client_op_id: op.client_op_id, status: "ok" }] })
    })
    vi.stubGlobal("fetch", network)
    const report = await executeOfflineSync({ source: "background" })
    expect(report.error).toBeUndefined()
    expect(report).toMatchObject({ success: true, synced: 1 })
    expect(await outbox.listPending(BOB)).toHaveLength(1)
    expect(network).toHaveBeenCalledTimes(2)
  })

  it("mutation proof: even a broken queue-owner filter cannot send another account's operations", async () => {
    const foreign = await operation(BOB)
    vi.spyOn(outbox, "listPending").mockResolvedValue([foreign])
    const network = vi.fn()
    vi.stubGlobal("fetch", network)
    expect(await executeOfflineSync()).toMatchObject({ success: false, error: "Queue ownership validation failed" })
    expect(network).not.toHaveBeenCalled()
  })

  it("does not spend background network requests when the queue is empty or only contains unowned legacy data", async () => {
    await outbox.enqueue({ table: "health_data", type: "INSERT", payload: { value: 72 }, owner_user_id: null })
    const network = vi.fn()
    vi.stubGlobal("fetch", network)
    expect(await executeOfflineSync({ source: "background" })).toMatchObject({ success: true, synced: 0 })
    expect(network).not.toHaveBeenCalled()
  })

  it("runs logout cleanup once and blocks explicit-owner enqueue/replay until it completes", async () => {
    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    const erase = vi.spyOn(privateStorage, "erasePrivateDatabase").mockImplementation(async () => held)
    const first = wipeClientCachesOnSignOut()
    const second = wipeClientCachesOnSignOut()
    try {
      expect(first).toBe(second)
      expect(isOfflineCleanupInProgress()).toBe(true)
      await expect(operation(BOB)).rejects.toThrow("cleanup")
      expect(await executeOfflineSync({ ownerUserId: BOB })).toMatchObject({ success: false, error: "Private storage cleanup is in progress" })
    } finally { release(); await first }
    expect(erase).toHaveBeenCalledTimes(4)
    expect(isOfflineCleanupInProgress()).toBe(false)
    setOfflineSyncOwner(BOB)
    expect((await operation(BOB)).owner_user_id).toBe(BOB)
  })

  it("does not finish an old enqueue after cleanup begins during its asynchronous database open", async () => {
    vi.spyOn(privateStorage, "erasePrivateDatabase").mockResolvedValue()
    const pending = operation(ALICE)
    const cleaning = wipeClientCachesOnSignOut()
    await expect(pending).rejects.toThrow("cleanup interrupted")
    await cleaning
    expect(state.operations.size).toBe(0)
  })

  it("waits for the matching worker acknowledgment before permitting a new account's queue", async () => {
    let workerPort: any
    let requestId: string
    vi.stubGlobal("MessageChannel", class {
      port1: any = { onmessage: null, close: vi.fn() }
      port2: any = { close: vi.fn(), postMessage: (data: any) => queueMicrotask(() => this.port1.onmessage?.({ data })) }
    })
    const message = vi.fn((data: any, ports: any[]) => { workerPort = ports[0]; requestId = data.requestId })
    vi.stubGlobal("navigator", { onLine: true, serviceWorker: { controller: { postMessage: message } } })
    const erase = vi.spyOn(privateStorage, "erasePrivateDatabase").mockResolvedValue()
    const cleaning = wipeClientCachesOnSignOut()
    await vi.waitFor(() => expect(message).toHaveBeenCalledTimes(1))
    workerPort.postMessage({ type: "PRIVATE_CACHES_CLEARED", requestId: "old-request", success: true })
    await Promise.resolve()
    expect(isOfflineCleanupInProgress()).toBe(true)
    await expect(operation(BOB)).rejects.toThrow("cleanup")
    workerPort.postMessage({ type: "PRIVATE_CACHES_CLEARED", requestId: requestId!, success: true })
    await cleaning
    // Worker already erased the shared databases; no second late erasure is launched.
    expect(erase).not.toHaveBeenCalled()
    setOfflineSyncOwner(BOB)
    await operation(BOB)
    expect(state.operations.size).toBe(1)
  })

  it("fails closed for an unresponsive active worker instead of treating postMessage as completed cleanup", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("MessageChannel", class {
      port1: any = { onmessage: null, close: vi.fn() }
      port2: any = { close: vi.fn() }
    })
    vi.stubGlobal("navigator", { serviceWorker: { controller: { postMessage: vi.fn() } } })
    const response = requestWorkerPrivateCleanup(50)
    const rejection = expect(response).rejects.toThrow("did not acknowledge")
    await vi.advanceTimersByTimeAsync(50)
    await rejection
  })

  it("persists cleanup failure across reload checks and clears the marker only after a successful retry", async () => {
    const values = new Map<string, string>()
    const storage: Storage = { get length() { return values.size }, key: (index: number) => [...values.keys()][index], getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => { values.set(key, value) }, removeItem: (key: string) => { values.delete(key) }, clear: () => values.clear() }
    vi.stubGlobal("localStorage", storage)
    vi.spyOn(privateStorage, "erasePrivateDatabase").mockRejectedValue(new Error("Blocked fixture"))
    await expect(wipeClientCachesOnSignOut()).rejects.toThrow("could not complete")
    expect(storage.getItem(PRIVATE_CLEANUP_MARKER)).toBe("1")
    expect(isClientCleanupPending()).toBe(true)
    expect(privateStorage.isPrivateStorageKey(PRIVATE_CLEANUP_MARKER)).toBe(false)
    await expect(operation(BOB)).rejects.toThrow("cleanup")
    vi.mocked(privateStorage.erasePrivateDatabase).mockResolvedValue()
    await wipeClientCachesOnSignOut()
    expect(storage.getItem(PRIVATE_CLEANUP_MARKER)).toBeNull()
    expect(isClientCleanupPending()).toBe(false)
    expect(isOfflineCleanupInProgress()).toBe(false)
  })

  it("retains requests after malformed acknowledgments instead of silently dropping them", async () => {
    const op = await operation()
    vi.stubGlobal("fetch", vi.fn(async () => json({ owner_user_id: BOB, results: [{ client_op_id: op.client_op_id, status: "ok" }] })))
    expect(await executeOfflineSync()).toMatchObject({ success: false, failed: 1 })
    expect(state.operations.has(op.client_op_id)).toBe(true)
  })

  it("clears clinical/browser session keys while preserving public language and avatar preferences", () => {
    const data = new Map([
      ["rhcp_records_alice", "private record"], ["rhcp_patient_clinical_pretext", "clinical baseline"],
      ["rhcp_assistant_session", "private conversation"], ["rhcp_assistant_session_alice", "owned conversation"], ["ruralhealth_emergency_vault_v1", "profile"],
      ["rhcp_language", "hi"], ["rhcp_assistant_enabled", "true"],
    ])
    clearPrivateStorage({ length: data.size, key: (index: number) => [...data.keys()][index], getItem: (key: string) => data.get(key) || null, setItem: (key: string, value: string) => { data.set(key, value) }, clear: () => data.clear(), removeItem: (key: string) => { data.delete(key) } })
    expect([...data.keys()]).toEqual(["rhcp_language", "rhcp_assistant_enabled"])
  })
})
