"use client"

/**
 * components/notification-bell/parts/NotificationPanel.tsx
 *
 * Dedicated notification dropdown/modal panel container.
 * Supports dual presentation: desktop positioned popover or mobile viewport portal.
 *
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Notification Subsystem
 */

import { Bell, X, Loader2 } from "lucide-react"
import type { AppNotification } from "@/lib/notifications/notification-engine"
import type { NotificationTab } from "../types"
import { NotificationTabs } from "./NotificationTabs"
import { NotificationItem } from "./NotificationItem"

interface NotificationPanelProps {
  isMobilePortal: boolean
  en: boolean
  unreadCount: number
  activeTab: NotificationTab
  setActiveTab: (tab: NotificationTab) => void
  totalCount: number
  filteredNotifications: AppNotification[]
  loading: boolean
  loadingMore: boolean
  nextCursor: string | null
  user: any
  markAllRead: () => void
  onClose: () => void
  onLoadMore: () => void
  onNotificationClick: (notif: AppNotification) => void
}

export function NotificationPanel({
  isMobilePortal,
  en,
  unreadCount,
  activeTab,
  setActiveTab,
  totalCount,
  filteredNotifications,
  loading,
  loadingMore,
  nextCursor,
  user,
  markAllRead,
  onClose,
  onLoadMore,
  onNotificationClick,
}: NotificationPanelProps) {
  return (
    <div
      data-notification-panel="true"
      className={
        isMobilePortal
          ? "fixed top-16 inset-x-3 max-w-sm sm:max-w-md mx-auto max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden flex flex-col"
          : "hidden md:flex absolute top-full right-0 mt-2 w-96 max-h-[580px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex-col"
      }
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0">
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <NotificationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCount={totalCount}
        en={en}
      />

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
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
              onClick={onNotificationClick}
            />
          ))
        )}

        {nextCursor && user && (
          <div className="p-2 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={onLoadMore}
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
  )
}
