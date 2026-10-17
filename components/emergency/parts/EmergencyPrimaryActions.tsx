"use client"

/**
 * components/emergency/parts/EmergencyPrimaryActions.tsx
 *
 * Primary 108 Call, SOS distress, contact dispatch, and beacon buttons.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Phone,
  MapPin,
  BookOpen,
  ShieldAlert,
  Flashlight,
  Users,
} from "lucide-react"

interface EmergencyPrimaryActionsProps {
  language: string
  t: any
  onTriggerDistressSos: () => void
  onOpenContactAlert: () => void
  onStartBeacon: () => void
}

export function EmergencyPrimaryActions({
  language,
  t,
  onTriggerDistressSos,
  onOpenContactAlert,
  onStartBeacon,
}: EmergencyPrimaryActionsProps) {
  const router = useRouter()

  return (
    <Card className="border-2 border-red-200 bg-white shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        <Button
          onClick={() => { window.location.href = "tel:108" }}
          className="w-full min-h-[4.5rem] py-3 px-4 text-xl sm:text-2xl bg-red-600 hover:bg-red-700 animate-pulse font-black text-white rounded-xl shadow-md whitespace-normal leading-tight flex items-center justify-center text-center"
        >
          <Phone className="mr-2.5 h-7 w-7 flex-shrink-0" />
          <span>{t.call108}</span>
        </Button>

        <div className="space-y-1">
          <Button
            onClick={onTriggerDistressSos}
            className="w-full min-h-[3.75rem] py-3 px-4 text-sm sm:text-base bg-red-950 hover:bg-black font-extrabold text-white rounded-xl shadow-md flex items-center justify-center text-center gap-2"
          >
            <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span>{t.distressBtn}</span>
          </Button>
          <p className="text-[11px] text-gray-500 text-center leading-tight">{t.distressBtnSub}</p>
        </div>

        <div className="space-y-1">
          <Button
            onClick={onOpenContactAlert}
            className="w-full min-h-[3.75rem] py-3 px-4 text-sm sm:text-base bg-amber-600 hover:bg-amber-700 font-extrabold text-white rounded-xl shadow-md flex items-center justify-center text-center gap-2"
          >
            <Users className="h-5 w-5 flex-shrink-0" />
            <span>{t.contactBtn}</span>
          </Button>
          <p className="text-[11px] text-gray-500 text-center leading-tight">{t.contactBtnSub}</p>
        </div>

        <Button
          variant="outline"
          className="w-full min-h-[3.75rem] py-3 px-3.5 flex items-center justify-start gap-3 font-semibold rounded-xl text-left bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
          onClick={onStartBeacon}
        >
          <Flashlight className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold truncate">{t.beaconBtn}</div>
            <div className="text-[11px] text-amber-700/90 font-normal line-clamp-1">{t.beaconBtnSub}</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-full min-h-[3.25rem] py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl border-gray-200 hover:bg-gray-50 flex items-center justify-center"
          onClick={() => router.push("/locations")}
        >
          <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
          <span>{t.findHospital}</span>
        </Button>

        <Button
          variant="outline"
          className="w-full min-h-[3.75rem] py-2.5 px-3.5 rounded-xl text-center bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          onClick={() => router.push("/health-info")}
        >
          <div className="flex flex-col items-center">
            <span className="flex items-center text-xs sm:text-sm font-bold">
              <BookOpen className="mr-2 h-4 w-4 flex-shrink-0" /> {t.firstAid}
            </span>
            <span className="text-[11px] text-blue-600/90 font-normal mt-0.5">{t.firstAidSub}</span>
          </div>
        </Button>
      </CardContent>
    </Card>
  )
}
