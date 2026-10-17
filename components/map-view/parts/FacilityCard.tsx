"use client"

/**
 * components/map-view/parts/FacilityCard.tsx
 *
 * Card display for individual healthcare facilities or verified clinicians.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Navigation, Loader2, MapPin, Building2, Stethoscope } from "lucide-react"
import { IPHS_TIER_CONFIG } from "@/lib/geo/lgd-iphs"
import type { Facility } from "../types"
import { TYPE_CONFIG } from "../types"

interface FacilityCardProps {
  facility: Facility
  itemIndex: number
  userCoords: { lat: number; lng: number } | null
  en: boolean
  routingLoading: boolean
  onShowRoute: (lat: number, lon: number) => void
}

export function FacilityCard({
  facility: f,
  itemIndex,
  userCoords,
  en,
  routingLoading,
  onShowRoute,
}: FacilityCardProps) {
  const cfg = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.clinic
  const isDoc = f.type === "doctors"

  return (
    <Card
      className={`border hover:shadow-md transition-all hover:border-blue-300 bg-white ${
        isDoc ? "border-purple-200" : ""
      }`}
    >
      <CardContent className="p-3 flex flex-col justify-between h-full gap-2">
        <div>
          {/* Header: Item Index + Name + Distance/District */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="h-5 w-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                style={{ background: cfg.color }}
              >
                {itemIndex}
              </span>
              <h4 className="font-semibold text-xs sm:text-sm text-gray-900 truncate" title={f.name}>
                {f.name}
              </h4>
            </div>
            {userCoords ? (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                {f.distance_km < 1 ? `${Math.round(f.distance_km * 1000)}m` : `${f.distance_km.toFixed(1)} km`}
              </span>
            ) : (
              <span
                className="text-[10px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 truncate max-w-[100px]"
                title={f.district || ""}
              >
                {f.district || (en ? "District" : "जिला")}
              </span>
            )}
          </div>

          {/* Doctor details or Facility Capabilities */}
          {isDoc ? (
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                  <span>👨‍⚕️</span>
                  <span>{f.specialtyName}</span>
                </span>
                {f.verificationStatus === "independently_verified" && f.regNo ? (
                  <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1 py-0.5 rounded">
                    NMC Verified
                  </span>
                ) : f.recordType === "facility_nodal_contact" ? (
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.5 rounded">
                    {en ? "Facility Contact" : "सुविधा संपर्क"}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5 rounded">
                    {en ? "Verified Clinician" : "सत्यापित चिकित्सक"}
                  </span>
                )}
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5 rounded">
                  {f.consultationFee === 0 ? (en ? "Free OPD" : "निःशुल्क OPD") : `₹${f.consultationFee}`}
                </span>
              </div>
              {f.hospitalAffiliation && (
                <p className="text-[11px] text-gray-700 truncate flex items-center gap-1" title={f.hospitalAffiliation}>
                  <Building2 className="h-3 w-3 text-purple-600 shrink-0" />
                  <span className="truncate">{f.hospitalAffiliation}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: cfg.color }}>
                <span>{cfg.icon}</span>
                <span>{en ? cfg.en : cfg.hi}</span>
              </span>
              {f.tier && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    IPHS_TIER_CONFIG[f.tier]?.badgeColor || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {en ? IPHS_TIER_CONFIG[f.tier]?.en : IPHS_TIER_CONFIG[f.tier]?.hi}
                </span>
              )}
              {f.capabilities?.isPmJayEmpaneled && (
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5 rounded">
                  PM-JAY
                </span>
              )}
              {f.capabilities?.isFRU && (
                <span className="text-[9px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-1 py-0.5 rounded">
                  FRU
                </span>
              )}
              {f.capabilities?.hasBloodBankOrStorage && (
                <span className="text-[9px] font-bold bg-red-50 text-red-700 border border-red-200 px-1 py-0.5 rounded">
                  Blood
                </span>
              )}
            </div>
          )}

          {/* Address */}
          {f.address && (
            <p className="text-[11px] text-gray-500 truncate mt-1 flex items-center gap-1" title={f.address}>
              <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
              <span className="truncate">{f.address}</span>
            </p>
          )}
        </div>

        {/* Action Footer (Call + Route + Book) */}
        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-1">
            {f.phone ? (
              <a
                href={`tel:${f.phone}`}
                className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title={f.phone}
              >
                <Phone className="h-3 w-3 shrink-0" />
                <span className="text-[11px]">{en ? "Call" : "कॉल"}</span>
              </a>
            ) : (
              <span className="text-[10px] text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-1 rounded font-medium">
                {en ? "OPD" : "OPD"}
              </span>
            )}

            {isDoc && f.recordType === "clinician" && (
              <a
                href="/consultation"
                className="h-7 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Stethoscope className="h-3 w-3 shrink-0" />
                <span className="text-[11px]">{en ? "Book" : "बुक"}</span>
              </a>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-blue-700 hover:bg-blue-50 border-blue-200 flex items-center gap-1 shrink-0"
            onClick={() => onShowRoute(f.lat, f.lon)}
            disabled={routingLoading}
          >
            {routingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
            <span>{en ? "Route" : "मार्ग"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
