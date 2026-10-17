"use client"

/**
 * components/dashboard/parts/RegisteredCampsList.tsx
 *
 * Upcoming and registered healthcare camp cards with location, time, and type tags.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Dashboard Subsystem
 */

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Heart, Activity, Stethoscope } from "lucide-react"
import type { RegisteredCamp } from "../types"

interface RegisteredCampsListProps {
  registeredCamps: RegisteredCamp[]
  language: string
  upcomingCampaignsTitle: string
  viewAllText: string
}

export function RegisteredCampsList({
  registeredCamps,
  language,
  upcomingCampaignsTitle,
  viewAllText,
}: RegisteredCampsListProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{upcomingCampaignsTitle}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => router.push("/camps")}>
          {viewAllText}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {registeredCamps.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              {language === "en"
                ? "No registered campaigns yet."
                : "अभी तक कोई पंजीकृत अभियान नहीं है।"}
            </div>
          ) : (
            registeredCamps.slice(0, 3).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <div className="flex-shrink-0">
                  {campaign.type === "blood-donation" && (
                    <Heart className="h-8 w-8 text-red-500" />
                  )}
                  {campaign.type === "checkup" && (
                    <Activity className="h-8 w-8 text-blue-500" />
                  )}
                  {campaign.type === "vaccination" && (
                    <Stethoscope className="h-8 w-8 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{campaign.date}</span>
                    <Clock className="h-4 w-4 ml-4 mr-1" />
                    <span>{campaign.time}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{campaign.location}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="secondary">
                    {campaign.participants}{" "}
                    {language === "en" ? "joined" : "शामिल"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
