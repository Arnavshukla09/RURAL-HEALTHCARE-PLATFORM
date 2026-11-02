"use client"

/**
 * components/health-info-hub/parts/DiseasesTab.tsx
 *
 * Disease directory with symptoms, prevention, and severity tiers.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Education Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DISEASES, SEV_COLORS, type DiseaseItem } from "../types"

interface DiseasesTabProps {
  en: boolean
  search: string
  symptomResult?: any | null
}

export function DiseasesTab({ en, search, symptomResult }: DiseasesTabProps) {
  const relevantKeys: string[] = symptomResult?.relevantDiseases || []
  const initialPool =
    relevantKeys.length > 0
      ? DISEASES.filter((d) =>
          relevantKeys.some(
            (k) =>
              d.name.toLowerCase().includes(k.toLowerCase()) ||
              k.toLowerCase().includes(d.name.toLowerCase())
          )
        )
      : DISEASES

  const displayList = initialPool.length > 0 ? initialPool : DISEASES

  const filtered = displayList.filter((d: DiseaseItem) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {filtered.map((d) => (
        <Card key={d.name} className="hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{d.icon}</span>
                <h3 className="font-semibold">{en ? d.name : d.hi}</h3>
              </div>
              <Badge className={`text-xs ${SEV_COLORS[d.severity] || "bg-gray-100 text-gray-700"}`}>
                {d.severity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              <strong>{en ? "Symptoms:" : "लक्षण:"}</strong> {en ? d.symptoms : d.hiSymptoms || d.symptoms}
            </p>
            <p className="text-sm text-green-700">
              <strong>{en ? "Prevention:" : "रोकथाम:"}</strong>{" "}
              {en ? d.prevention : d.hiPrevention || d.prevention}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
