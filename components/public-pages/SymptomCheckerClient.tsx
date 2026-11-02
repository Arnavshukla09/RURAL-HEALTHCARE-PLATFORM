"use client"

import { useApp } from "@/components/providers/AppProvider"
import { SymptomChecker } from "@/components/SymptomChecker"

export function SymptomCheckerClient() {
  const { language } = useApp()
  return <SymptomChecker language={language} />
}
