"use client"

/**
 * components/map-view/parts/FacilityMapControls.tsx
 *
 * Search inputs, category filters, radius chips, and LGD state/district dropdowns.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, LocateFixed, MapPin, Minimize2, Maximize2 } from "lucide-react"
import { SearchableDropdown } from "./SearchableDropdown"
import type { Facility } from "../types"
import { TYPE_CONFIG } from "../types"

interface FacilityMapControlsProps {
  en: boolean
  selectedState: string
  selectedDistrict: string
  stateOptions: { code: string; nameEn: string; nameHi?: string }[]
  districtOptions: { code: string; nameEn: string; nameHi?: string }[]
  onStateChange: (code: string) => void
  onDistrictChange: (code: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  onUseMyLocation: () => void
  locating: boolean
  filter: Facility["type"] | "all"
  onFilterChange: (filter: Facility["type"] | "all") => void
  counts: Record<string, number>
  radiusKm: number
  onRadiusChange: (km: number) => void
  facilitiesCount: number
  isMapExpanded: boolean
  setIsMapExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void
}

export function FacilityMapControls({
  en,
  selectedState,
  selectedDistrict,
  stateOptions,
  districtOptions,
  onStateChange,
  onDistrictChange,
  searchQuery,
  setSearchQuery,
  onUseMyLocation,
  locating,
  filter,
  onFilterChange,
  counts,
  radiusKm,
  onRadiusChange,
  facilitiesCount,
  isMapExpanded,
  setIsMapExpanded,
}: FacilityMapControlsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-1">
          {en ? "National Healthcare Facility Discovery" : "राष्ट्रीय स्वास्थ्य सुविधा खोज"}
        </h2>
        <p className="text-sm text-gray-500">
          {en
            ? "Capability-aware facility locator indexed by Local Government Directory (LGD) and Indian Public Health Standards (IPHS)"
            : "स्थानीय निकाय निर्देशिका (LGD) एवं भारतीय लोक स्वास्थ्य मानक (IPHS) आधारित स्वास्थ्य केंद्र खोज"}
        </p>
      </div>

      {/* LGD Geographic Navigation & Search Row */}
      <div className="relative z-30 flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-blue-50/60 p-3 rounded-xl border border-blue-100">
        <div className="flex-1 flex gap-2">
          <div className="w-1/2 md:w-52">
            <SearchableDropdown
              label={en ? "State (LGD)" : "राज्य (LGD)"}
              placeholder={en ? "Select State" : "राज्य चुनें"}
              searchPlaceholder={en ? "Search state..." : "राज्य खोजें..."}
              selectedCode={selectedState}
              options={stateOptions}
              onSelect={onStateChange}
              en={en}
            />
          </div>

          <div className="w-1/2 md:w-56">
            <SearchableDropdown
              label={en ? "District (LGD)" : "जिला (LGD)"}
              placeholder={en ? "Select District" : "जिला चुनें"}
              searchPlaceholder={en ? "Search district..." : "जिला खोजें..."}
              selectedCode={selectedDistrict}
              options={districtOptions}
              onSelect={onDistrictChange}
              en={en}
            />
          </div>
        </div>

        <div className="relative flex-1">
          <label className="text-[11px] font-semibold text-blue-900 block mb-1">
            {en ? "Search Facility" : "सुविधा खोजें"}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={en ? "Search hospital or CHC name..." : "अस्पताल या CHC का नाम खोजें..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white"
            />
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={onUseMyLocation}
            disabled={locating}
            className="gap-1.5 shrink-0"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            {en ? "Use My Location" : "मेरा स्थान"}
          </Button>

          {(["all", "hospital", "health_post", "clinic", "pharmacy", "lab", "doctors"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onFilterChange(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {t === "all"
                ? en ? `All (${counts.all ?? 0})` : `सभी (${counts.all ?? 0})`
                : `${TYPE_CONFIG[t].icon} ${en ? TYPE_CONFIG[t].en : TYPE_CONFIG[t].hi}${
                    counts[t] ? ` (${counts[t]})` : ""
                  }`}
            </button>
          ))}

          <select
            value={radiusKm}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="text-xs border rounded-full px-3 py-1.5 bg-white ml-auto"
          >
            {[10, 25, 50, 100].map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Header with Compact / Expand Toggle */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-blue-600" />
          <span>{en ? "Facility Map" : "सुविधा मानचित्र"}</span>
          <span className="text-gray-400 font-normal">
            ({facilitiesCount} {en ? "facilities plotted" : "सुविधाएं दर्शाई गई"})
          </span>
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsMapExpanded((prev) => !prev)}
          className="h-7 text-xs gap-1.5 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-xs"
        >
          {isMapExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span>
            {isMapExpanded
              ? en ? "Compact Map (260px)" : "छोटा नक्शा (260px)"
              : en ? "Expand Map (460px)" : "बड़ा नक्शा (460px)"}
          </span>
        </Button>
      </div>
    </div>
  )
}
