"use client"

import { useState, useEffect, useCallback } from "react"
import { cacheData, getCachedData, saveOfflineOperation } from "../offline/storage"
import { isOnline } from "../offline/sync"

interface UseOfflineDataOptions {
  fetchFn: () => Promise<any>
  table: string
  key: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useOfflineData({ fetchFn, table, key, onSuccess, onError }: UseOfflineDataOptions) {
  const [data, setData] = useState<any[]>([])   // ✅ FIXED
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        if (isOnline()) {
          const result = await fetchFn()
          setData(result || [])   // ✅ safety
          cacheData(key, result)
          setError(null)
          onSuccess?.(result)
        } else {
          const cached = getCachedData(key)
          if (cached) {
            setData(cached)
            setError(null)
          } else {
            setError(new Error("No data available offline"))
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        setError(error)

        const cached = getCachedData(key)
        if (cached) {
          setData(cached)
        }

        onError?.(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [fetchFn, table, key, onSuccess, onError])

  const createOffline = useCallback(
    (operation: any) => {
      const op = saveOfflineOperation({
        table,
        type: "INSERT",
        data: operation,
      })
      if (op) {
        setData((prev) => [...prev, op.data])   // ✅ safe now
      }
    },
    [table],
  )

  const updateOffline = useCallback(
    (id: string, updates: any) => {
      saveOfflineOperation({
        table,
        type: "UPDATE",
        data: { id, ...updates },
      })

      setData((prev) =>
        prev.map((item: any) =>
          item.id === id ? { ...item, ...updates } : item
        )
      )
    },
    [table],
  )

  const deleteOffline = useCallback(
    (id: string) => {
      saveOfflineOperation({
        table,
        type: "DELETE",
        data: { id },
      })

      // ✅ FIX ADDED
      setData((prev) => prev.filter((item: any) => item.id !== id))
    },
    [table],
  )

  return { data, loading, error, createOffline, updateOffline, deleteOffline }
}
