"use client"

/**
 * components/health-info-hub/index.tsx
 *
 * Modular Health Information Hub — Public health, vaccination, first-aid & ASHA triage.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Education Subsystem
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, Shield } from "lucide-react"

import { VaccinesTab } from "./parts/VaccinesTab"
import { FirstAidTab } from "./parts/FirstAidTab"
import { DiseasesTab } from "./parts/DiseasesTab"
import { AwarenessTab } from "./parts/AwarenessTab"
import { AshaCopilotTab } from "./parts/AshaCopilotTab"
import { getTabs, type HealthInfoHubProps } from "./types"

export function HealthInfoHub({ language, symptomResult }: HealthInfoHubProps) {
  const router = useRouter()
  const en = language === "en"
  const hasRelevantDiseases = (symptomResult?.relevantDiseases?.length ?? 0) > 0

  const [tab, setTab] = useState<"vaccines" | "firstaid" | "diseases" | "awareness" | "asha">(
    hasRelevantDiseases ? "diseases" : "firstaid"
  )
  const [search, setSearch] = useState("")

  const tabs = getTabs(en)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {en ? "Health Information Hub" : "स्वास्थ्य जानकारी केंद्र"}
          </h1>
          {symptomResult?.possibleConditions?.length > 0 ? (
            <p className="text-muted-foreground text-sm mt-1">
              {en
                ? `Showing information for: ${symptomResult.possibleConditions
                    .map((c: any) => c.name)
                    .slice(0, 2)
                    .join(", ")}`
                : `के लिए जानकारी: ${symptomResult.possibleConditions
                    .map((c: any) => c.name)
                    .slice(0, 2)
                    .join(", ")}`}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              {en
                ? "Personalized health information based on your symptoms"
                : "आपके लक्षणों के आधार पर स्वास्थ्य जानकारी"}
            </p>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 flex-wrap justify-center">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <Button
                key={t.key}
                variant={tab === t.key ? "default" : "outline"}
                size="sm"
                onClick={() => setTab(t.key as any)}
                className={tab === t.key ? "gradient-primary text-white" : ""}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {t.label}
              </Button>
            )
          })}
        </div>

        {/* Government Schemes Navigation Link */}
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => router.push("/health-info/schemes")}
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md border border-green-500"
          >
            <Shield className="h-4 w-4 mr-2" />
            {en ? "View Government Health Schemes" : "सरकारी स्वास्थ्य योजनाएं देखें"}
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-9 h-9 border rounded-lg text-sm"
            placeholder={en ? "Search..." : "खोजें..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tab Panels */}
        {tab === "vaccines" && <VaccinesTab en={en} search={search} />}
        {tab === "firstaid" && <FirstAidTab en={en} search={search} />}
        {tab === "diseases" && (
          <DiseasesTab en={en} search={search} symptomResult={symptomResult} />
        )}
        {tab === "awareness" && <AwarenessTab en={en} search={search} />}
        {tab === "asha" && <AshaCopilotTab en={en} />}
      </div>
    </div>
  )
}

export default HealthInfoHub
