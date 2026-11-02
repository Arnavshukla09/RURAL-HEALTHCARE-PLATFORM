"use client"

/**
 * components/emergency/parts/EmergencyVaultSummary.tsx
 *
 * Compact summary view of the user's emergency medical profile.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HeartPulse, Mic } from "lucide-react"
import type { EmergencyProfile } from "@/lib/emergency/vault"

interface EmergencyVaultSummaryProps {
  profile: EmergencyProfile
  language: string
  t: any
  onOpenVault: () => void
}

export function EmergencyVaultSummary({
  profile,
  language,
  t,
  onOpenVault,
}: EmergencyVaultSummaryProps) {
  return (
    <Card className="border-red-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center text-red-700 text-base sm:text-lg">
            <HeartPulse className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
            {t.vaultTitle}
          </CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">{t.vaultSubtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenVault}
          className="border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold"
        >
          {t.editVault}
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-gray-50 rounded-lg">
            <span className="text-gray-500 block text-[11px]">{t.fullName}</span>
            <span className="font-semibold text-gray-900">{profile.fullName || t.noneRecorded}</span>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-lg">
            <span className="text-gray-500 block text-[11px]">{t.bloodGroup}</span>
            <span className={`font-black ${profile.bloodGroup && profile.bloodGroup !== "Unknown" ? "text-red-700" : "text-gray-600"}`}>
              {profile.bloodGroup || t.unknown}
            </span>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-lg">
            <span className="text-gray-500 block text-[11px]">{t.chronicConditions}</span>
            <span className="font-medium text-gray-900">{profile.chronicConditions || t.noneRecorded}</span>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-lg">
            <span className="text-gray-500 block text-[11px]">{t.allergies}</span>
            <span className="font-medium text-red-600">{profile.severeAllergies || t.noneRecorded}</span>
          </div>

          <div className="p-2.5 bg-gray-50 rounded-lg sm:col-span-2 space-y-1">
            <span className="text-gray-500 block text-[11px] font-semibold">
              {language === "en" ? "Emergency Contacts (Up to 3):" : "आपातकालीन संपर्क (3 तक):"}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
              <div className="bg-white p-1.5 rounded border border-gray-200">
                <span className="text-gray-400 block text-[10px]">#1 Primary</span>
                <span className="font-semibold text-gray-900">{profile.primaryEmergencyContact || t.noneRecorded}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-gray-200">
                <span className="text-gray-400 block text-[10px]">#2 Secondary</span>
                <span className="font-semibold text-gray-900">{profile.secondaryEmergencyContact || t.noneRecorded}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-gray-200">
                <span className="text-gray-400 block text-[10px]">#3 Tertiary</span>
                <span className="font-semibold text-gray-900">{profile.tertiaryEmergencyContact || t.noneRecorded}</span>
              </div>
            </div>
          </div>

          {profile.customVoiceAlert && (
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg sm:col-span-2">
              <span className="text-amber-800 font-semibold block text-[11px] flex items-center gap-1">
                <Mic className="h-3 w-3 text-amber-600" />
                {t.customVoiceLabel}
              </span>
              <span className="font-medium text-amber-950 italic">"{profile.customVoiceAlert}"</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
