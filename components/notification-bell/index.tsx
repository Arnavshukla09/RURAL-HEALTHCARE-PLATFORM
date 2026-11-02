"use client"

/**
 * components/notification-bell/index.tsx
 *
 * Modularized NotificationBell component for Rural Healthcare Platform.
 * Supports adaptive polling with backoff, offline local fallback, multi-tab categorization,
 * and mark-as-read sync across server and local engines.
 *
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Notification Subsystem
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import {
  getLocalNotifications,
  markLocalNotificationRead,
  markAllLocalNotificationsRead,
  AppNotification,
} from "@/lib/notifications/notification-engine"
import type { NotificationBellProps, NotificationTab } from "./types"
import { NotificationPanel } from "./parts/NotificationPanel"

export function NotificationBell({ user, language }: NotificationBellProps) {
  const router = useRouter()
  const en = language === "en"
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeTab, setActiveTab] = useState<NotificationTab>("all")
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const latestCreatedAtRef = useRef<string | null>(null)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const backoffDelayRef = useRef<number>(60000)

  const mergeWithLocal = useCallback((serverNotifs: any[] = []) => {
    const local = getLocalNotifications(user?.id, user?.role)
    const map = new Map<string, any>()
    serverNotifs.forEach((n) => map.set(n.id, n))
    local.forEach((n) => {
      if (!map.has(n.id)) {
        map.set(n.id, n)
      }
    })
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [user?.id, user?.role])

  const fetchNotifications = useCallback(async (isInitial = false) => {
    if (!user) {
      setNotifications(getLocalNotifications(user?.id, user?.role))
      return
    }

    if (isInitial) setLoading(true)
    try {
      const res = await fetch("/api/notifications?limit=20")
      if (res.ok) {
        const json = await res.json()
        const notifs = Array.isArray(json) ? json : json.data ?? []
        const merged = mergeWithLocal(notifs)
        setNotifications(merged)
        setNextCursor(json.nextCursor || null)
        if (merged.length > 0 && merged[0].created_at) {
          latestCreatedAtRef.current = merged[0].created_at
        } else {
          latestCreatedAtRef.current = new Date().toISOString()
        }
        backoffDelayRef.current = 60000
      } else {
        setNotifications(getLocalNotifications(user?.id, user?.role))
        backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 300000)
      }
    } catch {
      setNotifications(getLocalNotifications(user?.id, user?.role))
      backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 300000)
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [user, mergeWithLocal])

  const pollNewNotifications = useCallback(async () => {
    if (!user || typeof document === "undefined" || document.visibilityState !== "visible") {
      return
    }
    const sinceParam = latestCreatedAtRef.current
    if (!sinceParam) {
      await fetchNotifications(false)
      return
    }
    try {
      const res = await fetch(
        `/api/notifications?since=${encodeURIComponent(sinceParam)}&limit=20`
      )
      if (res.ok) {
        const json = await res.json()
        const notifs = Array.isArray(json) ? json : json.data ?? []
        if (notifs.length > 0) {
          setNotifications((prev) => {
            const merged = mergeWithLocal([...notifs, ...prev])
            return merged
          })
          if (notifs[0]?.created_at) {
            latestCreatedAtRef.current = notifs[0].created_at
          }
        }
        backoffDelayRef.current = 60000
      } else {
        backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 300000)
      }
    } catch {
      backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 300000)
    }
  }, [user, fetchNotifications, mergeWithLocal])

  useEffect(() => {
    fetchNotifications(true)
    const scheduleNextPoll = () => {
      pollTimerRef.current = setTimeout(async () => {
        await pollNewNotifications()
        scheduleNextPoll()
      }, backoffDelayRef.current)
    }
    scheduleNextPoll()
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        backoffDelayRef.current = 60000
        pollNewNotifications()
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [fetchNotifications, pollNewNotifications])

  useEffect(() => {
    const handleSync = () => setNotifications((prev) => mergeWithLocal(prev))
    window.addEventListener("rhcp_notification_sync", handleSync)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "rhcp_local_notifications") setNotifications((prev) => mergeWithLocal(prev))
    }
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("rhcp_notification_sync", handleSync)
      window.removeEventListener("storage", onStorage)
    }
  }, [mergeWithLocal])

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel("rhcp_notifications")
      bc.onmessage = (event) => {
        if (event.data?.type === "NEW_NOTIFICATION" && event.data?.notification) {
          const n = event.data.notification
          setNotifications((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]))
        }
      }
    } catch {}
    return () => {
      try { bc?.close() } catch {}
    }
  }, [])

  useEffect(() => {
    if (user?.id) fetchNotifications(false)
  }, [user?.id, fetchNotifications])

  useEffect(() => {
    const h = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (target?.closest?.("[data-notification-panel]")) return
      if (panelRef.current && !panelRef.current.contains(target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    document.addEventListener("touchstart", h)
    return () => {
      document.removeEventListener("mousedown", h)
      document.removeEventListener("touchstart", h)
    }
  }, [])

  const handleLoadMoreNotifs = async () => {
    if (!nextCursor || loadingMore || !user) return
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/notifications?cursor=${encodeURIComponent(nextCursor)}&limit=20`
      )
      if (res.ok) {
        const json = await res.json()
        const notifs = Array.isArray(json) ? json : json.data ?? []
        setNotifications((prev) => [...prev, ...notifs])
        setNextCursor(json.nextCursor || null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMore(false)
    }
  }

  const markAllRead = async () => {
    markAllLocalNotificationsRead()
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length > 0 && user) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: unreadIds, is_read: true }),
        })
      } catch (e) {
        console.error("Failed to mark notifications as read on server:", e)
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const handleNotificationClick = async (notif: AppNotification) => {
    markLocalNotificationRead(notif.id)
    if (user && !notif.is_read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notif.id], is_read: true }),
        })
      } catch {}
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    )

    if (notif.action_url) {
      setOpen(false)
      const target = user?.role === "doctor" && notif.action_url === "/records" ? "/doctor/patients" : notif.action_url
      router.push(target)
    }
  }

  const handleOpen = () => {
    setOpen(!open)
    if (!open) {
      fetchNotifications(false)
    }
  }

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications
    if (activeTab === "appointments") {
      return notifications.filter(
        (n) =>
          n.action_url?.includes("appointment") ||
          n.action_url?.includes("consultation") ||
          n.title.toLowerCase().includes("appointment") ||
          n.title.toLowerCase().includes("consultation") ||
          n.title.toLowerCase().includes("अपॉइंटमेंट") ||
          n.title.toLowerCase().includes("परामर्श")
      )
    }
    if (activeTab === "alerts") {
      return notifications.filter(
        (n) =>
          n.type === "emergency" ||
          n.type === "warning" ||
          n.action_url?.includes("emergency") ||
          n.title.toLowerCase().includes("sos") ||
          n.title.toLowerCase().includes("emergency")
      )
    }
    return notifications
  }, [notifications, activeTab])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length
  }, [notifications])

  const isDarkNav = user?.role === "doctor" || user?.role === "admin"

  const renderPanel = (isMobilePortal: boolean) => (
    <NotificationPanel
      isMobilePortal={isMobilePortal}
      en={en}
      unreadCount={unreadCount}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      totalCount={notifications.length}
      filteredNotifications={filteredNotifications}
      loading={loading}
      loadingMore={loadingMore}
      nextCursor={nextCursor}
      user={user}
      markAllRead={markAllRead}
      onClose={() => setOpen(false)}
      onLoadMore={handleLoadMoreNotifs}
      onNotificationClick={handleNotificationClick}
    />
  )

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-lg transition-colors ${
          isDarkNav
            ? "hover:bg-white/10 text-yellow-300"
            : "hover:bg-teal-50 text-gray-600 hover:text-teal-700"
        }`}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 drop-shadow-xs" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {renderPanel(false)}
          {mounted &&
            createPortal(
              <div className="md:hidden">
                <div
                  className="fixed inset-0 bg-black/40 z-[90] backdrop-blur-xs"
                  onClick={() => setOpen(false)}
                  aria-hidden="true"
                />
                {renderPanel(true)}
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  )
}

export default NotificationBell
