"use client"
import { useMap } from "react-leaflet"
import { Button } from "@/components/ui/button"
import { useApp } from "@/components/providers/AppProvider"
import { MAP_LABELS } from "@/lib/assistant/map-labels"
import { MEDIA_LABELS } from "@/lib/assistant/media-control-catalog"
import { resolveAssistantLanguage } from "@/lib/assistant/languages"
import { useEffect, useRef } from "react"
import { DomEvent } from "leaflet"

/** Supported Leaflet instance API; no third-party DOM selection. */
export default function MapVoiceControls({ center }: { center: [number, number] }) {
  const map = useMap()
  const controls = useRef<HTMLDivElement>(null)
  useEffect(() => { if (controls.current) { DomEvent.disableClickPropagation(controls.current); DomEvent.disableScrollPropagation(controls.current) } }, [])
  const { language } = useApp()
  const labels = MEDIA_LABELS[resolveAssistantLanguage(language)]
  const mapLabels = MAP_LABELS[resolveAssistantLanguage(language)]
  const button = "h-11 w-11 rounded-lg border border-gray-200 bg-white p-0 text-lg text-gray-800 shadow-none hover:bg-blue-50"
  return <div ref={controls} role="group" aria-label={mapLabels[0]} data-testid="map-navigation-controls" className="pointer-events-none absolute inset-0" style={{ zIndex: 1000 }}>
    <div className="leaflet-top leaflet-left m-2 grid gap-1 rounded-xl border bg-white/95 p-1 shadow-sm" style={{ pointerEvents: "auto" }}>
      <Button data-voice-control="ui.50cea3883c320ca8" className={button} type="button" aria-label={labels[8]} onClick={event => { event.stopPropagation(); map.zoomIn() }}>+</Button>
      <Button data-voice-control="ui.c638d6dfc806ae51" className={button} type="button" aria-label={labels[9]} onClick={event => { event.stopPropagation(); map.zoomOut() }}>−</Button>
    </div>
    <div className="leaflet-bottom leaflet-right m-2 grid grid-cols-3 gap-1 rounded-xl border bg-white/95 p-1 shadow-sm" style={{ pointerEvents: "auto" }}>
      <Button data-voice-control="ui.40f28443773b41e8" className={`${button} col-start-2`} type="button" aria-label={mapLabels[1]} onClick={event => { event.stopPropagation(); map.panBy([0, -150]) }}>↑</Button>
      <Button data-voice-control="ui.697afaffef7df3d7" className={`${button} col-start-1 row-start-2`} type="button" aria-label={labels[10]} onClick={event => { event.stopPropagation(); map.panBy([-150, 0]) }}>←</Button>
      <Button data-voice-control="ui.97b4f5295aa0efcb" className={`${button} col-start-2 row-start-2`} type="button" aria-label={mapLabels[3]} onClick={event => { event.stopPropagation(); map.panTo(center) }}>◎</Button>
      <Button data-voice-control="ui.ad00eabeb8adf6fe" className={`${button} col-start-3 row-start-2`} type="button" aria-label={labels[11]} onClick={event => { event.stopPropagation(); map.panBy([150, 0]) }}>→</Button>
      <Button data-voice-control="ui.4c159d49da03fc98" className={`${button} col-start-2 row-start-3`} type="button" aria-label={mapLabels[2]} onClick={event => { event.stopPropagation(); map.panBy([0, 150]) }}>↓</Button>
    </div>
  </div>
}
