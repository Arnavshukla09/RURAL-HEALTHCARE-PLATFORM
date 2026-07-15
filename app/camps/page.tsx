"use client"
import { useApp } from "@/components/providers/AppProvider"
import { CampLocations } from "@/components/CampLocations"

export default function Page() {
  const { language } = useApp()
  return <CampLocations language={language} />
}
