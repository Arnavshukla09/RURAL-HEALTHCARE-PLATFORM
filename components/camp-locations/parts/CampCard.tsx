"use client"

/**
 * components/camp-locations/parts/CampCard.tsx
 *
 * Card component for individual healthcare camps & outreach events.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Outreach & Camps Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Navigation,
  Calendar,
  Users,
  Phone,
  Heart,
  Activity,
  Stethoscope,
  Map,
} from "lucide-react"
import type { CampLocation } from "../types"

interface CampCardProps {
  camp: CampLocation
  language: string
  t: any
  registering: number | string | null
  registeredCamps: Set<number | string>
  onRegister: (camp: CampLocation) => void
  onDirections: (camp: CampLocation) => void
  onCall: (camp: CampLocation) => void
  onViewOnMap: () => void
}

export function CampCard({
  camp,
  language,
  t,
  registering,
  registeredCamps,
  onRegister,
  onDirections,
  onCall,
  onViewOnMap,
}: CampCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "upcoming":
        return "bg-blue-500"
      case "completed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "blood-donation":
        return <Heart className="h-5 w-5 text-red-500" />
      case "checkup":
        return <Activity className="h-5 w-5 text-blue-500" />
      case "vaccination":
        return <Stethoscope className="h-5 w-5 text-green-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return t.today
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t.tomorrow
    } else {
      return date.toLocaleDateString(language === "en" ? "en-US" : "hi-IN")
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {getTypeIcon(camp.type)}
                <div>
                  <h3 className="text-xl font-semibold">{camp.name}</h3>
                  <p className="text-gray-600 text-sm">{camp.description}</p>
                </div>
              </div>
              <Badge className={`${getStatusColor(camp.status)} text-white`}>
                {camp.status === "active" && t.active}
                {camp.status === "upcoming" && t.upcoming}
                {camp.status === "completed" && t.completed}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{camp.address}</span>
                </div>
                <div className="flex items-center">
                  <Navigation className="h-4 w-4 mr-2" />
                  <span>{camp.landmark}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {formatDate(camp.date)} at {camp.time}
                    <span className="text-xs text-amber-600 ml-1">
                      ({language === "en" ? "Tentative — Annual" : "अस्थायी — वार्षिक"})
                    </span>
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>
                    {camp.participants} {t.participants}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 space-y-2">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <Button onClick={() => onDirections(camp)} className="flex items-center justify-center">
                <Navigation className="h-4 w-4 mr-1" />
                {t.getDirections}
              </Button>
              <Button
                variant="outline"
                onClick={() => onCall(camp)}
                className="flex items-center justify-center"
              >
                <Phone className="h-4 w-4 mr-1" />
                {t.callCamp}
              </Button>
            </div>

            {camp.status !== "completed" && (
              <Button
                variant="secondary"
                onClick={() => onRegister(camp)}
                className="w-full"
                disabled={registering === camp.id || registeredCamps.has(camp.id)}
              >
                {registering === camp.id
                  ? (language === "en" ? "Registering..." : "पंजीकरण हो रहा है...")
                  : registeredCamps.has(camp.id)
                    ? (language === "en" ? "✓ Registered" : "✓ पंजीकृत")
                    : t.registerNow}
              </Button>
            )}

            <Button variant="outline" onClick={onViewOnMap} className="w-full">
              <Map className="h-4 w-4 mr-1" />
              {t.viewOnMap}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
