"use client"

/**
 * components/dashboard/parts/StatsCards.tsx
 *
 * Metrics cards for patient and healthcare provider dashboards.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Dashboard Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Stethoscope, UserCheck } from "lucide-react"
import type { UserStats } from "../types"

interface StatsCardsProps {
  user: any
  language: string
  userStats: UserStats
  statsLabels: {
    consultations: string
    campaigns: string
    donations: string
  }
}

export function StatsCards({
  user,
  language,
  userStats,
  statsLabels,
}: StatsCardsProps) {
  return (
    <div
      className={`grid grid-cols-1 gap-6 ${
        user.role === "patient"
          ? "md:grid-cols-2 max-w-3xl mx-auto w-full"
          : "md:grid-cols-3"
      }`}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{statsLabels.consultations}</CardTitle>
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.consultations}</div>
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "This month" : "इस महीने"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{statsLabels.campaigns}</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.campaigns}</div>
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "Total participated" : "कुल भागीदारी"}
          </p>
        </CardContent>
      </Card>

      {user.role !== "patient" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "en" ? "Patients Helped" : "मरीजों की मदद की"}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">324</div>
            <p className="text-xs text-muted-foreground">
              {language === "en" ? "This year" : "इस साल"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
