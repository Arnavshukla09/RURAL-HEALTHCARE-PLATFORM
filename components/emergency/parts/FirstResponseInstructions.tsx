"use client"

/**
 * components/emergency/parts/FirstResponseInstructions.tsx
 *
 * Visual first-response guideline steps during emergency waiting time.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface FirstResponseInstructionsProps {
  t: any
}

export function FirstResponseInstructions({ t }: FirstResponseInstructionsProps) {
  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center text-red-800">
          <AlertTriangle className="h-4 w-4 mr-2 text-red-600 flex-shrink-0" />
          {t.instructionsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[t.inst1, t.inst2, t.inst3, t.inst4, t.inst5].map((text, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-red-50/50 border border-red-100">
              <span className="h-5 w-5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs sm:text-sm text-gray-700 leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
