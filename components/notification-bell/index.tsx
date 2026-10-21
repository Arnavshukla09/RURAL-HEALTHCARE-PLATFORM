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

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, Loader2 } from "lucide-react"
import {
  getLocalNotifications,
  markLocalNotificationRead,
  markAllLocalNotificationsRead,
  AppNotification,
} from "@/lib/notifications/notification-engine"
import type { NotificationBellProps, NotificationTab } from "./types"
import { NotificationTabs } from "./parts/NotificationTabs"
import { NotificationItem } from "./parts/NotificationItem"

export function NotificationBell({ user, language }: NotificationBellProps) {
  const router = useRouter()
  const en = language === "en"
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeTab, setActiveTab] = useState<NotificationTab>("all")
  const panelRef = useRef<HTMLDivElement>(null)

  const latestCreatedAtRef = useRef<string | null>(null)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const backoffDelayRef = useRef<number>(60000)

  const mergeWithLocal = (serverNotifs: any[] = []) => {
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
  }

  const fetchNotifications = async (isInitial = false) => {
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
  }

  const pollNewNotifications = async () => {
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
        const newNotifs = Array.isArray(json) ? json : json.data ?? []
        if (newNotifs.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n: any) => n.id))
            const fresh = newNotifs.filter((n: any) => !existingIds.has(n.id))
            return [...fresh, ...prev]
          })
          if (newNotifs[0].created_at) {
            latestCreatedAtRef.current = newNotifs[0].created_at
          }
        }
        backoffDelayRef.current = 60000
      } else {
        backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 300000)
      }
    } catch {
      backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 300000)
    }
  }

  useEffect(() => {
    const handleNewNotification = (e: CustomEvent<AppNotification>) => {
      const notif = e.detail
      if (!notif) return
      if (user?.role === "doctor" && notif.title?.includes("Appointment Confirmed")) return
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev
        return [notif, ...prev]
      })
    }

    const handleNotificationRead = (e: CustomEvent<{ id: string }>) => {
      const { id } = e.detail || {}
      if (!id) return
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    }

    const handleNotificationReadAll = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }

    window.addEventListener("ruralhealth:notification" as any, handleNewNotification)
    window.addEventListener("ruralhealth:notification_read" as any, handleNotificationRead)
    window.addEventListener("ruralhealth:notification_read_all" as any, handleNotificationReadAll)

    return () => {
      window.removeEventListener("ruralhealth:notification" as any, handleNewNotification)
      window.removeEventListener("ruralhealth:notification_read" as any, handleNotificationRead)
      window.removeEventListener("ruralhealth:notification_read_all" as any, handleNotificationReadAll)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(true)

    if (user) {
      const scheduleNextPoll = () => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
        pollTimerRef.current = setTimeout(async () => {
          if (typeof document !== "undefined" && document.visibilityState === "visible") {
            await pollNewNotifications()
          }
          scheduleNextPoll()
        }, backoffDelayRef.current)
      }

      scheduleNextPoll()

      const handleFocusOrVisible = () => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          pollNewNotifications()
          scheduleNextPoll()
        }
      }

      window.addEventListener("focus", handleFocusOrVisible)
      document.addEventListener("visibilitychange", handleFocusOrVisible)

      return () => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
        window.removeEventListener("focus", handleFocusOrVisible)
        document.removeEventListener("visibilitychange", handleFocusOrVisible)
      }
    }
  }, [user])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
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
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">
                {en ? "Notifications" : "सूचनाएं"}
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                >
                  {en ? "Mark all read" : "सभी पढ़े"}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-0.5" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <NotificationTabs activeTab={activeTab} setActiveTab={setActiveTab} totalCount={notifications.length} en={en} />

          <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">
                  {en ? "No notifications in this tab" : "इस टैब में कोई सूचना नहीं"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  en={en}
                  onClick={handleNotificationClick}
                />
              ))
            )}

            {nextCursor && user && (
              <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={handleLoadMoreNotifs}
                  disabled={loadingMore}
                  className="w-full py-1.5 text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center justify-center gap-1"
                >
                  {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {en ? "Load more" : "और देखें"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
