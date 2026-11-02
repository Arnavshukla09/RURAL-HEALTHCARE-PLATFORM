"use client"

/**
 * components/dashboard/index.tsx
 *
 * Modularized Dashboard component for Rural Healthcare Platform.
 * Aggregates patient statistics, upcoming camps, high-priority emergency access,
 * and quick workflow navigation.
 *
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Dashboard Subsystem
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { DashboardProps, RegisteredCamp, UserStats } from "./types"
import { getDashboardContent } from "./types"
import { WelcomeHeader } from "./parts/WelcomeHeader"
import { StatsCards } from "./parts/StatsCards"
import { QuickActions } from "./parts/QuickActions"
import { SchemesPreview } from "./parts/SchemesPreview"
import { RegisteredCampsList } from "./parts/RegisteredCampsList"

export function Dashboard({ user, language }: DashboardProps) {
  const t = getDashboardContent(language, user.name)
  const [userStats, setUserStats] = useState<UserStats>({
    consultations: 0,
    campaigns: 0,
  })
  const [registeredCamps, setRegisteredCamps] = useState<RegisteredCamp[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        if (!authUser) return

        const { data: patient } = await supabase
          .from("patients")
          .select("id")
          .eq("user_id", authUser.id)
          .single()

        if (patient?.id) {
          const apptRes = await fetch("/api/appointments")
          if (apptRes.ok) {
            const apptData = await apptRes.json()
            setUserStats((prev) => ({
              ...prev,
              consultations: apptData.appointments?.length || 0,
            }))
          }

          const recRes = await fetch("/api/medical-records")
          if (recRes.ok) {
            const allRecords = await recRes.json()
            const records = (allRecords || []).filter(
              (r: any) =>
                r.record_type === "other" &&
                r.content.startsWith("[Camp Registration]")
            )

            if (records) {
              setUserStats((prev) => ({ ...prev, campaigns: records.length }))
              setRegisteredCamps(
                records.map((r: any) => {
                  const content = r.content
                  const titleMatch = content.match(/\[Camp Registration\] (.*?) —/)
                  const locMatch = content.match(/— (.*?) on /)
                  const dateMatch = content.match(/ on (.*?) at /)
                  const timeMatch = content.match(/ at (.*?)\. Contact:/)

                  return {
                    id: r.id,
                    title: titleMatch ? titleMatch[1] : "Camp",
                    location: locMatch ? locMatch[1] : "Unknown",
                    date: dateMatch ? dateMatch[1] : "",
                    time: timeMatch ? timeMatch[1] : "",
                    type: "checkup",
                    participants: 1,
                  }
                })
              )
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <WelcomeHeader
          user={user}
          language={language}
          welcomeText={t.welcome}
        />

        <StatsCards
          user={user}
          language={language}
          userStats={userStats}
          statsLabels={t.stats}
        />

        <div className="max-w-5xl mx-auto w-full">
          <div className="space-y-6">
            <QuickActions user={user} language={language} t={t} />

            <SchemesPreview language={language} />

            <RegisteredCampsList
              registeredCamps={registeredCamps}
              language={language}
              upcomingCampaignsTitle={t.upcomingCampaigns}
              viewAllText={t.viewAll}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
