"use client"
import { useApp } from "@/components/providers/AppProvider"
import { AppointmentManager } from "@/components/AppointmentManager"

export default function Page() {
  const { user, language } = useApp()
  return <AppointmentManager user={user} language={language} setJitsiRoom={() => {}} />
}
