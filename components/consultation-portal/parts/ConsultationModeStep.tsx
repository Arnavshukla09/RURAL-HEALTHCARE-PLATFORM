"use client"

/**
 * components/consultation-portal/parts/ConsultationModeStep.tsx
 *
 * Step 1: Select Video, Audio, or Chat consultation mode.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Consultation Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CONSULT_TYPES } from "../types"

interface ConsultationModeStepProps {
  en: boolean
  consultType: "video" | "audio" | "chat"
  setConsultType: (type: "video" | "audio" | "chat") => void
}

export function ConsultationModeStep({
  en,
  consultType,
  setConsultType,
}: ConsultationModeStepProps) {
  return (
    <Card className="border-gray-200 bg-white rounded-2xl shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
            1
          </span>
          <span>{en ? "Step 1 — Choose Consultation Mode" : "चरण 1 — परामर्श माध्यम चुनें"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CONSULT_TYPES.map((ct) => {
            const Icon = ct.icon
            const active = consultType === ct.id
            return (
              <button
                key={ct.id}
                onClick={() => setConsultType(ct.id as any)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  active
                    ? "border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-100"
                    : "border-gray-200 hover:border-blue-300 bg-white"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900">{en ? ct.labelEn : ct.labelHi}</h4>
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {en ? ct.badgeEn : ct.badgeHi}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
