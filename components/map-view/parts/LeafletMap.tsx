"use client"

/**
 * components/map-view/parts/LeafletMap.tsx
 *
 * Strict Mode resilient Leaflet map wrapper and marker pin generator.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { useState, useRef, useEffect, ReactNode } from "react"
import { Map as NativeMap } from "leaflet"
import { createLeafletContext, LeafletProvider, type LeafletContextInterface } from "@react-leaflet/core"
import MapVoiceControls from "./MapVoiceControls"

// MapView is loaded through a client-only boundary; layers share one owned map.
export { TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet"

export function LeafletMap({ children, center, zoom }: { children: ReactNode; center: [number, number]; zoom: number }) {
  const host = useRef<HTMLDivElement>(null)
  const initialView = useRef({ center, zoom })
  const [context, setContext] = useState<LeafletContextInterface | null>(null)
  const [latitude, longitude] = center
  useEffect(() => {
    if (!host.current) return
    // Own creation and removal in the same effect. Strict Mode may replay the
    // effect, but the previous instance is removed before another is created.
    const map = new NativeMap(host.current, { zoomControl: false }).setView(initialView.current.center, initialView.current.zoom)
    setContext(createLeafletContext(map))
    const resize = () => map.invalidateSize()
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
    observer?.observe(host.current)
    window.addEventListener("resize", resize)
    return () => { observer?.disconnect(); window.removeEventListener("resize", resize); map.remove() }
  }, [])
  useEffect(() => { context?.map.setView([latitude, longitude], zoom) }, [context, latitude, longitude, zoom])
  return <div ref={host} className="h-full w-full" style={{ height: "100%", width: "100%" }}>
    {context && <LeafletProvider value={context}>{children}<MapVoiceControls center={center}/></LeafletProvider>}
  </div>
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
