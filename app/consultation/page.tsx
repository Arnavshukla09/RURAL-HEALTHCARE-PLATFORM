"use client"
import { useApp } from "@/components/providers/AppProvider"
import { ConsultationPortal } from "@/components/ConsultationPortal"

export default function Page() {
  const { user, language, symptomCheckResult } = useApp()
  return <ConsultationPortal user={user} language={language} symptomResult={symptomCheckResult} />
}
