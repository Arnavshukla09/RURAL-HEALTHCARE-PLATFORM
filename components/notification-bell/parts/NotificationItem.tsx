"use client"

/**
 * components/notification-bell/parts/NotificationItem.tsx
 *
 * Notification row item display with type icons, timestamp, and unread marker.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Notification Subsystem
 */

import { ArrowRight } from "lucide-react"
import type { AppNotification } from "@/lib/notifications/notification-engine"
import { TYPE_META } from "../types"

interface NotificationItemProps {
  notification: AppNotification
  en: boolean
  onClick: (notif: AppNotification) => void
}

export function NotificationItem({
  notification: n,
  en,
  onClick,
}: NotificationItemProps) {
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
      onClick={() => onClick(n)}
      className={`px-4 py-3 cursor-pointer transition-colors ${
        !n.is_read ? "bg-blue-50/50 hover:bg-blue-50/80" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${meta.bg} border ${meta.border}`}
        >
          <Icon className={`h-4 w-4 ${meta.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-xs sm:text-sm text-gray-900 leading-tight truncate ${
                !n.is_read ? "font-bold" : "font-medium"
              }`}
            >
              {n.title}
            </p>
            {!n.is_read && (
              <span className="h-2 w-2 bg-blue-600 rounded-full shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
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
}
