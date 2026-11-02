"use client"

import dynamic from "next/dynamic"
import { useApp } from "@/components/providers/AppProvider"

const MapView = dynamic(
  () => import("@/components/MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-sm text-gray-500 animate-pulse">Loading healthcare facility map...</p>
      </div>
    ),
  }
)

export function LocationsClient() {
  const { language } = useApp()
  return <MapView language={language} userLocation={null} camps={[]} />
}
