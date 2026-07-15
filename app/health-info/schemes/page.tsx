"use client"
import { useApp } from "@/components/providers/AppProvider"
import { GovernmentSchemes } from "@/components/GovernmentSchemes"

export default function Page() {
  const { language, loading } = useApp()
  if (loading) return null
  return <GovernmentSchemes language={language} />
}
