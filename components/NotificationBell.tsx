"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Info, AlertTriangle, CheckCircle, Megaphone, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface NotificationBellProps {
  user: any
  language: string
}

const TYPE_META: Record<string, { icon: any; bg: string; border: string }> = {
  info:      { icon: Info,           bg: "bg-blue-50",   border: "border-blue-200" },
  warning:   { icon: AlertTriangle,  bg: "bg-orange-50", border: "border-orange-200" },
  success:   { icon: CheckCircle,    bg: "bg-green-50",  border: "border-green-200" },
  emergency: { icon: AlertTriangle,  bg: "bg-red-50",    border: "border-red-200" },
}

export function NotificationBell({ user, language }: NotificationBellProps) {
  const en = language === "en"
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    fetchNotifications()
    // Real-time: subscribe to new notifications
    const supabase = createClient()
    const channel = supabase
      .channel("notifications-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, payload => {
        const n = payload.new as any
        const myId = user.patientId
        const myRole = user.role
        // Show if broadcast, role-match, or individual match
        if (n.recipient_type === "all"
          || (n.recipient_type === "role" && n.recipient_role === myRole)
          || (n.recipient_type === "individual" && n.recipient_id === myId)) {
          setNotifications(prev => [n, ...prev])
          setUnread(prev => prev + 1)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30)
      const notifs = data ?? []
      setNotifications(notifs)
      setUnread(notifs.filter((n: any) => !n.is_read).length)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const markAllRead = async () => {
    const supabase = createClient()
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  const handleOpen = () => {
    setOpen(!open)
    if (!open) { fetchNotifications(); markAllRead() }
  }

  if (!user) return null

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notifications">
        <Bell className="h-5 w-5 text-white" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">{en ? "Notifications" : "सूचनाएं"}</h3>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">{unread}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.is_read) && (
                <button onClick={markAllRead} className="text-xs text-teal-600 hover:text-teal-800">
                  {en ? "Mark all read" : "सभी पढ़े"}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">{en ? "No notifications yet" : "अभी कोई सूचना नहीं"}</p>
              </div>
            ) : notifications.map(n => {
              const meta = TYPE_META[n.type] || TYPE_META.info
              const Icon = meta.icon
              const timeStr = n.created_at
                ? new Date(n.created_at).toLocaleString(en ? "en-IN" : "hi-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                : ""
              return (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? "bg-blue-50/40" : ""} hover:bg-gray-50 transition-colors`}>
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.bg} border ${meta.border}`}>
                      <Icon className="h-3.5 w-3.5 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium text-gray-900 leading-tight ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</p>
                        {!n.is_read && <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeStr}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
