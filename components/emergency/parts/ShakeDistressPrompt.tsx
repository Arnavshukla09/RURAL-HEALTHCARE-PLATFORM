"use client"

/**
 * components/emergency/parts/ShakeDistressPrompt.tsx
 *
 * Floating confirmation prompt when device shake is detected.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { Button } from "@/components/ui/button"
import { Smartphone } from "lucide-react"

interface ShakeDistressPromptProps {
  isOpen: boolean
  shakeCountdown: number
  onCancel: () => void
  onConfirm: () => void
  language: string
}

export function ShakeDistressPrompt({
  isOpen,
  shakeCountdown,
  onCancel,
  onConfirm,
  language,
}: ShakeDistressPromptProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-x-0 bottom-4 sm:bottom-6 z-50 px-4 flex justify-center animate-bounce-short">
      <div className="max-w-md w-full bg-red-950 text-white border-2 border-red-500 rounded-2xl p-4 shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="h-6 w-6 text-red-400 animate-pulse flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">
                {language === "en" ? "Shake Detected: Emergency Distress?" : "फोन झटका पहचाना गया: आपातकालीन अलर्ट?"}
              </h4>
              <p className="text-xs text-red-200 mt-0.5">
                {language === "en"
                  ? `Initiating Siren, Beacon & SOS Broadcast in ${shakeCountdown}s...`
                  : `${shakeCountdown} सेकंड में सायरन, बीकन व एसओएस अलर्ट शुरू हो रहा है...`}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-black bg-red-800 text-white rounded-full h-7 w-7 flex items-center justify-center border border-red-400">
            {shakeCountdown}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            onClick={onCancel}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/40 text-white font-bold text-xs py-2 h-auto rounded-xl"
          >
            {language === "en" ? "Cancel (Accidental)" : "रद्द करें (गलती से हुआ)"}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 h-auto rounded-xl shadow"
          >
            {language === "en" ? "Send Now" : "अभी भेजें"}
          </Button>
        </div>
      </div>
    </div>
  )
}
