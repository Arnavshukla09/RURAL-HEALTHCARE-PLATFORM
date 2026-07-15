"use client"
import { useApp } from "@/components/providers/AppProvider"
import { EmergencyModule } from "@/components/EmergencyModule"

export default function Page() {
  const { language } = useApp()
  return <EmergencyModule language={language} />
}
