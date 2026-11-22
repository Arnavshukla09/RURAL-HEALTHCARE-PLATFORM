"use client"
import { Button } from "@/components/ui/button"
import { MEDIA_LABELS } from "@/lib/assistant/media-control-catalog"
import { resolveAssistantLanguage } from "@/lib/assistant/languages"

export function MeetingControls({ language, onCommand, audioMuted, videoMuted }: { language: string; onCommand: (command: string) => void; audioMuted: boolean | null; videoMuted: boolean | null }) {
  const labels = MEDIA_LABELS[resolveAssistantLanguage(language)]
  return <div className="notranslate flex flex-wrap gap-2 py-2" translate="no">
    <Button data-voice-control="ui.e11ca77cc94ba14e" type="button" aria-pressed={audioMuted === false} onClick={() => onCommand("toggleAudio")}>{labels[0]}</Button>
    <Button data-voice-control="ui.6c267fe90208ccb5" type="button" aria-pressed={videoMuted === false} onClick={() => onCommand("toggleVideo")}>{labels[1]}</Button>
    <Button data-voice-control="ui.b77405404fa375c1" type="button" onClick={() => onCommand("toggleChat")}>{labels[2]}</Button>
    <Button data-voice-control="ui.977bba067f927635" type="button" onClick={() => onCommand("toggleRaiseHand")}>{labels[3]}</Button>
    <Button data-voice-control="ui.dd970638ca2af0c3" type="button" onClick={() => onCommand("toggleTileView")}>{labels[4]}</Button>
    <Button data-voice-control="ui.179dbaf08ecb1d31" type="button" onClick={() => onCommand("hangup")}>{labels[5]}</Button>
    <Button data-voice-control="ui.a019fabf3e58266c" type="button" data-voice-handoff="true" onClick={() => onCommand("toggleShareScreen")}>{labels[6]}</Button>
    <Button data-voice-control="ui.bd3bb0cf4d0809ee" type="button" data-voice-handoff="true" onClick={() => onCommand("toggleFullScreen")}>{labels[7]}</Button>
  </div>
}
