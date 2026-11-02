"use client"

/**
 * components/health-info-hub/parts/VaccinesTab.tsx
 *
 * Universal immunization schedule table.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Education Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { VACCINES } from "../types"

interface VaccinesTabProps {
  en: boolean
  search: string
}

export function VaccinesTab({ en, search }: VaccinesTabProps) {
  const filtered = VACCINES.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.disease.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="gradient-primary text-white">
                <th className="p-3 text-left text-sm font-medium">Vaccine</th>
                <th className="p-3 text-left text-sm font-medium">Age/Schedule</th>
                <th className="p-3 text-left text-sm font-medium">Protects Against</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.name} className={i % 2 === 0 ? "bg-white" : "bg-teal-50/50"}>
                  <td className="p-3 font-semibold text-sm">{v.name}</td>
                  <td className="p-3 text-sm text-muted-foreground">{en ? v.age : v.hi.split("—")[0]}</td>
                  <td className="p-3 text-sm">{en ? v.disease : v.hi.split("—")[1] || v.disease}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-amber-50 border-t text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {en
            ? "Contact your nearest Anganwadi or PHC for vaccination"
            : "टीकाकरण के लिए नजदीकी आंगनवाड़ी से संपर्क करें"}
        </div>
      </CardContent>
    </Card>
  )
}
