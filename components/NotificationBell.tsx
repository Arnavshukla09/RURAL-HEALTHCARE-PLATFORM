"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, Info, AlertTriangle, CheckCircle, Loader2, Calendar, ShieldAlert, ArrowRight } from "lucide-react"
import {
  getLocalNotifications,
  markLocalNotificationRead,
  markAllLocalNotificationsRead,
  AppNotification
} from "@/lib/notifications/notification-engine"

interface NotificationBellProps {
  user: any
  language: string
}

const TYPE_META: Record<string, { icon: any; bg: string; border: string; text: string }> = {
  info:      { icon: Info,           bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700" },
  warning:   { icon: AlertTriangle,  bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  success:   { icon: CheckCircle,    bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700" },
  emergency: { icon: AlertTriangle,  bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700" },
}

export function NotificationBell({ user, language }: NotificationBellProps) {
  const router = useRouter()
  const en = language === "en"
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "appointments" | "alerts">("all")
  const panelRef = useRef<HTMLDivElement>(null)

  const latestCreatedAtRef = useRef<string | null>(null)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const backoffDelayRef = useRef<number>(60000)

  // Load and merge local notifications
  const mergeWithLocal = (serverNotifs: any[] = []) => {
    const local = getLocalNotifications()
    const map = new Map<string, any>()
    
    // Server notifications first
    serverNotifs.forEach(n => map.set(n.id, n))
    // Local notifications merged
    local.forEach(n => {
      if (!map.has(n.id)) {
        map.set(n.id, n)
      }
    })

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return combined
  }

  const fetchNotifications = async (isInitial = false) => {
    if (!user) {
      // Offline / guest mode: load strictly from local storage
      const local = getLocalNotifications()
      setNotifications(local)
      return
    }

    if (isInitial) setLoading(true)
    try {
      const res = await fetch("/api/notifications?limit=20")
      if (res.ok) {
        const json = await res.json()
        const notifs = Array.isArray(json) ? json : (json.data ?? [])
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
        // Fallback to local
        setNotifications(getLocalNotifications())
        backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 300000)
      }
    } catch {
      setNotifications(getLocalNotifications())
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
      const res = await fetch(`/api/notifications?since=${encodeURIComponent(sinceParam)}&limit=20`)
      if (res.ok) {
        const json = await res.json()
        const newNotifs = Array.isArray(json) ? json : (json.data ?? [])
        if (newNotifs.length > 0) {
          setNotifications(prev => {
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

  // Subscribe to real-time custom notification events from notification engine
  useEffect(() => {
    const handleNewNotification = (e: CustomEvent<AppNotification>) => {
      const notif = e.detail
      if (!notif) return
      setNotifications(prev => {
        if (prev.some(n => n.id === notif.id)) return prev
        return [notif, ...prev]
      })
    }

    const handleNotificationRead = (e: CustomEvent<{ id: string }>) => {
      const { id } = e.detail || {}
      if (!id) return
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    }

    const handleNotificationReadAll = () => {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
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

  // Initial fetch and polling schedule
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

  // Close on outside click
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
      const res = await fetch(`/api/notifications?cursor=${encodeURIComponent(nextCursor)}&limit=20`)
      if (res.ok) {
        const json = await res.json()
        const notifs = Array.isArray(json) ? json : (json.data ?? [])
        setNotifications(prev => [...prev, ...notifs])
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
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
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
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleNotificationClick = async (notif: AppNotification) => {
    // Mark as read
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
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))

    // Navigate to action URL if present
    if (notif.action_url) {
      setOpen(false)
      router.push(notif.action_url)
    }
  }

  const handleOpen = () => {
    setOpen(!open)
    if (!open) {
      fetchNotifications(false)
    }
  }

  // Filtered list based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications
    if (activeTab === "appointments") {
      return notifications.filter(n =>
        n.action_url?.includes("appointment") ||
        n.action_url?.includes("consultation") ||
        n.title.toLowerCase().includes("appointment") ||
        n.title.toLowerCase().includes("consultation") ||
        n.title.toLowerCase().includes("अपॉइंटमेंट") ||
        n.title.toLowerCase().includes("परामर्श")
      )
    }
    if (activeTab === "alerts") {
      return notifications.filter(n =>
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
    return notifications.filter(n => !n.is_read).length
  }, [notifications])

  const isDarkNav = user?.role === "doctor" || user?.role === "admin"

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
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

      {/* Panel */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">{en ? "Notifications" : "सूचनाएं"}</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-semibold text-teal-600 hover:text-teal-800">
                  {en ? "Mark all read" : "सभी पढ़े"}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/40 px-3 py-1.5 gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === "all" ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {en ? "All" : "सभी"} ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeTab === "appointments" ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>{en ? "Appointments" : "अपॉइंटमेंट"}</span>
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeTab === "alerts" ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ShieldAlert className="h-3 w-3" />
              <span>{en ? "Alerts" : "अलर्ट"}</span>
            </button>
          </div>

          {/* List */}
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
              filteredNotifications.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.info
                const Icon = meta.icon
                const timeStr = n.created_at
                  ? new Date(n.created_at).toLocaleString(en ? "en-IN" : "hi-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      !n.is_read ? "bg-blue-50/50 hover:bg-blue-50/80" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${meta.bg} border ${meta.border}`}>
                        <Icon className={`h-4 w-4 ${meta.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs sm:text-sm text-gray-900 leading-tight truncate ${!n.is_read ? "font-bold" : "font-medium"}`}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="h-2 w-2 bg-blue-600 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-400">
                          <span>{timeStr}</span>
                          {n.action_url && (
                            <span className="text-teal-600 font-semibold hover:underline flex items-center gap-0.5">
                              <span>{en ? "View Details" : "विवरण देखें"}</span>
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
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
