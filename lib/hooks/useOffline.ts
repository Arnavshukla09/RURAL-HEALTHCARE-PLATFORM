"use client"

import { useState, useEffect } from "react"
import { isOnline, syncOfflineData } from "../offline/sync"

export function useOffline() {
  const [online, setOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Set initial state
    setOnline(isOnline())

    // Listen for online/offline events
    const handleOnline = () => {
      setOnline(true)
      setSyncing(true)
      syncOfflineData().finally(() => setSyncing(false))
    }

    const handleOffline = () => {
      setOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const manualSync = async () => {
    setSyncing(true)
    try {
      await syncOfflineData()
    } finally {
      setSyncing(false)
    }
  }

  return { online, syncing, manualSync }
}
