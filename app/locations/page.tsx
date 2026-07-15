"use client"
import { useApp } from "@/components/providers/AppProvider"
import { MapView } from "@/components/MapView"

export default function Page() {
  const { language } = useApp()
  return <MapView language={language} userLocation={null} camps={[]} />
}
