"use client"

import { useApp } from "@/components/providers/AppProvider"
import { CampLocations } from "@/components/CampLocations"

export function CampsClient() {
  const { language } = useApp()
  return <CampLocations language={language} />
}
