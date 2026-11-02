"use client"

/**
 * components/map-view/parts/LeafletMap.tsx
 *
 * Strict Mode resilient Leaflet map wrapper and marker pin generator.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { useState, useRef, useEffect, ReactNode } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

export const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false })
export const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false })
export const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false })
export const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false })
export const Circle = dynamic(() => import("react-leaflet").then((m) => m.Circle), { ssr: false })
export const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false })

export function LeafletMap({
  children,
  center,
  zoom,
}: {
  children: ReactNode
  center: [number, number]
  zoom: number
}) {
  const [ready, setReady] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) {
      setMapKey((k) => k + 1)
    } else {
      mountedRef.current = true
    }
    const id = requestAnimationFrame(() => setReady(true))
    return () => {
      cancelAnimationFrame(id)
      setReady(false)
    }
  }, [])

  if (!ready) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      key={`map-${mapKey}-${center[0].toFixed(4)}-${center[1].toFixed(4)}`}
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      {children}
    </MapContainer>
  )
}

export function makeIcon(color: string, isTop10: boolean, isUser = false) {
  if (typeof window === "undefined") return undefined
  try {
    const L = require("leaflet")
    if (isUser) {
      return L.divIcon({
        className: "",
        html: `
          <div style="position:relative; width:36px; height:36px; display:flex; justify-content:center; align-items:flex-end; cursor: grab;">
            <div style="position:absolute; top:-22px; background:#1d4ed8; color:white; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:bold; white-space:nowrap; pointer-events:none; box-shadow:0 2px 4px rgba(0,0,0,0.3); border: 1.5px solid white; z-index:50;">
              📍 You Are Here
            </div>
            <div style="
              width:24px; height:24px; background:#1d4ed8; border-radius:50% 50% 50% 0;
              transform:rotate(-45deg); border:3px solid white;
              box-shadow: 0 4px 8px rgba(29, 78, 216, 0.5);
              position:relative;
            ">
              <div style="position:absolute; top:4px; left:4px; width:10px; height:10px; background:white; border-radius:50%;"></div>
            </div>
          </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })
    }
    const size = isTop10 ? 28 : 20
    const ring = isTop10
      ? `<div style="
          position:absolute; inset:-4px; border-radius:50%;
          border:2.5px solid #f59e0b;
          animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
          opacity:0.75;
        "></div>
        <div style="
          position:absolute; top:-12px; left:50%; transform:translateX(-50%);
          background:#f59e0b; color:white; font-size:8px; font-weight:900;
          padding:0 3px; border-radius:4px; line-height:12px; white-space:nowrap;
        ">TOP</div>`
      : ""

    return L.divIcon({
      className: "",
      html: `
        <div style="position:relative; width:${size}px; height:${size}px;">
          ${ring}
          <div style="
            width:${size}px; height:${size}px;
            background:${color};
            border-radius:50%;
            border:2.5px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          "></div>
        </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  } catch {
    return undefined
  }
}
