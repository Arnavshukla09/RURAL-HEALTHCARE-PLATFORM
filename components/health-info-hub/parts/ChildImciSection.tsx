"use client"

/**
 * components/health-info-hub/parts/ChildImciSection.tsx
 *
 * Integrated Management of Childhood Illness (IMCI) Triage Section.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Education Subsystem
 */

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { evaluateImci, type ImciChildAssessment } from "@/lib/clinical/imci-anc"

interface ChildImciSectionProps {
  en: boolean
  imciData: ImciChildAssessment
  setImciData: React.Dispatch<React.SetStateAction<ImciChildAssessment>>
}

export function ChildImciSection({ en, imciData, setImciData }: ChildImciSectionProps) {
  const router = useRouter()
  const imciResult = evaluateImci(imciData)

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Clinical Inputs */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">
            {en ? "1. General Danger Signs (0-5 Years)" : "1. सामान्य खतरे के लक्षण (0-5 वर्ष)"}
          </h3>

          <div className="space-y-2.5">
            {[
              { key: "cannotDrinkOrBreastfeed", label: en ? "Unable to drink or breastfeed" : "पीने या स्तनपान करने में असमर्थ" },
              { key: "vomitsEverything", label: en ? "Vomits everything ingested" : "सब कुछ उल्टी कर देता है" },
              { key: "convulsions", label: en ? "History of convulsions/fits" : "दौरे या ऐंठन की स्थिति" },
              { key: "lethargicOrUnconscious", label: en ? "Lethargic or unconscious" : "सुस्त या बेहोश" },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(imciData as any)[item.key]}
                  onChange={(e) => setImciData((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <h3 className="text-sm font-bold text-gray-900 border-b pb-2 pt-2">
            {en ? "2. Respiratory & Diarrhea" : "2. श्वसन एवं दस्त संबंधी लक्षण"}
          </h3>

          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={imciData.hasCoughOrDifficultyBreathing}
                onChange={(e) => setImciData((prev) => ({ ...prev, hasCoughOrDifficultyBreathing: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span>{en ? "Has cough or breathing difficulty" : "खांसी या सांस लेने में कठिनाई है"}</span>
            </label>

            {imciData.hasCoughOrDifficultyBreathing && (
              <div className="pl-6 space-y-2">
                <label className="block text-xs text-gray-600">
                  {en ? `Respiratory Rate: ${imciData.respiratoryRate} breaths/min` : `श्वसन दर: ${imciData.respiratoryRate} सांस/मिनट`}
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={imciData.respiratoryRate || 40}
                    onChange={(e) => setImciData((prev) => ({ ...prev, respiratoryRate: Number(e.target.value) }))}
                    className="w-full mt-1 accent-emerald-600"
                  />
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(imciData.chestIndrawing)}
                    onChange={(e) => setImciData((prev) => ({ ...prev, chestIndrawing: e.target.checked }))}
                    className="rounded text-emerald-600 h-3.5 w-3.5"
                  />
                  <span>{en ? "Chest indrawing present" : "छाती का अंदर धंसना"}</span>
                </label>
              </div>
            )}

            <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={imciData.hasDiarrhea}
                onChange={(e) => setImciData((prev) => ({ ...prev, hasDiarrhea: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span>{en ? "Has diarrhea" : "दस्त (डायरिया) है"}</span>
            </label>

            {imciData.hasDiarrhea && (
              <div className="pl-6 space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(imciData.bloodInStool)}
                    onChange={(e) => setImciData((prev) => ({ ...prev, bloodInStool: e.target.checked }))}
                    className="rounded text-emerald-600 h-3.5 w-3.5"
                  />
                  <span>{en ? "Blood in stool (Dysentery)" : "मल में खून (पेचिश)"}</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(imciData.sunkenEyes)}
                    onChange={(e) => setImciData((prev) => ({ ...prev, sunkenEyes: e.target.checked }))}
                    className="rounded text-emerald-600 h-3.5 w-3.5"
                  />
                  <span>{en ? "Sunken eyes (Dehydration)" : "धंसी हुई आंखें (निर्जलीकरण)"}</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Triage Output Card */}
        <div className="space-y-4">
          <div
            className={`p-5 rounded-xl border-2 transition-all ${
              imciResult.urgency === "EMERGENCY_RED"
                ? "bg-red-50 border-red-300 text-red-950"
                : imciResult.urgency === "URGENT_YELLOW"
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-emerald-50 border-emerald-300 text-emerald-950"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Badge
                className={`text-xs uppercase font-bold px-2.5 py-1 ${
                  imciResult.urgency === "EMERGENCY_RED"
                    ? "bg-red-600 text-white"
                    : imciResult.urgency === "URGENT_YELLOW"
                    ? "bg-amber-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {imciResult.urgency === "EMERGENCY_RED"
                  ? en ? "Emergency Red (Immediate Referral)" : "आपातकालीन लाल (तुरंत रेफरल)"
                  : imciResult.urgency === "URGENT_YELLOW"
                  ? en ? "Urgent Yellow (PHC/CHC within 24h)" : "गंभीर पीला (24 घंटे में रेफरल)"
                  : en ? "Routine Green (Home Care)" : "सामान्य हरा (घरेलू देखभाल)"}
              </Badge>

              {imciResult.requiresImmediateReferral ? (
                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> 108 Ambulance
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> ASHA Protocol
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold mb-2">
              {en ? "Clinical Classifications:" : "नैदानिक वर्गीकरण:"}
            </h4>
            <ul className="text-xs space-y-1 mb-4 list-disc list-inside">
              {(en ? imciResult.classifications : imciResult.hindiClassifications).map((c, i) => (
                <li key={i} className="font-semibold">{c}</li>
              ))}
            </ul>

            <h4 className="text-sm font-bold mb-2">
              {en ? "Mandated Action Steps:" : "निर्धारित आवश्यक कदम:"}
            </h4>
            <ul className="text-xs space-y-1 list-disc list-inside">
              {(en ? imciResult.recommendedActions : imciResult.hindiRecommendedActions).map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>

            {imciResult.requiresImmediateReferral && (
              <div className="mt-4 pt-3 border-t border-red-200 flex gap-2">
                <a
                  href="tel:108"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg text-center transition-colors"
                >
                  {en ? "Dial 108 Ambulance" : "108 एम्बुलेंस डायल करें"}
                </a>
                <button
                  onClick={() => router.push("/locations")}
                  className="flex-1 bg-white border border-red-300 text-red-700 text-xs font-bold py-2 rounded-lg text-center hover:bg-red-50 transition-colors"
                >
                  {en ? "Find Nearest Hospital" : "निकटतम अस्पताल देखें"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
