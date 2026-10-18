"use client"

/**
 * components/camp-locations/parts/CampCard.tsx
 *
 * Rich Card Component for verified Pan-India Annual Health Campaigns & Outreach Camps.
 * Displays scope (National/State), timing, venue, 100% Free NHM cost, organizer, and services.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Outreach & Camps Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Calendar,
  Phone,
  Copy,
  Heart,
  Activity,
  Stethoscope,
  Eye,
  ShieldAlert,
  Baby,
  CheckCircle2,
  Share2,
  Clock,
  Sparkles,
} from "lucide-react"
import type { CampLocation } from "../types"

interface CampCardProps {
  camp: CampLocation
  language: string
  t: any
  registering: number | string | null
  registeredCamps: Set<number | string>
  onRegister: (camp: CampLocation) => void
  onCall: (camp: CampLocation) => void
  onCopyNumber: (contact: string) => void
  onShare: (camp: CampLocation) => void
}

export function CampCard({
  camp,
  language,
  t,
  registering,
  registeredCamps,
  onRegister,
  onCall,
  onCopyNumber,
  onShare,
}: CampCardProps) {
  const isRegistered = registeredCamps.has(camp.id)
  const isNational = camp.scope === "national"

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "maternal":
        return <Baby className="h-5 w-5 text-pink-600" />
      case "blood-donation":
        return <Heart className="h-5 w-5 text-red-600" />
      case "checkup":
        return <Activity className="h-5 w-5 text-blue-600" />
      case "vaccination":
        return <Stethoscope className="h-5 w-5 text-emerald-600" />
      case "eye-care":
        return <Eye className="h-5 w-5 text-amber-600" />
      case "communicable-disease":
        return <ShieldAlert className="h-5 w-5 text-purple-600" />
      default:
        return <Activity className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-gray-200 overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header Badges & Title */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 shrink-0 mt-0.5">
              {getTypeIcon(camp.type)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                {isNational ? (
                  <Badge className="bg-blue-600 text-white font-bold text-[11px] px-2 py-0.5">
                    {t.nationalBadge}
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-700 text-white font-bold text-[11px] px-2 py-0.5">
                    {camp.stateName || t.stateBadge}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={
                    camp.status === "active"
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50 text-[11px]"
                      : "border-blue-400 text-blue-700 bg-blue-50 text-[11px]"
                  }
                >
                  {camp.status === "active" ? t.active : t.upcoming}
                </Badge>
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[11px] font-semibold">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 inline" />
                  {camp.cost || t.costFree}
                </Badge>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                {camp.name}
              </h3>
              {camp.organizer && (
                <p className="text-xs text-gray-600 font-medium">
                  <span className="text-gray-500">{t.organizerLabel}</span> {camp.organizer}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Camp Key Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-900">{t.recurrenceLabel}</span>{" "}
                <span>{camp.recurrence || camp.date}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-900">{t.timingLabel}</span>{" "}
                <span>{camp.time}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-900">{t.venueLabel}</span>{" "}
                <span>{camp.address}</span>
              </div>
            </div>
            {camp.targetBeneficiaries && (
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">{t.targetLabel}</span>{" "}
                  <span>{camp.targetBeneficiaries}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Services & Diagnostic Highlights */}
        {camp.services && camp.services.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              {t.servicesProvided}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {camp.services.map((service, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50/80 text-blue-800 text-[11px] font-medium border border-blue-100"
                >
                  <CheckCircle2 className="h-3 w-3 text-blue-600 shrink-0" />
                  <span>{service}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2.5 border-t border-gray-100 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCall(camp)}
              className="text-xs h-9 text-gray-800 hover:text-blue-700 hover:border-blue-300 border-gray-200 font-medium"
              title={language === "en" ? `Call Helpline: ${camp.contact}` : `हेल्पलाइन कॉल करें: ${camp.contact}`}
            >
              <Phone className="h-3.5 w-3.5 mr-1.5 text-blue-600 shrink-0" />
              <span>{language === "en" ? "Helpline:" : "हेल्पलाइन:"}</span>
              <span className="font-bold text-blue-700 ml-1 select-all">{camp.contact}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopyNumber(camp.contact)}
              className="text-xs h-9 px-2.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 border-gray-200"
              title={language === "en" ? "Copy helpline number" : "हेल्पलाइन नंबर कॉपी करें"}
            >
              <Copy className="h-3.5 w-3.5 mr-1 text-gray-500" />
              <span className="text-[11px] font-medium">{language === "en" ? "Copy" : "कॉपी"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onShare(camp)}
              className="text-xs h-9 px-2.5 text-gray-700 hover:text-gray-900 border-gray-200"
              title={language === "en" ? "Share campaign details" : "अभियान का विवरण साझा करें"}
            >
              <Share2 className="h-3.5 w-3.5 text-gray-600" />
            </Button>
          </div>

          <div className="flex flex-col items-stretch sm:items-end">
            <Button
              size="sm"
              onClick={() => onRegister(camp)}
              disabled={registering === camp.id || isRegistered}
              className={`text-xs font-semibold h-9 px-4 rounded-lg transition-all ${
                isRegistered
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              }`}
            >
              {registering === camp.id
                ? language === "en"
                  ? "Registering..."
                  : "पंजीकरण हो रहा है..."
                : isRegistered
                ? language === "en"
                  ? "✓ Saved in Medical Records"
                  : "✓ मेडिकल रिकॉर्ड में सहेजा गया"
                : language === "en"
                ? "Register / Add to Records"
                : "पंजीकरण / रिकॉर्ड में जोड़ें"}
            </Button>
            <span className="text-[10px] text-gray-500 mt-1 text-center sm:text-right">
              {language === "en"
                ? "Saves schedule & venue to your Patient Records"
                : "शिविर का विवरण आपके मरीज रिकॉर्ड में सहेजता है"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
