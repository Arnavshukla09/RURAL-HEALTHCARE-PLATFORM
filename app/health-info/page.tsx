"use client"
import { useApp } from "@/components/providers/AppProvider"
import { HealthInfoHub } from "@/components/HealthInfoHub"

export default function Page() {
  const { language, symptomCheckResult } = useApp()
  return <HealthInfoHub language={language} symptomResult={symptomCheckResult} />
}
