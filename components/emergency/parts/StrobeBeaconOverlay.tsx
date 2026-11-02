"use client"

/**
 * components/emergency/parts/StrobeBeaconOverlay.tsx
 *
 * Fullscreen flashing strobe beacon overlay with siren & flashlight hardware toggles.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { Button } from "@/components/ui/button"
import { Flashlight, Volume2, VolumeX, X } from "lucide-react"

interface StrobeBeaconOverlayProps {
  strobeLightOn: boolean
  sirenActive: boolean
  torchActive: boolean
  voiceLoopActiveState: boolean
  voiceAlertMessage: string
  onToggleSiren: () => void
  onToggleTorch: () => void
  onStopAllAlarms: () => void
  language: string
  t: any
}

export function StrobeBeaconOverlay({
  strobeLightOn,
  sirenActive,
  torchActive,
  voiceLoopActiveState,
  voiceAlertMessage,
  onToggleSiren,
  onToggleTorch,
  onStopAllAlarms,
  language,
  t,
}: StrobeBeaconOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center transition-colors duration-100 ${
        strobeLightOn ? "bg-red-600 text-white" : "bg-black text-yellow-300"
      }`}
    >
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-2">
          <Flashlight className="h-16 w-16 mx-auto animate-bounce text-yellow-300" />
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
            {t.beaconActive}
          </h2>
          <p className="text-xs sm:text-sm opacity-90 max-w-sm mx-auto">
            {language === "en"
              ? "Audio siren, flashlight, and voice announcement are active. Display is kept at maximum visibility."
              : "सायरन, फ्लैशलाइट और आवाज़ सक्रिय हैं। डिस्प्ले अधिकतम चमक पर चल रहा है।"}
          </p>
          {voiceLoopActiveState && (
            <p className="text-xs bg-black/40 text-yellow-300 p-2 rounded-lg font-mono italic">
              "{voiceAlertMessage}"
            </p>
          )}
        </div>

        {/* Hardware Toggles: Siren & Camera LED Flashlight */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onToggleSiren}
            className={`font-bold py-3 text-xs sm:text-sm rounded-xl ${
              sirenActive ? "bg-yellow-400 text-black hover:bg-yellow-300" : "bg-gray-800 text-white"
            }`}
          >
            {sirenActive ? <Volume2 className="mr-1.5 h-4 w-4" /> : <VolumeX className="mr-1.5 h-4 w-4" />}
            <span>{sirenActive ? t.sirenOff : t.sirenOn}</span>
          </Button>

          <Button
            onClick={onToggleTorch}
            className={`font-bold py-3 text-xs sm:text-sm rounded-xl ${
              torchActive ? "bg-yellow-400 text-black hover:bg-yellow-300" : "bg-gray-800 text-white"
            }`}
          >
            <Flashlight className="mr-1.5 h-4 w-4" />
            <span>{torchActive ? t.torchOff : t.torchOn}</span>
          </Button>
        </div>

        {/* Dismiss / Stop Everything Button */}
        <Button
          onClick={onStopAllAlarms}
          className="w-full bg-white text-black hover:bg-gray-200 font-black text-lg py-4 rounded-xl shadow-2xl"
        >
          <X className="mr-2 h-6 w-6 text-red-600" />
          <span>{t.stopBeacon}</span>
        </Button>
      </div>
    </div>
  )
}
