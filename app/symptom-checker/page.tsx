"use client"
import { useApp } from "@/components/providers/AppProvider"
import { SymptomChecker } from "@/components/SymptomChecker"

export default function Page() {
  const { language } = useApp()
  return <SymptomChecker language={language} />
}
