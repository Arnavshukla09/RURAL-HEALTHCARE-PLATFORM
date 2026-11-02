"use client"

/**
 * components/health-info-hub/parts/MaternalAncSection.tsx
 *
 * Antenatal Care (ANC) High-Risk Pregnancy Assessment Section.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Education Subsystem
 */

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { evaluateAncMaternalRisk, type AncMaternalAssessment } from "@/lib/clinical/imci-anc"

interface MaternalAncSectionProps {
  en: boolean
  ancData: AncMaternalAssessment
  setAncData: React.Dispatch<React.SetStateAction<AncMaternalAssessment>>
}

export function MaternalAncSection({ en, ancData, setAncData }: MaternalAncSectionProps) {
  const router = useRouter()
  const ancResult = evaluateAncMaternalRisk(ancData)

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Clinical Inputs */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">
            {en ? "High-Risk Pregnancy Danger Signs" : "उच्च जोखिम गर्भावस्था के खतरे के संकेत"}
          </h3>

          <div className="space-y-2.5">
            {[
              { key: "vaginalBleeding", label: en ? "Vaginal bleeding / spotting" : "योनि से रक्तस्राव या खून आना" },
              { key: "severeHeadacheWithBlurredVision", label: en ? "Severe headache with blurred vision (Pre-eclampsia)" : "धुंधली दृष्टि के साथ तेज सिरदर्द (प्री-एक्लेमप्सिया)" },
              { key: "swellingFaceAndHands", label: en ? "Puffy swelling in face and hands" : "चेहरे और हाथों में अत्यधिक सूजन" },
              { key: "highFever", label: en ? "High fever (> 101°F)" : "तेज बुखार (> 101°F)" },
              { key: "foulSmellingDischarge", label: en ? "Foul-smelling vaginal discharge" : "दुर्गंधयुक्त योनि स्राव" },
              { key: "reducedFetalMovements", label: en ? "Reduced / absent baby movements" : "गर्भ में शिशु की हलचल कम या बंद" },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(ancData as any)[item.key]}
                  onChange={(e) => setAncData((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                {en ? "Systolic BP (mmHg)" : "सिस्टोलिक बीपी"}
              </label>
              <input
                type="number"
                value={ancData.systolicBp || 120}
                onChange={(e) => setAncData((prev) => ({ ...prev, systolicBp: Number(e.target.value) }))}
                className="w-full text-xs p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                {en ? "Diastolic BP (mmHg)" : "डायस्टोलिक बीपी"}
              </label>
              <input
                type="number"
                value={ancData.diastolicBp || 80}
                onChange={(e) => setAncData((prev) => ({ ...prev, diastolicBp: Number(e.target.value) }))}
                className="w-full text-xs p-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Triage Output Card */}
        <div className="space-y-4">
          <div
            className={`p-5 rounded-xl border-2 transition-all ${
              ancResult.urgency === "EMERGENCY_RED"
                ? "bg-red-50 border-red-300 text-red-950"
                : ancResult.urgency === "URGENT_YELLOW"
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-emerald-50 border-emerald-300 text-emerald-950"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Badge
                className={`text-xs uppercase font-bold px-2.5 py-1 ${
                  ancResult.urgency === "EMERGENCY_RED"
                    ? "bg-red-600 text-white"
                    : ancResult.urgency === "URGENT_YELLOW"
                    ? "bg-amber-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {ancResult.urgency === "EMERGENCY_RED"
                  ? en ? "Emergency Red (Hospitalize)" : "आपातकालीन लाल (अस्पताल में भर्ती)"
                  : ancResult.urgency === "URGENT_YELLOW"
                  ? en ? "Urgent Yellow (ANC Clinic)" : "गंभीर पीला (एएनसी क्लीनिक)"
                  : en ? "Routine Green (Normal ANC)" : "सामान्य हरा (नियमित जांच)"}
              </Badge>

              {ancResult.requiresImmediateHospitalization ? (
                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> FRU / Hospital
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Safe Pregnancy
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold mb-2">
              {en ? "Maternal Risk Diagnosis:" : "मातृ जोखिम वर्गीकरण:"}
            </h4>
            <ul className="text-xs space-y-1 mb-4 list-disc list-inside">
              {(en ? ancResult.highRiskCategory : ancResult.hindiHighRiskCategory).map((c, i) => (
                <li key={i} className="font-semibold">{c}</li>
              ))}
            </ul>

            <h4 className="text-sm font-bold mb-2">
              {en ? "Referral Directives:" : "रेफरल निर्देश:"}
            </h4>
            <ul className="text-xs space-y-1 list-disc list-inside">
              {(en ? ancResult.recommendations : ancResult.hindiRecommendations).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            {ancResult.requiresImmediateHospitalization && (
              <div className="mt-4 pt-3 border-t border-red-200 flex gap-2">
                <a
                  href="tel:108"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg text-center transition-colors"
                >
                  {en ? "Call 108 (Obstetric Ambulance)" : "108 एम्बुलेंस बुलाएं"}
                </a>
                <button
                  onClick={() => router.push("/locations")}
                  className="flex-1 bg-white border border-red-300 text-red-700 text-xs font-bold py-2 rounded-lg text-center hover:bg-red-50 transition-colors"
                >
                  {en ? "Nearest FRU / Hospital" : "निकटतम एफआरयू / अस्पताल"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
