"use client"
import { useMap } from "react-leaflet"
import { Button } from "@/components/ui/button"
import { useApp } from "@/components/providers/AppProvider"
import { getAssistantPrompt } from "@/lib/assistant/prompts"
import { MEDIA_LABELS } from "@/lib/assistant/media-control-catalog"
import { resolveAssistantLanguage } from "@/lib/assistant/languages"

/** Supported Leaflet instance API; no third-party DOM selection. */
export default function MapVoiceControls({ center }: { center: [number, number] }) {
  const map = useMap()
  const { language } = useApp()
  const labels = MEDIA_LABELS[resolveAssistantLanguage(language)]
  return <div className="leaflet-top leaflet-right pointer-events-auto flex gap-1 p-2" style={{ zIndex: 1000 }}>
    <Button data-voice-control="ui.50cea3883c320ca8" type="button" aria-label={labels[8]} onClick={() => map.zoomIn()}>+</Button>
    <Button data-voice-control="ui.c638d6dfc806ae51" type="button" aria-label={labels[9]} onClick={() => map.zoomOut()}>−</Button>
    <Button data-voice-control="ui.97b4f5295aa0efcb" type="button" aria-label={getAssistantPrompt(language, "gps")} onClick={() => map.panTo(center)}>◎</Button>
    <Button data-voice-control="ui.40f28443773b41e8" type="button" aria-label={getAssistantPrompt(language, "scrollUp")} onClick={() => map.panBy([0, -150])}>↑</Button>
    <Button data-voice-control="ui.4c159d49da03fc98" type="button" aria-label={getAssistantPrompt(language, "scrollDown")} onClick={() => map.panBy([0, 150])}>↓</Button>
    <Button data-voice-control="ui.697afaffef7df3d7" type="button" aria-label={labels[10]} onClick={() => map.panBy([-150, 0])}>←</Button>
    <Button data-voice-control="ui.ad00eabeb8adf6fe" type="button" aria-label={labels[11]} onClick={() => map.panBy([150, 0])}>→</Button>
  </div>
}
