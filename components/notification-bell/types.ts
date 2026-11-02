/**
 * components/notification-bell/types.ts
 *
 * Types and metadata for NotificationBell.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Notification Subsystem
 */

import { Info, AlertTriangle, CheckCircle, LucideIcon } from "lucide-react"

export interface NotificationBellProps {
  user: any
  language: string
}

export type NotificationTab = "all" | "appointments" | "alerts"

export interface TypeMetaConfig {
  icon: LucideIcon
  bg: string
  border: string
  text: string
}

export const TYPE_META: Record<string, TypeMetaConfig> = {
  info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  warning: { icon: AlertTriangle, bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  success: { icon: CheckCircle, bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  emergency: { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
}
