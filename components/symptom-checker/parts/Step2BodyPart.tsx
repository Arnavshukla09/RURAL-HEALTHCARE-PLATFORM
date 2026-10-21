"use client"

/**
 * components/symptom-checker/parts/Step2BodyPart.tsx
 *
 * Anatomical body part selection grid.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Triage Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { BODY_PARTS } from "../types"

interface Step2BodyPartProps {
  en: boolean
  selectedBodyPart: string | null
  setSelectedBodyPart: (part: string) => void
  onBack: () => void
  onNext: () => void
}

export function Step2BodyPart({
  en,
  selectedBodyPart,
  setSelectedBodyPart,
  onBack,
  onNext,
}: Step2BodyPartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{en ? "Where does it hurt?" : "दर्द कहाँ है?"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {BODY_PARTS.map((part) => {
            const Icon = part.icon
            const sel = selectedBodyPart === part.id
            return (
              <button
                key={part.id}
                onClick={() => setSelectedBodyPart(part.id)}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all hover:shadow-md ${
                  sel
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 bg-white hover:border-teal-300"
                }`}
              >
                <Icon className={`h-7 w-7 ${sel ? "text-teal-600" : "text-gray-400"}`} />
                <span className="text-xs font-medium text-center leading-tight">
                  {en ? part.label : part.labelHi}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {en ? "Back" : "पीछे"}
          </Button>
          <Button
            onClick={onNext}
            disabled={!selectedBodyPart}
            className="gradient-primary text-white"
          >
            {en ? "Next" : "अगला"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
