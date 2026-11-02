"use client"

import { useState, useEffect, useCallback } from "react"
import {
  listAll,
  retryOp,
  discardOp,
  checkStorageQuota,
  type OutboxOperation,
} from "@/lib/offline/outbox"
import { syncOfflineData, isOnline, setupOfflineSync } from "@/lib/offline/sync"
import {
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Trash2,
  HardDrive,
} from "lucide-react"

interface OfflineSyncBadgeProps {
  language: string
  role?: string
}

export function OfflineSyncBadge({ language, role }: OfflineSyncBadgeProps) {
  const en = language === "en"
  const [items, setItems] = useState<OutboxOperation[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [online, setOnline] = useState(true)
  const [quota, setQuota] = useState<{ percent: number; warning: boolean; usage: number; quota: number }>({
    percent: 0,
    warning: false,
    usage: 0,
    quota: 0,
  })

  const refreshState = useCallback(async () => {
    try {
      const all = await listAll()
      setItems(all)
      const q = await checkStorageQuota()
      setQuota(q)
      setOnline(isOnline())
    } catch {
      // In SSR or non-IDB environments
    }
  }, [])

  useEffect(() => {
    refreshState()
    const cleanup = setupOfflineSync()

    const onUpdate = () => refreshState()
    const onOnline = () => {
      setOnline(true)
      refreshState()
    }
    const onOffline = () => {
      setOnline(false)
      refreshState()
    }

    window.addEventListener("rhcp:outbox-updated", onUpdate)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    return () => {
      cleanup()
      window.removeEventListener("rhcp:outbox-updated", onUpdate)
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [refreshState])

  const pendingCount = items.filter((i) => i.status === "pending").length
  const failedCount = items.filter((i) => i.status === "failed").length
  const totalWaiting = pendingCount + failedCount

  if (totalWaiting === 0 && online) {
    return null
  }

  const handleManualSync = async () => {
    setSyncing(true)
    try {
      await syncOfflineData()
      await refreshState()
    } finally {
      setSyncing(false)
    }
  }

  const handleRetry = async (client_op_id: string) => {
    await retryOp(client_op_id)
    await refreshState()
    if (online) {
      handleManualSync()
    }
  }

  const handleDiscard = async (client_op_id: string) => {
    await discardOp(client_op_id)
    await refreshState()
  }

  return (
    <>
      {/* Header Pill / Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all shadow-sm ${
          failedCount > 0
            ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
            : !online
            ? "bg-amber-500 text-white hover:bg-amber-600"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        title={
          en
            ? `${totalWaiting} offline changes waiting to sync`
            : `${totalWaiting} ऑफ़लाइन परिवर्तन सिंक हेतु प्रतीक्षारत`
        }
      >
        {!online ? (
          <CloudOff className="h-3.5 w-3.5" />
        ) : (
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
        )}
        <span>
          {failedCount > 0
            ? `${failedCount} ${en ? "failed" : "विफल"}`
            : `${totalWaiting} ${en ? "waiting" : "प्रतीक्षारत"}`}
        </span>
      </button>

      {/* Outbox Queue Inspector Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <div className="flex items-center gap-2">
                <RefreshCw className={`h-5 w-5 text-teal-600 ${syncing ? "animate-spin" : ""}`} />
                <h3 className="font-semibold text-gray-900 text-base">
                  {en ? "Offline Sync Queue" : "ऑफ़लाइन सिंक कतार"}
                </h3>
                <span className="text-xs bg-teal-100 text-teal-800 font-medium px-2 py-0.5 rounded-full">
                  {totalWaiting} {en ? "items" : "मद"}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Storage Quota Warning (Audit §2.4) */}
            {quota.warning && (
              <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <HardDrive className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">
                    {en ? "Storage Space Low (>80% used)" : "संग्रहण स्थान कम है (>80% प्रयुक्त)"}
                  </p>
                  <p className="text-amber-700 mt-0.5">
                    {en
                      ? "Old sent items will be cleaned up. Consider syncing soon to avoid storage eviction."
                      : "पुरानी भेजी गई मदें साफ की जाएंगी। संग्रहण सीमा से बचने हेतु शीघ्र सिंक करें।"}
                  </p>
                </div>
              </div>
            )}

            {/* Operations List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-2" />
                  <p className="text-sm">
                    {en ? "All offline actions are in sync" : "सभी ऑफ़लाइन क्रियाएं सिंक हो चुकी हैं"}
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.client_op_id}
                    className={`p-3.5 rounded-xl border transition-all text-xs ${
                      item.status === "failed"
                        ? "border-red-200 bg-red-50/50"
                        : item.status === "sent"
                        ? "border-green-200 bg-green-50/30"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {item.type}
                        </span>
                        <span className="font-medium text-gray-800">{item.table}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : item.status === "sent"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.status === "failed"
                            ? en
                              ? "Failed"
                              : "विफल"
                            : item.status === "sent"
                            ? en
                              ? "Synced"
                              : "सिंक किया"
                            : en
                            ? "Waiting"
                            : "प्रतीक्षारत"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-gray-500 flex items-center justify-between text-[11px]">
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                      <span>
                        {en ? `Attempts: ${item.attempts}/5` : `प्रयास: ${item.attempts}/5`}
                      </span>
                    </div>

                    {item.last_error && (
                      <div className="mt-2 text-red-600 bg-red-100/60 p-2 rounded-lg flex items-start gap-1.5 text-[11px]">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span className="break-all">{item.last_error}</span>
                      </div>
                    )}

                    {item.status === "failed" && (
                      <div className="mt-2.5 flex items-center justify-end gap-2 pt-2 border-t border-red-200/50">
                        <button
                          onClick={() => handleDiscard(item.client_op_id)}
                          className="px-2.5 py-1 text-gray-600 hover:text-red-700 font-medium flex items-center gap-1 rounded hover:bg-red-100/40 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          {en ? "Discard" : "हटाएं"}
                        </button>
                        <button
                          onClick={() => handleRetry(item.client_op_id)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" />
                          {en ? "Retry" : "पुनः प्रयास"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <span className="text-xs text-gray-500">
                {!online
                  ? en
                    ? "Network offline: queued for sync"
                    : "नेटवर्क ऑफ़लाइन: कतार में सुरक्षित"
                  : en
                  ? "Connected: auto-sync active"
                  : "कनेक्टेड: स्वतः सिंक सक्रिय"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {en ? "Close" : "बंद करें"}
                </button>
                {online && totalWaiting > 0 && (
                  <button
                    onClick={handleManualSync}
                    disabled={syncing}
                    className="px-3.5 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                    {syncing
                      ? en
                        ? "Syncing..."
                        : "सिंक हो रहा है..."
                      : en
                      ? "Sync Now"
                      : "अभी सिंक करें"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
