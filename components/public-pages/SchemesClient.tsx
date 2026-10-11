"use client"

import { useApp } from "@/components/providers/AppProvider"
import { GovernmentSchemes } from "@/components/GovernmentSchemes"

export function SchemesClient() {
  const { language } = useApp()
  return <GovernmentSchemes language={language} />
}
