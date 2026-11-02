"use client"

/**
 * components/health-info-hub/parts/FirstAidTab.tsx
 *
 * Emergency first aid step-by-step guides.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Education Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { FIRST_AID_ITEMS } from "../types"

interface FirstAidTabProps {
  en: boolean
  search: string
}

export function FirstAidTab({ en, search }: FirstAidTabProps) {
  const filtered = FIRST_AID_ITEMS.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {filtered.map((f) => (
        <Card key={f.title} className="hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-semibold">{en ? f.title : f.hi}</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1.5">
              {(en ? f.steps : (f.hiSteps || f.steps)).map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {s}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
