"use client"

/**
 * components/symptom-checker/parts/Step3Symptoms.tsx
 *
 * Specific symptoms checklist based on chosen anatomical region.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Triage Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Loader2, Stethoscope } from "lucide-react"
import { SYMPTOM_HI } from "../types"

interface Step3SymptomsProps {
  en: boolean
  symptomList: string[]
  selectedSymptoms: string[]
  toggleSymptom: (s: string) => void
  onBack: () => void
  onAnalyze: () => void
  loading: boolean
  error: string
}

export function Step3Symptoms({
  en,
  symptomList,
  selectedSymptoms,
  toggleSymptom,
  onBack,
  onAnalyze,
  loading,
  error,
}: Step3SymptomsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {en ? "Select your symptoms" : "अपने लक्षण चुनें"}
          </CardTitle>
          <Badge variant="outline">
            {selectedSymptoms.length} {en ? "selected" : "चयनित"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {en ? "Select all that apply" : "जो भी लागू हो चुनें"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {symptomList.map((symptom) => {
            const sel = selectedSymptoms.includes(symptom)
            const label = !en && SYMPTOM_HI[symptom] ? SYMPTOM_HI[symptom] : symptom
            return (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left text-sm transition-all ${
                  sel
                    ? "border-teal-500 bg-teal-50 text-teal-800"
                    : "border-gray-200 bg-white hover:border-teal-300"
                }`}
              >
                {sel ? (
                  <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                {label}
              </button>
            )
          })}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {en ? "Back" : "पीछे"}
          </Button>
          <Button
            onClick={onAnalyze}
            disabled={selectedSymptoms.length === 0 || loading}
            className="gradient-primary text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {en ? "Analyzing..." : "विश्लेषण..."}
              </>
            ) : (
              <>
                {en ? "Get AI Analysis" : "AI विश्लेषण"}{" "}
                <Stethoscope className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
