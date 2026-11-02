"use client"

import { useApp } from "@/components/providers/AppProvider"
import { EmergencyModule } from "@/components/EmergencyModule"

export function EmergencyClient() {
  const { language } = useApp()
  return <EmergencyModule language={language} />
}
