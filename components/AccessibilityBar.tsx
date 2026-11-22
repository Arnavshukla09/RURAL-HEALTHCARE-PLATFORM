"use client"
import { Accessibility, ChevronUp, Contrast, Type, Volume2, VolumeX } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { useApp } from "./providers/AppProvider"
import { CONTROL_PROMPTS } from "@/lib/assistant/control-catalog"
import { resolveAssistantLanguage } from "@/lib/assistant/languages"
import { useAccessibility, setAccessibility, requestAudioStop, requestPageReading } from "@/lib/assistant/accessibility"

export function AccessibilityBar() {
  const { language } = useApp()
  const state = useAccessibility()
  const t = CONTROL_PROMPTS[resolveAssistantLanguage(language)]
  return <div className="notranslate" translate="no" data-testid="accessibility-toolbar">
    <Button data-voice-control="ui.5e657ef31f4d5b07" className="fixed bottom-20 left-4 z-[60] h-12 w-12 rounded-full bg-purple-700 p-0 shadow-lg md:bottom-6" aria-label={t.accessibility} aria-expanded={state.open} onClick={() => setAccessibility({ open: !state.open })}><Accessibility className="h-5 w-5"/></Button>
    {state.open && <Card className="fixed bottom-36 left-4 z-[60] max-h-[60dvh] w-72 overflow-auto border-2 border-purple-200 shadow-xl md:bottom-20"><CardContent className="space-y-4 p-4">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{t.accessibility}</h3><Button data-voice-control="ui.a5f9c09110aa5540" variant="ghost" aria-label={t.back} onClick={() => setAccessibility({ open: false })}><ChevronUp/></Button></div>
      <div className="flex items-center justify-between"><span className="flex gap-2 text-sm"><Type size={18}/>{t.fontSize}</span><output data-testid="accessibility-font-size">{state.fontSize}px</output></div>
      <div className="flex gap-2"><Button data-voice-control="ui.01b20ed72eea17d5" variant="outline" className="min-h-11 flex-1" disabled={state.fontSize <= 12} onClick={() => setAccessibility({ fontSize: state.fontSize - 2 })}>{t.decreaseFont}</Button><Button data-voice-control="ui.6616468571682297" variant="outline" className="min-h-11 flex-1" disabled={state.fontSize >= 24} onClick={() => setAccessibility({ fontSize: state.fontSize + 2 })}>{t.increaseFont}</Button></div>
      <Button data-voice-control="ui.6f0808e8adb11d66" variant="outline" className="min-h-11 w-full" aria-pressed={state.highContrast} onClick={() => setAccessibility({ highContrast: !state.highContrast })}><Contrast size={18}/>{state.highContrast ? t.contrastOff : t.contrastOn}</Button>
      <Button data-voice-control="ui.14df208a3de96489" variant="outline" className="min-h-11 w-full" onClick={requestPageReading}><Volume2 size={18}/>{t.readPage}</Button>
      <Button data-voice-control="ui.cf6ec693b2cd441d" variant="outline" className="min-h-11 w-full" onClick={requestAudioStop}><VolumeX size={18}/>{t.stopReading}</Button>
      <Button data-voice-control="ui.89b79bd04184b5ca" variant="secondary" className="min-h-11 w-full" onClick={() => { requestAudioStop(); setAccessibility({ fontSize: 16, highContrast: false, rate: 0.85 }) }}>{t.resetAccessibility}</Button>
    </CardContent></Card>}
  </div>
}
