"use client"

/**
 * components/notification-bell/parts/NotificationTabs.tsx
 *
 * Category filter tabs for notifications (All, Appointments, Alerts).
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Notification Subsystem
 */

import { Calendar, ShieldAlert } from "lucide-react"
import type { NotificationTab } from "../types"

interface NotificationTabsProps {
  activeTab: NotificationTab
  setActiveTab: (tab: NotificationTab) => void
  totalCount: number
  en: boolean
}

export function NotificationTabs({
  activeTab,
  setActiveTab,
  totalCount,
  en,
}: NotificationTabsProps) {
  return (
    <div className="flex border-b border-gray-100 bg-gray-50/40 px-3 py-1.5 gap-1.5 text-xs">
      <button data-voice-control="ui.df1b990275b3d5fb"
        onClick={() => setActiveTab("all")}
        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
          activeTab === "all"
            ? "bg-teal-600 text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {en ? "All" : "सभी"} ({totalCount})
      </button>
      <button data-voice-control="ui.80a86e57911b8c0b"
        onClick={() => setActiveTab("appointments")}
        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
          activeTab === "appointments"
            ? "bg-teal-600 text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <Calendar className="h-3 w-3" />
        <span>{en ? "Appointments" : "अपॉइंटमेंट"}</span>
      </button>
      <button data-voice-control="ui.dbf16f98fa000dc6"
        onClick={() => setActiveTab("alerts")}
        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
          activeTab === "alerts"
            ? "bg-teal-600 text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <ShieldAlert className="h-3 w-3" />
        <span>{en ? "Alerts" : "अलर्ट"}</span>
      </button>
    </div>
  )
}
