"use client"

/**
 * components/dashboard/parts/QuickActions.tsx
 *
 * Fast navigation grid for high-priority healthcare workflows.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Dashboard Subsystem
 */

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Users, Calendar, Heart, AlertCircle } from "lucide-react"

interface QuickActionsProps {
  user: any
  language: string
  t: any
}

export function QuickActions({ user, language, t }: QuickActionsProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.quickActions}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={() => router.push("/consultation")}
            className="h-16 flex items-center justify-center space-x-2"
          >
            <Phone className="h-5 w-5" />
            <span>{t.bookConsultation}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/directory")}
            className="h-16 flex items-center justify-center space-x-2"
          >
            <Users className="h-5 w-5" />
            <span>{t.viewDirectory}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/camps")}
            className="h-16 flex items-center justify-center space-x-2"
          >
            <Calendar className="h-5 w-5" />
            <span>{t.joinCampaign}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              router.push(user.role === "doctor" ? "/doctor/patients" : "/records")
            }
            className="h-16 flex items-center justify-center space-x-2"
          >
            <Heart className="h-5 w-5" />
            <span>
              {user.role === "doctor"
                ? language === "en"
                  ? "Patient Records"
                  : "मरीज़ रिकॉर्ड"
                : language === "en"
                ? "My Records"
                : "मेरे रिकॉर्ड"}
            </span>
          </Button>
        </div>

        <div className="mt-4">
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={() => router.push("/emergency")}
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            {t.emergencyContact}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
