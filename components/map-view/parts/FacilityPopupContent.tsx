"use client"

/**
 * components/map-view/parts/FacilityPopupContent.tsx
 *
 * Rich popup preview for markers on the Leaflet map.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { Button } from "@/components/ui/button"
import { Phone, Navigation, Loader2, MapPin, Building2, ShieldCheck, Star, Stethoscope } from "lucide-react"
import type { Facility } from "../types"
import { TYPE_CONFIG } from "../types"

interface FacilityPopupContentProps {
  facility: Facility
  userCoords: { lat: number; lng: number } | null
  isTop: boolean
  en: boolean
  routingLoading: boolean
  onShowRoute: (lat: number, lon: number) => void
}

export function FacilityPopupContent({
  facility: f,
  userCoords,
  isTop,
  en,
  routingLoading,
  onShowRoute,
}: FacilityPopupContentProps) {
  const cfg = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.clinic
  const isDoc = f.type === "doctors"

  return (
    <div className="text-sm space-y-1.5 min-w-[220px]">
      <div className="flex items-start gap-1.5">
        <span className="text-xl shrink-0">{cfg.icon}</span>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 leading-tight">{f.name}</p>
          <p className="text-xs font-medium" style={{ color: cfg.color }}>
            {isDoc ? f.specialtyName || (en ? "Specialist Doctor" : "विशेषज्ञ डॉक्टर") : en ? cfg.en : cfg.hi}
          </p>
          {isDoc && f.doctorQualifications && (
            <p className="text-[10px] text-gray-500 truncate">{f.doctorQualifications}</p>
          )}
        </div>
      </div>

      {isDoc && f.hospitalAffiliation && (
        <p className="text-xs text-gray-700 flex items-center gap-1">
          <Building2 className="h-3 w-3 text-purple-600 shrink-0" />
          <span className="truncate">{f.hospitalAffiliation}</span>
        </p>
      )}

      {isDoc && (
        <div className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {f.verificationStatus === "independently_verified" && f.regNo
              ? `NMC: ${f.regNo}`
              : f.recordType === "facility_nodal_contact"
              ? en ? "Facility Nodal Contact" : "सुविधा नोडल संपर्क"
              : en ? "Source Verified Clinician" : "स्रोत सत्यापित चिकित्सक"}
          </span>
        </div>
      )}

      {isTop && (
        <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {userCoords ? (en ? "Top 10 Nearest" : "10 निकटतम में से") : en ? "Top Recommendation" : "शीर्ष अनुशंसित"}
        </p>
      )}

      {f.address && (
        <p className="text-[11px] text-gray-500 flex items-start gap-1">
          <MapPin className="h-3 w-3 text-gray-400 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{f.address}</span>
        </p>
      )}

      {userCoords ? (
        <p className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
          📍 {f.distance_km < 1 ? `${Math.round(f.distance_km * 1000)}m` : `${f.distance_km.toFixed(1)} km`} {en ? "away" : "दूर"}
        </p>
      ) : (
        <p className="text-[11px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded inline-block">
          📍 {f.district || (en ? "District Center" : "जिला केंद्र")}
        </p>
      )}

      {f.phone ? (
        <div className="pt-0.5">
          <a
            href={`tel:${f.phone}`}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 flex items-center justify-between gap-1.5"
          >
            <span className="flex items-center gap-1 truncate">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{f.phone}</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-200/60 px-1 py-0.5 rounded shrink-0">
              {en ? "Call" : "कॉल"}
            </span>
          </a>
        </div>
      ) : null}

      <div className="pt-1 flex flex-col gap-1">
        {isDoc && f.recordType === "clinician" && (
          <a
            href="/consultation"
            className="w-full text-center py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>{en ? "Book Consultation" : "परामर्श बुक करें"}</span>
          </a>
        )}
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={() => onShowRoute(f.lat, f.lon)}
          disabled={routingLoading}
        >
          {routingLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Navigation className="h-3 w-3 mr-1" />}
          {en ? "Show Route" : "मार्ग दिखाएं"}
        </Button>
      </div>
    </div>
  )
}
