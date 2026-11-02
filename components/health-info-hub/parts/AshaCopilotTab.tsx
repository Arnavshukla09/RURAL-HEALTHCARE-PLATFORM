"use client"

/**
 * components/health-info-hub/parts/AshaCopilotTab.tsx
 *
 * ASHA / ANM Clinical Copilot (IMCI Pediatric Triage & ANC High-Risk Pregnancy Assessment).
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Education Subsystem
 */

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Baby, UserCheck } from "lucide-react"
import type { ImciChildAssessment, AncMaternalAssessment } from "@/lib/clinical/imci-anc"
import { ChildImciSection } from "./ChildImciSection"
import { MaternalAncSection } from "./MaternalAncSection"

interface AshaCopilotTabProps {
  en: boolean
}

export function AshaCopilotTab({ en }: AshaCopilotTabProps) {
  const [copilotMode, setCopilotMode] = useState<"imci" | "anc">("imci")

  const [imciData, setImciData] = useState<ImciChildAssessment>({
    ageMonths: 12,
    cannotDrinkOrBreastfeed: false,
    vomitsEverything: false,
    convulsions: false,
    lethargicOrUnconscious: false,
    hasCoughOrDifficultyBreathing: false,
    respiratoryRate: 40,
    chestIndrawing: false,
    stridorWhenCalm: false,
    hasDiarrhea: false,
    diarrheaDays: 2,
    bloodInStool: false,
    sunkenEyes: false,
    drinkingEagerlyOrThirsty: false,
    hasFever: false,
    feverDays: 2,
    stiffNeck: false,
  })

  const [ancData, setAncData] = useState<AncMaternalAssessment>({
    gestationalWeeks: 28,
    vaginalBleeding: false,
    severeHeadacheWithBlurredVision: false,
    swellingFaceAndHands: false,
    highFever: false,
    foulSmellingDischarge: false,
    reducedFetalMovements: false,
    systolicBp: 120,
    diastolicBp: 80,
    hemoglobinGdl: 11,
  })

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-emerald-50/20 shadow-xs">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                <span>{en ? "ASHA / ANM Village Health Copilot" : "आशा / एएनएम ग्रामीण स्वास्थ्य मार्गदर्शक"}</span>
                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                  WHO / MoHFW IMCI & ANC
                </Badge>
              </h2>
              <p className="text-xs text-emerald-800/80 mt-0.5">
                {en
                  ? "Standardized clinical triage algorithms for field workers: Under-5 child illness & maternal risks."
                  : "क्षेत्रीय कार्यकर्ताओं हेतु मानकीकृत क्लीनिकल ट्रायज: 5 वर्ष से कम आयु बाल रोग व मातृ जोखिम।"}
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-100/70 p-1 rounded-xl self-start sm:self-auto border border-emerald-200">
              <Button
                variant={copilotMode === "imci" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCopilotMode("imci")}
                className={`text-xs h-8 ${copilotMode === "imci" ? "bg-emerald-700 text-white shadow-xs" : "text-emerald-900"}`}
              >
                <Baby className="h-3.5 w-3.5 mr-1" />
                {en ? "Child IMCI (0-5 Yrs)" : "शिशु स्वास्थ्य (0-5 वर्ष)"}
              </Button>
              <Button
                variant={copilotMode === "anc" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCopilotMode("anc")}
                className={`text-xs h-8 ${copilotMode === "anc" ? "bg-emerald-700 text-white shadow-xs" : "text-emerald-900"}`}
              >
                <UserCheck className="h-3.5 w-3.5 mr-1" />
                {en ? "Maternal ANC Risk" : "गर्भावस्था जोखिम"}
              </Button>
            </div>
          </div>

          {copilotMode === "imci" ? (
            <ChildImciSection en={en} imciData={imciData} setImciData={setImciData} />
          ) : (
            <MaternalAncSection en={en} ancData={ancData} setAncData={setAncData} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
